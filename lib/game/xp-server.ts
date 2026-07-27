// Server-only XP engine. This is the "referee": whenever a user should earn
// XP (a workout, a quest, an achievement), server code calls applyXp(). It
// recalculates the level and rank from the new total and saves them.
// Running here (not in the browser) is what stops users from faking XP.
import { createClient } from "@/lib/supabase/server";
import { levelFromXp, rankForLevel } from "./leveling";

export type XpResult = {
  ok: boolean;
  awarded: number;
  totalXp: number;
  level: number;
  rank: string;
  leveledUp: boolean;
  fromLevel: number;
  rankChanged: boolean;
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
};

export async function applyXp(amount: number): Promise<XpResult> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return FAIL;

  // Read the current totals.
  const { data: profile, error: readErr } = await supabase
    .from("profiles")
    .select("xp, level, rank")
    .eq("id", user.id)
    .single();
  if (readErr || !profile) return FAIL;

  const fromLevel = profile.level as number;
  const fromRank = profile.rank as string;

  // Recompute everything from the new total XP.
  const totalXp = (profile.xp as number) + amount;
  const level = levelFromXp(totalXp);
  const rank = rankForLevel(level);

  const { error: writeErr } = await supabase
    .from("profiles")
    .update({ xp: totalXp, level, rank })
    .eq("id", user.id);
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
  };
}
