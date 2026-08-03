import { createAdminClient } from "@/lib/supabase/admin";
import { rankForLevel, type Rank } from "@/lib/game/leveling";

const RANK_ORDER: Rank[] = ["Beginner", "Bronze", "Silver", "Gold", "Platinum", "Diamond", "Elite"];
const DAYS_BACK = 30;

function dayBuckets(rows: { created_at: string }[], days: number): number[] {
  const counts = new Array(days).fill(0);
  const now = new Date();
  const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  for (const r of rows) {
    const d = new Date(r.created_at);
    const dayUtc = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
    const idx = days - 1 - Math.round((todayUtc - dayUtc) / 86400000);
    if (idx >= 0 && idx < days) counts[idx]++;
  }
  return counts;
}

export default async function AdminAnalytics() {
  const admin = createAdminClient();
  const since = new Date(Date.now() - DAYS_BACK * 86400000).toISOString();

  const [{ data: profiles }, { data: recentWorkouts }, { data: recentWaitlist }, plusInterestRes] =
    await Promise.all([
      admin
        .from("profiles")
        .select(
          "xp, level, current_streak, longest_streak, total_workouts, created_at, chests_common, chests_rare, chests_legendary"
        ),
      admin.from("workouts").select("created_at, difficulty").gte("created_at", since),
      admin.from("waitlist").select("created_at").gte("created_at", since),
      admin.from("plus_interest").select("*", { count: "exact", head: true }),
    ]);
  const plusInterestCount = plusInterestRes.count ?? 0;

  const users = (profiles ?? []) as {
    xp: number;
    level: number;
    current_streak: number;
    longest_streak: number;
    total_workouts: number;
    created_at: string;
    chests_common: number;
    chests_rare: number;
    chests_legendary: number;
  }[];
  const workouts = (recentWorkouts ?? []) as { created_at: string; difficulty: string }[];
  const waitlistSignups = (recentWaitlist ?? []) as { created_at: string }[];

  // ---- Signups + waitlist growth, last 30 days ----
  const signupCounts = dayBuckets(users, DAYS_BACK);
  const waitlistCounts = dayBuckets(waitlistSignups, DAYS_BACK);

  // ---- Workouts logged, last 30 days ----
  const workoutCounts = dayBuckets(workouts, DAYS_BACK);

  // ---- Rank distribution ----
  const rankCounts: Record<Rank, number> = {
    Beginner: 0,
    Bronze: 0,
    Silver: 0,
    Gold: 0,
    Platinum: 0,
    Diamond: 0,
    Elite: 0,
  };
  for (const u of users) rankCounts[rankForLevel(u.level)]++;

  // ---- Difficulty breakdown (last 30 days of workouts) ----
  const difficultyCounts = { easy: 0, medium: 0, hard: 0 } as Record<string, number>;
  for (const w of workouts) difficultyCounts[w.difficulty] = (difficultyCounts[w.difficulty] ?? 0) + 1;
  const totalDifficulty = workouts.length || 1;

  // ---- Chest inventory (unopened, currently held) ----
  const chestTotals = users.reduce(
    (acc, u) => ({
      common: acc.common + (u.chests_common ?? 0),
      rare: acc.rare + (u.chests_rare ?? 0),
      legendary: acc.legendary + (u.chests_legendary ?? 0),
    }),
    { common: 0, rare: 0, legendary: 0 }
  );

  // ---- Engagement ----
  const totalUsers = users.length;
  const neverWorkedOut = users.filter((u) => u.total_workouts === 0).length;
  const avgLongestStreak = totalUsers
    ? Math.round((users.reduce((s, u) => s + (u.longest_streak ?? 0), 0) / totalUsers) * 10) / 10
    : 0;

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-3 text-sm font-black uppercase tracking-wide text-muted">
          Signups — last {DAYS_BACK} days
        </h2>
        <BarChart values={signupCounts} color="bg-forge" />
      </section>

      <section>
        <h2 className="mb-3 text-sm font-black uppercase tracking-wide text-muted">
          Workouts logged — last {DAYS_BACK} days
        </h2>
        <BarChart values={workoutCounts} color="bg-sky-500" />
      </section>

      <section>
        <h2 className="mb-3 text-sm font-black uppercase tracking-wide text-muted">
          Waitlist joins — last {DAYS_BACK} days
        </h2>
        <BarChart values={waitlistCounts} color="bg-fuchsia-500" />
      </section>

      <section>
        <h2 className="mb-3 text-sm font-black uppercase tracking-wide text-muted">
          Rank distribution ({totalUsers} users)
        </h2>
        <div className="space-y-2 rounded-xl border border-line bg-surface p-4">
          {RANK_ORDER.map((rank) => (
            <HBar key={rank} label={rank} value={rankCounts[rank]} max={totalUsers || 1} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-black uppercase tracking-wide text-muted">
          Workout difficulty — last {DAYS_BACK} days
        </h2>
        <div className="space-y-2 rounded-xl border border-line bg-surface p-4">
          <HBar label="🔥 Embers (easy)" value={difficultyCounts.easy ?? 0} max={totalDifficulty} />
          <HBar label="🔥🔥 Flames (medium)" value={difficultyCounts.medium ?? 0} max={totalDifficulty} />
          <HBar label="🔥🔥🔥 Inferno (hard)" value={difficultyCounts.hard ?? 0} max={totalDifficulty} />
        </div>
      </section>

      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Never worked out" value={`${neverWorkedOut}`} sub={`of ${totalUsers} users`} />
        <Stat label="Avg longest streak" value={`${avgLongestStreak}🔥`} />
        <Stat label="Unopened Common" value={`📦 ${chestTotals.common}`} />
        <Stat label="Unopened Rare" value={`💎 ${chestTotals.rare}`} />
      </section>

      <section>
        <h2 className="mb-3 text-sm font-black uppercase tracking-wide text-muted">
          Forge Plus demand
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <Stat
            label="Notify-me signups"
            value={`⭐ ${plusInterestCount}`}
            sub={totalUsers ? `${Math.round((plusInterestCount / totalUsers) * 100)}% of users` : undefined}
          />
          <div className="rounded-xl border border-line bg-surface p-5 text-xs text-muted">
            Users who tapped "Notify me when Plus launches" on /shop — a free
            read on willingness to pay, before wiring any payment processor.
          </div>
        </div>
      </section>
    </div>
  );
}

function BarChart({ values, color }: { values: number[]; color: string }) {
  const max = Math.max(1, ...values);
  return (
    <div className="flex h-24 items-end gap-[2px] rounded-xl border border-line bg-surface p-3">
      {values.map((v, i) => (
        <div
          key={i}
          className={`flex-1 rounded-t ${v > 0 ? color : "bg-surface2"}`}
          style={{ height: `${Math.max(3, Math.round((v / max) * 100))}%` }}
          title={`${v}`}
        />
      ))}
    </div>
  );
}

function HBar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="font-semibold">{label}</span>
        <span className="text-muted">{value}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-surface2">
        <div className="h-full rounded-full bg-forge transition-all duration-700 ease-out" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface p-5">
      <div className="text-2xl font-black">{value}</div>
      <div className="mt-1 text-xs uppercase tracking-wide text-muted">{label}</div>
      {sub && <div className="mt-1 text-xs text-muted">{sub}</div>}
    </div>
  );
}
