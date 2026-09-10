-- ============================================================================
--  Forge — Phase 1 database: the profiles table.
--  Paste this whole file into Supabase -> SQL Editor -> New query -> Run.
-- ============================================================================

-- One row per user. `id` links to Supabase's built-in auth users.
create table if not exists public.profiles (
  id                uuid primary key references auth.users on delete cascade,
  username          text unique not null,
  avatar            text not null default 'flame',
  xp                integer not null default 0,      -- total lifetime XP
  level             integer not null default 1,
  rank              text not null default 'Beginner',
  current_streak    integer not null default 0,
  longest_streak    integer not null default 0,
  total_workouts    integer not null default 0,
  last_workout_date date,
  is_admin          boolean not null default false,
  created_at        timestamptz not null default now()
);

-- Row Level Security: lock the table down, then add specific allow-rules.
alter table public.profiles enable row level security;

-- Anyone (even logged-out) can READ profiles. Needed later for leaderboards;
-- only public game stats live here, no private data.
drop policy if exists "profiles_select_all" on public.profiles;
create policy "profiles_select_all"
  on public.profiles for select
  using (true);

-- A user can only UPDATE their own profile row.
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ----------------------------------------------------------------------------
-- Auto-create a profile the moment someone signs up. The username is read
-- from the sign-up data we attach in the app. Runs with elevated rights
-- (security definer) so it can insert despite RLS.
-- ----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'username', 'user_' || substr(new.id::text, 1, 8))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
