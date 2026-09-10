"use client";

// The other half of the celebration pair (see AchievementCelebration): a
// full-screen takeover for the single biggest "I'm progressing" moment in
// the game, instead of leveling up just being a line on the reward card.
import { useEffect, useMemo } from "react";
import { playLevelUp } from "@/lib/sound";
import { vibrate } from "@/lib/haptics";

const CONFETTI_COLORS = ["#ff6a1a", "#fbbf24", "#ff8c4b", "#ffffff", "#a78bfa"];
const CONFETTI_COUNT = 44;

export default function LevelUpCelebration({
  level,
  rank,
  rankChanged,
  onDismiss,
}: {
  level: number;
  rank: string;
  rankChanged: boolean;
  onDismiss: () => void;
}) {
  const confetti = useMemo(
    () =>
      Array.from({ length: CONFETTI_COUNT }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 1.2,
        duration: 2.2 + Math.random() * 1.6,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        width: 5 + Math.random() * 5,
        rotate: Math.round(Math.random() * 360),
      })),
    []
  );

  useEffect(() => {
    playLevelUp();
    vibrate([30, 60, 30, 60, 80]);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-bg/90 backdrop-blur-sm">
      <div className="pointer-events-none absolute inset-0">
        {confetti.map((c) => (
          <span
            key={c.id}
            className="confetti-piece absolute top-[-10px] rounded-sm"
            style={{
              left: `${c.left}%`,
              width: c.width,
              height: c.width * 0.4,
              backgroundColor: c.color,
              animationDelay: `${c.delay}s`,
              animationDuration: `${c.duration}s`,
              transform: `rotate(${c.rotate}deg)`,
            }}
          />
        ))}
      </div>

      <div className="relative mx-auto max-w-sm px-6 text-center">
        <p className="celebrate-pop text-sm font-black uppercase tracking-[0.3em] text-forge">
          Level Up
        </p>

        <div
          className="celebrate-pop glow-pulse mt-6 rounded-3xl border border-amber-500/40 bg-gradient-to-br from-amber-500/20 via-forge/10 to-transparent p-8"
          style={{ animationDelay: "0.1s" }}
        >
          <p
            className="celebrate-bounce text-7xl font-black text-transparent [background:linear-gradient(180deg,#fff,theme(colors.amber.300))] [background-clip:text] [-webkit-background-clip:text]"
            style={{ animationDelay: "0.4s" }}
          >
            {level}
          </p>
          <p className="mt-2 text-sm font-bold uppercase tracking-wide text-muted">
            {rankChanged ? "New rank reached" : "Level"}
          </p>
          {rankChanged && (
            <p
              className="celebrate-pop mt-1 text-2xl font-black text-amber-300"
              style={{ animationDelay: "0.3s" }}
            >
              {rank}
            </p>
          )}
        </div>

        <button
          onClick={onDismiss}
          className="celebrate-pop press mt-8 rounded-lg bg-forge px-8 py-3 font-black text-neutral-950 transition hover:bg-forge-soft"
          style={{ animationDelay: "0.5s" }}
        >
          Let's go!
        </button>
      </div>
    </div>
  );
}
