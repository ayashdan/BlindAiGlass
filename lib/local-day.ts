// Vercel's servers run in UTC, but visitors aren't — anyone west of UTC
// (basically all of the US) is already into "tomorrow" server-side for
// several hours every evening while it's still today where they actually
// are. That's exactly why the weekly schedule was reading the wrong day.
// Vercel's edge network reports each visitor's real timezone on every
// request (x-vercel-ip-timezone); use that instead of trusting the
// server's own clock for "what day is it" decisions.
import { headers } from "next/headers";
import { SUNDAY_FIRST_DAY_KEYS, type WeeklySplitDayKey } from "@/lib/game/quests";

const SHORT_WEEKDAY_TO_KEY: Record<string, WeeklySplitDayKey> = {
  Sun: "sun",
  Mon: "mon",
  Tue: "tue",
  Wed: "wed",
  Thu: "thu",
  Fri: "fri",
  Sat: "sat",
};

export function localDayKey(): WeeklySplitDayKey {
  const tz = headers().get("x-vercel-ip-timezone");
  if (!tz) return SUNDAY_FIRST_DAY_KEYS[new Date().getDay()];

  try {
    const weekday = new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "short" }).format(
      new Date()
    );
    return SHORT_WEEKDAY_TO_KEY[weekday] ?? SUNDAY_FIRST_DAY_KEYS[new Date().getDay()];
  } catch {
    return SUNDAY_FIRST_DAY_KEYS[new Date().getDay()];
  }
}
