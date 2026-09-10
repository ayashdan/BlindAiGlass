-- ============================================================================
--  BayRan — construction project management. Core schema.
--  Paste this whole file into Supabase -> SQL Editor -> New query -> Run.
--
--  This is an internal company tool: every signed-in (Google) user gets a
--  profile automatically and can see/edit every project. The first person
--  ever to sign in becomes 'admin'; everyone after that is 'member'. If you
--  need to keep sign-in restricted to your company's Google Workspace, set
--  that on the Google Cloud OAuth consent screen / Supabase provider config
--  (not in this schema).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- profiles — one row per signed-in user.
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id         uuid primary key references auth.users on delete cascade,
  email      text not null,
  full_name  text,
  avatar_url text,
  role       text not null default 'member' check (role in ('admin', 'member')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_signed_in" on public.profiles;
create policy "profiles_select_signed_in"
  on public.profiles for select
  to authenticated
  using (true);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Auto-create a profile the moment someone signs in with Google.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url',
    case when not exists (select 1 from public.profiles) then 'admin' else 'member' end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Shared helper: any signed-in user with a profile is "in the company" and
-- gets full access to every project and its child records.
create or replace function public.is_team_member()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from public.profiles where id = auth.uid());
$$;

-- Keeps `updated_at` current on any update, everywhere it's used below.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ----------------------------------------------------------------------------
-- projects — one per customer job.
-- ----------------------------------------------------------------------------
create table if not exists public.projects (
  id                     uuid primary key default gen_random_uuid(),
  name                   text not null,
  client_name            text not null,
  client_email           text,
  client_phone           text,
  address                text,
  project_type           text,
  roc_number             text,
  pm_id                  uuid references public.profiles(id) on delete set null,
  status                 text not null default 'active'
                           check (status in ('active', 'on_hold', 'complete', 'cancelled')),
  start_date             date,
  target_completion_date date,
  contract_value         numeric(12, 2) not null default 0,
  created_by             uuid references public.profiles(id) on delete set null,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

alter table public.projects enable row level security;

drop policy if exists "projects_all_team" on public.projects;
create policy "projects_all_team"
  on public.projects for all
  to authenticated
  using (public.is_team_member())
  with check (public.is_team_member());

drop trigger if exists projects_set_updated_at on public.projects;
create trigger projects_set_updated_at
  before update on public.projects
  for each row
  execute function public.set_updated_at();

-- Small helper macro (repeated for every child table below): full CRUD for
-- any signed-in team member, scoped through the parent project.
create or replace function public.template_child_policy(tbl text)
returns void
language plpgsql
as $$
begin
  execute format(
    'alter table public.%I enable row level security', tbl
  );
  execute format(
    'drop policy if exists "%1$s_all_team" on public.%1$s', tbl
  );
  execute format(
    'create policy "%1$s_all_team" on public.%1$s for all to authenticated using (public.is_team_member()) with check (public.is_team_member())',
    tbl
  );
end;
$$;

-- ----------------------------------------------------------------------------
-- tasks
-- ----------------------------------------------------------------------------
create table if not exists public.tasks (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  title       text not null,
  category    text,
  assigned_to text,
  start_date  date,
  due_date    date,
  status      text not null default 'not_started'
                check (status in ('not_started', 'in_progress', 'complete', 'blocked')),
  notes       text,
  created_at  timestamptz not null default now()
);
select public.template_child_policy('tasks');

-- ----------------------------------------------------------------------------
-- design_selections
-- ----------------------------------------------------------------------------
create table if not exists public.design_selections (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null references public.projects(id) on delete cascade,
  area          text,
  item          text not null,
  description   text,
  status        text not null default 'not_selected'
                  check (status in ('not_selected', 'selected', 'ordered', 'received')),
  selected_by   text,
  date_selected date,
  notes         text,
  created_at    timestamptz not null default now()
);
select public.template_child_policy('design_selections');

-- ----------------------------------------------------------------------------
-- room_measurements — floor/perimeter/wall area auto-calculated.
-- ----------------------------------------------------------------------------
create table if not exists public.room_measurements (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid not null references public.projects(id) on delete cascade,
  area         text not null,
  width_ft     numeric(10, 2),
  length_ft    numeric(10, 2),
  height_ft    numeric(10, 2),
  floor_sqft   numeric generated always as
                 (coalesce(width_ft, 0) * coalesce(length_ft, 0)) stored,
  perimeter_lf numeric generated always as
                 (2 * (coalesce(width_ft, 0) + coalesce(length_ft, 0))) stored,
  wall_sqft    numeric generated always as
                 ((2 * (coalesce(width_ft, 0) + coalesce(length_ft, 0))) * coalesce(height_ft, 0)) stored,
  notes        text,
  created_at   timestamptz not null default now()
);
select public.template_child_policy('room_measurements');

-- ----------------------------------------------------------------------------
-- materials — cost vs. what's charged to the customer, profit auto-calculated.
-- ----------------------------------------------------------------------------
create table if not exists public.materials (
  id                   uuid primary key default gen_random_uuid(),
  project_id           uuid not null references public.projects(id) on delete cascade,
  area                 text,
  material             text not null,
  vendor               text,
  qty                  numeric(10, 2),
  unit                 text,
  unit_cost            numeric(12, 2),
  total_cost           numeric generated always as
                         (coalesce(qty, 0) * coalesce(unit_cost, 0)) stored,
  status               text not null default 'needed'
                         check (status in ('needed', 'ordered', 'backordered', 'delivered', 'installed')),
  order_date           date,
  po_number            text,
  charged_to_customer  numeric(12, 2) not null default 0,
  materials_profit     numeric generated always as
                         (coalesce(charged_to_customer, 0) - (coalesce(qty, 0) * coalesce(unit_cost, 0))) stored,
  notes                text,
  created_at           timestamptz not null default now()
);
select public.template_child_policy('materials');

-- ----------------------------------------------------------------------------
-- subcontractors — payments out, balance due auto-calculated.
-- ----------------------------------------------------------------------------
create table if not exists public.subcontractors (
  id                 uuid primary key default gen_random_uuid(),
  project_id         uuid not null references public.projects(id) on delete cascade,
  trade              text,
  company             text not null,
  contact            text,
  contract_amount    numeric(12, 2) not null default 0,
  amount_paid        numeric(12, 2) not null default 0,
  balance_due        numeric generated always as
                       (coalesce(contract_amount, 0) - coalesce(amount_paid, 0)) stored,
  last_payment_date  date,
  status             text not null default 'not_started'
                       check (status in ('not_started', 'in_progress', 'complete')),
  notes              text,
  created_at         timestamptz not null default now()
);
select public.template_child_policy('subcontractors');

-- ----------------------------------------------------------------------------
-- customer_payments — payments in, balance remaining auto-calculated.
-- ----------------------------------------------------------------------------
create table if not exists public.customer_payments (
  id                 uuid primary key default gen_random_uuid(),
  project_id         uuid not null references public.projects(id) on delete cascade,
  payment_number     integer,
  description        text,
  amount_due         numeric(12, 2) not null default 0,
  amount_received    numeric(12, 2) not null default 0,
  balance_remaining  numeric generated always as
                       (coalesce(amount_due, 0) - coalesce(amount_received, 0)) stored,
  date_received      date,
  payment_method     text,
  status             text not null default 'pending'
                       check (status in ('pending', 'invoiced', 'paid')),
  notes              text,
  created_at         timestamptz not null default now()
);
select public.template_child_policy('customer_payments');

-- ----------------------------------------------------------------------------
-- change_orders
-- ----------------------------------------------------------------------------
create table if not exists public.change_orders (
  id                 uuid primary key default gen_random_uuid(),
  project_id         uuid not null references public.projects(id) on delete cascade,
  co_number          integer,
  description        text not null,
  date_submitted     date,
  date_approved      date,
  amount             numeric(12, 2) not null default 0,
  status             text not null default 'pending'
                       check (status in ('pending', 'approved', 'rejected')),
  amount_received    numeric(12, 2) not null default 0,
  balance_remaining  numeric generated always as
                       (coalesce(amount, 0) - coalesce(amount_received, 0)) stored,
  notes              text,
  created_at         timestamptz not null default now()
);
select public.template_child_policy('change_orders');

-- ----------------------------------------------------------------------------
-- trade_scope
-- ----------------------------------------------------------------------------
create table if not exists public.trade_scope (
  id             uuid primary key default gen_random_uuid(),
  project_id     uuid not null references public.projects(id) on delete cascade,
  trade          text not null,
  scope_item     text,
  description    text,
  status         text not null default 'not_started'
                   check (status in ('not_started', 'in_progress', 'complete')),
  assigned_sub   text,
  start_date     date,
  complete_date  date,
  notes          text,
  created_at     timestamptz not null default now()
);
select public.template_child_policy('trade_scope');

drop function public.template_child_policy(text);

-- ----------------------------------------------------------------------------
-- Indexes for the project detail pages / dashboard aggregation.
-- ----------------------------------------------------------------------------
create index if not exists tasks_project_id_idx on public.tasks(project_id);
create index if not exists design_selections_project_id_idx on public.design_selections(project_id);
create index if not exists room_measurements_project_id_idx on public.room_measurements(project_id);
create index if not exists materials_project_id_idx on public.materials(project_id);
create index if not exists subcontractors_project_id_idx on public.subcontractors(project_id);
create index if not exists customer_payments_project_id_idx on public.customer_payments(project_id);
create index if not exists change_orders_project_id_idx on public.change_orders(project_id);
create index if not exists trade_scope_project_id_idx on public.trade_scope(project_id);

-- ----------------------------------------------------------------------------
-- project_financials — one row per project, every dashboard number
-- pre-aggregated. Mirrors the "Financial Summary" + "Progress Snapshot"
-- sections of the original spreadsheet.
-- ----------------------------------------------------------------------------
create or replace view public.project_financials
  with (security_invoker = true)
as
select
  p.id                                                       as project_id,
  p.contract_value                                           as total_contract_value,
  coalesce(co.approved_total, 0)                             as approved_change_orders,
  coalesce(co.pending_total, 0)                               as pending_change_orders,
  p.contract_value + coalesce(co.approved_total, 0)          as adjusted_contract_value,
  coalesce(pay.received_total, 0)                            as received_from_client,
  (p.contract_value + coalesce(co.approved_total, 0)) - coalesce(pay.received_total, 0)
                                                               as balance_due_from_client,
  coalesce(subs.contract_total, 0)                           as total_sub_contracts,
  coalesce(subs.paid_total, 0)                                as paid_to_subs,
  coalesce(subs.contract_total, 0) - coalesce(subs.paid_total, 0)
                                                               as balance_owed_to_subs,
  coalesce(mat.cost_total, 0)                                as materials_cost,
  coalesce(mat.charged_total, 0)                              as materials_charged_to_customer,
  coalesce(mat.charged_total, 0) - coalesce(mat.cost_total, 0)
                                                               as materials_profit,
  (p.contract_value + coalesce(co.approved_total, 0))
    - coalesce(subs.contract_total, 0) - coalesce(mat.cost_total, 0)
                                                               as est_job_margin,
  coalesce(t.total_count, 0)                                 as tasks_total,
  coalesce(t.complete_count, 0)                               as tasks_complete,
  coalesce(mat.pending_count, 0)                              as materials_pending,
  coalesce(d.pending_count, 0)                                as design_items_pending
from public.projects p
left join lateral (
  select
    count(*) filter (where status = 'complete')::int as complete_count,
    count(*)::int as total_count
  from public.tasks where project_id = p.id
) t on true
left join lateral (
  select count(*) filter (where status <> 'selected')::int as pending_count
  from public.design_selections where project_id = p.id
) d on true
left join lateral (
  select
    coalesce(sum(total_cost), 0) as cost_total,
    coalesce(sum(charged_to_customer), 0) as charged_total,
    count(*) filter (where status in ('ordered', 'backordered'))::int as pending_count
  from public.materials where project_id = p.id
) mat on true
left join lateral (
  select
    coalesce(sum(contract_amount), 0) as contract_total,
    coalesce(sum(amount_paid), 0) as paid_total
  from public.subcontractors where project_id = p.id
) subs on true
left join lateral (
  select coalesce(sum(amount_received), 0) as received_total
  from public.customer_payments where project_id = p.id
) pay on true
left join lateral (
  select
    coalesce(sum(amount) filter (where status = 'approved'), 0) as approved_total,
    coalesce(sum(amount) filter (where status = 'pending'), 0) as pending_total
  from public.change_orders where project_id = p.id
) co on true;
