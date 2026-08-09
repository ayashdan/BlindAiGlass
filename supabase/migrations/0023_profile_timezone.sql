-- ============================================================================
--  Forge — stores each user's IANA timezone (captured client-side, e.g.
--  "America/Los_Angeles") so the streak-reminder cron job can figure out
--  what day it actually is for THEM, instead of assuming the server's UTC
--  clock. Without this, a reminder firing at a fixed UTC time has no way to
--  know whether a given user's "today" has already happened or not.
--  Paste into Supabase -> SQL Editor -> New query -> Run.
-- ============================================================================

alter table public.profiles
  add column if not exists timezone text;
