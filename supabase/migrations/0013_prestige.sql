-- ============================================================================
--  Forge — Tier C: prestige. At Level 100 there was no more goal left; this
--  gives veteran users a reason to keep going. Purely cosmetic — resets
--  XP/level/rank back to 1, but permanently marks a prestige star. Lifetime
--  stats (workouts, streaks, achievements) are untouched.
--  Paste into Supabase -> SQL Editor -> New query -> Run.
-- ============================================================================

alter table public.profiles
  add column if not exists prestige integer not null default 0;
