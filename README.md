# BayRan

Construction project management for companies running multiple customer jobs
at once. Track schedules, design selections, room measurements, materials,
subcontractors, customer payments, and change orders — per project — with a
main dashboard that rolls everything up into overall status and open action
items.

Modeled directly on a real per-customer project tracking spreadsheet (see
"Where this came from" below), turned into a shared, multi-project web app.

**Stack:** Next.js · React · TypeScript · Tailwind CSS · Supabase (Postgres +
Auth) · Google sign-in

---

## What's built

- **Google sign-in.** No passwords — sign in with your company Google
  account. The first person to ever sign in becomes an admin; everyone after
  that is a regular team member. Every signed-in user can see and edit every
  project (this is an internal company tool, not a multi-tenant product).
- **Main dashboard** — active project count, total contract value, balance
  due from clients, estimated total margin, and a prioritized list of open
  action items across every active project: overdue and upcoming tasks,
  pending change-order approvals, backordered materials, and unmade design
  selections. Each item links straight to where it needs to be handled.
- **Projects list** — every job, filterable by status (Active / On Hold /
  Complete / Cancelled), with a card summarizing progress, contract value,
  and balance due.
- **Per-project workspace**, one tab per area of the job:
  - **Overview** — project info, progress snapshot, and financial summary
    (contract value, change orders, payments received/due, sub payments,
    materials cost vs. charged, estimated job margin).
  - **Tasks** — schedule with category, assignee, dates, and status.
  - **Design** — selections by area/room, status, who picked it, when.
  - **Measurements** — room dimensions with floor/perimeter/wall area
    calculated automatically.
  - **Materials** — vendor, quantity, cost, status, PO #, and what's charged
    to the customer (profit calculated automatically).
  - **Subs** — subcontractors by trade, contract amount, amount paid,
    balance due (calculated automatically).
  - **Payments** — customer payments in, balance remaining (calculated
    automatically).
  - **Change Orders** — submitted/approved amounts, balance remaining.
  - **Trade Scope** — scope of work by trade, assigned sub, dates, status.

All the "auto-calculated" numbers (totals, balances, profit, floor area) are
computed by the database, not the app, so they can't drift out of sync.

---

## Run it locally (first-time setup, ~10 min)

### 1. Create a free Supabase project
1. Go to **https://supabase.com** → sign up (free, no card).
2. **New project** → name it `bayran`, pick a database password (save it),
   choose the closest region, and create it (~2 min to provision).

### 2. Create the database schema
1. In Supabase, open **SQL Editor → New query**.
2. Copy the entire contents of `supabase/migrations/0001_bayran_schema.sql`,
   paste it, and click **Run**. You should see "Success".

### 3. Turn on Google sign-in
1. **Google Cloud Console** → APIs & Services → Credentials → **Create OAuth
   client ID** (type: Web application). Add
   `https://<your-project-ref>.supabase.co/auth/v1/callback` as an
   authorized redirect URI.
2. Supabase → **Authentication → Providers → Google** → paste the Client ID
   and Client Secret from step 1, and enable the provider.
3. Supabase → **Authentication → URL Configuration** → set **Site URL** to
   `http://localhost:3000` for now (add your deployed URL later, alongside
   this one, once you deploy).

### 4. Add your keys
1. Supabase → **Project Settings → API**. Copy the **Project URL** and the
   **anon public** key.
2. In this project, copy `.env.local.example` to a new file `.env.local` and
   paste your two values in.

### 5. Install and run
```bash
npm install
npm run dev
```
Open **http://localhost:3000** and sign in with Google.

---

## How to test

1. Sign in with Google — you should land on an empty **Dashboard**.
2. Go to **Projects → New project**, fill in a name, client, contract value,
   and dates, and create it.
3. Open the project, add a task with a due date in the past — it should
   immediately show up as an overdue item on the main **Dashboard**.
4. Add a few materials, a subcontractor, and a customer payment, then check
   the **Overview** tab — the financial summary and progress snapshot should
   update automatically.
5. In Supabase → **Table Editor**, confirm the rows exist under `projects`
   and its related tables.

---

## Where this came from

This app started from a real per-customer "master project sheet" spreadsheet
tab structure (Dashboard, Tasks, Design, Room Measurements, Materials, Subs,
Payments, Change Orders, Trade Scope) used to run one job at a time. BayRan
keeps that same structure per project, but lets a team run as many projects
as they have going at once, from one shared, always-up-to-date app instead of
a spreadsheet per customer.

---

## Deploy

- **Google Cloud (Firebase App Hosting or Cloud Run):** see `DEPLOY-GCP.md`.
- **Vercel:** import the repo at https://vercel.com, add the two
  `NEXT_PUBLIC_SUPABASE_*` environment variables in project settings, and
  deploy. Add the Vercel URL to Supabase's Site URL / Redirect URLs and to
  the Google OAuth client's authorized redirect URIs.
