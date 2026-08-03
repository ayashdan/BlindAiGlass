// Chest tiers and reward rolls. Deliberately NOT blind-gambling loot boxes:
// every chest's possible range is disclosed here (and shown in the UI)
// before you ever open one, every roll is strictly positive value (no dead
// pulls), and nothing exclusive is gated solely behind a paid chest's luck —
// same "not loot boxes" principle already used for achievement cosmetics.

export type ChestTier = "common" | "rare" | "legendary";

export type ChestDef = {
  tier: ChestTier;
  name: string;
  icon: string;
  color: string; // tailwind color token, drives glow/border treatment
  blurb: string;
  xpRange: [number, number];
  freezeChance: number; // 0-1, chance of +1 streak freeze on top of XP
  guaranteedFreeze?: boolean;
};

export const CHEST_DEFS: Record<ChestTier, ChestDef> = {
  common: {
    tier: "common",
    name: "Common Chest",
    icon: "📦",
    color: "emerald",
    blurb: "10-25 XP. One dropped every workout you log.",
    xpRange: [10, 25],
    freezeChance: 0,
  },
  rare: {
    tier: "rare",
    name: "Rare Chest",
    icon: "💎",
    color: "sky",
    blurb: "40-80 XP, 25% chance of a bonus streak freeze. One every 5 levels.",
    xpRange: [40, 80],
    freezeChance: 0.25,
  },
  legendary: {
    tier: "legendary",
    name: "Legendary Chest",
    icon: "👑",
    color: "amber",
    blurb: "150-300 XP, always includes a streak freeze. A rare prize from special events.",
    xpRange: [150, 300],
    freezeChance: 1,
    guaranteedFreeze: true,
  },
};

export const CHEST_ORDER: ChestTier[] = ["common", "rare", "legendary"];

export type ChestReward = { xp: number; freeze: boolean };

// Server-side only in practice (called from chests-server.ts), but kept
// pure/testable — takes a rng function so tests can supply a fixed one.
export function rollChestReward(tier: ChestTier, rng: () => number = Math.random): ChestReward {
  const def = CHEST_DEFS[tier];
  const [lo, hi] = def.xpRange;
  const xp = lo + Math.floor(rng() * (hi - lo + 1));
  const freeze = def.guaranteedFreeze || rng() < def.freezeChance;
  return { xp, freeze };
}
