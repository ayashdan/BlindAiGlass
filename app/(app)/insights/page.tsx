import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import TickerChart from "@/components/TickerChart";
import {
  weeklyWorkoutBuckets,
  muscleGroupBalance,
  daysSinceTrained,
  weeklyRecap,
  type WorkoutRow,
} from "@/lib/game/insights";
import { PLUS_FEATURES } from "@/lib/game/shop";
import { MUSCLE_GROUPS } from "@/lib/game/muscle-groups";
import type { Profile } from "@/lib/types";

function recordLabel(category: string): string {
  if (category === "overall") return "Longest workout";
  return MUSCLE_GROUPS.find((g) => g.key === category)?.label ?? category;
}

const WINDOW_DAYS = 120;
const TREND_WEEKS = 12;
const STALE_THRESHOLD_DAYS = 9; // flag a group you train regularly if it's gone quiet

// Coaching/insights: a Plus feature. Free logging, streaks, quests, and
// competition stay untouched — this is pure personal analysis (trend,
// balance, recap, PR board), never anything that affects rank or XP, so
// gating it behind Plus doesn't touch the "core logging stays free" rule.
export default async function InsightsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase.from("profiles").select("tier").eq("id", user.id).single();
  const profile = data as Pick<Profile, "tier"> | null;
  const isPremium = profile?.tier === "premium";

  if (!isPremium) {
    return (
      <main className="mx-auto max-w-lg px-6 py-12">
        <Link href="/dashboard" className="text-sm text-muted hover:text-fg">
          ← Back
        </Link>
        <h1 className="mb-1 mt-3 text-2xl font-black tracking-tight">📊 Insights</h1>
        <p className="mb-6 text-sm text-muted">A Plus feature — here's what's inside.</p>

        <div className="forge-panel forge-accent-sky p-6 text-center">
          <p className="text-3xl">🔒</p>
          <p className="mt-2 font-display text-lg font-bold">Locked</p>
          <p className="mx-auto mt-1 max-w-xs text-sm text-muted">
            Muscle-group balance, a 12-week trend, a weekly recap, and your full
            personal-record board — all pure analysis, nothing that touches XP or rank.
          </p>
          <Link
            href="/shop"
            className="press mt-4 inline-block rounded-lg bg-forge px-4 py-2 text-sm font-bold text-neutral-950 transition hover:bg-forge-soft"
          >
            See Forge Plus →
          </Link>
        </div>

        <ul className="mt-6 space-y-2">
          {PLUS_FEATURES.map((f) => (
            <li key={f} className="flex gap-2 text-sm text-muted">
              <span className="text-amber-400">✦</span>
              <span>{f}</span>
            </li>
          ))}
        </ul>
      </main>
    );
  }

  const since = new Date(Date.now() - WINDOW_DAYS * 86400000).toISOString();
  const [{ data: workoutsData }, { data: recordsData }] = await Promise.all([
    supabase
      .from("workouts")
      .select("muscle_groups, duration_minutes, xp_earned, created_at")
      .eq("user_id", user.id)
      .gte("created_at", since),
    supabase
      .from("personal_records")
      .select("category, best_minutes, achieved_at")
      .eq("user_id", user.id)
      .order("achieved_at", { ascending: false }),
  ]);
  const workouts = (workoutsData ?? []) as WorkoutRow[];
  const records = (recordsData ?? []) as { category: string; best_minutes: number; achieved_at: string }[];

  const trend = weeklyWorkoutBuckets(workouts, TREND_WEEKS);
  const balance = muscleGroupBalance(workouts);
  const stale = daysSinceTrained(workouts).filter((g) => g.days >= STALE_THRESHOLD_DAYS);
  const recap = weeklyRecap(workouts);
  const maxBalance = Math.max(1, ...balance.map((b) => b.count));

  return (
    <main className="mx-auto max-w-lg px-6 py-12">
      <Link href="/dashboard" className="text-sm text-muted hover:text-fg">
        ← Back
      </Link>
      <h1 className="mb-1 mt-3 text-2xl font-black tracking-tight">📊 Insights</h1>
      <p className="mb-6 text-sm text-muted">
        ⭐ Plus · your own training, not the leaderboard.
      </p>

      {/* Weekly recap */}
      <section className="forge-panel forge-panel-hot mb-6 p-5">
        <p className="mb-3 text-sm font-black uppercase tracking-wide text-amber-300">
          This week
        </p>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="font-display text-2xl font-black">{recap.workouts}</p>
            <p className="text-xs text-muted">workouts</p>
          </div>
          <div>
            <p className="font-display text-2xl font-black">{recap.xp.toLocaleString()}</p>
            <p className="text-xs text-muted">XP earned</p>
          </div>
          <div>
            <p className="font-display text-2xl font-black">{recap.totalMinutes}</p>
            <p className="text-xs text-muted">minutes</p>
          </div>
        </div>
        {recap.bestDayLabel && (
          <p className="mt-3 text-center text-xs text-muted">
            Best day: <span className="font-semibold text-fg">{recap.bestDayLabel}</span>
          </p>
        )}
      </section>

      {/* Trend */}
      <section className="mb-6">
        <h2 className="mb-3 text-sm font-black uppercase tracking-wide text-muted">
          Workouts per week — last {TREND_WEEKS} weeks
        </h2>
        <TickerChart values={trend.counts} labels={trend.labels} color="#38bdf8" />
      </section>

      {/* Balance callouts */}
      {stale.length > 0 && (
        <section className="mb-6 space-y-2">
          <h2 className="text-sm font-black uppercase tracking-wide text-muted">Going quiet</h2>
          {stale.slice(0, 3).map((g) => (
            <p
              key={g.key}
              className="rounded-lg border border-rose-500/30 bg-rose-500/5 px-3 py-2 text-sm text-rose-300"
            >
              You haven't trained <span className="font-bold">{g.label}</span> in {g.days} days.
            </p>
          ))}
        </section>
      )}

      {/* Muscle-group balance — a categorical breakdown, so bars, not a line */}
      <section className="mb-6 rounded-xl border border-line bg-surface p-4">
        <h2 className="mb-3 text-sm font-black uppercase tracking-wide text-muted">
          Muscle-group balance — last {WINDOW_DAYS} days
        </h2>
        {balance.length > 0 ? (
          <div className="space-y-2">
            {balance.map((b) => (
              <div key={b.key}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-semibold">{b.label}</span>
                  <span className="text-muted">{b.count}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-surface2">
                  <div
                    className="h-full rounded-full bg-sky-500 transition-all duration-700 ease-out"
                    style={{ width: `${Math.round((b.count / maxBalance) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted">Log a few workouts to see your balance here.</p>
        )}
      </section>

      {/* PR board */}
      <section className="rounded-xl border border-line bg-surface p-4">
        <h2 className="mb-3 text-sm font-black uppercase tracking-wide text-muted">
          🏆 Personal records
        </h2>
        {records.length > 0 ? (
          <div className="space-y-2">
            {records.map((r) => (
              <div key={r.category} className="flex items-center justify-between text-sm">
                <span className="font-semibold">{recordLabel(r.category)}</span>
                <span className="text-muted">
                  {r.best_minutes} min ·{" "}
                  {new Date(r.achieved_at).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted">No records yet — your first workout in each category sets one.</p>
        )}
      </section>
    </main>
  );
}
