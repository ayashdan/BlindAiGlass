-- ============================================================================
--  Forge — manual tier control. Lets the admin flag an account as
--  'premium' from the admin panel. This is NOT a payment system — no money
--  moves through the app — it's just a flag you flip by hand for whoever
--  you've decided should have it (e.g. paid you some other way, or a
--  comped/test account). No features are gated on it yet.
--  Paste into Supabase -> SQL Editor -> New query -> Run.
-- ============================================================================

alter table public.profiles
  add column if not exists tier text not null default 'free';

alter table public.profiles
  drop constraint if exists profiles_tier_check;
alter table public.profiles
  add constraint profiles_tier_check check (tier in ('free', 'premium'));
