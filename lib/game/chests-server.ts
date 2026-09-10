// Server-only: chest inventory + opening. Awarding happens wherever a chest
// is earned (workout logging, level-up milestones); opening is a
// user-triggered action from the /chests page.
import { createClient } from "@/lib/supabase/server";
import { rollChestReward, type ChestTier, type ChestReward } from "./chests";
import { applyXp } from "./xp-server";

const FREEZE_CAP = 2; // keep in sync with app/(app)/workout/actions.ts

// Adds `count` unopened chests of a tier to a user's inventory. A single
// atomic RPC call (see 0025_chest_rpcs.sql) instead of a select-then-update
// — this sits directly in the hot workout-logging path (a Common Chest
// drops every workout), so the extra round trip was worth cutting. Takes
// the caller's already-verified user id — see applyXp for why.
export async function awardChest(userId: string, tier: ChestTier, count = 1): Promise<void> {
  if (count <= 0) return;
  const supabase = createClient();
  await supabase.rpc("award_chest", { p_user_id: userId, p_tier: tier, p_amount: count });
}

export type OpenChestResult =
  | { ok: false; error: string }
  | { ok: true; tier: ChestTier; reward: ChestReward; level: number; leveledUp: boolean };

// Opens one chest of a tier: atomically consumes it from inventory (fails
// cleanly instead of racing — two fast taps can no longer both succeed off
// a stale read), rolls a reward (always positive — see chests.ts), and
// applies it immediately.
export async function openChest(userId: string, tier: ChestTier): Promise<OpenChestResult> {
  const supabase = createClient();

  const [{ data: claimed }, { data: prof }] = await Promise.all([
    supabase.rpc("claim_chest", { p_user_id: userId, p_tier: tier }),
    supabase.from("profiles").select("streak_freezes").eq("id", userId).single(),
  ]);
  if (!claimed) return { ok: false, error: "No chest of that type to open." };

  const reward = rollChestReward(tier);
  const xpResult = await applyXp(userId, reward.xp);

  if (reward.freeze) {
    const freezes = ((prof as any)?.streak_freezes as number) ?? 0;
    const next = Math.min(FREEZE_CAP, freezes + 1);
    if (next !== freezes) {
      await supabase.from("profiles").update({ streak_freezes: next }).eq("id", userId);
    }
  }

  return { ok: true, tier, reward, level: xpResult.level, leveledUp: xpResult.leveledUp };
}
