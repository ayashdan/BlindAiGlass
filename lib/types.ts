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
