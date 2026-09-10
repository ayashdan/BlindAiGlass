// Vercel's servers run in UTC, but visitors aren't — anyone west of UTC
// (basically all of the US) is already into "tomorrow" server-side for
// several hours every evening while it's still today where they actually
// are. Vercel's edge network reports each visitor's real timezone on every
// request (x-vercel-ip-timezone); use that instead of trusting the
// server's own clock for "what day is it" decisions.
import { headers } from "next/headers";
import { type WeeklySplitDayKey } from "@/lib/game/quests";

// The calendar date (YYYY-MM-DD) in an arbitrary IANA timezone — the pure
// version, for contexts with no incoming request to read a header from
// (e.g. the cron job, which uses each user's own *stored* timezone instead).
export function dateStrInTimezone(tz: string | null): string {
  if (!tz) return new Date().toISOString().slice(0, 10);
  try {
    // en-CA formats as YYYY-MM-DD, exactly what we want.
    return new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

// The visitor's real local calendar date (YYYY-MM-DD) — this is the one and
// only source of "today" for anything gameplay-related (daily quests,
// streaks, rest days, the weekly split schedule). Everything else in this
// file derives from this exact string so they can never disagree with each
// other the way quest_date and the schedule lookup used to.
export function localDateStr(): string {
  return dateStrInTimezone(headers().get("x-vercel-ip-timezone"));
}

// Pure calendar-date arithmetic on a YYYY-MM-DD string (e.g. -1 for
// "yesterday"). Anchored to UTC noon, not midnight, so it can't accidentally
// land on the wrong side of a day boundary.
export function addDaysToDateStr(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

const WEEKDAY_FROM_UTC_DAY: WeeklySplitDayKey[] = [
  "sun",
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
];

export function localDayKey(): WeeklySplitDayKey {
  const d = new Date(`${localDateStr()}T12:00:00Z`);
  return WEEKDAY_FROM_UTC_DAY[d.getUTCDay()];
}

// Same as localMidnightUtcIso below, but reads the visitor's timezone from
// the request itself — the convenient version for most call sites.
export function localMidnightUtcIsoForToday(dateStr: string): string {
  return localMidnightUtcIso(dateStr, headers().get("x-vercel-ip-timezone"));
}

// The UTC instant that corresponds to local midnight of `dateStr` in `tz` —
// e.g. for a Pacific Time visitor, "today" doesn't start at 00:00 UTC, it
// starts around 07:00-08:00 UTC (whenever midnight actually is for them).
// Used as the boundary for "which of today's workouts count," so a workout
// logged late in the evening isn't misfiled under the wrong day.
export function localMidnightUtcIso(dateStr: string, tz: string | null): string {
  const naiveUtcGuess = new Date(`${dateStr}T00:00:00.000Z`);
  if (!tz) return naiveUtcGuess.toISOString();

  try {
    const dtf = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
    const parts: Record<string, string> = {};
    for (const p of dtf.formatToParts(naiveUtcGuess)) parts[p.type] = p.value;

    // What the naive UTC guess actually reads as in the visitor's timezone.
    const asUtcMs = Date.UTC(
      Number(parts.year),
      Number(parts.month) - 1,
      Number(parts.day),
      Number(parts.hour) === 24 ? 0 : Number(parts.hour),
      Number(parts.minute),
      Number(parts.second)
    );
    const offsetMs = asUtcMs - naiveUtcGuess.getTime();
    // local = UTC + offset, so UTC(local midnight) = naiveGuess - offset.
    return new Date(naiveUtcGuess.getTime() - offsetMs).toISOString();
  } catch {
    return naiveUtcGuess.toISOString();
  }
}
