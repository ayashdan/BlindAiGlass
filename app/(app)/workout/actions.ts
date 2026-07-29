"use server";

// Saving a workout: validate on the server, store it, bump the workout count,
// and award XP through the same server-side "referee" the whole game uses.
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { applyXp } from "@/lib/game/xp-server";
import { checkAndAwardAchievements } from "@/lib/game/achievements-server";
import { checkAndCompleteQuests } from "@/lib/game/quests-server";
import { VALID_MUSCLE_GROUPS } from "@/lib/game/muscle-groups";
import type { WorkoutResult } from "@/lib/types";

// Completing a workout is worth a base 100 XP, plus a bonus for difficulty.
const BASE_XP = 100;
const DIFFICULTY_BONUS: Record<string, number> = { easy: 0, medium: 25, hard: 50 };

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

  const xpEarned = BASE_XP + DIFFICULTY_BONUS[difficulty];

  // ---- Save the workout ----
  const { error: insErr } = await supabase.from("workouts").insert({
    user_id: user.id,
    muscle_groups: muscleGroups,
    custom_name: customName,
    duration_minutes: duration,
    difficulty,
    notes,
    xp_earned: xpEarned,
  });
  if (insErr) return { ok: false, error: "Could not save the workout." };

  // ---- Read current profile stats ----
  const { data: prof } = await supabase
    .from("profiles")
    .select("total_workouts, current_streak, longest_streak, last_workout_date")
    .eq("id", user.id)
    .single();

  const prevWorkouts = prof?.total_workouts ?? 0;
  const prevStreak = prof?.current_streak ?? 0;
  const prevLongest = prof?.longest_streak ?? 0;
  const lastDate = (prof?.last_workout_date as string | null) ?? null;

  // ---- Streak logic (UTC dates) ----
  // Worked out today already -> streak unchanged. Worked out yesterday -> +1.
  // Otherwise the streak resets to 1.
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const yesterdayStr = new Date(now.getTime() - 86400000).toISOString().slice(0, 10);

  const advancedToday = lastDate !== todayStr;
  let newStreak: number;
  if (lastDate === todayStr) newStreak = prevStreak;
  else if (lastDate === yesterdayStr) newStreak = prevStreak + 1;
  else newStreak = 1;
  const newLongest = Math.max(prevLongest, newStreak);

  const newWorkouts = prevWorkouts + 1;

  await supabase
    .from("profiles")
    .update({
      total_workouts: newWorkouts,
      current_streak: newStreak,
      longest_streak: newLongest,
      last_workout_date: todayStr,
    })
    .eq("id", user.id);

  // ---- Bonus XP when the streak advances into a multiple of 7 days ----
  const streakBonus = advancedToday && newStreak > 0 && newStreak % 7 === 0 ? 50 : 0;

  // ---- Award workout XP (+ streak bonus), recalculating level + rank ----
  const xp1 = await applyXp(xpEarned + streakBonus);

  // ---- Check achievements against the fresh stats ----
  const ach = await checkAndAwardAchievements({
    totalWorkouts: newWorkouts,
    currentStreak: newStreak,
    level: xp1.level,
  });

  // ---- Check today's quests against today's workouts (including this one) ----
  const todayStart = `${todayStr}T00:00:00.000Z`;
  const { data: todaysWorkouts } = await supabase
    .from("workouts")
    .select("muscle_groups, duration_minutes, difficulty")
    .eq("user_id", user.id)
    .gte("created_at", todayStart);
  const rows = todaysWorkouts ?? [];
  const quest = await checkAndCompleteQuests({
    workoutsToday: rows.length,
    muscleGroupsToday: rows.flatMap((r: any) => (r.muscle_groups as string[]) ?? []),
    maxDurationToday: rows.reduce((m: number, r: any) => Math.max(m, r.duration_minutes ?? 0), 0),
    hardToday: rows.some((r: any) => r.difficulty === "hard"),
  });

  // ---- Award any achievement/quest bonus XP (can trigger another level-up) ----
  let level = xp1.level;
  let rank = xp1.rank;
  let leveledUp = xp1.leveledUp;
  let rankChanged = xp1.rankChanged;
  const bonusXp = ach.xpAwarded + quest.xpAwarded;
  if (bonusXp > 0) {
    const xp2 = await applyXp(bonusXp);
    level = xp2.level;
    rank = xp2.rank;
    leveledUp = leveledUp || xp2.leveledUp;
    rankChanged = rankChanged || xp2.rankChanged;
  }

  revalidatePath("/dashboard");
  revalidatePath("/achievements");
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
  };
}
