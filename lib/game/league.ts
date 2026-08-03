// Weekly friends league — pure logic, no database.
//
// The score is deliberately NOT lifetime XP: friends compete on XP earned
// this week (Monday reset, UTC), so a brand-new user can beat a level-90
// veteran by showing up more — which is exactly what a fitness app should
// reward. Only base workout XP counts, and only the first few workouts per
// day, so the score measures consistency rather than volume (and bounds
// what fabricated workouts can buy).
//
// The score itself lives in `profiles.weekly_xp` + `profiles.week_start`,
// written only inside logWorkout (see app/(app)/workout/actions.ts). The
// reset is lazy: a stale `week_start` means "this row hasn't scored this
// week yet," so every reader must go through effectiveWeeklyXp() rather
// than the raw column.

export const LEAGUE_DAILY_WORKOUT_CAP = 3;

// The Monday 00:00 UTC date string ("YYYY-MM-DD") for the week containing
// `now`. One global boundary — not per-user timezones — so two friends never
// disagree about when the week flipped.
export function currentWeekStart(now: Date = new Date()): string {
  const daysSinceMonday = (now.getUTCDay() + 6) % 7;
  const monday = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - daysSinceMonday)
  );
  return monday.toISOString().slice(0, 10);
}

// The Monday of the week before the current one.
export function previousWeekStart(now: Date = new Date()): string {
  const monday = new Date(currentWeekStart(now) + "T00:00:00Z");
  monday.setUTCDate(monday.getUTCDate() - 7);
  return monday.toISOString().slice(0, 10);
}

// What a profile row's league score actually is right now: the stored value
// if it was earned this week, otherwise 0 (the lazy reset).
export function effectiveWeeklyXp(
  p: { weekly_xp?: number | null; week_start?: string | null },
  now: Date = new Date()
): number {
  return p.week_start === currentWeekStart(now) ? p.weekly_xp ?? 0 : 0;
}

// Days until the next Monday reset (1-7), for the "resets in Nd" chip.
export function daysUntilReset(now: Date = new Date()): number {
  return ((8 - now.getUTCDay()) % 7) || 7;
}
