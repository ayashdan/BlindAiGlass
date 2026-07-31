// Server-only: chest inventory + opening. Awarding happens wherever a chest
// is earned (workout logging, level-up milestones); opening is a
// user-triggered action from the /chests page.
import { createClient } from "@/lib/supabase/server";
import { rollChestReward, type ChestTier, type ChestReward } from "./chests";
import { applyXp } from "./xp-server";

const FREEZE_CAP = 2; // keep in sync with app/(app)/workout/actions.ts

const COLUMN: Record<ChestTier, "chests_common" | "chests_rare" | "chests_legendary"> = {
  common: "chests_common",
  rare: "chests_rare",
  legendary: "chests_legendary",
};

// Adds `count` unopened chests of a tier to a user's inventory. Takes the
// caller's already-verified user id — see applyXp for why.
export async function awardChest(userId: string, tier: ChestTier, count = 1): Promise<void> {
  if (count <= 0) return;
  const supabase = createClient();
  const column = COLUMN[tier];

  const { data: prof } = await supabase.from("profiles").select(column).eq("id", userId).single();
  const current = ((prof as any)?.[column] as number) ?? 0;
  await supabase.from("profiles").update({ [column]: current + count }).eq("id", userId);
}

export type OpenChestResult =
  | { ok: false; error: string }
  | { ok: true; tier: ChestTier; reward: ChestReward; level: number; leveledUp: boolean };

// Opens one chest of a tier: consumes it from inventory, rolls a reward
// (always positive — see chests.ts), and applies it immediately.
export async function openChest(userId: string, tier: ChestTier): Promise<OpenChestResult> {
  const supabase = createClient();
  const column = COLUMN[tier];

  const { data: prof } = await supabase
    .from("profiles")
    .select(`${column}, streak_freezes`)
    .eq("id", userId)
    .single();
  const have = ((prof as any)?.[column] as number) ?? 0;
  if (have <= 0) return { ok: false, error: "No chest of that type to open." };

  await supabase
    .from("profiles")
    .update({ [column]: have - 1 })
    .eq("id", userId);

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
