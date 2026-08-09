import type { Metadata } from "next";
import Link from "next/link";
import { joinWaitlist } from "../actions";
import ThemeToggle from "@/components/ThemeToggle";
import SubmitButton from "@/components/SubmitButton";
import PhoneMockup from "@/components/PhoneMockup";
import ScreenshotFrame from "@/components/ScreenshotFrame";
import ChestGraphic from "@/components/ChestGraphic";
import WorldMapPath from "@/components/WorldMapPath";

export const metadata: Metadata = {
  title: "Forge — Level up your fitness | Everything inside",
  description:
    "A full look at Forge: XP and levels, daily quests, streaks, achievements, character stats, a world map, chests, friends, leaderboards, and more. Free to join the waitlist.",
};

// ---------------------------------------------------------------------------
// Screenshot gallery — the same trick PhoneMockup already uses: real app
// building blocks shrunk down inside a phone frame, instead of an image
// file that doesn't exist in this environment and would go stale the next
// time a screen changes. WorldMapPath and ChestGraphic below are the actual
// components /world and /chests render — not lookalikes.
// ---------------------------------------------------------------------------

function ScreenQuests() {
  const quests = [
    { icon: "💪", title: "Push Day", xp: 25, done: true },
    { icon: "⏱️", title: "Endurance", xp: 30, done: true },
    { icon: "💧", title: "Hydrate", xp: 10, done: false },
  ];
  return (
    <div className="flex h-full flex-col px-2.5 pb-1.5 pt-7 text-white">
      <p className="font-display text-[11px] font-bold">🎯 Today&apos;s Quests</p>
      <div className="mt-2 space-y-1.5">
        {quests.map((q) => (
          <div
            key={q.title}
            className={`flex items-center gap-1.5 rounded-lg border px-2 py-1.5 ${
              q.done ? "border-emerald-500/40 bg-emerald-500/10" : "border-white/10 bg-white/5"
            }`}
          >
            <span className="text-[10px]">{q.icon}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[7.5px] font-bold">{q.title}</p>
            </div>
            <span className="text-[6px] font-bold text-forge">+{q.xp}xp</span>
            <span
              className={`flex h-3 w-3 flex-shrink-0 items-center justify-center rounded-full border text-[6px] ${
                q.done ? "border-emerald-400 bg-emerald-400 text-neutral-950" : "border-white/30"
              }`}
            >
              {q.done ? "✓" : ""}
            </span>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[5px] font-black uppercase tracking-wide text-white/40">
        2 of 3 complete
      </p>
      <div className="flex-1" />
    </div>
  );
}

function ScreenMap() {
  return (
    <div className="relative h-full w-full overflow-hidden pt-6">
      <WorldMapPath currentLevel={22} />
    </div>
  );
}

function ScreenChests() {
  const chests: { tier: "common" | "rare" | "legendary"; label: string; range: string }[] = [
    { tier: "common", label: "Common", range: "10–25xp" },
    { tier: "rare", label: "Rare", range: "40–80xp" },
    { tier: "legendary", label: "Legendary", range: "150–300xp" },
  ];
  return (
    <div className="flex h-full flex-col items-center px-2.5 pb-1.5 pt-7 text-white">
      <p className="font-display self-start text-[11px] font-bold">🧰 Chests</p>
      <div className="mt-4 flex flex-1 items-center gap-2">
        {chests.map((c) => (
          <div key={c.tier} className="flex flex-col items-center gap-1">
            <ChestGraphic tier={c.tier} className="w-16" />
            <p className="text-[6px] font-bold text-white/80">{c.label}</p>
            <p className="text-[5px] font-semibold text-forge">{c.range}</p>
          </div>
        ))}
      </div>
      <p className="mb-1 text-[5.5px] font-semibold text-white/40">
        Common drops every workout · Rare every 5 levels
      </p>
    </div>
  );
}

function ScreenLeaderboard() {
  const rows = [
    { medal: "🥇", name: "Sarah_K", xp: "2,140", me: false },
    { medal: "🥈", name: "Mike_R", xp: "1,980", me: false },
    { medal: "🥉", name: "Jordan", xp: "1,750", me: false },
    { medal: "#4", name: "You", xp: "1,620", me: true },
    { medal: "#5", name: "Alex_T", xp: "1,400", me: false },
  ];
  return (
    <div className="flex h-full flex-col px-2.5 pb-1.5 pt-7 text-white">
      <p className="font-display text-[11px] font-bold">🏆 Leaderboard</p>
      <div className="mt-2 space-y-1">
        {rows.map((r) => (
          <div
            key={r.name}
            className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 ${
              r.me ? "border border-forge/50 bg-forge/15" : "bg-white/5"
            }`}
          >
            <span className="w-4 text-[7px] font-black">{r.medal}</span>
            <span className="h-3.5 w-3.5 flex-shrink-0 rounded-full bg-gradient-to-br from-rose-500 to-amber-500" />
            <span className={`flex-1 truncate text-[7px] font-bold ${r.me ? "text-forge" : ""}`}>
              {r.name}
            </span>
            <span className="text-[6.5px] font-bold text-white/60">{r.xp} xp</span>
          </div>
        ))}
      </div>
      <div className="flex-1" />
    </div>
  );
}

function ScreenProfile() {
  const stats = [
    { label: "POWER", pct: 78, color: "from-rose-500 to-rose-300" },
    { label: "GRIT", pct: 45, color: "from-violet-500 to-violet-300" },
    { label: "ENDURANCE", pct: 60, color: "from-sky-500 to-sky-300" },
    { label: "DISCIPLINE", pct: 90, color: "from-emerald-500 to-emerald-300" },
  ];
  return (
    <div className="flex h-full flex-col px-2.5 pb-1.5 pt-7 text-white">
      <div className="flex items-center gap-1.5">
        <div className="h-8 w-8 flex-shrink-0 rounded-full bg-gradient-to-br from-rose-500 to-amber-500" />
        <div>
          <p className="font-display text-[10px] font-bold">ForgeUser</p>
          <p className="text-[6px] font-semibold text-amber-400">🛡️ Titan · Bronze</p>
        </div>
      </div>
      <div className="mt-3 space-y-1.5">
        {stats.map((s) => (
          <div key={s.label}>
            <p className="text-[5px] font-black tracking-wide text-white/40">{s.label}</p>
            <div className="mt-0.5 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${s.color}`}
                style={{ width: `${s.pct}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[5px] font-black uppercase tracking-wide text-white/40">
        Trophy case
      </p>
      <div className="mt-1 flex gap-1">
        {["🏅", "🔥", "💯", "🏆", "⭐"].map((e, i) => (
          <span
            key={i}
            className="flex h-4 w-4 items-center justify-center rounded-full border border-amber-400/40 bg-amber-500/10 text-[7px]"
          >
            {e}
          </span>
        ))}
      </div>
      <div className="flex-1" />
    </div>
  );
}

const SCREENS: { label: string; node: React.ReactNode }[] = [
  { label: "Home", node: <PhoneMockup /> },
  {
    label: "World Map",
    node: (
      <ScreenshotFrame>
        <ScreenMap />
      </ScreenshotFrame>
    ),
  },
  {
    label: "Daily Quests",
    node: (
      <ScreenshotFrame>
        <ScreenQuests />
      </ScreenshotFrame>
    ),
  },
  {
    label: "Chests",
    node: (
      <ScreenshotFrame>
        <ScreenChests />
      </ScreenshotFrame>
    ),
  },
  {
    label: "Leaderboard",
    node: (
      <ScreenshotFrame>
        <ScreenLeaderboard />
      </ScreenshotFrame>
    ),
  },
  {
    label: "Profile & Stats",
    node: (
      <ScreenshotFrame>
        <ScreenProfile />
      </ScreenshotFrame>
    ),
  },
];

// ---------------------------------------------------------------------------
// "What's inside" — one card per system that's actually shipped, cycling
// through the app's own accent palette (forge-accent-*, globals.css) so this
// reads as the same design system as the real app, not a separate site.
// ---------------------------------------------------------------------------

const ACCENTS = ["amber", "emerald", "sky", "rose", "violet", "fuchsia"] as const;

const FEATURES: { icon: string; title: string; body: string }[] = [
  {
    icon: "🔥",
    title: "XP, levels & ranks",
    body: "Every workout earns real XP — more for higher difficulty. Total XP sets your level (100 levels, each one costing more than the last) and your rank: Beginner, Bronze, Silver, Gold, Platinum, Diamond, then Elite at level 90+.",
  },
  {
    icon: "🎯",
    title: "Daily quests",
    body: "Three quests a day, drawn from a pool of ten — Show Up, Push/Pull/Leg Day, Endurance, Go Hard, plus self-reported rest-day quests like Stretch, Hydrate, and Get Moving. Pick today's split on the dashboard and the matching split quest is guaranteed, not random.",
  },
  {
    icon: "🧊",
    title: "Streaks & earned freezes",
    body: "Keep a daily streak alive and bank a streak freeze automatically every 7 days, capped at two. Miss exactly one day and a banked freeze protects the streak instead of resetting it — earned, never purchased.",
  },
  {
    icon: "🏅",
    title: "Achievements & boss fights",
    body: "Ten badges unlock as you train, from your first logged workout to a 100-workout Century Club. Milestones like a 30-day streak get a full-screen \"Boss Defeated\" celebration instead of a quiet badge pop-in.",
  },
  {
    icon: "🛡️",
    title: "Character stats & class",
    body: "Every workout grows Power, Grit, Endurance, or Discipline based on what you actually trained. Your class — Titan, Warden, Ranger, or Adept — is derived live from that balance. Not picked at signup. Earned by how you train.",
  },
  {
    icon: "🗺️",
    title: "World map & chests",
    body: "Level progress plays out as a path with a waypoint every 5 levels. A Common Chest (10–25 XP) drops every workout you log; a Rare Chest (40–80 XP, a chance at a bonus streak freeze) drops every 5 levels.",
  },
  {
    icon: "🎟️",
    title: "Season pass",
    body: "A 60-day track pays bonus XP at four workout-count milestones. No stat resets, no pressure to keep pace — a bonus layer on top of everything else, run manually season to season.",
  },
  {
    icon: "🤝",
    title: "Friends & leaderboards",
    body: "Add friends by username and see a small leaderboard ranked by XP among people you actually know — the dashboard also names whichever friend is closest above you, so there's always someone specific to chase. A global top-50 (by XP or streak) shows your rank even outside it.",
  },
  {
    icon: "📈",
    title: "Personal records & history",
    body: "Forge tracks your longest workout, overall and per muscle group, and flags a real 🏆 New PR the moment you beat a previous best. Your last 30 workouts and a 14-week GitHub-style heatmap live on your History page.",
  },
  {
    icon: "😴",
    title: "Recovery days",
    body: "Log a deliberate rest day — once a day, only if you haven't trained yet — for a one-time +10% XP bonus on your next workout. Planned rest gets rewarded, not just tolerated.",
  },
  {
    icon: "⭐",
    title: "Prestige",
    body: "Hit level 100 and prestige: level and XP reset to 1, but a permanent star marks your name everywhere — dashboard, profile, leaderboard, friends. Streaks, workouts, and achievements stay untouched.",
  },
  {
    icon: "🎨",
    title: "Cosmetics",
    body: "Avatar borders and titles unlock from specific achievements you've already earned — deliberately not random loot. Want the Inferno border? You know exactly which achievement gets it, before you start.",
  },
  {
    icon: "📲",
    title: "Install & notifications",
    body: "Add Forge to your home screen and it opens like a real app — no app store, no download. Opt into push notifications for a nudge at your own local 3pm and 5pm if you haven't trained, plus a heads-up when you're one level from your next Rare Chest.",
  },
];

const FAQS: { q: string; a: string }[] = [
  {
    q: "Is Forge free?",
    a: "Yes. Logging workouts, quests, streaks, achievements, and the leaderboard are all free — no subscription, no paywall on the basics.",
  },
  {
    q: "Do I need to download it from an app store?",
    a: "No. Forge runs in your browser and installs straight to your home screen as a Progressive Web App — tap Share → Add to Home Screen on iOS, or use the install prompt on Android/Chrome. It opens full-screen, just like a native app.",
  },
  {
    q: "Which devices does it work on?",
    a: "Any modern phone or desktop browser. For push notifications on iPhone specifically, Safari requires the app to be installed to your home screen first — a regular browser tab can't receive them there.",
  },
  {
    q: "My workouts are self-reported — how is anything fair?",
    a: "Every XP award, streak update, and achievement unlock is calculated on the server, never trusted from the browser — so what you see on the leaderboard is what actually happened, not whatever a request claims.",
  },
  {
    q: "How do I actually get in?",
    a: "Forge is pre-launch. Join the waitlist below — inviting friends moves you up the line. Already got an invite? Log in directly, no waitlist needed.",
  },
];

export default function FeaturesPage({
  searchParams,
}: {
  searchParams: { ref?: string; error?: string };
}) {
  const ref = searchParams.ref ?? "";

  return (
    <main className="mx-auto max-w-3xl px-6 pb-20">
      {/* Slim sticky top bar — the App-Store-style "GET" row that stays put
          while you scroll a long product page. */}
      <div className="sticky top-0 z-20 -mx-6 mb-2 border-b border-line bg-bg/85 px-6 py-3 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2">
            <img src="/icon-192.png" alt="" width={28} height={28} className="rounded-lg" />
            <span className="font-display text-sm font-bold">Forge</span>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              href="/login"
              className="press rounded-lg border border-line px-3 py-2 text-xs font-bold transition hover:border-forge/50"
            >
              Log in
            </Link>
            <a
              href="#waitlist"
              className="press rounded-lg bg-forge px-3 py-2 text-xs font-black text-neutral-950 transition hover:bg-forge-soft"
            >
              Join waitlist
            </a>
          </div>
        </div>
      </div>

      {/* Hero */}
      <section className="pt-8 text-center">
        <img
          src="/icon-192.png"
          alt="Forge app icon"
          width={88}
          height={88}
          className="mx-auto rounded-[22%] shadow-lg shadow-forge/20"
        />
        <h1 className="mt-5 text-4xl font-black leading-tight tracking-tight sm:text-5xl">
          Forge
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-lg text-muted">
          Turn your workouts into a game. Earn XP, keep a streak, unlock
          achievements, and climb ranks with people you actually know.
        </p>

        {/* App-Store-style metadata row */}
        <div className="mx-auto mt-6 flex max-w-md flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted">
          <span>
            <span className="font-bold text-fg">Free</span> · no subscription
          </span>
          <span>Health &amp; Fitness</span>
          <span>Independent developer</span>
        </div>

        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <a
            href="#waitlist"
            className="press rounded-xl bg-forge px-6 py-3 font-black text-neutral-950 transition hover:bg-forge-soft"
          >
            Join the waitlist
          </a>
          <Link
            href="/login"
            className="press rounded-xl border border-line px-6 py-3 font-bold transition hover:border-forge/50"
          >
            Open Forge →
          </Link>
        </div>
        <p className="mt-3 text-xs text-muted">
          Already invited? &quot;Open Forge&quot; takes you straight to login — no waitlist needed.
        </p>
      </section>

      {/* Screenshot gallery */}
      <section id="screenshots" className="mt-14 scroll-mt-20">
        <h2 className="text-center text-xl font-black">See it in action</h2>
        <p className="mx-auto mt-1 max-w-md text-center text-sm text-muted">
          Every screen below is built from the same components the real app
          renders — not mockup images.
        </p>
        <div className="mt-6 flex snap-x snap-mandatory gap-5 overflow-x-auto px-2 pb-4">
          {SCREENS.map((s) => (
            <div key={s.label} className="flex flex-shrink-0 snap-center flex-col items-center gap-2">
              {s.node}
              <p className="text-xs font-bold text-muted">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Trust / fairness banner */}
      <section className="forge-panel mt-10 flex items-start gap-3 px-5 py-4">
        <span className="text-xl">🔒</span>
        <p className="text-sm text-muted">
          <span className="font-bold text-fg">Every number is real.</span>{" "}
          XP, streaks, and achievement unlocks are calculated on the server —
          never trusted from the browser — so nothing on the leaderboard can
          be faked.
        </p>
      </section>

      {/* Feature grid */}
      <section id="features" className="mt-14 scroll-mt-20">
        <h2 className="text-center text-xl font-black">What&apos;s inside</h2>
        <p className="mx-auto mt-1 max-w-md text-center text-sm text-muted">
          Thirteen systems, all live today — not a roadmap.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className={`forge-accent-${ACCENTS[i % ACCENTS.length]} forge-panel game-card px-5 py-4`}
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">{f.icon}</span>
                <h3 className="font-display text-base font-bold">{f.title}</h3>
              </div>
              <p className="mt-2 text-sm text-muted">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Requirements / compatibility */}
      <section className="mt-14 rounded-2xl border border-line bg-surface p-6">
        <h2 className="text-center text-lg font-black">Compatibility</h2>
        <div className="mx-auto mt-4 grid max-w-lg gap-3 text-sm sm:grid-cols-2">
          <div className="flex justify-between gap-3 border-b border-line pb-2 sm:border-b-0 sm:border-r sm:pb-0 sm:pr-3">
            <span className="text-muted">Works on</span>
            <span className="text-right font-semibold">iPhone, Android, desktop</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-muted">Install</span>
            <span className="text-right font-semibold">Add to Home Screen (PWA)</span>
          </div>
          <div className="flex justify-between gap-3 border-b border-line pb-2 sm:border-b-0 sm:border-r sm:pb-0 sm:pr-3">
            <span className="text-muted">Price</span>
            <span className="text-right font-semibold">Free</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-muted">Account needed</span>
            <span className="text-right font-semibold">Yes — email + username</span>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mt-14 scroll-mt-20">
        <h2 className="text-center text-xl font-black">Questions</h2>
        <div className="mx-auto mt-6 max-w-lg space-y-3">
          {FAQS.map((f) => (
            <details
              key={f.q}
              className="group rounded-xl border border-line bg-surface px-4 py-3 open:border-forge/40"
            >
              <summary className="cursor-pointer list-none font-bold marker:content-none">
                <span className="flex items-center justify-between gap-3">
                  {f.q}
                  <span className="text-muted transition group-open:rotate-45">+</span>
                </span>
              </summary>
              <p className="mt-2 text-sm text-muted">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Waitlist */}
      <section id="waitlist" className="mx-auto mt-16 max-w-md scroll-mt-20">
        <h2 className="text-center text-xl font-black">Join the Forge waitlist</h2>
        <p className="mt-1 text-center text-sm text-muted">
          Be first in line for launch — invite friends to move up.
        </p>

        {searchParams.error && (
          <p className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {searchParams.error}
          </p>
        )}

        <form action={joinWaitlist} className="mt-5 space-y-3">
          <input type="hidden" name="ref" value={ref} />
          <input
            type="text"
            name="name"
            placeholder="Name (optional)"
            className="w-full rounded-lg border border-line bg-surface px-4 py-3 outline-none focus:border-forge"
          />
          <input
            type="email"
            name="email"
            required
            placeholder="Email"
            className="w-full rounded-lg border border-line bg-surface px-4 py-3 outline-none focus:border-forge"
          />
          <SubmitButton
            pendingText="Joining…"
            className="w-full rounded-lg bg-forge py-3 font-black text-neutral-950 transition hover:bg-forge-soft"
          >
            Join the Forge waitlist
          </SubmitButton>
        </form>

        {ref && (
          <p className="mt-3 text-center text-xs text-forge">
            🎉 You were invited by a friend!
          </p>
        )}

        <p className="mt-6 text-center text-sm text-muted">
          Already have access?{" "}
          <Link href="/login" className="font-semibold text-forge">
            Log in
          </Link>
        </p>
      </section>
    </main>
  );
}
