-- ============================================================================
--  Forge — real Forge Plus features: a cosmetic vault, a parallel Plus
--  season-pass track, and the RLS fix that makes gating on `tier` mean
--  anything at all.
--  Paste into Supabase -> SQL Editor -> New query -> Run.
-- ============================================================================

-- ---- Close a pre-existing gap: `profiles_update_own` let any authenticated
-- ---- user set ANY column on their own row directly (e.g. a raw REST call
-- ---- bypassing the app entirely), including `tier`. That was harmless
-- ---- while nothing was gated on it — now that the cosmetic vault and the
-- ---- Plus season track key off `tier`, a self-writable tier column would
-- ---- make "Plus" a free checkbox anyone can flip. Every legitimate write
-- ---- to `tier` already goes through the service-role admin client
-- ---- (app/admin/users/actions.ts), which bypasses RLS entirely — so this
-- ---- only blocks the forgery path, not the real one.
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and tier = (select p.tier from public.profiles p where p.id = auth.uid())
  );

-- ---- Season pass: a second, parallel "plus" track alongside the existing
-- ---- "free" one. Same tiers (5/15/30/50 workouts this season — nobody's
-- ---- progress changes), but Plus subscribers additionally unlock a
-- ---- cosmetic-only reward at each tier. No extra XP on the plus track —
-- ---- only the free track ever pays XP, so this never touches the
-- ---- leaderboard or the weekly league.
alter table public.season_pass_progress
  add column if not exists track text not null default 'free' check (track in ('free', 'plus'));

alter table public.season_pass_progress
  drop constraint if exists season_pass_progress_user_id_season_number_tier_key;

-- Postgres has no ADD CONSTRAINT IF NOT EXISTS for named constraints, so
-- guard it explicitly — this migration must be safe to re-run.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'season_pass_progress_user_id_season_number_tier_track_key'
  ) then
    alter table public.season_pass_progress
      add constraint season_pass_progress_user_id_season_number_tier_track_key
      unique (user_id, season_number, tier, track);
  end if;
end $$;

-- A free user could otherwise insert their own 'plus' row directly (RLS
-- only checked auth.uid() = user_id) and claim Plus season cosmetics for
-- free. Require an actual premium tier for anything but the free track.
drop policy if exists "season_pass_insert_own" on public.season_pass_progress;
create policy "season_pass_insert_own"
  on public.season_pass_progress for insert
  with check (
    auth.uid() = user_id
    and (
      track = 'free'
      or exists (
        select 1 from public.profiles p
        where p.id = auth.uid() and p.tier = 'premium'
      )
    )
  );
