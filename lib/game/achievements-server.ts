// Server-only: checks which achievements a user has newly earned, records them,
// and reports them (plus the total bonus XP) back to the caller.
import { createClient } from "@/lib/supabase/server";
import { ACHIEVEMENT_CONDITIONS, type AchievementStats } from "./achievements";
import type { UnlockedAchievement } from "@/lib/types";

// Takes the caller's already-verified user id — see applyXp for why.
export async function checkAndAwardAchievements(
  userId: string,
  stats: AchievementStats
): Promise<{ unlocked: UnlockedAchievement[]; xpAwarded: number }> {
  const supabase = createClient();

  // The catalog of all achievements, and which ones this user already has —
  // independent queries, run together instead of one at a time.
  const [{ data: catalog }, { data: mine }] = await Promise.all([
    supabase.from("achievements").select("id, key, name, icon, xp_reward"),
    supabase.from("user_achievements").select("achievement_id"),
  ]);

  const have = new Set((mine ?? []).map((r: any) => r.achievement_id));
  const byKey = new Map((catalog ?? []).map((a: any) => [a.key as string, a]));

  const unlocked: UnlockedAchievement[] = [];
  for (const cond of ACHIEVEMENT_CONDITIONS) {
    const cat: any = byKey.get(cond.key);
    if (!cat || have.has(cat.id)) continue; // unknown or already earned
    if (cond.check(stats)) {
      const { error } = await supabase
        .from("user_achievements")
        .insert({ user_id: userId, achievement_id: cat.id });
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
