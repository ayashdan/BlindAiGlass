-- ============================================================================
--  Forge — choose today's split. Lets a user tell Forge what they're
--  training today so the Push/Pull/Leg Day quest actually matches their
--  plan instead of being randomly assigned.
--  Paste into Supabase -> SQL Editor -> New query -> Run.
-- ============================================================================

alter table public.profiles
  add column if not exists split_choice_date date,
  add column if not exists split_choice text;
