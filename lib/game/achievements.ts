// Achievement unlock RULES (pure logic). The names/icons/XP live in the
// database `achievements` table; these conditions decide when each one unlocks.
// The `key` links a rule here to its row in the database.

export type AchievementStats = {
  totalWorkouts: number;
  currentStreak: number;
  level: number;
  hasNewPR: boolean; // did this workout beat a previously-set personal record?
  muscleGroupVariety: number; // distinct muscle groups trained, lifetime
};

export type AchievementCondition = {
  key: string;
  check: (s: AchievementStats) => boolean;
  // Only set for simple single-metric threshold conditions — lets the "next
  // reward" teaser show real progress ("4 more workouts") without needing
  // its own separate copy of these numbers.
  progress?: { metric: keyof AchievementStats; threshold: number };
};

export const ACHIEVEMENT_CONDITIONS: AchievementCondition[] = [
  {
    key: "first_workout",
    check: (s) => s.totalWorkouts >= 1,
    progress: { metric: "totalWorkouts", threshold: 1 },
  },
  {
    key: "getting_started",
    check: (s) => s.totalWorkouts >= 3,
    progress: { metric: "totalWorkouts", threshold: 3 },
  },
  {
    key: "warrior_7",
    check: (s) => s.currentStreak >= 7,
    progress: { metric: "currentStreak", threshold: 7 },
  },
  {
    key: "beast_30",
    check: (s) => s.currentStreak >= 30,
    progress: { metric: "currentStreak", threshold: 30 },
  },
  {
    key: "workouts_100",
    check: (s) => s.totalWorkouts >= 100,
    progress: { metric: "totalWorkouts", threshold: 100 },
  },
  { key: "level_10", check: (s) => s.level >= 10, progress: { metric: "level", threshold: 10 } },
  { key: "level_25", check: (s) => s.level >= 25, progress: { metric: "level", threshold: 25 } },
  { key: "level_50", check: (s) => s.level >= 50, progress: { metric: "level", threshold: 50 } },
  { key: "first_pr", check: (s) => s.hasNewPR }, // no meaningful countdown metric
  {
    key: "well_rounded",
    check: (s) => s.muscleGroupVariety >= 5,
    progress: { metric: "muscleGroupVariety", threshold: 5 },
  },
];
