// Server-only: today's step count, goal, and the reward for hitting it.
// Manual entry (see 0026_step_tracking.sql for why there's no auto-sync).
// Each call ADDS to today's running total rather than replacing it — you
// log however many more steps you've done since the last entry, the same
// way logging a second workout doesn't erase the first.
//
// The goal shown and evaluated is always your CURRENT profile.step_goal —
// never a frozen snapshot from earlier today. Raise it mid-day and the
// progress bar immediately targets the new number. XP already banked today
// is never clawed back if you lower the goal, and raising it to a harder
// target you then reach pays out the difference on top of what's already
// banked (not a second full reward). The Common Chest, though, pays out
// at most once per day no matter how many times you raise the goal and
// clear it again.
import { createClient } from "@/lib/supabase/server";
import { applyXp } from "./xp-server";
import { awardChest } from "./chests-server";
import { clampStepGoal, stepGoalXp } from "./steps";
import { localDateStr } from "@/lib/local-day";

export type StepStatus = {
  steps: number;
  goal: number;
  goalMet: boolean;
  xpAwarded: number;
  chestAwarded: boolean;
};

export async function getTodayStepStatus(userId: string): Promise<StepStatus> {
  const supabase = createClient();
  const todayStr = localDateStr();

  const [{ data: profile }, { data: log }] = await Promise.all([
    supabase.from("profiles").select("step_goal").eq("id", userId).single(),
    supabase
      .from("step_logs")
      .select("steps, xp_awarded, chest_awarded")
      .eq("user_id", userId)
      .eq("log_date", todayStr)
      .maybeSingle(),
  ]);

  const goal = (profile as any)?.step_goal ?? 6000;
  const steps = log?.steps ?? 0;
  return {
    steps,
    goal,
    goalMet: steps >= goal,
    xpAwarded: log?.xp_awarded ?? 0,
    chestAwarded: log?.chest_awarded ?? false,
  };
}

export type StepResult =
  | { ok: false; error: string }
  | {
      ok: true;
      steps: number;
      goal: number;
      goalMet: boolean;
      newlyMet: boolean;
      xpEarned: number;
      leveledUp: boolean;
      level: number;
      rank: string;
      rankChanged: boolean;
      chestEarned: boolean;
    };

export async function logSteps(userId: string, stepsToAdd: number): Promise<StepResult> {
  if (!Number.isFinite(stepsToAdd) || stepsToAdd <= 0 || stepsToAdd > 200000) {
    return { ok: false, error: "Enter how many steps to add (1-200,000)." };
  }
  stepsToAdd = Math.round(stepsToAdd);

  const supabase = createClient();
  const todayStr = localDateStr();

  const [{ data: profile }, { data: existing }] = await Promise.all([
    supabase.from("profiles").select("step_goal").eq("id", userId).single(),
    supabase
      .from("step_logs")
      .select("steps, xp_awarded, chest_awarded")
      .eq("user_id", userId)
      .eq("log_date", todayStr)
      .maybeSingle(),
  ]);
  const currentGoal = (profile as any)?.step_goal ?? 6000;
  const priorXpAwarded = existing?.xp_awarded ?? 0;
  const priorChestAwarded = existing?.chest_awarded ?? false;

  const newSteps = Math.min(200000, (existing?.steps ?? 0) + stepsToAdd);
  const goalMetNow = newSteps >= currentGoal;

  // The full reward for today's (current) goal, minus whatever's already
  // banked — 0 if the goal isn't met yet, or if it's met but a harder goal
  // met earlier already paid out more than this one's worth.
  const xpEarned = goalMetNow ? Math.max(0, stepGoalXp(currentGoal) - priorXpAwarded) : 0;
  const chestEarned = goalMetNow && !priorChestAwarded;
  const newXpAwarded = priorXpAwarded + xpEarned;
  const newChestAwarded = priorChestAwarded || chestEarned;

  await supabase.from("step_logs").upsert(
    {
      user_id: userId,
      log_date: todayStr,
      steps: newSteps,
      goal: currentGoal,
      goal_met: goalMetNow,
      xp_awarded: newXpAwarded,
      chest_awarded: newChestAwarded,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,log_date" }
  );

  let leveledUp = false;
  let level = 0;
  let rank = "";
  let rankChanged = false;

  if (xpEarned > 0 || chestEarned) {
    const [xpResult] = await Promise.all([
      xpEarned > 0 ? applyXp(userId, xpEarned) : Promise.resolve(null),
      chestEarned ? awardChest(userId, "common", 1) : Promise.resolve(),
    ]);
    if (xpResult) {
      leveledUp = xpResult.leveledUp;
      level = xpResult.level;
      rank = xpResult.rank;
      rankChanged = xpResult.rankChanged;
    }
  }

  return {
    ok: true,
    steps: newSteps,
    goal: currentGoal,
    goalMet: goalMetNow,
    newlyMet: xpEarned > 0 || chestEarned,
    xpEarned,
    leveledUp,
    level,
    rank,
    rankChanged,
    chestEarned,
  };
}

// Returns the goal that's ACTUALLY in the database after the write, not
// just an echo of what was requested — an update blocked by RLS or any
// other issue succeeds silently with zero rows affected (Postgrest doesn't
// error on that), so this confirms the row via .select() instead of taking
// the write on faith.
export async function setStepGoal(
  userId: string,
  goal: number
): Promise<{ ok: boolean; goal: number; error?: string }> {
  const clamped = clampStepGoal(goal);
  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .update({ step_goal: clamped })
    .eq("id", userId)
    .select("step_goal")
    .single();

  if (error || !data) {
    return { ok: false, goal: clamped, error: error?.message ?? "Could not save your goal — try again." };
  }
  return { ok: true, goal: data.step_goal };
}
