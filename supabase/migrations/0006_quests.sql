-- ============================================================================
--  Forge — Phase 8: daily quests.
--  Quest copy/XP/unlock-rules live in code (lib/game/quests.ts); this table
--  only tracks which quests got assigned to which user on which day, and
--  whether they're done.
--  Paste into Supabase -> SQL Editor -> New query -> Run.
-- ============================================================================

create table if not exists public.daily_quests (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users on delete cascade,
  quest_date   date not null,
  quest_key    text not null,
  xp_reward    integer not null default 0,
  completed    boolean not null default false,
  completed_at timestamptz,
  created_at   timestamptz not null default now(),
  unique (user_id, quest_date, quest_key)
);

create index if not exists daily_quests_user_date_idx
  on public.daily_quests (user_id, quest_date);

alter table public.daily_quests enable row level security;

drop policy if exists "daily_quests_select_own" on public.daily_quests;
create policy "daily_quests_select_own"
  on public.daily_quests for select
  using (auth.uid() = user_id);

drop policy if exists "daily_quests_insert_own" on public.daily_quests;
create policy "daily_quests_insert_own"
  on public.daily_quests for insert
  with check (auth.uid() = user_id);

drop policy if exists "daily_quests_update_own" on public.daily_quests;
create policy "daily_quests_update_own"
  on public.daily_quests for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
