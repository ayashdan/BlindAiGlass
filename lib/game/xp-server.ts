// Server-only XP engine. This is the "referee": whenever a user should earn
// XP (a workout, a quest, an achievement), server code calls applyXp(). It
// recalculates the level and rank from the new total and saves them.
// Running here (not in the browser) is what stops users from faking XP.
import { createClient } from "@/lib/supabase/server";
import { levelFromXp, rankForLevel } from "./leveling";
import { currentWeekStart } from "./weekly";

export type XpResult = {
  ok: boolean;
  awarded: number;
  totalXp: number;
  level: number;
  rank: string;
  leveledUp: boolean;
  fromLevel: number;
  rankChanged: boolean;
  weeklyXp: number; // this week's XP so far, after this grant
};

const FAIL: XpResult = {
  ok: false,
  awarded: 0,
  totalXp: 0,
  level: 1,
  rank: "Beginner",
  leveledUp: false,
  fromLevel: 1,
  rankChanged: false,
  weeklyXp: 0,
};

// Takes the caller's already-verified user id rather than re-checking
// auth.getUser() itself — a single workout log can award XP several times
// over (base, streak, quests, achievements, PRs, season tiers), and each of
// those used to be its own separate network round trip to re-verify the
// exact same identity the caller already confirmed once.
export async function applyXp(userId: string, amount: number): Promise<XpResult> {
  const supabase = createClient();

  // Read the current totals.
  const { data: profile, error: readErr } = await supabase
    .from("profiles")
    .select("xp, level, rank, weekly_xp, weekly_xp_week_start")
    .eq("id", userId)
    .single();
  if (readErr || !profile) return FAIL;

  const fromLevel = profile.level as number;
  const fromRank = profile.rank as string;

  // Recompute everything from the new total XP.
  const totalXp = (profile.xp as number) + amount;
  const level = levelFromXp(totalXp);
  const rank = rankForLevel(level);

  // Lazy weekly reset: if the stored week has rolled over since this
  // profile last earned XP, this grant starts a fresh weekly total instead
  // of adding onto last week's leftover number (see effectiveWeeklyXp).
  const weekStart = currentWeekStart();
  const weeklyBase =
    profile.weekly_xp_week_start === weekStart ? (profile.weekly_xp as number) : 0;
  const weeklyXp = weeklyBase + amount;

  const { error: writeErr } = await supabase
    .from("profiles")
    .update({ xp: totalXp, level, rank, weekly_xp: weeklyXp, weekly_xp_week_start: weekStart })
    .eq("id", userId);
  if (writeErr) return FAIL;

  return {
    ok: true,
    awarded: amount,
    totalXp,
    level,
    rank,
    leveledUp: level > fromLevel,
    fromLevel,
    rankChanged: rank !== fromRank,
    weeklyXp,
  };
}
