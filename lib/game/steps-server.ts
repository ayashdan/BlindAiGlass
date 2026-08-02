// Server-only: today's step count, goal, and the reward for hitting it.
// Manual entry (see 0026_step_tracking.sql for why there's no auto-sync).
// Each call ADDS to today's running total rather than replacing it — you
// log however many more steps you've done since the last entry, the same
// way logging a second workout doesn't erase the first. The day's target
// locks in once you hit it, so raising your goal later the same day can't
// retroactively "unmet" an already-earned reward, but can still raise the
// bar for a day you haven't hit yet, and logging more steps after the goal
// is met never re-awards the XP/chest — it just keeps the count accurate.
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
      .select("steps, goal, goal_met, xp_awarded, chest_awarded")
      .eq("user_id", userId)
      .eq("log_date", todayStr)
      .maybeSingle(),
  ]);

  const fallbackGoal = (profile as any)?.step_goal ?? 6000;
  if (!log) return { steps: 0, goal: fallbackGoal, goalMet: false, xpAwarded: 0, chestAwarded: false };
  return {
    steps: log.steps,
    goal: log.goal,
    goalMet: log.goal_met,
    xpAwarded: log.xp_awarded,
    chestAwarded: log.chest_awarded,
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
      .select("steps, goal, goal_met")
      .eq("user_id", userId)
      .eq("log_date", todayStr)
      .maybeSingle(),
  ]);
  const currentGoal = (profile as any)?.step_goal ?? 6000;
  const newSteps = Math.min(200000, (existing?.steps ?? 0) + stepsToAdd);

  // Already met today — target and reward stay locked, just keep the count
  // accurate as more steps come in. Never re-awards.
  if (existing?.goal_met) {
    await supabase
      .from("step_logs")
      .update({ steps: newSteps, updated_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("log_date", todayStr);
    return {
      ok: true,
      steps: newSteps,
      goal: existing.goal,
      goalMet: true,
      newlyMet: false,
      xpEarned: 0,
      leveledUp: false,
      level: 0,
      rank: "",
      rankChanged: false,
      chestEarned: false,
    };
  }

  const newlyMet = newSteps >= currentGoal;
  const xpEarned = newlyMet ? stepGoalXp(currentGoal) : 0;

  await supabase.from("step_logs").upsert(
    {
      user_id: userId,
      log_date: todayStr,
      steps: newSteps,
      goal: currentGoal,
      goal_met: newlyMet,
      xp_awarded: newlyMet ? xpEarned : 0,
      chest_awarded: newlyMet,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,log_date" }
  );

  if (!newlyMet) {
    return {
      ok: true,
      steps: newSteps,
      goal: currentGoal,
      goalMet: false,
      newlyMet: false,
      xpEarned: 0,
      leveledUp: false,
      level: 0,
      rank: "",
      rankChanged: false,
      chestEarned: false,
    };
  }

  const [xpResult] = await Promise.all([applyXp(userId, xpEarned), awardChest(userId, "common", 1)]);

  return {
    ok: true,
    steps: newSteps,
    goal: currentGoal,
    goalMet: true,
    newlyMet: true,
    xpEarned,
    leveledUp: xpResult.leveledUp,
    level: xpResult.level,
    rank: xpResult.rank,
    rankChanged: xpResult.rankChanged,
    chestEarned: true,
  };
}

export async function setStepGoal(userId: string, goal: number): Promise<{ ok: boolean; goal: number }> {
  const clamped = clampStepGoal(goal);
  const supabase = createClient();
  await supabase.from("profiles").update({ step_goal: clamped }).eq("id", userId);
  return { ok: true, goal: clamped };
}
