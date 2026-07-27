# Forge 🔥

A gamified fitness app that makes working out feel like a video game — earn
**XP**, hit **levels**, keep **streaks**, climb **ranks**, and unlock
**achievements**. Built with 100% free tools.

**Stack:** Next.js · React · TypeScript · Tailwind CSS · Supabase (free) · Vercel (free)

---

## Phase 1 — what's built

- Project setup (Next.js + TypeScript + Tailwind, dark theme).
- Sign up / log in / log out with a chosen **username**.
- A **profile** auto-created in the database on sign-up (username, XP, level,
  rank, streaks, workouts).
- A dashboard showing your Level, rank, an XP progress bar, and streak stats.

---

## Run it locally (first-time setup, ~5 min)

### 1. Create a free Supabase project
1. Go to **https://supabase.com** → sign up (free, no card).
2. **New project** → name it `forge`, pick a database password (save it),
   choose the closest region, and create it (~2 min to provision).

### 2. Create the database table
1. In Supabase, open **SQL Editor → New query**.
2. Copy the entire contents of `supabase/migrations/0001_profiles.sql`,
   paste it, and click **Run**. You should see "Success".

### 3. Turn off email confirmation (for easy testing)
- Supabase → **Authentication → Sign In / Providers → Email** → turn
  **"Confirm email" OFF** → Save. (This lets sign-up log you straight in while
  testing. We can turn it back on before real launch.)

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
Open **http://localhost:3000**.

---

## How to test Phase 1

1. Click **Get started**, create an account with a username, email, password.
2. You should land on the **dashboard** showing your username, **Level 1**,
   rank **Beginner**, an empty XP bar, and streak/workout stats at 0.
3. Click **Log out**, then **Log in** with the same details — you're back in.
4. In Supabase → **Table Editor → profiles**, confirm a row exists for you.

If all four work, Phase 1 is done. ✅

---

## Deploy free on Vercel (optional now, or later)
1. Push this repo to GitHub (already done if you're reading this there).
2. Go to **https://vercel.com** → sign in with GitHub → **Import** this repo.
3. Add the two environment variables (`NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`) in Vercel's project settings.
4. Deploy. Every future `git push` auto-deploys.

---

## Roadmap
- [x] **Phase 1** — Setup, auth, database, profile.
- [x] **Phase 2** — XP system + levels: server-side XP awarding, animated XP
  bar, level-up + rank-up celebration. (Temporary "Gain 100 XP" test button on
  the dashboard until real workouts land in Phase 3.)
- [ ] **Phase 3** — Workout logging.
- [ ] **Phase 4** — Streaks + achievements.
- [ ] **Phase 5** — Waitlist landing page + referrals.
- [ ] **Phase 6** — Admin dashboard.
- [ ] **Phase 7** — UI polish + animations.
