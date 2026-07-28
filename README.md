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
  bar, level-up + rank-up celebration.
- [x] **Phase 3** — Workout logging: pick a type (Push/Pull/Legs/Full/Custom),
  enter duration + difficulty + notes; completing it awards real XP (100 + a
  difficulty bonus), records the workout, and bumps total workouts.
- [x] **Phase 4** — Streaks + achievements: daily streak that grows on
  consecutive-day workouts (bonus XP at each 7-day milestone) and resets on a
  miss; auto-unlocking achievement badges (First Workout, 7 Day Warrior, 30 Day
  Beast, Century, Level 10/50) shown on an Achievements page.
- [x] **Phase 5** — Waitlist landing page (email signup, app mockup) + a
  referral system: each person gets a shareable invite link, and referrals move
  them up the line. Position/referrals shown on a personal waitlist page, backed
  by security-definer DB functions so the email list is never publicly readable.
- [x] **Phase 6** — Admin dashboard: overview analytics (total users, active
  today, workouts logged, avg streak, 7-day retention, waitlist size), user
  search/view/delete, waitlist viewer + CSV export, achievement catalog
  editor (name/description/XP reward, add/delete), and a launch switch that
  gates public sign-up. A pre-launch gate now blocks account creation for
  everyone except the admin until launch is flipped on.
- [x] **Phase 7** — UI polish: a full-screen achievement celebration (confetti
  + bouncing badge pop-in) whenever you unlock one, a matching pop-in on the
  level-up banner, staggered fade-ins on the dashboard/achievements cards, a
  soft persistent glow on unlocked achievement badges, and tactile
  press-down feedback on the main buttons. Respects `prefers-reduced-motion`.

### How to test Phase 7
1. Log a workout that unlocks an achievement (e.g. your very first one, or
   hit a 7-day streak) — you should get a full-screen confetti celebration
   with the badge bouncing in. Tap **"Nice!"** to dismiss it.
2. Level up in the same workout — the "⬆️ Level X!" banner should pop in
   with a little bounce.
3. Visit the dashboard and achievements page — cards should fade/slide in
   on load, and any unlocked achievement badge should have a soft orange
   glow around it.

---

## Phase 6 setup — required before it works

1. Run `supabase/migrations/0005_admin.sql` in Supabase SQL Editor (same as
   every other migration: SQL Editor → New query → paste → Run).
2. Get your **service role** key: Supabase → **Project Settings → API** →
   under "Project API keys" click **Reveal** next to `service_role`, copy it.
   This key bypasses all security rules — never share it, never put it in
   code, never prefix it `NEXT_PUBLIC_`.
3. Add it as `SUPABASE_SERVICE_ROLE_KEY` to `.env.local` (for local dev) and
   to Vercel → your project → **Settings → Environment Variables** (for
   Production/Preview/Development) — same place you added the other two
   Supabase values.
4. Redeploy on Vercel after adding the env var (Vercel doesn't pick up new
   env vars on already-running deployments).

### How the pre-launch gate works
- The app starts **closed**: nobody but the admin email
  (`yoniayash007@gmail.com`) can create an account. Everyone else who tries
  to sign up gets redirected back to the waitlist.
- Only you (the admin) can flip this by visiting **`/admin/settings`** and
  clicking **"🚀 Launch Forge"**. That's the only thing that opens
  public sign-up.

### How to test Phase 6
1. Log in with the admin email → you'll see an **Admin** button on your
   dashboard → click it (or go to `/admin`).
2. **Overview** — sanity-check the numbers match what you'd expect.
3. **Users** — search a username, confirm delete removes them (careful,
   this is permanent — it deletes their whole account).
4. **Waitlist** — confirm your test signups show up, click **Export CSV**.
5. **Achievements** — edit an XP reward, save, confirm it changed in
   Supabase's Table Editor.
6. **Settings** — confirm it shows "🔒 Pre-launch." Open an incognito
   window, try to sign up with a non-admin email — you should get bounced
   to the waitlist with a message. Come back, click **"🚀 Launch Forge,"**
   then retry the incognito sign-up — it should work now. Flip it back to
   pre-launch when you're done testing.
7. Try visiting `/admin` while logged in as a non-admin (or logged out) —
   confirm you're redirected to `/login`.
