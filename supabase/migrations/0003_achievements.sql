-- ============================================================================
--  Forge — Phase 4 database: achievements catalog + user unlocks.
--  Paste into Supabase -> SQL Editor -> New query -> Run.
--  (Streaks reuse the existing profiles columns — no new streak table needed.)
-- ============================================================================

-- The catalog of every possible badge.
create table if not exists public.achievements (
  id          uuid primary key default gen_random_uuid(),
  key         text unique not null,      -- links to the unlock rule in code
  name        text not null,
  description text not null,
  icon        text not null default '🏅',
  xp_reward   integer not null default 0,
  sort_order  integer not null default 0
);

alter table public.achievements enable row level security;

drop policy if exists "achievements_select_all" on public.achievements;
create policy "achievements_select_all"
  on public.achievements for select
  using (true);

-- Which user unlocked which badge (and when).
create table if not exists public.user_achievements (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users on delete cascade,
  achievement_id uuid not null references public.achievements on delete cascade,
  unlocked_at    timestamptz not null default now(),
  unique (user_id, achievement_id)       -- can't unlock the same one twice
);

alter table public.user_achievements enable row level security;

drop policy if exists "ua_select_own" on public.user_achievements;
create policy "ua_select_own"
  on public.user_achievements for select
  using (auth.uid() = user_id);

drop policy if exists "ua_insert_own" on public.user_achievements;
create policy "ua_insert_own"
  on public.user_achievements for insert
  with check (auth.uid() = user_id);

-- Seed the catalog (safe to re-run — it won't create duplicates).
insert into public.achievements (key, name, description, icon, xp_reward, sort_order) values
  ('first_workout', 'First Workout', 'Complete your very first workout.', '🥇', 50,  1),
  ('warrior_7',     '7 Day Warrior', 'Reach a 7 day streak.',             '🔥', 100, 2),
  ('beast_30',      '30 Day Beast',  'Reach a 30 day streak.',            '🦾', 300, 3),
  ('workouts_100',  'Century',       'Log 100 total workouts.',           '💯', 300, 4),
  ('level_10',      'Rising Star',   'Reach Level 10.',                   '⭐', 100, 5),
  ('level_50',      'Elite Forger',  'Reach Level 50.',                   '👑', 500, 6)
on conflict (key) do nothing;
