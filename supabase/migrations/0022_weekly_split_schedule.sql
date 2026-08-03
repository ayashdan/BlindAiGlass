-- ============================================================================
--  Forge — recurring weekly split schedule. Lets a user set what they train
--  each day of the week (Push/Pull/Legs) once from their profile; it stays
--  in effect every week until they manually change it, and drives the
--  dashboard's daily quest automatically instead of asking every day.
--  Paste into Supabase -> SQL Editor -> New query -> Run.
-- ============================================================================

alter table public.profiles
  add column if not exists weekly_split_schedule jsonb not null default '{}'::jsonb;
