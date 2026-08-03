/*
  leveling.ts — the "referee" math for XP, levels, and ranks.
  Pure functions (no database), so they're easy to test and reuse.

  Design:
   - We store each user's TOTAL lifetime XP.
   - The level is derived from that total XP.
   - XP to go from level L to L+1 grows with the level, so higher levels
     take longer (classic game feel).
*/

export const MAX_LEVEL = 100;
const BASE_XP = 100; // XP to go from level 1 -> 2

// XP required to advance FROM `level` to the next level.
export function xpToNextLevel(level: number): number {
  return BASE_XP * level; // L1->2 = 100, L2->3 = 200, ...
}

// Total XP needed to REACH a given level (level 1 = 0 XP).
export function totalXpForLevel(level: number): number {
  let total = 0;
  for (let l = 1; l < level; l++) total += xpToNextLevel(l);
  return total;
}

// Work out the current level from a total XP amount.
export function levelFromXp(totalXp: number): number {
  let level = 1;
  while (level < MAX_LEVEL && totalXp >= totalXpForLevel(level + 1)) level++;
  return level;
}

// Everything the UI needs to draw the XP progress bar.
export function levelProgress(totalXp: number) {
  const level = levelFromXp(totalXp);
  const floor = totalXpForLevel(level);
  const need = xpToNextLevel(level);
  const into = totalXp - floor;
  const atMax = level >= MAX_LEVEL;
  return {
    level,
    into,                                   // XP earned inside this level
    need,                                   // XP needed to finish this level
    remaining: atMax ? 0 : Math.max(0, need - into),
    percent: atMax ? 100 : Math.min(100, Math.round((into / need) * 100)),
    atMax,
  };
}

// Ranks unlock at level milestones.
export type Rank =
  | "Beginner" | "Bronze" | "Silver" | "Gold"
  | "Platinum" | "Diamond" | "Elite";

export function rankForLevel(level: number): Rank {
  if (level >= 90) return "Elite";
  if (level >= 75) return "Diamond";
  if (level >= 55) return "Platinum";
  if (level >= 35) return "Gold";
  if (level >= 20) return "Silver";
  if (level >= 10) return "Bronze";
  return "Beginner";
}
