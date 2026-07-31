-- ============================================================================
--  Forge — chest system. Tracks how many unopened chests of each rarity a
--  user is holding; the chests themselves are earned (workouts, level
--  milestones) or bought in the shop (still a placeholder, see the Shop
--  page) and opened from /chests.
--  Paste into Supabase -> SQL Editor -> New query -> Run.
-- ============================================================================

alter table public.profiles
  add column if not exists chests_common integer not null default 0,
  add column if not exists chests_rare integer not null default 0,
  add column if not exists chests_legendary integer not null default 0;
