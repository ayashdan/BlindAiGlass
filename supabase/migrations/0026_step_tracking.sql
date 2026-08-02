-- Daily step goal + step logging. Manual entry, not auto-synced from Apple
-- Health or Android's Health Connect — neither exposes a web API a PWA can
-- reach (Apple Health never has; Google Fit's REST API, which used to, was
-- shut down for good in June 2025). Steps count is typed in from a
-- Health/Fit app widget; the goal you set yourself scales the XP reward.

alter table profiles
  add column step_goal integer not null default 6000
  check (step_goal >= 2000 and step_goal <= 30000);

create table step_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  log_date date not null,
  steps integer not null default 0 check (steps >= 0 and steps <= 200000),
  goal integer not null,
  goal_met boolean not null default false,
  xp_awarded integer not null default 0,
  chest_awarded boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, log_date)
);

alter table step_logs enable row level security;

create policy "Users can view their own step logs"
  on step_logs for select
  using (auth.uid() = user_id);

create policy "Users can insert their own step logs"
  on step_logs for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own step logs"
  on step_logs for update
  using (auth.uid() = user_id);

create index step_logs_user_date_idx on step_logs (user_id, log_date);
