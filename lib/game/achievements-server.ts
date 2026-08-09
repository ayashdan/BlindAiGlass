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

export type NextAchievementProgress = {
  key: string;
  name: string;
  icon: string;
  remaining: number;
};

// The not-yet-unlocked achievement the user is closest to (by % of its
// threshold reached) — powers the dashboard's "next reward" teaser. Only
// considers achievements with a simple numeric threshold (see
// ACHIEVEMENT_CONDITIONS) since "closest" isn't meaningful for booleans
// like "beat a PR."
export async function getNextAchievementProgress(
  stats: AchievementStats
): Promise<NextAchievementProgress | null> {
  const supabase = createClient();

  const [{ data: catalog }, { data: mine }] = await Promise.all([
    supabase.from("achievements").select("id, key, name, icon"),
    supabase.from("user_achievements").select("achievement_id"),
  ]);

  const have = new Set((mine ?? []).map((r: any) => r.achievement_id));
  const byKey = new Map((catalog ?? []).map((a: any) => [a.key as string, a]));

  let best: NextAchievementProgress | null = null;
  let bestPct = -1;

  for (const cond of ACHIEVEMENT_CONDITIONS) {
    if (!cond.progress) continue;
    const cat: any = byKey.get(cond.key);
    if (!cat || have.has(cat.id)) continue;

    const current = stats[cond.progress.metric] as number;
    const threshold = cond.progress.threshold;
    if (current >= threshold) continue; // already qualifies, not yet recorded

    const pct = current / threshold;
    if (pct > bestPct) {
      bestPct = pct;
      best = { key: cat.key, name: cat.name, icon: cat.icon, remaining: threshold - current };
    }
  }

  return best;
}
