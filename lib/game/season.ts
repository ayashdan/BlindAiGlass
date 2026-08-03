// A lightweight season: no forced resets (Prestige already covers the
// opt-in reset loop), just a time-boxed track of workout-count tiers that
// pay out bonus XP, giving a reason to care about "this month" specifically.
// The admin starts a new season manually from /admin/settings.

export type SeasonTier = { tier: number; workouts: number; xpReward: number };

export const SEASON_TIERS: SeasonTier[] = [
  { tier: 1, workouts: 5, xpReward: 50 },
  { tier: 2, workouts: 15, xpReward: 100 },
  { tier: 3, workouts: 30, xpReward: 150 },
  { tier: 4, workouts: 50, xpReward: 250 },
];

// Roughly two months — long enough to be a real chunk of a training block,
// short enough that "this season" still means something. The admin starts
// each new one manually from /admin/settings; nothing here auto-rotates.
export const SEASON_LENGTH_DAYS = 60;

// The Plus season track: same tiers, same workout counts — nobody's
// progress changes — but a Plus subscriber additionally unlocks a cosmetic
// at each one. Never XP; only the free track pays currency, so this never
// touches the leaderboard or the weekly league. Titles carry the season
// number (`S${seasonNumber} ${titleSuffix}`) so a reward earned in Season 1
// reads as a permanent trophy from that season, not a title that mutates
// when Season 2 starts — and it stays equippable even if the subscription
// later lapses, same as an achievement.
export type SeasonPlusReward = { border?: string; titleSuffix?: string };

export const SEASON_PLUS_REWARDS: Record<number, SeasonPlusReward> = {
  1: { border: "shop-ring-emerald" },
  2: { titleSuffix: "Contender" },
  3: { border: "shop-ring-crimson" },
  4: { titleSuffix: "Champion" },
};

export function seasonPlusTitle(seasonNumber: number, tier: number): string | null {
  const suffix = SEASON_PLUS_REWARDS[tier]?.titleSuffix;
  return suffix ? `S${seasonNumber} ${suffix}` : null;
}
