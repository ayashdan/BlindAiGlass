// Server-only: season tier tracking. Reads season config from the public
// app_settings table (already used for the launch flag), tracks which
// workout-count tiers a user has claimed this season, and reports display
// status for the dashboard.
import { createClient } from "@/lib/supabase/server";
import { SEASON_TIERS } from "./season";
import type { SeasonTierReached } from "@/lib/types";

async function getSeasonConfig(supabase: ReturnType<typeof createClient>) {
  const { data } = await supabase
    .from("app_settings")
    .select("key, value")
    .in("key", ["season_number", "season_started_at"]);
  const map = new Map((data ?? []).map((r: any) => [r.key as string, r.value as string]));
  const seasonNumber = parseInt(map.get("season_number") ?? "1", 10) || 1;
  const seasonStartedAt = map.get("season_started_at") ?? new Date(0).toISOString();
  return { seasonNumber, seasonStartedAt };
}

// Call after logging a workout: checks whether this workout crossed any
// new season tier, records it (so it's never double-paid), and reports the
// bonus XP to award. Takes the caller's already-verified user id — see
// applyXp for why.
export async function checkAndAwardSeasonTiers(userId: string): Promise<{
  reached: SeasonTierReached[];
  xpAwarded: number;
}> {
  const supabase = createClient();

  const { seasonNumber, seasonStartedAt } = await getSeasonConfig(supabase);

  const [workoutsRes, claimedRes] = await Promise.all([
    supabase
      .from("workouts")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", seasonStartedAt),
    supabase
      .from("season_pass_progress")
      .select("tier")
      .eq("user_id", userId)
      .eq("season_number", seasonNumber),
  ]);
  const workoutsThisSeason = workoutsRes.count ?? 0;
  const claimedTiers = new Set((claimedRes.data ?? []).map((r: any) => r.tier as number));

  const reached: SeasonTierReached[] = [];
  for (const t of SEASON_TIERS) {
    if (claimedTiers.has(t.tier) || workoutsThisSeason < t.workouts) continue;
    const { error } = await supabase
      .from("season_pass_progress")
      .insert({ user_id: userId, season_number: seasonNumber, tier: t.tier });
    if (!error) reached.push({ tier: t.tier, xpReward: t.xpReward });
  }

  return { reached, xpAwarded: reached.reduce((s, r) => s + r.xpReward, 0) };
}

export type SeasonStatus = {
  seasonNumber: number;
  daysLeft: number;
  workoutsThisSeason: number;
  tiers: { tier: number; workouts: number; xpReward: number; done: boolean }[];
};

// Display-only status for the dashboard. Takes the caller's already-verified
// user id — see applyXp for why.
export async function getSeasonStatus(userId: string): Promise<SeasonStatus | null> {
  const supabase = createClient();

  const { seasonNumber, seasonStartedAt } = await getSeasonConfig(supabase);

  // Independent of each other once we know the season — run together.
  const [workoutsRes, claimedRes] = await Promise.all([
    supabase
      .from("workouts")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", seasonStartedAt),
    supabase
      .from("season_pass_progress")
      .select("tier")
      .eq("user_id", userId)
      .eq("season_number", seasonNumber),
  ]);
  const workoutsThisSeason = workoutsRes.count ?? 0;
  const claimedTiers = new Set((claimedRes.data ?? []).map((r: any) => r.tier as number));

  const startedMs = new Date(seasonStartedAt).getTime();
  const daysElapsed = Math.floor((Date.now() - startedMs) / 86400000);
  const daysLeft = Math.max(0, 28 - daysElapsed);

  return {
    seasonNumber,
    daysLeft,
    workoutsThisSeason,
    tiers: SEASON_TIERS.map((t) => ({
      tier: t.tier,
      workouts: t.workouts,
      xpReward: t.xpReward,
      done: claimedTiers.has(t.tier) || workoutsThisSeason >= t.workouts,
    })),
  };
}
