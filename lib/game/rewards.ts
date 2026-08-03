// Pure logic (no database): the full "what do I get every 5 levels" ladder.
// Every 5 levels always drops a Rare Chest (see the chest-award logic in
// app/(app)/workout/actions.ts); some of those levels also happen to be a
// rank threshold (lib/game/leveling.ts) or a level-based achievement
// (lib/game/achievements.ts) — all of which land on multiples of 5, so one
// ladder can show everything a level milestone unlocks at once.
//
// The achievement name/icon/XP here duplicate the database seed
// (supabase/migrations/0003_achievements.sql, 0010_achievements_v2.sql) —
// same reasoning as ACHIEVEMENT_COSMETICS: this needs to render without a
// round trip, and level-based achievements are a fixed, rarely-changed set.
import { MAX_LEVEL, rankForLevel, type Rank } from "./leveling";
import { ACHIEVEMENT_COSMETICS } from "./cosmetics";

export type LevelAchievement = { key: string; name: string; icon: string; xpReward: number };

export type LevelReward = {
  level: number;
  rank?: Rank;
  achievement?: LevelAchievement;
};

const RANK_LEVELS = new Set([10, 20, 35, 55, 75, 90]);

const LEVEL_ACHIEVEMENTS: Record<number, LevelAchievement> = {
  10: { key: "level_10", name: "Rising Star", icon: "⭐", xpReward: 100 },
  25: { key: "level_25", name: "Halfway Hero", icon: "🌟", xpReward: 150 },
  50: { key: "level_50", name: "Elite Forger", icon: "👑", xpReward: 500 },
};

// Every 5th level from 5 to MAX_LEVEL, oldest first.
export function levelRewardLadder(): LevelReward[] {
  const rungs: LevelReward[] = [];
  for (let level = 5; level <= MAX_LEVEL; level += 5) {
    rungs.push({
      level,
      rank: RANK_LEVELS.has(level) ? rankForLevel(level) : undefined,
      achievement: LEVEL_ACHIEVEMENTS[level],
    });
  }
  return rungs;
}

// The next rung above the given level — null once there's nothing left
// (past MAX_LEVEL).
export function nextLevelReward(currentLevel: number): LevelReward | null {
  return levelRewardLadder().find((r) => r.level > currentLevel) ?? null;
}

// A short, human line describing everything a rung unlocks — "Rare Chest",
// or "Rare Chest + Silver rank", or "Rare Chest + ⭐ Rising Star (+100 XP)".
export function levelRewardLabel(r: LevelReward): string {
  const parts = ["💎 Rare Chest"];
  if (r.rank) parts.push(`★ ${r.rank} rank`);
  if (r.achievement) {
    const cosmetic = ACHIEVEMENT_COSMETICS[r.achievement.key];
    const extra = cosmetic?.border && cosmetic?.title
      ? " + border + title"
      : cosmetic?.border
        ? " + border"
        : cosmetic?.title
          ? " + title"
          : "";
    parts.push(`${r.achievement.icon} "${r.achievement.name}" (+${r.achievement.xpReward} XP${extra})`);
  }
  return parts.join(" + ");
}
