"use client";

// The tap-and-reveal moment for a chest: a shake for anticipation, the lid
// pops open, then the reward shows. Rewards are always disclosed ranges
// (see lib/game/chests.ts) — this is presentation, not a gamble.
import { useState, useTransition } from "react";
import { CHEST_DEFS, type ChestTier } from "@/lib/game/chests";
import { openChestAction } from "@/app/(app)/chests/actions";
import ChestGraphic from "./ChestGraphic";
import { playChestOpen } from "@/lib/sound";
import { vibrate } from "@/lib/haptics";

const COLOR_CLASSES: Record<string, { accent: string; text: string; glow: string; press: string }> = {
  emerald: { accent: "forge-accent-emerald", text: "text-emerald-400", glow: "", press: "rgb(4 120 87 / 0.5)" },
  sky: { accent: "forge-accent-sky", text: "text-sky-400", glow: "glow-pulse", press: "rgb(2 132 199 / 0.5)" },
  amber: { accent: "forge-accent-amber", text: "text-amber-400", glow: "glow-pulse", press: "rgb(180 83 9 / 0.5)" },
};

export default function ChestOpener({
  tier,
  initialCount,
}: {
  tier: ChestTier;
  initialCount: number;
}) {
  const def = CHEST_DEFS[tier];
  const colors = COLOR_CLASSES[def.color] ?? COLOR_CLASSES.emerald;
  const [count, setCount] = useState(initialCount);
  const [shaking, setShaking] = useState(false);
  const [lidOpen, setLidOpen] = useState(false);
  const [reveal, setReveal] = useState<{ xp: number; freeze: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function open() {
    if (count <= 0 || pending || shaking) return;
    setError(null);
    setReveal(null);
    setLidOpen(false);
    setShaking(true);
    vibrate(12);

    startTransition(async () => {
      const result = await openChestAction(tier);
      // Let the shake play out before the lid pops open.
      setTimeout(() => {
        setShaking(false);
        if (result.ok) {
          setLidOpen(true);
          setCount((c) => Math.max(0, c - 1));
          setReveal({ xp: result.reward.xp, freeze: result.reward.freeze });
          playChestOpen();
          vibrate([20, 40, 60]);
        } else {
          setError(result.error);
        }
      }, 650);
    });
  }

  return (
    <div
      className={`forge-panel ${colors.accent} p-5 text-center ${count > 0 && !lidOpen ? colors.glow : ""}`}
    >
      <div className={`mx-auto w-28 ${shaking ? "chest-shake" : ""}`}>
        <ChestGraphic tier={tier} open={lidOpen} />
      </div>
      <p className="mt-1 font-black">{def.name}</p>
      <p className="mt-1 text-xs text-muted">{def.blurb}</p>

      <p className={`mt-3 text-2xl font-black ${colors.text}`}>×{count}</p>

      <button
        onClick={open}
        disabled={count <= 0 || pending || shaking}
        className="press-3d mt-3 w-full rounded-lg bg-forge py-2.5 text-sm font-bold text-neutral-950 transition hover:bg-forge-soft disabled:cursor-not-allowed disabled:bg-surface2 disabled:text-muted disabled:shadow-none"
        style={{ "--press-shadow": colors.press } as React.CSSProperties}
      >
        {count <= 0 ? "None to open" : shaking ? "Opening…" : "Open"}
      </button>

      {reveal && (
        <div className="celebrate-pop mt-3 rounded-lg border border-forge/40 bg-forge/10 px-3 py-2 text-sm">
          <span className="font-black text-forge">+{reveal.xp} XP</span>
          {reveal.freeze && <span className="ml-2 font-bold text-sky-400">🧊 +1 Streak Freeze</span>}
        </div>
      )}
      {error && <p className="mt-3 text-xs text-red-400">{error}</p>}
    </div>
  );
}
