// Server-only: checks which achievements a user has newly earned, records them,
// and reports them (plus the total bonus XP) back to the caller.
import { createClient } from "@/lib/supabase/server";
import { ACHIEVEMENT_CONDITIONS, type AchievementStats } from "./achievements";
import type { UnlockedAchievement } from "@/lib/types";

export async function checkAndAwardAchievements(
  stats: AchievementStats
): Promise<{ unlocked: UnlockedAchievement[]; xpAwarded: number }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { unlocked: [], xpAwarded: 0 };

  // The catalog of all achievements, and which ones this user already has.
  const { data: catalog } = await supabase
    .from("achievements")
    .select("id, key, name, icon, xp_reward");
  const { data: mine } = await supabase
    .from("user_achievements")
    .select("achievement_id");

  const have = new Set((mine ?? []).map((r: any) => r.achievement_id));
  const byKey = new Map((catalog ?? []).map((a: any) => [a.key as string, a]));

  const unlocked: UnlockedAchievement[] = [];
  for (const cond of ACHIEVEMENT_CONDITIONS) {
    const cat: any = byKey.get(cond.key);
    if (!cat || have.has(cat.id)) continue; // unknown or already earned
    if (cond.check(stats)) {
      const { error } = await supabase
        .from("user_achievements")
        .insert({ user_id: user.id, achievement_id: cat.id });
      if (!error) {
        unlocked.push({
          key: cat.key,
          name: cat.name,
          icon: cat.icon,
          xpReward: cat.xp_reward ?? 0,
        });
      }
    }
  }

  const xpAwarded = unlocked.reduce((sum, a) => sum + a.xpReward, 0);
  return { unlocked, xpAwarded };
}
