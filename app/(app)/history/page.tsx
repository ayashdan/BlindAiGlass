import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MUSCLE_GROUPS } from "@/lib/game/muscle-groups";
import WorkoutHeatmap from "@/components/game/WorkoutHeatmap";

const PAGE_SIZE = 30;
const HEATMAP_WEEKS = 14;

// A read-only list of your past workouts, newest first.
export default async function HistoryPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("workouts")
    .select("id, muscle_groups, custom_name, duration_minutes, difficulty, xp_earned, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE);

  const workouts = (data ?? []) as any[];
  const labelFor = (key: string) => MUSCLE_GROUPS.find((g) => g.key === key)?.label ?? key;

  // Heatmap covers a wider window than the list above, so fetch separately.
  const since = new Date(Date.now() - (HEATMAP_WEEKS * 7 - 1) * 86400000).toISOString();
  const { data: recent } = await supabase
    .from("workouts")
    .select("created_at")
    .eq("user_id", user.id)
    .gte("created_at", since);

  const counts: Record<string, number> = {};
  for (const w of recent ?? []) {
    const key = new Date(w.created_at).toISOString().slice(0, 10);
    counts[key] = (counts[key] ?? 0) + 1;
  }

  return (
    <main className="mx-auto max-w-lg px-6 py-12">
      <Link href="/dashboard" className="text-sm text-muted hover:text-fg">
        ← Back
      </Link>
      <h1 className="mb-1 mt-3 text-2xl font-black tracking-tight">Workout History</h1>
      <p className="mb-6 text-sm text-muted">
        Your last {workouts.length} workout{workouts.length === 1 ? "" : "s"}.
      </p>

      <Link
        href="/insights"
        className="fade-in-up mb-6 flex items-center justify-between rounded-xl border border-sky-500/30 bg-sky-500/5 p-3 transition hover:brightness-110"
      >
        <span className="text-sm font-bold text-sky-300">
          📊 Want trends and muscle-group balance instead of a list? See Insights →
        </span>
      </Link>

      <section className="fade-in-up mb-6 rounded-2xl border border-line bg-surface p-5">
        <p className="mb-3 text-sm font-black uppercase tracking-wide text-muted">
          Last {HEATMAP_WEEKS} weeks
        </p>
        <WorkoutHeatmap counts={counts} weeks={HEATMAP_WEEKS} />
      </section>

      <div className="space-y-3">
        {workouts.map((w, i) => (
          <div
            key={w.id}
            className="fade-in-up rounded-xl border border-line bg-surface p-4"
            style={{ animationDelay: `${Math.min(i, 10) * 0.03}s` }}
          >
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs text-muted">
                {new Date(w.created_at).toLocaleDateString(undefined, {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              </p>
              <span className="text-sm font-semibold text-forge">+{w.xp_earned} XP</span>
            </div>
            {w.custom_name && <p className="mb-1 font-bold">{w.custom_name}</p>}
            {(w.muscle_groups?.length ?? 0) > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {w.muscle_groups.map((g: string) => (
                  <span
                    key={g}
                    className="rounded-full bg-surface2 px-2 py-0.5 text-xs text-fg"
                  >
                    {labelFor(g)}
                  </span>
                ))}
              </div>
            )}
            <p className="mt-2 text-xs text-muted">
              {w.duration_minutes} min · {w.difficulty}
            </p>
          </div>
        ))}

        {workouts.length === 0 && (
          <p className="text-muted">No workouts logged yet — go log your first one!</p>
        )}
      </div>
    </main>
  );
}
