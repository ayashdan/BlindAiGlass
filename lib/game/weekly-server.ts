// Server-only: detects when logging a workout pushes a user's weekly XP
// past a friend's, and pushes that friend a heads-up. Deliberately wired
// only into the workout-logging flow (the app's one big reward moment),
// not into every small XP grant (quests, chest opens) — those still count
// toward weekly_xp (see applyXp in xp-server.ts), they just don't trigger
// this check, so a friend group doesn't get buried in notifications from a
// single session.
import { createClient } from "@/lib/supabase/server";
import { sendPushToUser } from "@/lib/push-server";
import { currentWeekStart, effectiveWeeklyXp } from "./weekly";

export async function checkAndNotifyWeeklyPass(
  userId: string,
  username: string,
  weeklyXpBefore: number,
  weeklyXpAfter: number
): Promise<{ passedFriendIds: string[] }> {
  if (weeklyXpAfter <= weeklyXpBefore) return { passedFriendIds: [] };

  const supabase = createClient();
  const { data: rows } = await supabase
    .from("friendships")
    .select("user_id, friend_id")
    .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
    .eq("status", "accepted");
  const friendIds = (rows ?? []).map((r: any) => (r.user_id === userId ? r.friend_id : r.user_id));
  if (friendIds.length === 0) return { passedFriendIds: [] };

  const { data: friendProfiles } = await supabase
    .from("profiles")
    .select("id, weekly_xp, weekly_xp_week_start")
    .in("id", friendIds);

  const weekStart = currentWeekStart();
  // Friends who were level-with-or-ahead of me before this workout, and are
  // now behind — i.e. I just passed them.
  const passed = (friendProfiles ?? []).filter((f: any) => {
    const theirXp = effectiveWeeklyXp(f.weekly_xp, f.weekly_xp_week_start, weekStart);
    return theirXp >= weeklyXpBefore && theirXp < weeklyXpAfter;
  });

  for (const f of passed) {
    await sendPushToUser(f.id, {
      title: "You've been passed 🏃",
      body: `${username} just passed you on this week's friends leaderboard.`,
      url: "/friends",
    });
  }

  return { passedFriendIds: passed.map((f: any) => f.id as string) };
}
