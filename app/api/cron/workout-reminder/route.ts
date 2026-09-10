import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPushToUser } from "@/lib/push-server";
import { dateStrInTimezone } from "@/lib/local-day";
import { dailyMotivation } from "@/lib/game/motivation";

// Runs once per UTC hour (24 entries in vercel.json — Vercel's Hobby plan
// caps any single cron entry to firing once a day, so "check every hour"
// means 24 separate once-a-day entries, not one hourly expression). Each
// run checks every user's OWN current local hour and only messages the
// ones where it's actually 3pm or 5pm for them right now — not the
// server's clock, which means nothing across timezones.
const TARGET_LOCAL_HOURS = [15, 17]; // 3pm and 5pm, each user's own local time

function localHourInTimezone(tz: string | null): number | null {
  if (!tz) return null;
  try {
    const formatted = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hour: "numeric",
      hour12: false,
    }).format(new Date());
    return parseInt(formatted, 10);
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const admin = createAdminClient();
  const { data: candidates } = await admin
    .from("profiles")
    .select("id, current_streak, last_workout_date, timezone");

  let sent = 0;
  for (const p of candidates ?? []) {
    const hour = localHourInTimezone(p.timezone as string | null);
    if (hour === null || !TARGET_LOCAL_HOURS.includes(hour)) continue;

    const theirToday = dateStrInTimezone(p.timezone as string | null);
    if (p.last_workout_date === theirToday) continue; // already worked out today

    const isEvening = hour === 17;
    const streak = (p.current_streak as number) ?? 0;

    // Same seed the dashboard uses (lib/game/motivation.ts) — whoever gets
    // this notification sees the identical quote if they then open the app,
    // not a second unrelated pick.
    const quote = dailyMotivation(`${p.id}:${theirToday}`);
    const nudge =
      streak > 0
        ? `Your ${streak}-day streak is still open today — log a workout before midnight.`
        : isEvening
          ? "It's getting late — squeeze in a workout before the day's over."
          : "There's still time today — get up and get moving!";

    await sendPushToUser(p.id, {
      title: isEvening ? "Still haven't worked out today 💪" : "Haven't hit the gym yet?",
      body: `${nudge} "${quote}"`,
      url: "/workout",
    });
    sent++;
  }

  return NextResponse.json({ ok: true, sent });
}
