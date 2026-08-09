// Pure calendar logic for the weekly friends leaderboard — no database here,
// same separation as leveling.ts/chests.ts. A leaderboard needs one shared
// clock for everyone being compared, so this deliberately does NOT use each
// visitor's own local timezone the way streaks/quests do (lib/local-day.ts)
// — "who's ahead this week" has to mean the same week for every friend in
// the comparison, not a different Monday depending on where each of them
// lives.

// The current week's start (Monday), as a UTC date string, e.g. "2026-08-03".
export function currentWeekStart(now: Date = new Date()): string {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const day = d.getUTCDay(); // 0 = Sunday, 1 = Monday, ...
  const sinceMonday = (day + 6) % 7; // Mon -> 0, Tue -> 1, ..., Sun -> 6
  d.setUTCDate(d.getUTCDate() - sinceMonday);
  return d.toISOString().slice(0, 10);
}

// A stored weekly_xp value only means something if it was last touched
// during the CURRENT week — otherwise it's last week's leftover number.
// Same lazy-reset pattern already used for streaks/quests: nothing has to
// run on a schedule to zero out every row at once, a value just reads as 0
// once its stored week has rolled over.
export function effectiveWeeklyXp(
  storedXp: number,
  storedWeekStart: string | null,
  weekStart: string = currentWeekStart()
): number {
  return storedWeekStart === weekStart ? storedXp : 0;
}
