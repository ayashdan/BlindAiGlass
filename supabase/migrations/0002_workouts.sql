-- ============================================================================
--  Forge — Phase 3 database: the workouts table.
--  Paste into Supabase -> SQL Editor -> New query -> Run.
-- ============================================================================

create table if not exists public.workouts (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users on delete cascade,
  type             text not null,          -- push | pull | legs | full | custom
  custom_name      text,                   -- filled in only when type = 'custom'
  duration_minutes integer not null,
  difficulty       text not null,          -- easy | medium | hard
  notes            text,
  xp_earned        integer not null default 0,
  created_at       timestamptz not null default now()
);

-- Helpful index for listing a user's workouts newest-first (streaks later).
create index if not exists workouts_user_created_idx
  on public.workouts (user_id, created_at desc);

alter table public.workouts enable row level security;

-- A user can only READ their own workouts.
drop policy if exists "workouts_select_own" on public.workouts;
create policy "workouts_select_own"
  on public.workouts for select
  using (auth.uid() = user_id);

-- A user can only INSERT workouts for themselves.
drop policy if exists "workouts_insert_own" on public.workouts;
create policy "workouts_insert_own"
  on public.workouts for insert
  with check (auth.uid() = user_id);
