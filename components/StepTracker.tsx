"use client";

// A self-contained daily-steps card, matching the Level/XP hero card's
// interaction model: an xp-bar-style progress bar, a quick-log form, and a
// goal you set yourself (a higher goal is harder but pays out more XP —
// see lib/game/steps.ts). No auto-sync from Apple Health or Android's
// Health Connect — neither exposes a web API a PWA can reach, so this is
// manual entry — but additive, like logging another workout: each submit
// adds to today's total instead of replacing it, so checking in throughout
// the day never loses progress or re-triggers the goal reward.
import { useState } from "react";
import Link from "next/link";
import { logStepsAction, setStepGoalAction } from "@/app/(app)/dashboard/step-actions";
import LevelUpCelebration from "@/components/game/LevelUpCelebration";
import { stepGoalXp, MIN_STEP_GOAL, MAX_STEP_GOAL, STEP_GOAL_STEP } from "@/lib/game/steps";
import { vibrate } from "@/lib/haptics";
import { DEFAULT_STEP_GOAL } from "@/lib/game/steps";

export default function StepTracker({
  initialSteps,
  initialGoal,
  initialGoalMet,
}: {
  initialSteps: number;
  initialGoal: number;
  initialGoalMet: boolean;
}) {
  // Defensive fallback: if the step_goal column/migration hasn't landed yet,
  // these can arrive as undefined — better to show a sane default than to
  // crash the whole dashboard on a missing migration.
  const safeInitialSteps = initialSteps || 0;
  const safeInitialGoal = initialGoal || DEFAULT_STEP_GOAL;

  const [steps, setSteps] = useState(safeInitialSteps);
  const [goal, setGoal] = useState(safeInitialGoal);
  const [goalMet, setGoalMet] = useState(initialGoalMet);
  const [input, setInput] = useState("");
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState(String(safeInitialGoal));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reward, setReward] = useState<{ xp: number; chest: boolean } | null>(null);
  const [celebratingLevel, setCelebratingLevel] = useState(false);
  const [levelInfo, setLevelInfo] = useState<{ level: number; rank: string; rankChanged: boolean } | null>(
    null
  );

  const percent = goal > 0 ? Math.min(100, Math.round((steps / goal) * 100)) : 0;
  const remaining = Math.max(0, goal - steps);

  async function submitSteps(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const n = parseInt(input, 10);
    if (!Number.isFinite(n) || n <= 0) {
      setError("Enter how many steps to add.");
      return;
    }
    setBusy(true);
    try {
      const res = await logStepsAction(n);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setSteps(res.steps);
      setGoal(res.goal);
      setGoalMet(res.goalMet);
      setInput("");
      if (res.newlyMet) {
        vibrate([20, 40, 60]);
        setReward({ xp: res.xpEarned, chest: res.chestEarned });
        if (res.leveledUp) {
          setLevelInfo({ level: res.level, rank: res.rank, rankChanged: res.rankChanged });
          setCelebratingLevel(true);
        }
      }
    } finally {
      setBusy(false);
    }
  }

  async function saveGoal() {
    const n = parseInt(goalInput, 10);
    if (!Number.isFinite(n)) {
      setError("Enter a valid goal.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const res = await setStepGoalAction(n);
      if (!res.ok) {
        // Keep the editor open with what was typed so it's obvious the
        // save didn't actually happen — closing it here would make a
        // failed save look identical to a successful one.
        setError(res.error ?? "Could not save your goal — try again.");
        return;
      }
      setGoal(res.goal);
      setGoalInput(String(res.goal));
      setGoalMet(steps >= res.goal);
      setEditingGoal(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {celebratingLevel && levelInfo && (
        <LevelUpCelebration
          level={levelInfo.level}
          rank={levelInfo.rank}
          rankChanged={levelInfo.rankChanged}
          onDismiss={() => setCelebratingLevel(false)}
        />
      )}

      <div
        className="fade-in-up forge-panel forge-accent-emerald relative overflow-hidden p-6"
        style={{ animationDelay: "0.02s" }}
      >
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <span className="text-lg font-bold">🚶 Daily Steps</span>
          {!editingGoal ? (
            <button
              type="button"
              onClick={() => setEditingGoal(true)}
              className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-400 transition hover:bg-emerald-500/25"
            >
              Goal: {goal.toLocaleString()} · edit
            </button>
          ) : (
            <div className="flex items-center gap-1">
              <input
                type="number"
                inputMode="numeric"
                min={MIN_STEP_GOAL}
                max={MAX_STEP_GOAL}
                step={STEP_GOAL_STEP}
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
                className="w-20 rounded-lg border border-line bg-bg px-2 py-1 text-xs outline-none focus:border-forge"
              />
              <button
                type="button"
                onClick={saveGoal}
                disabled={busy}
                className="press-3d rounded-lg bg-emerald-500 px-2 py-1 text-xs font-bold text-neutral-950"
              >
                Set
              </button>
            </div>
          )}
        </div>

        {editingGoal && (
          <p className="mb-3 text-xs text-muted">
            {MIN_STEP_GOAL.toLocaleString()}–{MAX_STEP_GOAL.toLocaleString()} steps · reaching it earns{" "}
            <span className="font-bold text-emerald-400">
              +{stepGoalXp(parseInt(goalInput, 10) || goal)} XP
            </span>{" "}
            — a higher goal is worth more.
          </p>
        )}

        <div className="xp-bar h-3 w-full rounded-full bg-surface2">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-300 transition-all duration-700 ease-out"
            style={{ width: `${percent}%` }}
          />
        </div>

        <p className="mt-2 text-sm text-muted">
          {goalMet ? (
            <span className="font-semibold text-emerald-400">
              🎉 Goal reached! {steps.toLocaleString()} steps.
            </span>
          ) : (
            <>
              {steps.toLocaleString()} / {goal.toLocaleString()} steps · {remaining.toLocaleString()} to go
            </>
          )}
        </p>

        {reward && (
          <div className="celebrate-pop mt-3 flex items-center justify-between rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm">
            <span className="font-black text-emerald-400">+{reward.xp} XP</span>
            {reward.chest && (
              <Link href="/chests" className="font-bold text-amber-300 hover:underline">
                📦 Common Chest earned →
              </Link>
            )}
          </div>
        )}

        {error && <p className="mt-2 text-xs text-red-400">{error}</p>}

        <form onSubmit={submitSteps} className="mt-3 flex gap-2">
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={200000}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Add steps, e.g. 500"
            className="flex-1 rounded-lg border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-forge"
          />
          <button
            type="submit"
            disabled={busy}
            className="press-3d rounded-lg bg-emerald-500 px-4 py-2 text-sm font-bold text-neutral-950 transition hover:bg-emerald-400 disabled:opacity-70"
            style={{ "--press-shadow": "rgb(4 120 87 / 0.5)" } as React.CSSProperties}
          >
            {busy ? "…" : "Add"}
          </button>
        </form>
      </div>
    </>
  );
}
