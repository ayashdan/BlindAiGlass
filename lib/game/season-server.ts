// Server-only: season tier tracking. Reads season config from the public
// app_settings table (already used for the launch flag), tracks which
// workout-count tiers a user has claimed this season (on both the free and
// the Plus track), and reports display status for the dashboard.
import { createClient } from "@/lib/supabase/server";
import { SEASON_TIERS, SEASON_LENGTH_DAYS, SEASON_PLUS_REWARDS } from "./season";
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

// Call after logging a workout: checks whether this workout crossed any new
// season tier, records it (so it's never double-paid), and reports the
// bonus XP to award. `isPremium` comes from the profile row the caller
// already fetched — this function trusts it, but RLS is what actually
// enforces it (see 0030_plus_features.sql: a 'plus' track row can only be
// inserted for an actually-premium user). Takes the caller's
// already-verified user id — see applyXp for why.
export async function checkAndAwardSeasonTiers(
  userId: string,
  isPremium: boolean
): Promise<{
  reached: SeasonTierReached[];
  xpAwarded: number;
  plusReached: number[]; // tiers whose Plus cosmetic just unlocked
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
      .select("tier, track")
      .eq("user_id", userId)
      .eq("season_number", seasonNumber),
  ]);
  const workoutsThisSeason = workoutsRes.count ?? 0;
  const claimedRows = (claimedRes.data ?? []) as { tier: number; track: string }[];
  const claimedFree = new Set(claimedRows.filter((r) => r.track !== "plus").map((r) => r.tier));
  const claimedPlus = new Set(claimedRows.filter((r) => r.track === "plus").map((r) => r.tier));

  const reached: SeasonTierReached[] = [];
  const plusReached: number[] = [];
  for (const t of SEASON_TIERS) {
    if (workoutsThisSeason < t.workouts) continue;

    if (!claimedFree.has(t.tier)) {
      const { error } = await supabase
        .from("season_pass_progress")
        .insert({ user_id: userId, season_number: seasonNumber, tier: t.tier, track: "free" });
      if (!error) reached.push({ tier: t.tier, xpReward: t.xpReward });
    }

    if (isPremium && !claimedPlus.has(t.tier)) {
      const { error } = await supabase
        .from("season_pass_progress")
        .insert({ user_id: userId, season_number: seasonNumber, tier: t.tier, track: "plus" });
      if (!error) plusReached.push(t.tier);
    }
  }

  return { reached, xpAwarded: reached.reduce((s, r) => s + r.xpReward, 0), plusReached };
}

export type SeasonStatus = {
  seasonNumber: number;
  daysLeft: number;
  workoutsThisSeason: number;
  isPremium: boolean;
  tiers: {
    tier: number;
    workouts: number;
    xpReward: number;
    done: boolean;
    plusDone: boolean;
    plusReward: { border?: string; titleSuffix?: string } | undefined;
  }[];
};

// Display-only status for the dashboard/world map. Takes the caller's
// already-verified user id and premium flag — see applyXp for why.
export async function getSeasonStatus(userId: string, isPremium: boolean): Promise<SeasonStatus | null> {
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
      .select("tier, track")
      .eq("user_id", userId)
      .eq("season_number", seasonNumber),
  ]);
  const workoutsThisSeason = workoutsRes.count ?? 0;
  const claimedRows = (claimedRes.data ?? []) as { tier: number; track: string }[];
  const claimedFree = new Set(claimedRows.filter((r) => r.track !== "plus").map((r) => r.tier));
  const claimedPlus = new Set(claimedRows.filter((r) => r.track === "plus").map((r) => r.tier));

  const startedMs = new Date(seasonStartedAt).getTime();
  const daysElapsed = Math.floor((Date.now() - startedMs) / 86400000);
  const daysLeft = Math.max(0, SEASON_LENGTH_DAYS - daysElapsed);

  return {
    seasonNumber,
    daysLeft,
    workoutsThisSeason,
    isPremium,
    tiers: SEASON_TIERS.map((t) => ({
      tier: t.tier,
      workouts: t.workouts,
      xpReward: t.xpReward,
      done: claimedFree.has(t.tier) || workoutsThisSeason >= t.workouts,
      plusDone: isPremium && (claimedPlus.has(t.tier) || workoutsThisSeason >= t.workouts),
      plusReward: SEASON_PLUS_REWARDS[t.tier],
    })),
  };
}
