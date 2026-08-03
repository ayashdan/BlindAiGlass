-- ============================================================================
--  Forge — the social/engagement pass: weekly friends league, invite loop,
--  hype feed, and the Forge Plus interest list.
--  Paste into Supabase -> SQL Editor -> New query -> Run.
-- ============================================================================

-- Reusable "are these two users accepted friends?" check, security definer so
-- policies on other tables can use it without re-granting friendships access.
create or replace function public.are_friends(a uuid, b uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.friendships
    where status = 'accepted'
      and ((user_id = a and friend_id = b) or (user_id = b and friend_id = a))
  );
$$;

grant execute on function public.are_friends(uuid, uuid) to anon, authenticated;

-- ---- Weekly league: score lives on the world-readable profiles row, written
-- ---- only by the server-side workout pipeline (same trust model as xp).
alter table public.profiles
  add column if not exists weekly_xp     integer not null default 0,
  add column if not exists week_start    date,
  -- Invite loop: who recruited this user (set once at signup), and how many
  -- of this user's recruits have logged their 3rd workout (unlocks the
  -- Recruiter cosmetic).
  add column if not exists referred_by   uuid references auth.users on delete set null,
  add column if not exists recruit_count integer not null default 0;

-- Past league weeks, written only by the Monday cron with the service-role
-- client. Readable by anyone — it's the same public game stats as profiles.
create table if not exists public.league_weeks (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users on delete cascade,
  week_start date not null,
  points     integer not null,
  won        boolean not null default false,
  unique (user_id, week_start)
);

create index if not exists league_weeks_week_idx on public.league_weeks (week_start);

alter table public.league_weeks enable row level security;

drop policy if exists "league_weeks_select_all" on public.league_weeks;
create policy "league_weeks_select_all"
  on public.league_weeks for select
  using (true);
-- No insert/update/delete policies: only the service-role cron writes here.

-- ---- Hype feed: one event per logged workout, visible to accepted friends.
create table if not exists public.friend_events (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users on delete cascade,
  kind       text not null default 'workout',
  payload    jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists friend_events_user_idx on public.friend_events (user_id, created_at desc);

alter table public.friend_events enable row level security;

drop policy if exists "friend_events_select_friends" on public.friend_events;
create policy "friend_events_select_friends"
  on public.friend_events for select
  using (auth.uid() = user_id or public.are_friends(auth.uid(), user_id));

drop policy if exists "friend_events_insert_own" on public.friend_events;
create policy "friend_events_insert_own"
  on public.friend_events for insert
  with check (auth.uid() = user_id);
-- No user delete: old events are cleaned up by the weekly cron.

-- One-tap 🔥 reactions. The unique constraint doubles as the rate limit:
-- each user can hype a given event exactly once.
create table if not exists public.hypes (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid not null references public.friend_events on delete cascade,
  from_user  uuid not null references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  unique (event_id, from_user)
);

create index if not exists hypes_event_idx on public.hypes (event_id);

alter table public.hypes enable row level security;

drop policy if exists "hypes_select_visible" on public.hypes;
create policy "hypes_select_visible"
  on public.hypes for select
  using (
    from_user = auth.uid()
    or exists (
      select 1 from public.friend_events e
      where e.id = event_id
        and (e.user_id = auth.uid() or public.are_friends(auth.uid(), e.user_id))
    )
  );

-- You can only hype as yourself, only on a friend's event (not your own).
drop policy if exists "hypes_insert_own" on public.hypes;
create policy "hypes_insert_own"
  on public.hypes for insert
  with check (
    from_user = auth.uid()
    and exists (
      select 1 from public.friend_events e
      where e.id = event_id
        and e.user_id <> auth.uid()
        and public.are_friends(auth.uid(), e.user_id)
    )
  );

-- ---- Forge Plus interest list: a free, honest demand measurement before
-- ---- any payment processor exists. One row per interested user.
create table if not exists public.plus_interest (
  user_id    uuid primary key references auth.users on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.plus_interest enable row level security;

drop policy if exists "plus_interest_select_own" on public.plus_interest;
create policy "plus_interest_select_own"
  on public.plus_interest for select
  using (auth.uid() = user_id);

drop policy if exists "plus_interest_insert_own" on public.plus_interest;
create policy "plus_interest_insert_own"
  on public.plus_interest for insert
  with check (auth.uid() = user_id);

drop policy if exists "plus_interest_delete_own" on public.plus_interest;
create policy "plus_interest_delete_own"
  on public.plus_interest for delete
  using (auth.uid() = user_id);
