// Shared TypeScript shapes used across the app.

export type Profile = {
  id: string;
  username: string;
  avatar: string;
  avatar_url: string | null; // an uploaded photo, if any — wins over `avatar` emoji
  xp: number; // total lifetime XP
  level: number;
  rank: string;
  current_streak: number;
  longest_streak: number;
  total_workouts: number;
  last_workout_date: string | null;
  is_admin: boolean;
  created_at: string;
  streak_freezes: number;
  trained_muscle_groups: string[];
  prestige: number;
  stat_power: number;
  stat_grit: number;
  stat_endurance: number;
  stat_discipline: number;
  equipped_border: string | null;
  equipped_title: string | null;
  last_rest_date: string | null;
  recovery_bonus_pct: number;
  split_choice_date: string | null;
  split_choice: string | null;
  // Per day-of-week (see WEEKLY_SPLIT_DISPLAY_ORDER): either the muscle
  // groups scheduled that day, or "rest". Missing = not scheduled.
  weekly_split_schedule: Record<string, string[] | "rest">;
  tier: "free" | "premium";
};

// An achievement the user just unlocked.
export type UnlockedAchievement = {
  key: string;
  name: string;
  icon: string;
  xpReward: number;
};

// A daily quest the user just completed.
export type CompletedQuest = {
  key: string;
  title: string;
  icon: string;
  xpReward: number;
};

// A personal record the user just beat (never fires on the first-ever entry
// in a category — only on genuinely improving past a prior best).
export type NewRecord = {
  category: string;
  label: string;
  value: number; // minutes
};

// A stat gain from a single workout (power/grit/endurance).
export type StatGain = { stat: string; amount: number };

// A season pass tier crossed by this workout.
export type SeasonTierReached = { tier: number; xpReward: number };

// The result of logging a workout (shared between the server action and the UI).
export type WorkoutResult =
  | { ok: false; error: string }
  | {
      ok: true;
      xpEarned: number; // workout + streak + achievement + quest + PR + season XP
      streak: number;
      leveledUp: boolean;
      level: number;
      rank: string;
      rankChanged: boolean;
      unlocked: UnlockedAchievement[];
      questsCompleted: CompletedQuest[];
      newRecords: NewRecord[];
      freezeUsed: boolean;
      freezeEarned: boolean;
      streakFreezes: number;
      statGains: StatGain[];
      newClass: string | null; // set only when the workout changed your class
      seasonTiersReached: SeasonTierReached[];
      recoveryBonusApplied: boolean;
    };
