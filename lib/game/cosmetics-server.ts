// Server-only: the single source of truth for "what cosmetics can this user
// equip right now." Shared by the profile page (to render the choices) and
// its equipCosmetic action (to validate a submission) so the two can never
// drift out of sync — a real risk if unlock logic were duplicated, since a
// gap between "what's shown" and "what's accepted" is exactly how a client
// could equip something it never earned.
import { createClient } from "@/lib/supabase/server";
import { ACHIEVEMENT_COSMETICS, RECRUITER_TITLE } from "./cosmetics";
import { PLUS_BORDERS, PLUS_TITLES } from "./shop";
import { SEASON_PLUS_REWARDS } from "./season";

export type CosmeticOption = { key: string; label: string; vault?: boolean };

export type UnlockedCosmetics = {
  borders: CosmeticOption[];
  titles: CosmeticOption[];
  isPremium: boolean;
};

export async function getUnlockedCosmetics(userId: string): Promise<UnlockedCosmetics> {
  const supabase = createClient();

  const [{ data: prof }, { data: catalog }, { data: mine }, { data: plusSeasonRows }] =
    await Promise.all([
      supabase.from("profiles").select("tier, recruit_count").eq("id", userId).single(),
      supabase.from("achievements").select("id, key"),
      supabase.from("user_achievements").select("achievement_id"),
      supabase
        .from("season_pass_progress")
        .select("season_number, tier")
        .eq("user_id", userId)
        .eq("track", "plus"),
    ]);

  const isPremium = prof?.tier === "premium";
  const have = new Set((mine ?? []).map((r: any) => r.achievement_id));
  const unlockedAchievementKeys = new Set(
    (catalog ?? []).filter((a: any) => have.has(a.id)).map((a: any) => a.key as string)
  );

  const borders = new Map<string, CosmeticOption>();
  const titles = new Map<string, CosmeticOption>();

  for (const key of unlockedAchievementKeys) {
    const c = ACHIEVEMENT_COSMETICS[key];
    if (c?.border) borders.set(c.border, { key: c.border, label: "Earned" });
    if (c?.title) titles.set(c.title, { key: c.title, label: "Earned" });
  }
  if ((prof?.recruit_count ?? 0) > 0) {
    titles.set(RECRUITER_TITLE, { key: RECRUITER_TITLE, label: "Earned" });
  }

  // Vault: while subscribed, not a permanent unlock — same as any
  // subscription perk, it's active while the subscription is.
  if (isPremium) {
    for (const b of PLUS_BORDERS) borders.set(b.previewClass, { key: b.previewClass, label: b.name, vault: true });
    for (const t of PLUS_TITLES) titles.set(t.name, { key: t.name, label: t.name, vault: true });
  }

  // Season-Plus rewards are a trophy, not a rental: once claimed (which
  // requires having been premium at the time — see the RLS policy on
  // season_pass_progress), they stay equippable even if the subscription
  // later lapses, same as an achievement.
  for (const r of (plusSeasonRows ?? []) as { season_number: number; tier: number }[]) {
    const reward = SEASON_PLUS_REWARDS[r.tier];
    if (reward?.border) {
      borders.set(reward.border, {
        key: reward.border,
        label: `Season ${r.season_number}`,
        vault: true,
      });
    }
    if (reward?.titleSuffix) {
      const title = `S${r.season_number} ${reward.titleSuffix}`;
      titles.set(title, { key: title, label: title, vault: true });
    }
  }

  return { borders: Array.from(borders.values()), titles: Array.from(titles.values()), isPremium };
}
