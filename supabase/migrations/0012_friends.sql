-- ============================================================================
--  Forge — Tier B: friends + a small-group leaderboard. A global leaderboard
--  demotivates everyone outside the top 1%; competing against people you
--  actually know is what drives daily check-ins.
--  Paste into Supabase -> SQL Editor -> New query -> Run.
-- ============================================================================

create table if not exists public.friendships (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users on delete cascade,
  friend_id  uuid not null references auth.users on delete cascade,
  status     text not null default 'pending', -- pending | accepted
  created_at timestamptz not null default now(),
  check (user_id <> friend_id)
);

create index if not exists friendships_user_idx on public.friendships (user_id);
create index if not exists friendships_friend_idx on public.friendships (friend_id);

alter table public.friendships enable row level security;

drop policy if exists "friendships_select_involved" on public.friendships;
create policy "friendships_select_involved"
  on public.friendships for select
  using (auth.uid() = user_id or auth.uid() = friend_id);

-- You can only create a request FROM yourself.
drop policy if exists "friendships_insert_own" on public.friendships;
create policy "friendships_insert_own"
  on public.friendships for insert
  with check (auth.uid() = user_id);

-- Only the recipient can accept (flip status).
drop policy if exists "friendships_update_recipient" on public.friendships;
create policy "friendships_update_recipient"
  on public.friendships for update
  using (auth.uid() = friend_id)
  with check (auth.uid() = friend_id);

-- Either side can remove/decline/cancel.
drop policy if exists "friendships_delete_involved" on public.friendships;
create policy "friendships_delete_involved"
  on public.friendships for delete
  using (auth.uid() = user_id or auth.uid() = friend_id);
