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

## Phase 8 — daily quests + getting ready to launch

- [x] **Daily quests** — each day you get 3 quests picked from a pool (Show
  Up, Push/Pull/Leg Day, Endurance, Go Hard, Double Up), shown on the
  dashboard. Completing one during a workout awards bonus XP immediately —
  same XP engine as everything else, so it can't be faked from the browser.
  Quest copy/XP live in code (`lib/game/quests.ts`) for now, same as
  achievement unlock rules; they're not yet editable from the admin panel.

### Phase 8 setup
Run `supabase/migrations/0006_quests.sql` in Supabase SQL Editor (SQL Editor
→ New query → paste → Run).

### How to test daily quests
1. Visit `/dashboard` — you should see a **"🎯 Today's quests"** card with 3
   quests.
2. Log a workout matching one of them (e.g. if "Push Day" is listed, log a
   Push workout) — on the reward screen you should see a
   **"Quest complete"** card with bonus XP, and the dashboard quest list
   should show it checked off.
3. Come back tomorrow (or change your system clock forward a day for
   testing) — you should get a fresh set of 3 quests.

### Muscle-group workout logging
Logging a workout no longer forces a single Push/Pull/Legs pick — you now
multi-select any combination of 13 muscle groups (Chest, Back, Shoulders,
Biceps, Triceps, Forearms, Abs/Core, Quads, Hamstrings, Glutes, Calves, Full
Body, Cardio), plus an optional workout name. The "Push/Pull/Leg Day" quests
now trigger off matching muscle groups (e.g. Chest/Shoulders/Triceps counts
as Push Day) instead of a single fixed type.

**Setup:** run `supabase/migrations/0007_muscle_groups.sql` in Supabase SQL
Editor.

### Leaderboard + workout history
- **Leaderboard** (`/leaderboard`) — ranks everyone by XP or streak (toggle
  between the two), highlights your own row, and shows your rank even if
  you're outside the visible top 50. No migration needed — it reads the
  already-public `profiles` table.
- **History** (`/history`) — your last 30 workouts, newest first, showing
  muscle groups, duration, difficulty, and XP earned for each.

Both are linked from the dashboard.

### Retention systems (Tier S + A from the game-design roadmap)

**Setup:** run these three migrations in order, in Supabase SQL Editor:
`0008_streak_freeze.sql`, `0009_personal_records.sql`, `0010_achievements_v2.sql`.

- **Streak freeze (earned, not purchased)** — you bank 1 automatically every
  time your streak hits a multiple of 7 days, capped at 2 banked at once. If
  you miss exactly one day, a banked freeze auto-protects your streak
  instead of resetting it to 1 (shown on the workout reward screen: "🧊
  Streak freeze used"). This is the single highest-leverage fix for
  week-one churn — losing a streak is the #1 reason people abandon habit
  apps.
- **Profile page** (`/profile`, linked from the dashboard and by tapping
  your name/avatar) — pick from 12 emoji avatars, see your stat card, and a
  trophy-case grid of unlocked achievements. Your avatar now also shows on
  the dashboard header and the leaderboard.
- **Personal records** — the app now tracks your longest workout, both
  overall and per muscle group. Beating a *previous* best (not just your
  first-ever entry in a category) shows a "🏆 New PR" card on the reward
  screen and awards bonus XP. This gives you a progress axis that keeps
  climbing even during a rough streak week.
- **Denser achievement catalog** — added Getting Started (3 workouts),
  Level 25, New Best (first PR), and Well Rounded (5 different muscle
  groups), closing the old dead zones between milestones. 10 achievements
  total now.
- **Broader daily quests** — 4 new self-reported quests (Stretch, Hydrate,
  Rest Up, Get Moving/steps) alongside the 7 workout-based ones. These
  can't be auto-verified (no pedometer access in a web app), so they show
  a **"Mark done"** button instead — gives you a reason to open Forge even
  on rest days.
- **Workout history heatmap** — `/history` now shows a GitHub-style
  contribution heatmap of the last 14 weeks above your workout list.
- **Leaderboard + history** — from the previous update, now joined by
  Profile in a 3-tile row on the dashboard.

### Tier B + C, plus visual redesign

**Setup:** run these three migrations in order: `0011_avatar_photos.sql`,
`0012_friends.sql`, `0013_prestige.sql`.

- **Tier B — Friends** (`/friends`, linked from the dashboard) — add
  someone by username, accept/decline requests, and see a small
  leaderboard ranked by XP among just your friends. Competing against
  people you actually know drives daily check-ins far better than a
  global leaderboard full of strangers.
- **Tier C — Prestige** — once you hit Level 100, your profile page shows
  a "⭐ Prestige" option: resets your level/XP back to 1 but permanently
  marks a prestige star next to your name everywhere (dashboard, profile,
  leaderboard, friends). Purely cosmetic — your streaks, workouts, and
  achievements are untouched. Gives veteran users a reason to keep going
  past the old level cap.
- **Light/dark mode** — a ☀️/🌙 toggle (dashboard header, landing page)
  switches the whole app's theme instantly, saved in your browser. Dark
  stays the default.
- **More colorful UI** — the flat single-orange-accent look is gone.
  Different card types now use distinct accent colors (gold for XP/level,
  sky for streaks, violet for PRs/best-stats, emerald for quests, rose for
  leaderboard, fuchsia for friends), matching the "Clash Royale" vibrancy
  you asked for, while Forge's orange stays the primary brand color for
  main actions.
- **Social sharing** — a Share button appears on the workout reward screen
  (with separate options for the workout itself, a new PR, and an
  unlocked achievement when applicable) and on your profile. Uses your
  phone's native share sheet when available, otherwise copies the text —
  no paid service, no generated image, just an honest share.
- **Real profile pictures** — upload a photo (max 3MB) on `/profile`
  instead of just picking an emoji; it's stored in Supabase Storage (free
  tier) and shows everywhere your avatar does. Remove it anytime to go
  back to the emoji.

### AAA game-director pass: character stats, class, cosmetics, rivals, boss fights, seasons, recovery

Run these four migrations, in order, in Supabase SQL Editor:

**1. `0014_character_stats.sql`**
```sql
alter table public.profiles
  add column if not exists stat_power      integer not null default 0,
  add column if not exists stat_grit       integer not null default 0,
  add column if not exists stat_endurance  integer not null default 0,
  add column if not exists stat_discipline integer not null default 0;
```

**2. `0015_cosmetics.sql`**
```sql
alter table public.profiles
  add column if not exists equipped_border text,
  add column if not exists equipped_title  text;
```

**3. `0016_season_pass.sql`**
```sql
insert into public.app_settings (key, value) values ('season_number', '1')
  on conflict (key) do nothing;
insert into public.app_settings (key, value) values ('season_started_at', now()::text)
  on conflict (key) do nothing;

create table if not exists public.season_pass_progress (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users on delete cascade,
  season_number integer not null,
  tier          integer not null,
  awarded_at    timestamptz not null default now(),
  unique (user_id, season_number, tier)
);

alter table public.season_pass_progress enable row level security;

drop policy if exists "season_pass_select_own" on public.season_pass_progress;
create policy "season_pass_select_own"
  on public.season_pass_progress for select
  using (auth.uid() = user_id);

drop policy if exists "season_pass_insert_own" on public.season_pass_progress;
create policy "season_pass_insert_own"
  on public.season_pass_progress for insert
  with check (auth.uid() = user_id);
```

**4. `0017_recovery.sql`**
```sql
alter table public.profiles
  add column if not exists last_rest_date date,
  add column if not exists recovery_bonus_pct integer not null default 0;
```

What each system does:
- **Character stats** — every workout grows Power (chest/shoulders/triceps),
  Grit (back/biceps), Endurance (legs/cardio/full body/abs/forearms), or
  Discipline (streak consistency + quests completed) instead of one flat
  XP number. Shown as bars on the dashboard and full profile.
- **Class** — derived live from your Power/Grit/Endurance balance: Titan
  (Power-dominant), Warden (Grit), Ranger (Endurance), or Adept (balanced).
  Not chosen — earned from how you actually train.
- **Cosmetics** — avatar borders and titles unlocked by achievements you've
  already earned (see `lib/game/cosmetics.ts`), equippable on `/profile`.
  Deliberately not random loot — no gambling-adjacent mechanic.
- **Rival spotlight** — the dashboard highlights the friend closest above
  you in XP ("Sarah is 40 XP ahead — catch up!"), or tells you you're
  leading if nobody's ahead.
- **Boss-fight framing** — 7-day streak, 30-day streak, 100 workouts, and
  Level 50 now show a "⚔️ Boss Defeated" treatment in the achievement
  celebration instead of a normal card.
- **Season pass** — a 28-day workout-count track (5/15/30/50 workouts) that
  pays bonus XP at each tier, shown on the dashboard. No stat resets — the
  admin starts a new season from `/admin/settings` whenever they want,
  which only restarts this track.
- **Recovery** — log a deliberate rest day (once per day, only if you
  haven't worked out yet today) for a one-shot +10% XP bonus on your next
  workout. Rewards planned rest instead of just not punishing it.

### Streak reminders (push notifications) + faster dashboard

Everything built so far only works once you're already in the app. This
adds one thing that reaches people who *haven't* opened it: a daily
reminder if you have an active streak and haven't worked out yet today.
Free — uses the browser's native Push API, no third-party notification
service, no per-message cost.

**Migration — run in Supabase SQL Editor:**

**`0018_push_subscriptions.sql`**
```sql
create table if not exists public.push_subscriptions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users on delete cascade,
  endpoint   text not null unique,
  p256dh     text not null,
  auth       text not null,
  created_at timestamptz not null default now()
);

create index if not exists push_subscriptions_user_idx on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

drop policy if exists "push_subscriptions_select_own" on public.push_subscriptions;
create policy "push_subscriptions_select_own"
  on public.push_subscriptions for select
  using (auth.uid() = user_id);

drop policy if exists "push_subscriptions_insert_own" on public.push_subscriptions;
create policy "push_subscriptions_insert_own"
  on public.push_subscriptions for insert
  with check (auth.uid() = user_id);

drop policy if exists "push_subscriptions_delete_own" on public.push_subscriptions;
create policy "push_subscriptions_delete_own"
  on public.push_subscriptions for delete
  using (auth.uid() = user_id);
```

**Env vars to add** (Vercel → Settings → Environment Variables, and your
`.env.local`):
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY` — generate your
  own pair with `npx web-push generate-vapid-keys` (free, instant, no
  account needed). Never commit these to the repo — treat
  `VAPID_PRIVATE_KEY` like a password, env vars only.
- `CRON_SECRET` = any long random string you make up (e.g. mash your
  keyboard for 30 characters)

**How it works:** click the 🔔 button on your dashboard header to opt in
(browser will ask for notification permission). Once a day (8pm UTC — edit
the schedule in `vercel.json` if you want a different time), Vercel Cron
hits `/api/cron/streak-reminder`, which notifies everyone with an active
streak who hasn't logged a workout yet that day. Requires redeploying
after adding the env vars for the cron to actually be registered.

**To test:** enable notifications on your dashboard, then visit
`/api/cron/streak-reminder` directly in a new tab with the header
`Authorization: Bearer <your CRON_SECRET>` (use a tool like Postman, or
just trust the daily schedule) — you should get a push notification if
you have an active streak and haven't worked out today.

**Also in this update:** the dashboard now fires several independent
Supabase queries in parallel (quests, season status, friends) instead of
one-at-a-time — same data, faster page load, no visible change.

### Installable as a real app (PWA)

No migration needed — this is pure code/config. Forge can now be added to
a phone's home screen and opens like a native app (no browser bar).

- `app/manifest.ts` — Next.js auto-serves this at `/manifest.webmanifest`
  with the app name, orange theme color, dark background, and a generated
  flame icon (`public/icon-192.png` / `icon-512.png`).
- iOS-specific meta tags in `app/layout.tsx` — iOS Safari ignores the web
  manifest for "Add to Home Screen," so these control its standalone
  behavior and icon there.
- **Install button** (📲) on the dashboard header — on Android/Chrome/Edge
  it triggers the real native install prompt; on iOS (which has no such
  API) it shows a small hint pointing at Share → Add to Home Screen. Once
  installed, the button disappears.
- This also matters for the push notifications from the last update: **iOS
  Safari only supports web push for apps installed to the home screen** —
  if you tested notifications on an iPhone in a regular Safari tab, this
  is almost certainly why the 🔔 button didn't work. Install the app first
  via the new 📲 button, then try 🔔 again from inside the installed app.

### Twice-daily reminders + test notification button

No migration — pure code/config.

- `vercel.json` now schedules the streak-reminder cron **twice a day**
  (12pm and 8pm UTC) instead of once.
- **Important free-tier caveat:** Vercel's Hobby (free) plan has
  historically limited Cron Jobs to firing **once per day**, regardless of
  how many entries or what schedule you set — this may get silently capped
  to a single daily run. Redeploy and watch it for a couple of days; if
  you only ever see one notification a day, that's Vercel's Hobby limit,
  not a bug here. Free workaround if that happens: use
  **[cron-job.org](https://cron-job.org)** (free, no card) to `GET` your
  `https://your-app.vercel.app/api/cron/streak-reminder` URl with header
  `Authorization: Bearer <your CRON_SECRET>` on whatever schedule you want
  — it calls the same endpoint, Vercel's cron limit doesn't apply since
  the request isn't coming from Vercel's own scheduler.
- **Test notification button** — `/admin/settings` → "🔔 Send me a test
  notification" sends an immediate push to your own device(s), as long as
  you've already tapped 🔔 on the dashboard on that device. This is the
  fastest way to confirm the whole pipeline (VAPID keys, subscription,
  service worker) actually works, without waiting for the schedule or
  faking a streak.

### Choose today's split (free)

Run this migration in Supabase SQL Editor:

```sql
alter table public.profiles
  add column if not exists split_choice_date date,
  add column if not exists split_choice text;
```

Fixes a real complaint: the Push/Pull/Leg Day quest used to be randomly
assigned and could not match what you actually planned to train. Now
there's a "What are you training today?" card on the dashboard — pick
Push/Pull/Leg Day and that exact quest is guaranteed to show up (instead
of possibly a different, unrelated one). Random quests still fill the
other slots as before. Once picked, it's locked for the day.

**Product note for later:** we talked through a possible paid tier and
paused on writing any payment code since that needs a parent/guardian
conversation first (Stripe requires an 18+ or business account holder).
Whenever that's resolved, keep core logging flexibility (multiple
workouts/day, custom names, cardio, split choice) free regardless —
paywalling basics would feel predatory rather than premium. A future
paid tier should add optional extras (more cosmetics, etc.), not
withhold things people already expect from a free fitness app.

### Manual tier control (admin)

Run this migration in Supabase SQL Editor:

```sql
alter table public.profiles
  add column if not exists tier text not null default 'free';

alter table public.profiles
  drop constraint if exists profiles_tier_check;
alter table public.profiles
  add constraint profiles_tier_check check (tier in ('free', 'premium'));
```

**Not a payment system** — no money moves through the app anywhere. This
is just a flag on each account (`free` or `premium`) that only you can
flip, from `/admin/users` → **"Make Premium"** / **"Move to Free"** next
to any user. Useful for comping accounts, testers, or manually marking
someone premium if they paid you some other way while the real payment
question is still on hold. Nothing in the app is gated on this yet — it
just shows a ⭐ Premium badge next to their name in the admin list and on
their own profile page.

### Invite specific people from the waitlist

Run this migration in Supabase SQL Editor:

```sql
alter table public.waitlist
  add column if not exists invited boolean not null default false,
  add column if not exists invited_at timestamptz;

create or replace function public.is_invited(p_email text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.waitlist
    where email = lower(trim(p_email)) and invited = true
  );
$$;

grant execute on function public.is_invited(text) to anon, authenticated;
```

Before this, the launch switch was all-or-nothing: either everyone could
sign up, or only you could. Now, on `/admin/waitlist`, every row has an
**"Invite"** button — click it and that specific email can create an
account right now, even while pre-launch, without opening it to everyone
else. Click "revoke" to undo it.

**No email gets sent** — Forge doesn't have outbound email set up (that'd
need a service like Resend, which is free but is a separate signup you
haven't made). Invite them here, then just tell them yourself (text, DM,
whatever) that they can go sign up now.

### Launch checklist
Things to do before you actually flip the switch and open Forge to
everyone:
1. **Turn email confirmation back ON** — Supabase → Authentication → Sign
   In / Providers → Email → turn **"Confirm email" ON**. It was off this
   whole time to make testing faster; leaving it off for real users means
   anyone could sign up with an email they don't own.
2. **Do one full test pass** as a normal (non-admin) user on the live site:
   sign up, log a workout, unlock an achievement, complete a quest, check
   the streak, log out, log back in.
3. **Check your waitlist** at `/admin/waitlist` — export the CSV so you
   have a backup of everyone who signed up, and see who your top referrers
   are (they've been waiting the longest / brought the most people, so
   they're a natural group to invite first if you want a staged rollout
   instead of opening to everyone at once).
4. **When you're ready:** go to `/admin/settings` and click **"🚀 Launch
   Forge."** That's the only thing that opens public sign-up.
5. Optional later: a custom domain instead of `forge-mot-ma1q.vercel.app`
   — Vercel supports connecting one for free if you already own it, under
   **Project Settings → Domains**. You don't need one to launch; the
   `.vercel.app` link works fine.

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
