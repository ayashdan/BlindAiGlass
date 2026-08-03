import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPushToUser } from "@/lib/push-server";
import { currentWeekStart } from "@/lib/game/league";

// Runs Monday 00:05 UTC (see vercel.json), just after the league week flips.
// Records everyone's finished week in league_weeks, crowns each friend
// cluster's winner, zeroes the live scores, and cleans up old feed events.
// The weekly_xp reset is also handled lazily by effectiveWeeklyXp(), so a
// missed cron run never shows wrong scores — it only delays the history row
// and the crown push.
export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const admin = createAdminClient();
  const thisWeek = currentWeekStart();

  // Everyone who scored in a week that has now ended.
  const { data: staleData } = await admin
    .from("profiles")
    .select("id, username, weekly_xp, week_start")
    .gt("weekly_xp", 0)
    .not("week_start", "is", null)
    .neq("week_start", thisWeek);
  const stale = (staleData ?? []) as {
    id: string;
    username: string;
    weekly_xp: number;
    week_start: string;
  }[];

  if (stale.length === 0) {
    // Still prune old feed events even on a quiet week.
    await pruneOldEvents(admin);
    return NextResponse.json({ ok: true, recorded: 0, winners: 0 });
  }

  const points = new Map(stale.map((p) => [p.id, p.weekly_xp]));

  // Winner = topped their own friends list (needs at least one friend).
  // Friends who didn't score at all count as 0.
  const { data: frData } = await admin
    .from("friendships")
    .select("user_id, friend_id")
    .eq("status", "accepted");
  const friendsOf = new Map<string, string[]>();
  for (const r of (frData ?? []) as { user_id: string; friend_id: string }[]) {
    friendsOf.set(r.user_id, [...(friendsOf.get(r.user_id) ?? []), r.friend_id]);
    friendsOf.set(r.friend_id, [...(friendsOf.get(r.friend_id) ?? []), r.user_id]);
  }

  let winners = 0;
  for (const p of stale) {
    const friends = friendsOf.get(p.id) ?? [];
    const won =
      friends.length > 0 && friends.every((f) => (points.get(f) ?? 0) < p.weekly_xp);

    await admin
      .from("league_weeks")
      .upsert(
        { user_id: p.id, week_start: p.week_start, points: p.weekly_xp, won },
        { onConflict: "user_id,week_start" }
      );

    if (won) {
      winners++;
      await sendPushToUser(p.id, {
        title: "👑 You won your league!",
        body: `${p.weekly_xp} XP topped your friends last week. New week starts now — everyone's back to 0.`,
        url: "/friends",
      });
    } else if (friends.length > 0) {
      await sendPushToUser(p.id, {
        title: "🔄 New league week",
        body: "Everyone's back to 0. First workout of the week takes the lead.",
        url: "/friends",
      });
    }
  }

  // Zero the recorded scores (week_start stays — effectiveWeeklyXp treats a
  // stale week as 0 either way).
  await admin
    .from("profiles")
    .update({ weekly_xp: 0 })
    .in(
      "id",
      stale.map((p) => p.id)
    );

  await pruneOldEvents(admin);

  return NextResponse.json({ ok: true, recorded: stale.length, winners });
}

// The hype feed only ever shows recent activity — drop events older than two
// weeks so the table doesn't grow forever on the free tier.
async function pruneOldEvents(admin: ReturnType<typeof createAdminClient>) {
  const cutoff = new Date(Date.now() - 14 * 86400000).toISOString();
  await admin.from("friend_events").delete().lt("created_at", cutoff);
}
