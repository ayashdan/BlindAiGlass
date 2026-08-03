-- ============================================================================
--  Forge — season pass. A time-boxed track of workout-count tiers that pay
--  out bonus XP, giving a reason to care about "this month" without forcing
--  a stat reset (Prestige already covers the opt-in reset loop).
--  Paste into Supabase -> SQL Editor -> New query -> Run.
-- ============================================================================

insert into public.app_settings (key, value) values ('season_number', '1')
  on conflict (key) do nothing;
insert into public.app_settings (key, value) values ('season_started_at', now()::text)
  on conflict (key) do nothing;

create table if not exists public.season_pass_progress (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users on delete cascade,
  season_number integer not null,
  tier          integer not null,
  awarded_at    timestamptz not null default now(),
  unique (user_id, season_number, tier)
);

alter table public.season_pass_progress enable row level security;

drop policy if exists "season_pass_select_own" on public.season_pass_progress;
create policy "season_pass_select_own"
  on public.season_pass_progress for select
  using (auth.uid() = user_id);

drop policy if exists "season_pass_insert_own" on public.season_pass_progress;
create policy "season_pass_insert_own"
  on public.season_pass_progress for insert
  with check (auth.uid() = user_id);
