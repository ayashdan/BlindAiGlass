-- ============================================================================
--  Forge — personal records + lifetime muscle-group variety tracking.
--  Paste into Supabase -> SQL Editor -> New query -> Run.
-- ============================================================================

-- Which muscle groups this user has ever trained (lifetime), used for the
-- "Well Rounded" achievement without re-scanning the whole workouts table.
alter table public.profiles
  add column if not exists trained_muscle_groups text[] not null default '{}';

-- One row per (user, category) where category is 'overall' or a muscle
-- group key. Tracks the longest single workout ever logged in that
-- category, in minutes.
create table if not exists public.personal_records (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users on delete cascade,
  category     text not null,
  best_minutes integer not null,
  achieved_at  timestamptz not null default now(),
  unique (user_id, category)
);

alter table public.personal_records enable row level security;

drop policy if exists "pr_select_own" on public.personal_records;
create policy "pr_select_own"
  on public.personal_records for select
  using (auth.uid() = user_id);

drop policy if exists "pr_insert_own" on public.personal_records;
create policy "pr_insert_own"
  on public.personal_records for insert
  with check (auth.uid() = user_id);

drop policy if exists "pr_update_own" on public.personal_records;
create policy "pr_update_own"
  on public.personal_records for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
