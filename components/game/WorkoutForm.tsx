"use client";

// The workout logging screen. On submit it calls the server action, then shows
// a reward screen ("+125 XP") and a level-up celebration when one happens.
import { useState } from "react";
import Link from "next/link";
import { logWorkout, type WorkoutResult } from "@/app/(app)/workout/actions";

const TYPES = [
  { key: "push", label: "Push" },
  { key: "pull", label: "Pull" },
  { key: "legs", label: "Legs" },
  { key: "full", label: "Full Body" },
  { key: "custom", label: "Custom" },
];

const DIFFICULTIES = [
  { key: "easy", label: "Easy" },
  { key: "medium", label: "Medium" },
  { key: "hard", label: "Hard" },
];

export default function WorkoutForm() {
  const [type, setType] = useState("push");
  const [customName, setCustomName] = useState("");
  const [duration, setDuration] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Extract<WorkoutResult, { ok: true }> | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const res = await runSubmit();
    if (res && res.ok) setResult(res);
  }

  async function runSubmit(): Promise<WorkoutResult | null> {
    const mins = parseInt(duration, 10);
    if (!mins || mins <= 0) {
      setError("Enter how many minutes you worked out.");
      return null;
    }
    if (type === "custom" && !customName.trim()) {
      setError("Give your custom workout a name.");
      return null;
    }
    setBusy(true);
    try {
      const res = await logWorkout({
        type,
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
  }

  // ---- Reward screen ----
  if (result) {
    return (
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-8 text-center">
        <div className="text-5xl">💪</div>
        <p className="mt-3 text-sm font-semibold uppercase tracking-[0.3em] text-neutral-400">
          Workout complete
        </p>
        <p className="mt-2 text-4xl font-black text-forge">+{result.xpEarned} XP</p>

        {result.leveledUp && (
          <div className="mt-6 rounded-xl border border-forge/40 bg-forge/10 p-4">
            <p className="text-lg font-black">🔥 Level {result.level}!</p>
            {result.rankChanged && (
              <p className="mt-1 font-semibold text-forge">New rank: {result.rank}</p>
            )}
          </div>
        )}

        <div className="mt-8 flex flex-col gap-3">
          <button
            onClick={reset}
            className="rounded-lg border border-neutral-800 py-3 font-bold transition hover:border-neutral-600"
          >
            Log another
          </button>
          <Link
            href="/dashboard"
            className="rounded-lg bg-forge py-3 font-bold text-neutral-950 transition hover:bg-forge-soft"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
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

      {/* Workout type */}
      <div>
        <label className="mb-2 block text-sm font-semibold text-neutral-300">Type</label>
        <div className="grid grid-cols-3 gap-2">
          {TYPES.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setType(t.key)}
              aria-pressed={type === t.key}
              className={
                "rounded-lg border py-3 text-sm font-bold transition " +
                (type === t.key
                  ? "border-forge bg-forge/15 text-forge"
                  : "border-neutral-800 bg-neutral-900 text-neutral-300 hover:border-neutral-600")
              }
            >
              {t.label}
            </button>
          ))}
        </div>
        {type === "custom" && (
          <input
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            placeholder="Name your workout (e.g. Boxing)"
            className="mt-3 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-3 outline-none focus:border-forge"
          />
        )}
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
        className="w-full rounded-lg bg-forge py-4 text-lg font-black text-neutral-950 transition hover:bg-forge-soft disabled:opacity-50"
      >
        {busy ? "Saving…" : "Complete workout"}
      </button>
    </form>
  );
}
