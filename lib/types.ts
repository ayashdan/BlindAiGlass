// Shared TypeScript shapes used across the app.

export type Profile = {
  id: string;
  username: string;
  avatar: string;
  xp: number; // total lifetime XP
  level: number;
  rank: string;
  current_streak: number;
  longest_streak: number;
  total_workouts: number;
  last_workout_date: string | null;
  is_admin: boolean;
  created_at: string;
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

// The result of logging a workout (shared between the server action and the UI).
export type WorkoutResult =
  | { ok: false; error: string }
  | {
      ok: true;
      xpEarned: number; // workout XP + streak bonus + achievement XP + quest XP
      streak: number;
      leveledUp: boolean;
      level: number;
      rank: string;
      rankChanged: boolean;
      unlocked: UnlockedAchievement[];
      questsCompleted: CompletedQuest[];
    };
