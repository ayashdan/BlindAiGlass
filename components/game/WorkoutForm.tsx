"use client";

// The workout logging screen. On submit it calls the server action, then shows
// a reward screen ("+125 XP") and a level-up celebration when one happens.
import { useState } from "react";
import Link from "next/link";
import { logWorkout } from "@/app/(app)/workout/actions";
import AchievementCelebration from "./AchievementCelebration";
import LevelUpCelebration from "./LevelUpCelebration";
import { MUSCLE_GROUPS } from "@/lib/game/muscle-groups";
import { CLASS_INFO, type CharacterClass } from "@/lib/game/stats";
import { CHEST_DEFS } from "@/lib/game/chests";
import ShareButton from "@/components/ShareButton";
import { vibrate } from "@/lib/haptics";
import type { WorkoutResult } from "@/lib/types";

const STAT_ICONS: Record<string, string> = {
  power: "🔥",
  grit: "🗡️",
  endurance: "🏃",
  discipline: "🧠",
};

const DIFFICULTIES = [
  { key: "easy", label: "Easy" },
  { key: "medium", label: "Medium" },
  { key: "hard", label: "Hard" },
];

export default function WorkoutForm({
  suggestedGroups,
  isScheduledRest,
}: {
  suggestedGroups?: string[] | null;
  isScheduledRest?: boolean;
} = {}) {
  const [muscleGroups, setMuscleGroups] = useState<string[]>(suggestedGroups ?? []);
  const [customName, setCustomName] = useState("");
  const [duration, setDuration] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Extract<WorkoutResult, { ok: true }> | null>(null);
  const [celebratingLevel, setCelebratingLevel] = useState(false);
  const [celebratingAchievements, setCelebratingAchievements] = useState(false);

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
      vibrate(15);
      // Level-up first (the bigger moment), achievements after it's
      // dismissed — showing both full-screen overlays at once is a mess.
      if (res.leveledUp) {
        setCelebratingLevel(true);
      } else if (res.unlocked.length > 0) {
        setCelebratingAchievements(true);
      }
    }
  }

  function dismissLevelCelebration() {
    setCelebratingLevel(false);
    if (result && result.unlocked.length > 0) setCelebratingAchievements(true);
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
    setMuscleGroups(suggestedGroups ?? []);
  }

  // ---- Reward screen ----
  if (result) {
    return (
      <>
        {celebratingLevel && (
          <LevelUpCelebration
            level={result.level}
            rank={result.rank}
            rankChanged={result.rankChanged}
            onDismiss={dismissLevelCelebration}
          />
        )}
        {celebratingAchievements && (
          <AchievementCelebration
            achievements={result.unlocked}
            onDismiss={() => setCelebratingAchievements(false)}
          />
        )}

        <div className="fade-in-up glow-pulse rounded-2xl border border-forge/30 bg-gradient-to-br from-forge/10 via-surface to-surface p-8 text-center">
          <div className="celebrate-bounce text-5xl">💪</div>
          <p className="mt-3 text-sm font-semibold uppercase tracking-[0.3em] text-muted">
            Workout complete
          </p>
          <p className="mt-2 text-4xl font-black text-forge">+{result.xpEarned} XP</p>

          <p className="mt-3 text-lg font-bold">
            🔥 {result.streak} day streak
          </p>

          {result.recoveryBonusApplied && (
            <p className="mt-2 text-sm text-sky-400">🌙 Recovery bonus applied to this workout</p>
          )}

          {result.statGains.length > 0 && (
            <div className="celebrate-pop mt-4 flex flex-wrap justify-center gap-2">
              {result.statGains.map((g) => (
                <span
                  key={g.stat}
                  className="rounded-full border border-line bg-surface px-3 py-1 text-xs font-bold"
                >
                  {STAT_ICONS[g.stat] ?? "✨"} +{g.amount} {g.stat}
                </span>
              ))}
            </div>
          )}

          {result.newClass && (
            <div className="celebrate-pop mt-4 rounded-xl border border-fuchsia-400/40 bg-fuchsia-400/10 p-4">
              <p className="text-lg font-black text-fuchsia-300">
                {CLASS_INFO[result.newClass as CharacterClass]?.icon} Your build shifted to{" "}
                {result.newClass}!
              </p>
            </div>
          )}

          {result.seasonTiersReached.length > 0 && (
            <div className="mt-4 space-y-2">
              {result.seasonTiersReached.map((t, i) => (
                <div
                  key={t.tier}
                  className="celebrate-pop rounded-xl border border-fuchsia-400/40 bg-fuchsia-400/10 p-3"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <p className="font-bold text-fuchsia-300">🎖️ Season tier {t.tier} reached!</p>
                  <p className="text-sm text-fuchsia-200/80">+{t.xpReward} XP</p>
                </div>
              ))}
            </div>
          )}

          {result.freezeUsed && (
            <div className="celebrate-pop mt-4 rounded-xl border border-sky-400/40 bg-sky-400/10 p-3">
              <p className="font-bold text-sky-300">🧊 Streak freeze used — your streak is safe!</p>
            </div>
          )}
          {result.freezeEarned && (
            <div className="celebrate-pop mt-4 rounded-xl border border-sky-400/40 bg-sky-400/10 p-3">
              <p className="font-bold text-sky-300">
                🧊 +1 Streak Freeze earned! ({result.streakFreezes} banked)
              </p>
            </div>
          )}

          {result.newRecords.length > 0 && (
            <div className="mt-4 space-y-2">
              {result.newRecords.map((r, i) => (
                <div
                  key={r.category}
                  className="celebrate-pop rounded-xl border border-purple-400/40 bg-purple-400/10 p-3"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <p className="font-bold text-purple-300">🏆 New PR: {r.label}</p>
                  <p className="text-sm text-purple-200/80">{r.value} minutes</p>
                </div>
              ))}
            </div>
          )}

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

          {result.chestsEarned.length > 0 && (
            <Link
              href="/chests"
              className="celebrate-pop mt-4 flex items-center justify-between rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 transition hover:border-amber-500/60"
            >
              <p className="font-bold text-amber-300">
                {result.chestsEarned
                  .map((c) => `${CHEST_DEFS[c.tier].icon} ${c.count > 1 ? `${c.count}× ` : ""}${CHEST_DEFS[c.tier].name}`)
                  .join(" + ")}
              </p>
              <span className="text-sm text-amber-300">Open →</span>
            </Link>
          )}

          {/* Share options — pick what to brag about */}
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <ShareButton
              label="Share workout"
              text={`Just crushed a workout on Forge 💪 +${result.xpEarned} XP, 🔥${result.streak} day streak.`}
            />
            {result.newRecords.length > 0 && (
              <ShareButton
                label="Share PR"
                text={`New PR on Forge 🏆 ${result.newRecords.map((r) => `${r.label}: ${r.value} min`).join(", ")}`}
              />
            )}
            {result.unlocked.length > 0 && (
              <ShareButton
                label="Share achievement"
                text={`Just unlocked "${result.unlocked.map((a) => a.name).join('", "')}" on Forge 🏅`}
              />
            )}
          </div>

          <div className="mt-6 flex flex-col gap-3">
            <button
              onClick={reset}
              className="press rounded-lg border border-line py-3 font-bold transition hover:border-forge/50"
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

      {isScheduledRest && (
        <p className="rounded-lg border border-sky-500/30 bg-sky-500/5 px-4 py-3 text-sm text-sky-300">
          😴 Today's scheduled as a rest day on your weekly plan. Logging a
          workout anyway is fine — or head back and tap "Log a rest day" on
          the dashboard instead.
        </p>
      )}

      {/* Muscle groups (multi-select) */}
      <div className="game-card rounded-2xl border border-line bg-surface p-4">
        <label className="mb-2 block text-sm font-semibold text-fg">
          Muscle groups worked
        </label>
        <p className="mb-2 text-xs text-muted">
          Tap all that apply.
          {suggestedGroups && suggestedGroups.length > 0 && (
            <span className="text-forge">
              {" "}
              📅 Suggested from your schedule — pre-selected below.
            </span>
          )}
        </p>
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
                    : "border-line bg-bg text-fg hover:border-forge/50")
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
          className="mt-3 w-full rounded-lg border border-line bg-bg px-4 py-3 outline-none focus:border-forge"
        />
      </div>

      {/* Duration */}
      <div className="game-card rounded-2xl border border-line bg-surface p-4">
        <label className="mb-2 block text-sm font-semibold text-fg">
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
          className="w-full rounded-lg border border-line bg-bg px-4 py-3 outline-none focus:border-forge"
        />
      </div>

      {/* Difficulty */}
      <div className="game-card rounded-2xl border border-line bg-surface p-4">
        <label className="mb-2 block text-sm font-semibold text-fg">
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
                  : "border-line bg-bg text-fg hover:border-forge/50")
              }
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div className="game-card rounded-2xl border border-line bg-surface p-4">
        <label className="mb-2 block text-sm font-semibold text-fg">
          Notes (optional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="How did it go?"
          className="w-full resize-none rounded-lg border border-line bg-bg px-4 py-3 outline-none focus:border-forge"
        />
      </div>

      <button
        type="submit"
        disabled={busy}
        className="press glow-pulse w-full rounded-lg bg-forge py-4 text-lg font-black text-neutral-950 transition hover:bg-forge-soft disabled:opacity-50"
      >
        {busy ? "Saving…" : "⚔️ Complete workout"}
      </button>
    </form>
  );
}
