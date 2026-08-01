-- ============================================================================
--  Forge — atomic chest award/claim functions.
--
--  Awarding a chest was a select-then-update from the app (2 round trips,
--  and directly in the hot "log a workout" path since Common Chests drop
--  every workout). Claiming (opening) a chest had a worse problem: the
--  select-then-update there was a real race — two fast taps on "Open"
--  could both read the same count, both pass the ">0" check, and both
--  succeed, letting someone open more chests than they actually had.
--
--  Both are now single atomic round trips via these functions instead.
--  Paste into Supabase -> SQL Editor -> New query -> Run.
-- ============================================================================

create or replace function public.award_chest(p_user_id uuid, p_tier text, p_amount int)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_tier = 'common' then
    update public.profiles set chests_common = chests_common + p_amount where id = p_user_id;
  elsif p_tier = 'rare' then
    update public.profiles set chests_rare = chests_rare + p_amount where id = p_user_id;
  elsif p_tier = 'legendary' then
    update public.profiles set chests_legendary = chests_legendary + p_amount where id = p_user_id;
  end if;
end;
$$;

-- Atomically decrements one chest of the given tier IF the user has at
-- least one — returns whether it actually claimed one, so the caller never
-- has to do its own separate "do they have one" check first.
create or replace function public.claim_chest(p_user_id uuid, p_tier text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_remaining int;
begin
  if p_tier = 'common' then
    update public.profiles set chests_common = chests_common - 1
      where id = p_user_id and chests_common > 0
      returning chests_common into v_remaining;
  elsif p_tier = 'rare' then
    update public.profiles set chests_rare = chests_rare - 1
      where id = p_user_id and chests_rare > 0
      returning chests_rare into v_remaining;
  elsif p_tier = 'legendary' then
    update public.profiles set chests_legendary = chests_legendary - 1
      where id = p_user_id and chests_legendary > 0
      returning chests_legendary into v_remaining;
  else
    return false;
  end if;

  return v_remaining is not null;
end;
$$;

grant execute on function public.award_chest(uuid, text, int) to authenticated;
grant execute on function public.claim_chest(uuid, text) to authenticated;
