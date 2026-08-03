// Pure logic for the Plus insights page — no database. Takes plain workout
// rows (already fetched) and derives the trend/balance/recap views.
import { MUSCLE_GROUPS } from "./muscle-groups";

export type WorkoutRow = {
  muscle_groups: string[] | null;
  duration_minutes: number;
  xp_earned: number;
  created_at: string;
};

// Workout counts bucketed into `weeks` 7-day windows ending today, oldest
// first — the shape TickerChart expects.
export function weeklyWorkoutBuckets(
  rows: WorkoutRow[],
  weeks: number,
  now: Date = new Date()
): { counts: number[]; labels: string[] } {
  const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const counts = new Array(weeks).fill(0);
  for (const r of rows) {
    const d = new Date(r.created_at);
    const dayUtc = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
    const daysAgo = Math.round((todayUtc - dayUtc) / 86400000);
    const weekIdx = weeks - 1 - Math.floor(daysAgo / 7);
    if (weekIdx >= 0 && weekIdx < weeks) counts[weekIdx]++;
  }
  const labels = Array.from({ length: weeks }, (_, i) => {
    const weeksAgo = weeks - 1 - i;
    const start = new Date(todayUtc - (weeksAgo * 7 + 6) * 86400000);
    return start.toLocaleDateString(undefined, { month: "short", day: "numeric", timeZone: "UTC" });
  });
  return { counts, labels };
}

// How much of the recent training window went to each muscle group,
// sorted by volume descending. A categorical breakdown, not a trend — bars,
// not a line.
export function muscleGroupBalance(rows: WorkoutRow[]): { key: string; label: string; count: number }[] {
  const counts: Record<string, number> = {};
  for (const r of rows) {
    for (const g of r.muscle_groups ?? []) counts[g] = (counts[g] ?? 0) + 1;
  }
  return MUSCLE_GROUPS.map((g) => ({ key: g.key, label: g.label, count: counts[g.key] ?? 0 }))
    .filter((g) => g.count > 0)
    .sort((a, b) => b.count - a.count);
}

// Days since a muscle group was last trained, for every group that's ever
// been trained at all (so a group you've simply never touched doesn't show
// up as a false "you're neglecting X").
export function daysSinceTrained(
  rows: WorkoutRow[],
  now: Date = new Date()
): { key: string; label: string; days: number }[] {
  const last: Record<string, number> = {};
  for (const r of rows) {
    const t = new Date(r.created_at).getTime();
    for (const g of r.muscle_groups ?? []) {
      if (!last[g] || t > last[g]) last[g] = t;
    }
  }
  return Object.entries(last)
    .map(([key, t]) => ({
      key,
      label: MUSCLE_GROUPS.find((g) => g.key === key)?.label ?? key,
      days: Math.floor((now.getTime() - t) / 86400000),
    }))
    .sort((a, b) => b.days - a.days);
}

export type WeeklyRecap = {
  workouts: number;
  xp: number;
  totalMinutes: number;
  bestDayLabel: string | null;
};

// Last 7 days, for the recap card.
export function weeklyRecap(rows: WorkoutRow[], now: Date = new Date()): WeeklyRecap {
  const since = now.getTime() - 7 * 86400000;
  const recent = rows.filter((r) => new Date(r.created_at).getTime() >= since);

  const byDay: Record<string, number> = {};
  for (const r of recent) {
    const key = new Date(r.created_at).toISOString().slice(0, 10);
    byDay[key] = (byDay[key] ?? 0) + 1;
  }
  const bestDay = Object.entries(byDay).sort((a, b) => b[1] - a[1])[0];
  const bestDayLabel = bestDay
    ? new Date(bestDay[0] + "T00:00:00Z").toLocaleDateString(undefined, {
        weekday: "long",
        timeZone: "UTC",
      })
    : null;

  return {
    workouts: recent.length,
    xp: recent.reduce((s, r) => s + (r.xp_earned ?? 0), 0),
    totalMinutes: recent.reduce((s, r) => s + (r.duration_minutes ?? 0), 0),
    bestDayLabel,
  };
}
