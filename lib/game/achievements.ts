// Achievement unlock RULES (pure logic). The names/icons/XP live in the
// database `achievements` table; these conditions decide when each one unlocks.
// The `key` links a rule here to its row in the database.

export type AchievementStats = {
  totalWorkouts: number;
  currentStreak: number;
  level: number;
};

export type AchievementCondition = {
  key: string;
  check: (s: AchievementStats) => boolean;
};

export const ACHIEVEMENT_CONDITIONS: AchievementCondition[] = [
  { key: "first_workout", check: (s) => s.totalWorkouts >= 1 },
  { key: "warrior_7", check: (s) => s.currentStreak >= 7 },
  { key: "beast_30", check: (s) => s.currentStreak >= 30 },
  { key: "workouts_100", check: (s) => s.totalWorkouts >= 100 },
  { key: "level_10", check: (s) => s.level >= 10 },
  { key: "level_50", check: (s) => s.level >= 50 },
];
