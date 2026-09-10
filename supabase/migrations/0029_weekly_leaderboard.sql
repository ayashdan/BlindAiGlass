-- ============================================================================
--  Forge — weekly friends leaderboard. The existing friends leaderboard
--  ranks by lifetime XP, so whoever joined first wins forever and everyone
--  else is playing for second place. A leaderboard that resets every Monday
--  gives every friend group a fresh race, every week.
--  Paste into Supabase -> SQL Editor -> New query -> Run.
-- ============================================================================

alter table public.profiles
  add column if not exists weekly_xp integer not null default 0,
  add column if not exists weekly_xp_week_start date;

-- No RLS changes needed — `profiles` is already public-read (see
-- 0001_profiles.sql), same as the xp/level/rank columns these sit next to.
