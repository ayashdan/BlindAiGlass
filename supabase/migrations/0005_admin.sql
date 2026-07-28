-- ============================================================================
--  Forge — Phase 6: app settings (the launch switch).
--  Paste into Supabase -> SQL Editor -> New query -> Run.
-- ============================================================================

create table if not exists public.app_settings (
  key   text primary key,
  value text not null
);

-- Start CLOSED: only the waitlist is public until you launch.
insert into public.app_settings (key, value) values ('launched', 'false')
  on conflict (key) do nothing;

alter table public.app_settings enable row level security;

-- Everyone can READ settings (the sign-up gate needs to check "launched").
drop policy if exists "settings_select_all" on public.app_settings;
create policy "settings_select_all"
  on public.app_settings for select
  using (true);
-- No insert/update policy: only the admin (service role) can change settings.
