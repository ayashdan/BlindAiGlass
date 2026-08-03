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
