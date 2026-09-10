import { createAdminClient } from "@/lib/supabase/admin";

// Top-line analytics: total users, how many worked out today, total workouts
// logged app-wide, average streak, a rough 7-day retention number, and
// waitlist size. All computed from the raw tables via the service-role
// client since some of this data (like the waitlist) has no public policy.
export default async function AdminOverview() {
  const admin = createAdminClient();

  const [{ data: profiles }, { count: workoutCount }, { count: waitlistCount }] =
    await Promise.all([
      admin.from("profiles").select("current_streak, last_workout_date, created_at"),
      admin.from("workouts").select("*", { count: "exact", head: true }),
      admin.from("waitlist").select("*", { count: "exact", head: true }),
    ]);

  const users = (profiles ?? []) as {
    current_streak: number;
    last_workout_date: string | null;
    created_at: string;
  }[];

  const totalUsers = users.length;
  const today = new Date().toISOString().slice(0, 10);
  const dau = users.filter((u) => u.last_workout_date === today).length;
  const avgStreak = totalUsers
    ? Math.round(
        (users.reduce((sum, u) => sum + (u.current_streak ?? 0), 0) / totalUsers) * 10
      ) / 10
    : 0;

  // Retention: of the users who joined 7+ days ago, what % worked out in the
  // last 7 days?
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const eligible = users.filter((u) => new Date(u.created_at) <= sevenDaysAgo);
  const retained = eligible.filter(
    (u) => u.last_workout_date && new Date(u.last_workout_date) >= sevenDaysAgo
  );
  const retentionPct = eligible.length
    ? Math.round((retained.length / eligible.length) * 100)
    : 0;

  return (
    <div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Stat label="Total users" value={`${totalUsers}`} />
        <Stat label="Active today" value={`${dau}`} />
        <Stat label="Workouts logged" value={`${workoutCount ?? 0}`} />
        <Stat label="Avg streak" value={`${avgStreak}🔥`} />
        <Stat
          label="7-day retention"
          value={`${retentionPct}%`}
          sub={eligible.length ? `of ${eligible.length} eligible` : "not enough data yet"}
        />
        <Stat label="Waitlist size" value={`${waitlistCount ?? 0}`} />
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
