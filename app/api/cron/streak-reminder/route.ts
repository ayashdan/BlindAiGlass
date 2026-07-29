import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPushToUser } from "@/lib/push-server";

// Runs once daily (see vercel.json). Notifies anyone with an active streak
// who hasn't logged a workout yet today — the one thing in Forge that
// reaches people who haven't opened the app.
export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const admin = createAdminClient();
  const todayStr = new Date().toISOString().slice(0, 10);

  const { data: atRisk } = await admin
    .from("profiles")
    .select("id, username, current_streak, last_workout_date")
    .neq("last_workout_date", todayStr)
    .gt("current_streak", 0);

  let sent = 0;
  for (const p of atRisk ?? []) {
    await sendPushToUser(p.id, {
      title: "Don't lose your streak! 🔥",
      body: `Your ${p.current_streak}-day streak is still open today — log a workout before midnight.`,
      url: "/workout",
    });
    sent++;
  }

  return NextResponse.json({ ok: true, sent });
}
