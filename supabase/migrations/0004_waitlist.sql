-- ============================================================================
--  Forge — Phase 5 database: waitlist + referrals.
--  All access goes through two security-definer functions so the raw email
--  list is never publicly readable.
--  Paste into Supabase -> SQL Editor -> New query -> Run.
-- ============================================================================

create table if not exists public.waitlist (
  id             uuid primary key default gen_random_uuid(),
  email          text unique not null,
  name           text,
  referral_code  text unique not null,
  referred_by    text,                 -- referral_code of whoever invited them
  referral_count integer not null default 0,
  created_at     timestamptz not null default now()
);

-- RLS on with NO policies: nobody can read/write the table directly. Everything
-- goes through the functions below.
alter table public.waitlist enable row level security;

-- Join the waitlist (idempotent by email). Returns the person's referral code.
create or replace function public.join_waitlist(p_email text, p_name text, p_ref text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email    text := lower(trim(p_email));
  v_code     text;
  v_existing text;
begin
  if v_email is null or position('@' in v_email) = 0 then
    raise exception 'invalid email';
  end if;

  -- Already joined? Just return their existing code.
  select referral_code into v_existing from public.waitlist where email = v_email;
  if v_existing is not null then
    return v_existing;
  end if;

  -- Make a unique short referral code.
  loop
    v_code := substr(md5(random()::text || clock_timestamp()::text), 1, 8);
    exit when not exists (select 1 from public.waitlist where referral_code = v_code);
  end loop;

  insert into public.waitlist (email, name, referral_code, referred_by)
  values (
    v_email,
    nullif(trim(coalesce(p_name, '')), ''),
    v_code,
    (select referral_code from public.waitlist where referral_code = p_ref)
  );

  -- Credit the referrer (if the ref code is real).
  if p_ref is not null then
    update public.waitlist set referral_count = referral_count + 1 where referral_code = p_ref;
  end if;

  return v_code;
end;
$$;

-- Look up someone's position. More referrals = higher up; ties broken by who
-- joined first.
create or replace function public.waitlist_position(p_code text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  me    public.waitlist;
  ahead integer;
  total integer;
begin
  select * into me from public.waitlist where referral_code = p_code;
  if not found then
    return null;
  end if;

  select count(*) into ahead from public.waitlist w
   where w.referral_count > me.referral_count
      or (w.referral_count = me.referral_count and w.created_at < me.created_at);

  select count(*) into total from public.waitlist;

  return json_build_object(
    'position', ahead + 1,
    'referral_count', me.referral_count,
    'total', total,
    'code', p_code
  );
end;
$$;

grant execute on function public.join_waitlist(text, text, text) to anon, authenticated;
grant execute on function public.waitlist_position(text) to anon, authenticated;
