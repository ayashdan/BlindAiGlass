-- ============================================================================
--  Forge — deliberate recovery days. Logging a rest day (max once per day)
--  grants a one-shot XP bonus on your next workout, rewarding planned
--  recovery instead of just not punishing rest.
--  Paste into Supabase -> SQL Editor -> New query -> Run.
-- ============================================================================

alter table public.profiles
  add column if not exists last_rest_date date,
  add column if not exists recovery_bonus_pct integer not null default 0;
