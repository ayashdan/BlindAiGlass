-- ============================================================================
--  Forge — earned streak freeze. Banked automatically at 7/14/... day streak
--  milestones (capped), auto-consumed to protect a streak after exactly one
--  missed day. Not purchasable — this is a safety valve, not a monetization
--  lever.
--  Paste into Supabase -> SQL Editor -> New query -> Run.
-- ============================================================================

alter table public.profiles
  add column if not exists streak_freezes integer not null default 0;
