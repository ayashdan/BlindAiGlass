-- ============================================================================
--  Forge — invite specific people from the waitlist before public launch.
--  Adds an `invited` flag the admin can set per person, plus a
--  security-definer function so the sign-up flow can check it without
--  needing raw read access to the waitlist table (which stays locked down).
--  Paste into Supabase -> SQL Editor -> New query -> Run.
-- ============================================================================

alter table public.waitlist
  add column if not exists invited boolean not null default false,
  add column if not exists invited_at timestamptz;

create or replace function public.is_invited(p_email text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.waitlist
    where email = lower(trim(p_email)) and invited = true
  );
$$;

grant execute on function public.is_invited(text) to anon, authenticated;
