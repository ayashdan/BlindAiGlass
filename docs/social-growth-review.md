# Forge — social / competitive / revenue review

*Response to `docs/social-growth-review-prompt.md`. Written against the code on
this branch, August 2026. Everything here is a proposal — nothing has been
built. Numbers marked (est.) are industry-pattern estimates, not measurements.*

---

## 1. Honest diagnosis

Forge's single-player game is genuinely deep — the reward pipeline in
`app/(app)/workout/actions.ts` fans one logged workout out into XP, streaks,
quests, achievements, PRs, season tiers, stats, and chests, all
server-authoritative. That part is done. Stop adding to it. The three problems
that actually matter are all on the other side of the app:

### Problem 1 — the social layer is a read-only scoreboard that the first
### mover wins forever

`app/(app)/friends/page.tsx` sorts friends by **lifetime XP** (line 43:
`.sort((a, b) => b.xp - a.xp)`). The dashboard's rival spotlight
(`dashboard/page.tsx:104-120`) is also lifetime XP. Whoever installed first is
permanently on top; everyone else is playing for second place with no reset,
ever. Worse, nothing a friend does ever *reaches* you: there is no event, no
feed, no reaction, no push. The entire push infrastructure
(`lib/push-server.ts`, `push_subscriptions`) only ever talks to you about
*yourself*. The friendships table is a graph with no traffic on it. This is
the biggest gap: the social features generate **zero sessions** — no one ever
opens Forge because of something another human did.

### Problem 2 — referral dies at the front door, and day one is socially empty

The referral loop exists only pre-signup (waitlist queue position). The moment
someone becomes a user, there is no invite link, no reward for bringing a
friend, and no mechanism that makes their experience better if they do —
except the Friends tab, whose empty state is one line of grey text
(`friends/page.tsx:156`). A new user sees an empty Friends tab and a global
leaderboard they can't win (`leaderboard/page.tsx` — top 50 by lifetime XP).
Combined with the one-shot launch constraint, this means the graph starts cold
and *stays* cold.

### Problem 3 — the shop as designed would poison both the competition and
### the monetisation

`lib/game/shop.ts` prices **Instant +500 XP**, **XP boosts**, and paid
**chests that pay out XP**. XP is the competitive currency — it's what both
leaderboards and the friends ranking sort by. The day any of this becomes
purchasable, every competitive surface in Forge is pay-to-win and the honest
players' ranks are worthless. Separately, **paid randomised chests aimed at a
young audience is a paid loot box** — disclosed odds and no dead pulls
(`lib/game/chests.ts`) make it a *polite* loot box, but several jurisdictions
(Belgium, Netherlands case law, pending US/UK scrutiny) treat paid randomised
rewards for minors as gambling-adjacent, and app-store review increasingly
does too. The earned-chest system is fine; **never sell a randomised one**.
And **Streak Restore** ($4.99) monetises the single most painful moment in the
app — that's the item users screenshot when they write the "this app is
predatory" post. Recommendation below, but the short version: the shop's
current catalogue is dead weight to cut, not a foundation to build on.

**One more honest cut candidate:** the manual quests ("Hydrate", "Rest Up" —
`lib/game/quests.ts`) award XP for tapping a button. That's XP-for-nothing in
a system whose whole identity is "XP can't be faked from the browser"
(`lib/game/xp-server.ts`). Keep them as habit check-offs if you like the
rest-day touchpoint, but their XP should be trivial (they already are ≤15) or
zero once XP has competitive stakes.

---

## 2. The social layer — one system, not a feature list

**The atomic social unit is the friendship pair; the experienced unit is the
weekly cohort.** Don't build crews/guilds yet — with a cold graph, a guild
system divides a small population into empty rooms. Crews become worth building
when the median user has ~5+ friends. Until then, everything below runs on the
`friendships` table you already have.

The system is a loop with four parts:

### a) The Weekly League (the heartbeat)
Friends are ranked by **XP earned this week** (Monday reset), not lifetime.
Now a brand-new user can beat a level-90 veteran by showing up more this week
— which is also exactly the behaviour a fitness app should reward. Lifetime XP
stays as levels/ranks/prestige (your *character*); the *competition* is weekly.
This one change converts the dead friends list into a reason to open the app
daily. Full implementation spec in §6.

### b) Activity + hype (how a friend reaches me)
A minimal feed: when you log a workout, level up, unlock an achievement, or
hit a PR, a row lands in a `friend_events` table (written server-side inside
`logWorkout`, same trust model as XP). Friends see the last few days of events
and can tap one reaction — 🔥 "hype". Hyping sends a **push notification to
the recipient** ("Dana hyped your leg day 🔥") via the existing
`lib/push-server.ts`. Receiving recognition from a real person is a stronger
re-open trigger than any self-directed streak nudge you can write — and it
costs the sender one tap. No comments, no free text (that's a moderation
surface you don't have time to police); one reaction type, rate-limited.
Deliberately **no XP for hype in either direction** — the moment recognition
pays currency, alt accounts farm it.

### c) The invite loop (what makes a user recruit)
Every user gets an in-app invite link (you already have the referral-code
machinery in the waitlist — reuse the pattern post-signup).

- **Invitee gets:** skipping the cold start — they arrive **auto-friended
  with their inviter**, so their day one has a rival, a league, and a feed
  with someone in it. That's the honest pitch: "Forge is better with a rival."
- **Inviter gets:** an exclusive cosmetic ("Recruiter" title / border) when
  the invitee logs their **3rd workout** — not on signup, so spam invites to
  dead accounts pay nothing. Cosmetic, not XP, so the league stays clean.
- **Why the invitee stays past day two:** they're in a 2-person league they
  could win *this week*, and their first workout puts an event in someone's
  feed that gets hyped. The existing solo loop (quests, chests, streak) does
  the rest.

### d) Zero-friend day one
For the user who arrives alone: the friends tab empty state becomes a real
screen — your invite link front and centre, plus a **"You vs. last week"**
card (beat your own previous week's XP) so the weekly-league mechanic works
solo from day one. Don't fake it with bots or "featured strangers"; a
self-versus-self target is honest and still gives the Monday reset meaning.

**Launch mechanic (uses the one-shot launch):** invite the waitlist in
**referral clusters**, not by queue position — everyone who signed up via the
same referrer goes in the same wave, pre-connected (you have the referral
edges in the `waitlist` table). People should arrive to a league that already
has their friends in it. This is ops + a small admin query, not a feature.

### k-factor, honestly
Fitness apps are not viral products; they're retention products with a
referral assist. A plausible range (est., based on consumer-app referral
norms): 10–20% of *retained* users ever send an invite that converts, most
sending 1–2. That's k ≈ 0.1–0.3 — each 100 users you acquire brings 10–30
more, a one-time multiplier of ~1.1–1.4×, **not** exponential growth. The
auto-friend mechanic's real value isn't the extra signups — it's that invited
users retain far better than organic ones (they arrive with a social reason
to stay). Plan distribution (school, gym, TikTok, whatever your channel is)
as if k were zero; treat referral as a retention feature that happens to also
grow the graph.

---

## 3. The competitive layer

**Format: weekly friends league scored by capped workout XP.**

- **Scoring:** only base workout XP (`workouts.xp_earned`) counts toward the
  league, and only the **first 3 workouts per day** count. Bonus XP
  (achievements, chests, season tiers) is excluded — it's lumpy, historical,
  and would let a veteran's achievement backlog swamp a newcomer's honest
  week. With the cap, the theoretical max is ~450 league points/day, and the
  realistic spread between "showed up daily" and "showed up daily and went
  hard" is small. **The score measures consistency, not volume** — which is
  both the right fitness incentive and the right anti-cheat shape: a liar who
  fabricates 3 hard workouts a day beats an honest daily user by ~40%, not
  40×. There's no handicapping to design because showing up is equally
  available to everyone regardless of fitness level.
- **Cadence: weekly, Monday 00:00 UTC.** Weekly is long enough that one bad
  day doesn't end your chances, short enough that losing never feels
  permanent. Use one global UTC boundary (not per-user timezones from
  `0023_profile_timezone.sql`) so two friends never disagree about when the
  week flipped; the cost is an off-by-hours reset for some timezones, which
  is acceptable and much simpler.
- **Losing survivable:** nothing is lost on a loss — no rating, no demotion
  (yet), no streak interaction. The floor competition is always **you vs.
  your own last week**, shown to everyone including the winner. Monday's
  push says "New week — everyone's at 0", which is the *good* framing of a
  reset. The winner gets a one-week cosmetic crown/title, not XP — so losing
  costs you a hat, not progress.
- **Divisions (Duolingo-style promotion cohorts): not yet.** They need
  hundreds of active users to fill fair brackets. Design the league so
  divisions can be added later (the score function doesn't change; only who
  you're grouped with does). Same answer for global tournaments.
- **Integrity:** workouts are self-reported, so the rule is: **cosmetic
  stakes only, forever** — never money, never anything scarce, attached to
  self-reported effort. The daily cap plus the existing input clamps
  (`workout/actions.ts` — duration ≤ 600, fixed difficulty bonuses) bound
  what lying can buy. Accept that a determined liar can win a hat among
  friends who know them; friends-only competition is itself the strongest
  anti-cheat, because your league knows whether you actually train.

---

## 4. The money

**Recommendation: subscription ("Forge Plus"), not à-la-carte — and gut the
current shop catalogue before launch.**

Why not à-la-carte cosmetics: a cosmetics economy needs a constantly
refreshed catalogue to keep selling — that's an art-production treadmill a
solo evening builder cannot feed. Why not consumables: everything consumable
in `shop.ts` is either XP (poisons competition, §1) or streak items
(monetises pain). A subscription monetises the thing Forge actually produces
— *ongoing engagement* — and is one SKU to maintain.

**Forge Plus, ~$2.99/mo or ~$24/yr (price for a young audience):**
- The full animated border set + an exclusive rotating monthly cosmetic
  (one new border/title a month is a sustainable production rate).
- Deep stats: full history (past the current 30-workout window in
  `history/page.tsx`), per-muscle-group trends, weekly report card.
- Custom quest slot (the `shop.ts` idea, but included — capped at the same
  ≤35 XP as catalogue quests so it can't mint currency).
- Streak-freeze cap raised from 2 to 3 (`FREEZE_CAP` in
  `workout/actions.ts`) — a comfort upgrade, not a competitive one, since
  freezes don't generate XP.
- Supporter badge next to your name.

**Free forever (agreeing with, and slightly extending, your standing rule):**
all logging, streaks, quests, achievements, chests-as-earned, leaderboards,
friends, the weekly league, and **hype/feed**. The social loop must be 100%
free — every paywalled social feature halves the graph's value for paying
users too. Your instinct on this rule is right; the only place I'd push back
is the framing: the reason isn't just "predatory optics," it's that in a
network product, free users are the *content* the paying users are paying to
be around.

**Cut from `shop.ts`:** Instant XP, XP boosts, paid chests, Streak Restore.
Keep the shop screen as the cosmetics/Plus preview surface.

**The arithmetic (all est.):** habit-app free→paid conversion typically lands
at 2–5%. Take 3% and $2.50/mo blended (mix of monthly and annual):

- 1,000 MAU → 30 subs → **~$75/mo** — pocket money.
- 10,000 MAU → 300 subs → **~$750/mo** — real but not rent.
- 50,000 MAU → 1,500 subs → **~$3,750/mo** — a real business.

So the honest N: **this doesn't pay meaningfully below ~10k MAU.** Which means
revenue work is premature and retention/growth work is the revenue work.
Also, at ~a few thousand MAU you'll outgrow Supabase/Vercel free tiers
(~$45/mo combined for the first paid rungs) — that's the first real cost.

**Sequencing given the processor block:**
1. Now: cut the toxic SKUs; keep building cosmetics that achievements unlock.
2. Now: make `profiles.tier` actually gate something small (the Plus border
   set renders locked with a "Plus — coming soon" tag). Add a one-tap
   **"Notify me when Plus launches"** button and count taps — that's a free,
   real demand measurement before anyone can pay.
3. When the guardian/Stripe conversation resolves: wire Stripe Checkout +
   webhook → flip `tier`. Because entitlements already key off `tier`, this
   is days, not weeks.
4. Charge nobody until email confirmation is on and the launch checklist in
   the README is done.

---

## 5. Ranked plan

| # | Proposal | What it changes | Effort (est.) | Expected effect | Risk |
|---|----------|-----------------|--------|-----------------|------|
| 1 | **Weekly friends league** (spec in §6) | Friends page becomes weekly race; rival card becomes weekly; Monday reset + winner title | 8–12 h | Retention ↑↑ (daily check-in reason), foundation for everything social | Low — no new write paths beyond 2 profile columns |
| 2 | **Invite link + auto-friend + Recruiter cosmetic** | Referral works post-signup; invitees arrive with a rival | 6–8 h | Virality ↑ (k from ~0 to ~0.1–0.3 est.), invited-user retention ↑↑ | Low |
| 3 | **Hype: friend events + one-tap reaction + push** | First time another human reaches you through Forge | 12–16 h | Retention ↑↑ (recognition loop), session frequency ↑ | Medium — new table + fanout, needs rate limits |
| 4 | **Shop detox + Plus placeholder + "notify me" counter** | Removes pay-to-win/loot-box liabilities; starts measuring willingness to pay | 4–6 h | Revenue foundation; protects league integrity | Low |
| 5 | **Share images** — replace plain-text share with a generated branded card (Next.js `ImageResponse`, free) for level-ups/PRs/streaks | Sharing survives contact with a group chat or story | 6–10 h | Virality ↑ (top of funnel), design ↑ | Low |
| 6 | **Design pass** (see appendix): header declutter, accent-colour discipline, empty states that sell, number formatting | The app reads as designed-on-purpose | 6–8 h | Conversion/retention ↑ at the margin, screenshots improve | Low |
| 7 | **Launch in referral clusters** (admin query + invite waves) | Day-one graph is warm | 2–3 h + ops | Cold-start ↓↓ at launch | Low |
| 8 | **Crews/guilds** | — | — | **Do nothing yet.** Needs a warm graph first; empty crews are worse than no crews | — |
| 9 | **Divisions / global tournaments** | — | — | **Do nothing yet.** Needs hundreds of MAU for fair brackets; league design already accommodates it later | — |
| 10 | **Payments** | — | — | **Do nothing until the guardian/Stripe question resolves**; item 4 makes the eventual wiring trivial | — |

Items 1+2 together are the launch-critical pair: they're what make the
one-shot launch produce a connected graph instead of a lobby of strangers.
Everything at 8–10 stays on ice until the numbers justify it.

---

## 6. Making #1 real — the Weekly Friends League

### Why there's (almost) no migration

The obvious source of weekly scores — summing `workouts.xp_earned` per friend
— is blocked by RLS: `workouts_select_own` (`0002_workouts.sql`) means you
cannot read friends' workout rows, and opening workouts to friends would leak
notes/durations you never promised to share. But `profiles` is world-readable
(`profiles_select_all`, `0001_profiles.sql`) and is already where every social
read happens. So: **denormalise the weekly score onto `profiles`**, updated
server-side in the one place workouts are written.

### Migration — `supabase/migrations/0029_weekly_league.sql`

```sql
-- Weekly friends league: score lives on the world-readable profiles row,
-- written only by the server-side workout pipeline (same trust model as xp).
alter table public.profiles
  add column if not exists weekly_xp integer not null default 0,
  add column if not exists week_start date;

-- Optional but cheap: past winners, for a future "trophy shelf".
create table if not exists public.league_weeks (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users on delete cascade,
  week_start date not null,
  points     integer not null,
  won        boolean not null default false,
  unique (user_id, week_start)
);

alter table public.league_weeks enable row level security;

-- Readable by anyone, like profiles — it's the same public game stats.
drop policy if exists "league_weeks_select_all" on public.league_weeks;
create policy "league_weeks_select_all"
  on public.league_weeks for select
  using (true);

-- No insert/update/delete policies: only the service-role cron writes here.
```

No new RLS complexity: `weekly_xp` rides the existing `profiles_update_own`
policy (updates happen in `logWorkout`, authenticated as the user), and
`league_weeks` is written only by the Monday cron with the service-role
client (`lib/supabase/admin.ts`), matching how admin writes already work.

### Pure logic — new file `lib/game/league.ts`

- `currentWeekStart(): string` — the Monday 00:00 UTC date string for now.
- `effectiveWeeklyXp(profile): number` — returns `weekly_xp`, or `0` if
  `week_start !== currentWeekStart()` (lazy reset: stale rows read as zero,
  no cron needed to zero them).
- `LEAGUE_DAILY_WORKOUT_CAP = 3`.

### Changes in `app/(app)/workout/actions.ts`

One block, right after the existing profile update (~line 201). The function
already fetched today's workout rows for quest checking (`todaysWorkouts`,
line 151) — reuse it:

```
if (rows.length <= LEAGUE_DAILY_WORKOUT_CAP) {
  weekly_xp = (week_start === currentWeekStart() ? prof.weekly_xp : 0) + xpEarned;
  week_start = currentWeekStart();
}
```

Fold those two fields into the existing `.update()` call — zero extra round
trips. (Add `weekly_xp, week_start` to the profile select at line 67.)

**Overtake push (the league's reach-out moment):** after `applyXp`, fetch
friends' profiles once (the same query shape the dashboard rival card already
uses), compute `before = myWeekly - xpEarned`, `after = myWeekly`; any friend
whose effective weekly XP lies in `(before, after]` just got passed → send
them one push via `lib/push-server.ts`: *"⚔️ {username} just passed you in
this week's league — {gap} XP to take it back."* Cap at one overtake push per
recipient per day (check a timestamp column or just send only when the passed
friend was in league rank 1–3 to keep volume tiny). Fire-and-forget like the
existing chest/season promises.

### Weekly rollover cron — `app/api/cron/league-finish/route.ts`

Monday 00:05 UTC (one more `vercel.json` entry, same `CRON_SECRET` guard as
the existing three crons): for each user with `weekly_xp > 0` and a stale
`week_start`, write their `league_weeks` row; for each friendship cluster,
mark `won` for each user who topped their own friends list; push to winners:
*"👑 You won your league this week."* Winners get the pre-existing cosmetics
path: a `Weekly Champion` title valid until next Monday (render-time check
against `league_weeks`, no schema change). Push to everyone else who
participated: *"New week. Everyone's back to 0."*

### UI

- **`app/(app)/friends/page.tsx`** — the list sorts by
  `effectiveWeeklyXp` (desc), shows `+{weekly} XP this week` as the big
  number with `Level {level}` demoted to the subtitle; a small
  `This week / All time` toggle (searchParam, same pattern as
  `leaderboard/page.tsx?by=`). Countdown chip in the header: "Resets Monday".
  **Empty state becomes the recruiting screen**: your invite link (item 2)
  plus a "You vs last week" self-target card.
- **`app/(app)/dashboard/page.tsx`** — the rival spotlight (lines 104–120)
  switches to weekly gap: *"Rival: Sarah is 120 XP ahead **this week** — one
  hard workout closes it."* That last clause matters: the gap is now always
  closable, which is the whole point.
- **`app/(app)/leaderboard/page.tsx`** — add `?by=weekly` as a third toggle
  using the same public column. Global weekly is winnable by newcomers, which
  fixes the cold-start leaderboard too.

### Failure modes

- **Gaming:** 3-workouts/day cap bounds fabrication (§3); difficulty is the
  only multiplier and it's clamped server-side. Prize is a one-week cosmetic.
- **Spam:** overtake pushes capped per day and only near the top; Monday push
  is one per user per week.
- **Harassment:** no new text surfaces; usernames were already visible.
- **Clock games:** `week_start` is computed server-side in UTC; the client
  never supplies it.
- **Stale reads:** lazy reset means a profile row can show last week's
  `weekly_xp` — every reader must go through `effectiveWeeklyXp()`, never the
  raw column. Enforce by exporting only the helper from `lib/game/league.ts`.

Two evenings of work: migration + `league.ts` + `logWorkout` edit on night
one; friends/dashboard/leaderboard UI + cron on night two. Everything else in
the plan builds on top of this heartbeat.

---

## Appendix — design pass (item 6), concrete list

1. **Dashboard header declutter** (`dashboard/page.tsx:149-170`): six utility
   chips (install, bell, sound, theme, feedback, admin) crowd the app's prime
   row. Keep the avatar/identity block; move all six into a settings sheet on
   `/profile`. The header should be identity + one contextual chip max.
2. **Accent-colour discipline**: six accent colours (`ACCENTS` map) plus
   brand orange reads as carnival rather than Clash-vibrant, and the
   assignments drift (fuchsia = both World Map and Shop; rival card
   introduces a seventh, `red-500`). Pick four with fixed meanings — orange =
   act now, gold = reward, emerald = quest/success, sky = streak/recovery —
   and map every panel to one. Vibrancy comes from consistency + saturation,
   not variety.
3. **Number formatting**: `12450 XP` → `12,450 XP` (`toLocaleString()`) in
   the XP card, leaderboard rows, and friends list. Small, everywhere,
   reads instantly more polished.
4. **Empty states that sell**: friends (`friends/page.tsx:156`) and
   leaderboard (`leaderboard/page.tsx:135`) empty states are one grey line.
   Each should be an illustration + one action (invite link / log first
   workout). Empty states are disproportionately what new users see.
5. **Share output** is plain text (`ShareButton`) — the generated share-card
   image (plan item 5) is the single highest-impact design change for growth;
   a branded 1080×1920 card with level/streak/class looks like something on
   a story instead of pasted text.
6. **Light-theme audit**: dark is clearly the designed-first theme
   (`globals.css`); check brand-orange-on-white and `--muted`-on-white
   contrast (WCAG AA) on the light palette before launch, or ship
   dark-only at launch and cut the maintenance surface in half.
