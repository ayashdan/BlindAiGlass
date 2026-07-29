"use client";

// The workout logging screen. On submit it calls the server action, then shows
// a reward screen ("+125 XP") and a level-up celebration when one happens.
import { useState } from "react";
import Link from "next/link";
import { logWorkout } from "@/app/(app)/workout/actions";
import AchievementCelebration from "./AchievementCelebration";
import { MUSCLE_GROUPS } from "@/lib/game/muscle-groups";
import type { WorkoutResult } from "@/lib/types";

const DIFFICULTIES = [
  { key: "easy", label: "Easy" },
  { key: "medium", label: "Medium" },
  { key: "hard", label: "Hard" },
];

export default function WorkoutForm() {
  const [muscleGroups, setMuscleGroups] = useState<string[]>([]);
  const [customName, setCustomName] = useState("");
  const [duration, setDuration] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Extract<WorkoutResult, { ok: true }> | null>(null);
  const [celebrating, setCelebrating] = useState(false);

  function toggleGroup(key: string) {
    setMuscleGroups((prev) =>
      prev.includes(key) ? prev.filter((g) => g !== key) : [...prev, key]
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const res = await runSubmit();
    if (res && res.ok) {
      setResult(res);
      if (res.unlocked.length > 0) setCelebrating(true);
    }
  }

  async function runSubmit(): Promise<WorkoutResult | null> {
    const mins = parseInt(duration, 10);
    if (!mins || mins <= 0) {
      setError("Enter how many minutes you worked out.");
      return null;
    }
    if (muscleGroups.length === 0 && !customName.trim()) {
      setError("Pick at least one muscle group, or name the workout.");
      return null;
    }
    setBusy(true);
    try {
      const res = await logWorkout({
        muscleGroups,
        customName: customName.trim(),
        duration: mins,
        difficulty,
        notes: notes.trim(),
      });
      if (!res.ok) setError(res.error);
      return res;
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setResult(null);
    setDuration("");
    setNotes("");
    setCustomName("");
    setMuscleGroups([]);
  }

  // ---- Reward screen ----
  if (result) {
    return (
      <>
        {celebrating && (
          <AchievementCelebration
            achievements={result.unlocked}
            onDismiss={() => setCelebrating(false)}
          />
        )}

        <div className="fade-in-up rounded-2xl border border-neutral-800 bg-neutral-900 p-8 text-center">
          <div className="text-5xl">💪</div>
          <p className="mt-3 text-sm font-semibold uppercase tracking-[0.3em] text-neutral-400">
            Workout complete
          </p>
          <p className="mt-2 text-4xl font-black text-forge">+{result.xpEarned} XP</p>

          <p className="mt-3 text-lg font-bold">
            🔥 {result.streak} day streak
          </p>

          {result.leveledUp && (
            <div className="celebrate-pop mt-6 rounded-xl border border-forge/40 bg-forge/10 p-4">
              <p className="text-lg font-black">⬆️ Level {result.level}!</p>
              {result.rankChanged && (
                <p className="mt-1 font-semibold text-forge">New rank: {result.rank}</p>
              )}
            </div>
          )}

          {result.unlocked.length > 0 && (
            <div className="mt-4 space-y-2">
              {result.unlocked.map((a) => (
                <div
                  key={a.key}
                  className="rounded-xl border border-yellow-500/40 bg-yellow-500/10 p-3"
                >
                  <p className="font-bold">
                    {a.icon} Achievement unlocked: {a.name}
                  </p>
                  <p className="text-sm text-yellow-300/90">+{a.xpReward} XP</p>
                </div>
              ))}
            </div>
          )}

          {result.questsCompleted.length > 0 && (
            <div className="mt-4 space-y-2">
              {result.questsCompleted.map((q, i) => (
                <div
                  key={q.key}
                  className="celebrate-pop rounded-xl border border-forge/40 bg-forge/10 p-3"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <p className="font-bold">
                    {q.icon} Quest complete: {q.title}
                  </p>
                  <p className="text-sm text-forge">+{q.xpReward} XP</p>
                </div>
              ))}
            </div>
          )}

          <div className="mt-8 flex flex-col gap-3">
            <button
              onClick={reset}
              className="press rounded-lg border border-neutral-800 py-3 font-bold transition hover:border-neutral-600"
            >
              Log another
            </button>
            <Link
              href="/dashboard"
              className="press rounded-lg bg-forge py-3 font-bold text-neutral-950 transition hover:bg-forge-soft"
            >
              Back to dashboard
            </Link>
          </div>
        </div>
      </>
    );
  }

  // ---- The form ----
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {error && (
        <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      )}

      {/* Muscle groups (multi-select) */}
      <div>
        <label className="mb-2 block text-sm font-semibold text-neutral-300">
          Muscle groups worked
        </label>
        <p className="mb-2 text-xs text-neutral-500">Tap all that apply.</p>
        <div className="grid grid-cols-3 gap-2">
          {MUSCLE_GROUPS.map((g) => {
            const active = muscleGroups.includes(g.key);
            return (
              <button
                key={g.key}
                type="button"
                onClick={() => toggleGroup(g.key)}
                aria-pressed={active}
                className={
                  "press rounded-lg border py-3 text-sm font-bold transition " +
                  (active
                    ? "border-forge bg-forge/15 text-forge"
                    : "border-neutral-800 bg-neutral-900 text-neutral-300 hover:border-neutral-600")
                }
              >
                {g.label}
              </button>
            );
          })}
        </div>
        <input
          value={customName}
          onChange={(e) => setCustomName(e.target.value)}
          placeholder="Workout name (optional, e.g. Boxing)"
          className="mt-3 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-3 outline-none focus:border-forge"
        />
      </div>

      {/* Duration */}
      <div>
        <label className="mb-2 block text-sm font-semibold text-neutral-300">
          Duration (minutes)
        </label>
        <input
          type="number"
          inputMode="numeric"
          min={1}
          max={600}
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          placeholder="e.g. 45"
          className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-3 outline-none focus:border-forge"
        />
      </div>

      {/* Difficulty */}
      <div>
        <label className="mb-2 block text-sm font-semibold text-neutral-300">
          Difficulty
        </label>
        <div className="grid grid-cols-3 gap-2">
          {DIFFICULTIES.map((d) => (
            <button
              key={d.key}
              type="button"
              onClick={() => setDifficulty(d.key)}
              aria-pressed={difficulty === d.key}
              className={
                "rounded-lg border py-3 text-sm font-bold transition " +
                (difficulty === d.key
                  ? "border-forge bg-forge/15 text-forge"
                  : "border-neutral-800 bg-neutral-900 text-neutral-300 hover:border-neutral-600")
              }
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="mb-2 block text-sm font-semibold text-neutral-300">
          Notes (optional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="How did it go?"
          className="w-full resize-none rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-3 outline-none focus:border-forge"
        />
      </div>

      <button
        type="submit"
        disabled={busy}
        className="press w-full rounded-lg bg-forge py-4 text-lg font-black text-neutral-950 transition hover:bg-forge-soft disabled:opacity-50"
      >
        {busy ? "Saving…" : "Complete workout"}
      </button>
    </form>
  );
}
