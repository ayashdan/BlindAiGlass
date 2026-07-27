"use client";

// The interactive Level + XP card. It owns the XP number in local state so the
// bar animates instantly, and pops a celebration overlay on a level-up.
import { useEffect, useState } from "react";
import { levelProgress, rankForLevel } from "@/lib/game/leveling";
import { gainTestXp } from "@/app/(app)/actions";

export default function XpPanel({ initialXp }: { initialXp: number }) {
  const [xp, setXp] = useState(initialXp);
  const [busy, setBusy] = useState(false);
  const [levelUp, setLevelUp] = useState<{ level: number; rank: string | null } | null>(null);

  const p = levelProgress(xp);
  const rank = rankForLevel(p.level);

  // Auto-dismiss the celebration after a few seconds.
  useEffect(() => {
    if (!levelUp) return;
    const t = setTimeout(() => setLevelUp(null), 2800);
    return () => clearTimeout(t);
  }, [levelUp]);

  async function onGain() {
    if (busy) return;
    setBusy(true);
    try {
      const res = await gainTestXp();
      if (res.ok) {
        setXp(res.totalXp);
        if (res.leveledUp) {
          setLevelUp({ level: res.level, rank: res.rankChanged ? res.rank : null });
        }
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
      <div className="mb-3 flex items-baseline justify-between">
        <span className="text-lg font-bold">Level {p.level}</span>
        <span className="rounded-full bg-forge/15 px-3 py-1 text-sm font-semibold text-forge">
          {rank}
        </span>
      </div>

      {/* XP progress bar */}
      <div className="h-3 w-full overflow-hidden rounded-full bg-neutral-800">
        <div
          className="h-full rounded-full bg-forge transition-all duration-700 ease-out"
          style={{ width: `${p.percent}%` }}
        />
      </div>
      <p className="mt-2 text-sm text-neutral-400">
        {p.atMax
          ? "Max level reached!"
          : `${p.into} / ${p.need} XP · ${p.remaining} to next level`}
      </p>

      <button
        onClick={onGain}
        disabled={busy || p.atMax}
        className="mt-5 w-full rounded-lg bg-forge py-3 font-bold text-neutral-950 transition hover:bg-forge-soft disabled:opacity-50"
      >
        {busy ? "…" : "＋ Gain 100 XP (test)"}
      </button>
      <p className="mt-2 text-center text-xs text-neutral-500">
        Temporary test button — Phase 3 replaces this with real workouts.
      </p>

      {/* Level-up celebration */}
      {levelUp && (
        <div
          onClick={() => setLevelUp(null)}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-neutral-950/85 px-6 text-center backdrop-blur"
        >
          <div className="animate-bounce text-6xl">🔥</div>
          <p className="mt-4 text-sm font-semibold uppercase tracking-[0.3em] text-forge">
            Level up
          </p>
          <p className="mt-1 text-5xl font-black">Level {levelUp.level}</p>
          {levelUp.rank && (
            <p className="mt-4 rounded-full bg-forge/15 px-4 py-1 font-semibold text-forge">
              New rank: {levelUp.rank}
            </p>
          )}
          <p className="mt-8 text-xs text-neutral-500">tap to continue</p>
        </div>
      )}
    </section>
  );
}
