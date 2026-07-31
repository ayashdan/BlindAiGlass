// Server-only: assigns today's quests the first time they're needed, and
// checks/marks them complete after a workout is logged.
import { createClient } from "@/lib/supabase/server";
import {
  QUEST_TEMPLATES,
  pickDailyQuestKeys,
  buildScheduledQuestKey,
  parseScheduledQuestKey,
  scheduledQuestLabel,
  scheduledQuestCheck,
  SCHEDULED_QUEST_XP,
  type QuestStats,
} from "./quests";

export type DailyQuestView = {
  key: string;
  title: string;
  description: string;
  icon: string;
  xpReward: number;
  completed: boolean;
  kind: "workout" | "manual";
};

export type CompletedQuest = { key: string; title: string; icon: string; xpReward: number };

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

// Makes sure today's quest rows exist for the current user (creating them
// the first time they're needed that day), then returns them for display.
// Takes the caller's already-verified user id — see applyXp for why.
export async function ensureTodayQuests(userId: string): Promise<DailyQuestView[]> {
  const supabase = createClient();

  const date = todayStr();

  const { data: existing } = await supabase
    .from("daily_quests")
    .select("quest_key, completed, xp_reward")
    .eq("user_id", userId)
    .eq("quest_date", date);

  let rows = existing ?? [];
  if (rows.length === 0) {
    const keys = pickDailyQuestKeys(`${userId}:${date}`);
    const inserts = keys
      .map((key) => QUEST_TEMPLATES.find((q) => q.key === key))
      .filter((t): t is NonNullable<typeof t> => Boolean(t))
      .map((t) => ({
        user_id: userId,
        quest_date: date,
        quest_key: t.key,
        xp_reward: t.xpReward,
      }));

    const { data: inserted } = await supabase
      .from("daily_quests")
      .insert(inserts)
      .select("quest_key, completed, xp_reward");
    rows = inserted ?? [];
  }

  return rows
    .map((r: any) => {
      const scheduledGroups = parseScheduledQuestKey(r.quest_key);
      if (scheduledGroups) {
        return {
          key: r.quest_key,
          title: `Train ${scheduledQuestLabel(scheduledGroups)}`,
          description: "From your weekly training schedule.",
          icon: "📅",
          xpReward: r.xp_reward,
          completed: r.completed,
          kind: "workout" as const,
        };
      }
      const tmpl = QUEST_TEMPLATES.find((q) => q.key === r.quest_key);
      if (!tmpl) return null;
      return {
        key: tmpl.key,
        title: tmpl.title,
        description: tmpl.description,
        icon: tmpl.icon,
        xpReward: r.xp_reward,
        completed: r.completed,
        kind: tmpl.kind,
      };
    })
    .filter((v): v is DailyQuestView => v !== null);
}

// Call right after logging a workout. Checks today's not-yet-completed
// quests against today's workout stats, marks newly finished ones, and
// reports the bonus XP to award. Takes the caller's already-verified user
// id — see applyXp for why.
export async function checkAndCompleteQuests(
  userId: string,
  stats: QuestStats
): Promise<{ completed: CompletedQuest[]; xpAwarded: number }> {
  const supabase = createClient();

  const date = todayStr();
  const { data: rows } = await supabase
    .from("daily_quests")
    .select("id, quest_key, completed, xp_reward")
    .eq("user_id", userId)
    .eq("quest_date", date);

  const completed: CompletedQuest[] = [];
  for (const row of rows ?? []) {
    if (row.completed) continue;

    const scheduledGroups = parseScheduledQuestKey(row.quest_key);
    if (scheduledGroups) {
      if (!scheduledQuestCheck(scheduledGroups)(stats)) continue;
      const { error } = await supabase
        .from("daily_quests")
        .update({ completed: true, completed_at: new Date().toISOString() })
        .eq("id", row.id);
      if (!error) {
        completed.push({
          key: row.quest_key,
          title: `Train ${scheduledQuestLabel(scheduledGroups)}`,
          icon: "📅",
          xpReward: row.xp_reward,
        });
      }
      continue;
    }

    const tmpl = QUEST_TEMPLATES.find((q) => q.key === row.quest_key);
    if (!tmpl || tmpl.kind !== "workout" || !tmpl.check(stats)) continue;

    const { error } = await supabase
      .from("daily_quests")
      .update({ completed: true, completed_at: new Date().toISOString() })
      .eq("id", row.id);
    if (!error) {
      completed.push({ key: tmpl.key, title: tmpl.title, icon: tmpl.icon, xpReward: row.xp_reward });
    }
  }

  const xpAwarded = completed.reduce((sum, c) => sum + c.xpReward, 0);
  return { completed, xpAwarded };
}

// Marks a "manual" (self-reported) quest complete when the user taps its
// "Mark done" button — there's no workout data to verify these against.
// Takes the caller's already-verified user id — see applyXp for why.
export async function completeManualQuest(
  userId: string,
  key: string
): Promise<{ quest: CompletedQuest | null; xpAwarded: number }> {
  const supabase = createClient();

  const tmpl = QUEST_TEMPLATES.find((q) => q.key === key && q.kind === "manual");
  if (!tmpl) return { quest: null, xpAwarded: 0 };

  const date = todayStr();
  const { data: row } = await supabase
    .from("daily_quests")
    .select("id, completed, xp_reward")
    .eq("user_id", userId)
    .eq("quest_date", date)
    .eq("quest_key", key)
    .maybeSingle();
  if (!row || row.completed) return { quest: null, xpAwarded: 0 };

  const { error } = await supabase
    .from("daily_quests")
    .update({ completed: true, completed_at: new Date().toISOString() })
    .eq("id", row.id);
  if (error) return { quest: null, xpAwarded: 0 };

  return {
    quest: { key: tmpl.key, title: tmpl.title, icon: tmpl.icon, xpReward: row.xp_reward },
    xpAwarded: row.xp_reward,
  };
}

// Records which split the user is training today and guarantees a matching
// Push/Pull/Leg Day quest exists for today — never a randomly-assigned,
// possibly-mismatched one. Takes the caller's already-verified user id —
// see applyXp for why.
export async function chooseSplit(userId: string, split: string): Promise<{ ok: boolean }> {
  const supabase = createClient();

  const tmpl = QUEST_TEMPLATES.find((q) => q.key === split && q.group === "split");
  if (!tmpl) return { ok: false };

  const date = todayStr();

  await supabase
    .from("profiles")
    .update({ split_choice_date: date, split_choice: split })
    .eq("id", userId);

  // Idempotent: adds today's matching split quest if it isn't already
  // there. Only sets the columns below, so it won't reset completion
  // status if the quest somehow already exists and is done.
  await supabase
    .from("daily_quests")
    .upsert(
      { user_id: userId, quest_date: date, quest_key: split, xp_reward: tmpl.xpReward },
      { onConflict: "user_id,quest_date,quest_key" }
    );

  return { ok: true };
}

// Called automatically on dashboard load when today's weekly split schedule
// has specific muscle groups set — guarantees a matching quest exists for
// exactly those groups, same idempotent-upsert approach as chooseSplit
// above but for an arbitrary (non-catalog) group combination. Takes the
// caller's already-verified user id — see applyXp for why.
export async function ensureScheduledQuest(userId: string, groups: string[]): Promise<void> {
  if (groups.length === 0) return;

  const supabase = createClient();

  const date = todayStr();
  const key = buildScheduledQuestKey(groups);

  await supabase
    .from("daily_quests")
    .upsert(
      { user_id: userId, quest_date: date, quest_key: key, xp_reward: SCHEDULED_QUEST_XP },
      { onConflict: "user_id,quest_date,quest_key" }
    );
}
