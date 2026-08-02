// Step goal bounds + XP scaling. Pure functions (no database) — the goal
// you set is a real tradeoff: a low goal is easy but worth little XP, a
// high goal is worth more but harder to actually hit.

export const MIN_STEP_GOAL = 2000;
export const MAX_STEP_GOAL = 30000;
export const DEFAULT_STEP_GOAL = 6000;
export const STEP_GOAL_STEP = 500; // increment the picker moves in

export function clampStepGoal(goal: number): number {
  const rounded = Math.round(goal / STEP_GOAL_STEP) * STEP_GOAL_STEP;
  return Math.min(MAX_STEP_GOAL, Math.max(MIN_STEP_GOAL, rounded));
}

// 100 steps = 1 XP, floored at 20 and capped at 300 — a 2,000-step goal
// earns 20 XP, a 10,000-step goal earns 100 XP, a 30,000-step goal caps
// out at 300 XP.
export function stepGoalXp(goal: number): number {
  return Math.min(300, Math.max(20, Math.round(goal / 100)));
}
