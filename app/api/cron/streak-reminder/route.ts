import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPushToUser } from "@/lib/push-server";
import { dateStrInTimezone, addDaysToDateStr } from "@/lib/local-day";

// Runs twice daily (see vercel.json). Notifies anyone with an active streak
// who hasn't logged a workout yet today, and anyone tracking steps who's
// logged some today but hasn't hit their goal yet — the one thing in Forge
// that reaches people who haven't opened the app.
export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const admin = createAdminClient();

  // ---- Streak nudge ----
  // Pull every active streak up front — "today" gets checked per person
  // below, using their own timezone, since this cron fires at one fixed UTC
  // time for everyone and can't assume the server's date is their date.
  const { data: candidates } = await admin
    .from("profiles")
    .select("id, username, current_streak, last_workout_date, timezone")
    .gt("current_streak", 0);

  let sent = 0;
  for (const p of candidates ?? []) {
    const theirToday = dateStrInTimezone(p.timezone);
    if (p.last_workout_date === theirToday) continue; // already worked out today

    await sendPushToUser(p.id, {
      title: "Don't lose your streak! 🔥",
      body: `Your ${p.current_streak}-day streak is still open today — log a workout before midnight.`,
      url: "/workout",
    });
    sent++;
  }

  // ---- Step goal nudge ----
  // Only for people who've actually logged steps today — someone who's
  // never touched the feature still has a default goal sitting on their
  // profile, and nagging them about it would be noise, not a nudge. A
  // window of yesterday..tomorrow (server UTC) safely covers "today" in
  // every timezone in one query instead of one row-lookup per candidate.
  const serverToday = new Date().toISOString().slice(0, 10);
  const { data: recentLogs } = await admin
    .from("step_logs")
    .select("user_id, log_date, steps, goal, goal_met")
    .gte("log_date", addDaysToDateStr(serverToday, -1))
    .lte("log_date", addDaysToDateStr(serverToday, 1))
    .eq("goal_met", false);

  if (recentLogs && recentLogs.length > 0) {
    const userIds = Array.from(new Set(recentLogs.map((l) => l.user_id)));
    const { data: stepProfiles } = await admin.from("profiles").select("id, timezone").in("id", userIds);
    const tzById = new Map((stepProfiles ?? []).map((p) => [p.id, p.timezone]));

    for (const log of recentLogs) {
      const theirToday = dateStrInTimezone(tzById.get(log.user_id) ?? null);
      if (log.log_date !== theirToday) continue; // this row isn't "today" for this person

      const remaining = Math.max(0, log.goal - log.steps);
      if (remaining <= 0) continue;

      await sendPushToUser(log.user_id, {
        title: `🚶 ${remaining.toLocaleString()} steps to go!`,
        body: `You're ${remaining.toLocaleString()} steps from today's goal — let's get up and get moving!`,
        url: "/dashboard",
      });
      sent++;
    }
  }

  return NextResponse.json({ ok: true, sent });
}
