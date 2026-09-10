-- ============================================================================
--  Forge — character stats. Every workout grows a specific stat based on
--  what was actually trained, instead of one flat XP number.
--  Paste into Supabase -> SQL Editor -> New query -> Run.
-- ============================================================================

alter table public.profiles
  add column if not exists stat_power      integer not null default 0,
  add column if not exists stat_grit       integer not null default 0,
  add column if not exists stat_endurance  integer not null default 0,
  add column if not exists stat_discipline integer not null default 0;
