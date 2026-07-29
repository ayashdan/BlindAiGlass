"use client";

// A full-screen celebration shown the moment an achievement unlocks:
// falling confetti + each badge popping in with a bounce and a glow.
// Pure CSS animation (see globals.css) — no dependencies, no cost.
import { useMemo } from "react";
import type { UnlockedAchievement } from "@/lib/types";

const CONFETTI_COLORS = ["#ff6a1a", "#ff8c4b", "#ffd23f", "#ffffff", "#4ade80"];
const CONFETTI_COUNT = 36;

export default function AchievementCelebration({
  achievements,
  onDismiss,
}: {
  achievements: UnlockedAchievement[];
  onDismiss: () => void;
}) {
  // Randomized once per mount, not on every re-render.
  const confetti = useMemo(
    () =>
      Array.from({ length: CONFETTI_COUNT }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 1.2,
        duration: 2.4 + Math.random() * 1.6,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        width: 5 + Math.random() * 5,
        rotate: Math.round(Math.random() * 360),
      })),
    []
  );

  if (achievements.length === 0) return null;

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
          Achievement Unlocked
        </p>

        <div className="mt-6 space-y-4">
          {achievements.map((a, i) => (
            <div
              key={a.key}
              className="celebrate-pop rounded-2xl border border-yellow-500/50 bg-yellow-500/10 p-5"
              style={{ animationDelay: `${0.15 + i * 0.2}s` }}
            >
              <div
                className="celebrate-bounce text-5xl"
                style={{ animationDelay: `${0.5 + i * 0.2}s` }}
              >
                {a.icon}
              </div>
              <p className="mt-2 text-lg font-black">{a.name}</p>
              <p className="text-sm font-semibold text-yellow-300/90">+{a.xpReward} XP</p>
            </div>
          ))}
        </div>

        <button
          onClick={onDismiss}
          className="celebrate-pop press mt-8 rounded-lg bg-forge px-8 py-3 font-black text-neutral-950 transition hover:bg-forge-soft"
          style={{ animationDelay: `${0.35 + achievements.length * 0.2}s` }}
        >
          Nice!
        </button>
      </div>
    </div>
  );
}
