"use server";

// Saving a workout: validate on the server, store it, bump the workout count,
// and award XP through the same server-side "referee" the whole game uses.
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { applyXp } from "@/lib/game/xp-server";
import { checkAndAwardAchievements } from "@/lib/game/achievements-server";
import { checkAndCompleteQuests } from "@/lib/game/quests-server";
import { checkAndRecordPRs } from "@/lib/game/records-server";
import { checkAndAwardSeasonTiers } from "@/lib/game/season-server";
import { VALID_MUSCLE_GROUPS } from "@/lib/game/muscle-groups";
import { localDateStr, addDaysToDateStr, localMidnightUtcIsoForToday } from "@/lib/local-day";
import {
  computeStatGains,
  deriveClass,
  DISCIPLINE_PER_STREAK_DAY,
  DISCIPLINE_PER_QUEST,
} from "@/lib/game/stats";
import type { WorkoutResult, StatGain } from "@/lib/types";

// Completing a workout is worth a base 100 XP, plus a bonus for difficulty.
const BASE_XP = 100;
const DIFFICULTY_BONUS: Record<string, number> = { easy: 0, medium: 25, hard: 50 };
// Earned only — never purchasable. Banked at every 7-day streak milestone,
// capped so it stays a safety net rather than trivializing consistency.
const FREEZE_CAP = 2;
const XP_PER_NEW_PR = 15;

export async function logWorkout(input: {
  muscleGroups: string[];
  customName?: string;
  duration: number;
  difficulty: string;
  notes?: string;
}): Promise<WorkoutResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "You are not logged in." };
  const userId = user.id;

  // ---- Validate the input ----
  const muscleGroups = Array.from(new Set(input.muscleGroups ?? [])).filter((g) =>
    VALID_MUSCLE_GROUPS.includes(g)
  );
  const customName = (input.customName || "").trim().slice(0, 60) || null;
  const difficulty = input.difficulty;
  const duration = Math.round(Number(input.duration));

  if (muscleGroups.length === 0 && !customName) {
    return { ok: false, error: "Pick at least one muscle group, or name the workout." };
  }
  if (!(difficulty in DIFFICULTY_BONUS)) return { ok: false, error: "Pick a difficulty." };
  if (!Number.isFinite(duration) || duration <= 0 || duration > 600) {
    return { ok: false, error: "Enter a duration between 1 and 600 minutes." };
  }

  const notes = (input.notes || "").trim().slice(0, 500) || null;

  // ---- Read current profile ----
  const { data: profData } = await supabase
    .from("profiles")
    .select(
      "total_workouts, current_streak, longest_streak, last_workout_date, streak_freezes, trained_muscle_groups, stat_power, stat_grit, stat_endurance, stat_discipline, recovery_bonus_pct"
    )
    .eq("id", userId)
    .single();
  const prof = profData as any;

  // ---- Recovery bonus (consumed by this workout, if one is banked) ----
  const recoveryPct = prof?.recovery_bonus_pct ?? 0;
  const recoveryBonusApplied = recoveryPct > 0;
  const baseXp = BASE_XP + DIFFICULTY_BONUS[difficulty];
  const xpEarned = recoveryBonusApplied ? Math.round(baseXp * (1 + recoveryPct / 100)) : baseXp;

  // ---- Save the workout ----
  const { error: insErr } = await supabase.from("workouts").insert({
    user_id: userId,
    muscle_groups: muscleGroups,
    custom_name: customName,
    duration_minutes: duration,
    difficulty,
    notes,
    xp_earned: xpEarned,
  });
  if (insErr) return { ok: false, error: "Could not save the workout." };

  // Season-tier progress only depends on the workout row just inserted
  // above (a count of this season's workouts) — nothing computed below.
  // Kick it off now so its round trips overlap with everything else
  // instead of stacking on top at the end.
  const seasonPromise = checkAndAwardSeasonTiers(userId);

  const prevWorkouts = prof?.total_workouts ?? 0;
  const prevStreak = prof?.current_streak ?? 0;
  const prevLongest = prof?.longest_streak ?? 0;
  const lastDate = (prof?.last_workout_date as string | null) ?? null;
  const prevFreezes = prof?.streak_freezes ?? 0;
  const prevTrained = (prof?.trained_muscle_groups as string[]) ?? [];
  const prevStats = {
    power: prof?.stat_power ?? 0,
    grit: prof?.stat_grit ?? 0,
    endurance: prof?.stat_endurance ?? 0,
    discipline: prof?.stat_discipline ?? 0,
  };

  // ---- Streak logic (the user's own local dates, not the server's UTC
  // clock — see lib/local-day.ts) ----
  // Worked out today already -> streak unchanged. Worked out yesterday -> +1.
  // Missed exactly one day but have a banked freeze -> the freeze protects
  // the streak (counts as if unbroken). Otherwise the streak resets to 1.
  const todayStr = localDateStr();
  const yesterdayStr = addDaysToDateStr(todayStr, -1);
  const twoDaysAgoStr = addDaysToDateStr(todayStr, -2);

  const advancedToday = lastDate !== todayStr;
  let newStreak: number;
  let freezeUsed = false;
  if (lastDate === todayStr) {
    newStreak = prevStreak;
  } else if (lastDate === yesterdayStr) {
    newStreak = prevStreak + 1;
  } else if (lastDate === twoDaysAgoStr && prevFreezes > 0) {
    newStreak = prevStreak + 1;
    freezeUsed = true;
  } else {
    newStreak = 1;
  }
  const newLongest = Math.max(prevLongest, newStreak);
  const newWorkouts = prevWorkouts + 1;

  // Bank a freeze at every 7-day streak milestone, capped.
  let newFreezes = prevFreezes - (freezeUsed ? 1 : 0);
  const freezeEarned =
    advancedToday && newStreak > 0 && newStreak % 7 === 0 && newFreezes < FREEZE_CAP;
  if (freezeEarned) newFreezes += 1;
  newFreezes = Math.max(0, Math.min(FREEZE_CAP, newFreezes));

  // Track lifetime muscle-group variety (for the "Well Rounded" achievement).
  const trainedSet = new Set(prevTrained);
  for (const g of muscleGroups) trainedSet.add(g);
  const newTrained = Array.from(trainedSet);

  // ---- Check today's quests against today's workouts (including this one) ----
  const todayStart = localMidnightUtcIsoForToday(todayStr);
  const { data: todaysWorkouts } = await supabase
    .from("workouts")
    .select("muscle_groups, duration_minutes, difficulty")
    .eq("user_id", userId)
    .gte("created_at", todayStart);
  const rows = todaysWorkouts ?? [];
  const quest = await checkAndCompleteQuests(userId, {
    workoutsToday: rows.length,
    muscleGroupsToday: rows.flatMap((r: any) => (r.muscle_groups as string[]) ?? []),
    maxDurationToday: rows.reduce((m: number, r: any) => Math.max(m, r.duration_minutes ?? 0), 0),
    hardToday: rows.some((r: any) => r.difficulty === "hard"),
  });

  // ---- Character stat gains: power/grit/endurance from what was trained,
  // discipline from consistency (streak advancing + quests completed) ----
  const gains = computeStatGains(muscleGroups, difficulty);
  const disciplineGain =
    (advancedToday ? DISCIPLINE_PER_STREAK_DAY : 0) + quest.completed.length * DISCIPLINE_PER_QUEST;

  const newStats = {
    power: prevStats.power + (gains.power ?? 0),
    grit: prevStats.grit + (gains.grit ?? 0),
    endurance: prevStats.endurance + (gains.endurance ?? 0),
    discipline: prevStats.discipline + disciplineGain,
  };

  const oldClass = deriveClass(prevStats);
  const newClassVal = deriveClass(newStats);
  const newClass = newClassVal !== oldClass ? newClassVal : null;

  const statGains: StatGain[] = Object.entries(gains)
    .filter(([, amount]) => (amount ?? 0) > 0)
    .map(([stat, amount]) => ({ stat, amount: amount ?? 0 }));
  if (disciplineGain > 0) statGains.push({ stat: "discipline", amount: disciplineGain });

  await supabase
    .from("profiles")
    .update({
      total_workouts: newWorkouts,
      current_streak: newStreak,
      longest_streak: newLongest,
      last_workout_date: todayStr,
      streak_freezes: newFreezes,
      trained_muscle_groups: newTrained,
      stat_power: newStats.power,
      stat_grit: newStats.grit,
      stat_endurance: newStats.endurance,
      stat_discipline: newStats.discipline,
      recovery_bonus_pct: 0, // consumed, whether or not it was active
    })
    .eq("id", userId);

  // ---- Bonus XP when the streak advances into a multiple of 7 days ----
  const streakBonus = advancedToday && newStreak > 0 && newStreak % 7 === 0 ? 50 : 0;

  // ---- Award workout XP (+ streak bonus), recalculating level + rank ----
  const xp1 = await applyXp(userId, xpEarned + streakBonus);

  // ---- Check for a new personal record (longest workout, overall + per muscle group) ----
  const pr = await checkAndRecordPRs(userId, muscleGroups, duration);
  const prXp = pr.newRecords.length * XP_PER_NEW_PR;

  // ---- Check achievements against the fresh stats ----
  const ach = await checkAndAwardAchievements(userId, {
    totalWorkouts: newWorkouts,
    currentStreak: newStreak,
    level: xp1.level,
    hasNewPR: pr.newRecords.length > 0,
    muscleGroupVariety: newTrained.length,
  });

  // ---- Season pass tiers (kicked off right after the workout insert above) ----
  const season = await seasonPromise;

  // ---- Award any achievement/quest/PR/season bonus XP (can trigger another level-up) ----
  let level = xp1.level;
  let rank = xp1.rank;
  let leveledUp = xp1.leveledUp;
  let rankChanged = xp1.rankChanged;
  const bonusXp = ach.xpAwarded + quest.xpAwarded + prXp + season.xpAwarded;
  if (bonusXp > 0) {
    const xp2 = await applyXp(userId, bonusXp);
    level = xp2.level;
    rank = xp2.rank;
    leveledUp = leveledUp || xp2.leveledUp;
    rankChanged = rankChanged || xp2.rankChanged;
  }

  revalidatePath("/dashboard");
  revalidatePath("/achievements");
  revalidatePath("/profile");
  return {
    ok: true,
    xpEarned: xpEarned + streakBonus + bonusXp,
    streak: newStreak,
    leveledUp,
    level,
    rank,
    rankChanged,
    unlocked: ach.unlocked,
    questsCompleted: quest.completed,
    newRecords: pr.newRecords,
    freezeUsed,
    freezeEarned,
    streakFreezes: newFreezes,
    statGains,
    newClass,
    seasonTiersReached: season.reached,
    recoveryBonusApplied,
  };
}
