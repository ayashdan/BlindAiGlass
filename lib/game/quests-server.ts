// Server-only: assigns today's quests the first time they're needed, and
// checks/marks them complete after a workout is logged.
import { createClient } from "@/lib/supabase/server";
import { QUEST_TEMPLATES, pickDailyQuestKeys, type QuestStats } from "./quests";

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
export async function ensureTodayQuests(): Promise<DailyQuestView[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const date = todayStr();

  const { data: existing } = await supabase
    .from("daily_quests")
    .select("quest_key, completed, xp_reward")
    .eq("user_id", user.id)
    .eq("quest_date", date);

  let rows = existing ?? [];
  if (rows.length === 0) {
    const keys = pickDailyQuestKeys(`${user.id}:${date}`);
    const inserts = keys
      .map((key) => QUEST_TEMPLATES.find((q) => q.key === key))
      .filter((t): t is NonNullable<typeof t> => Boolean(t))
      .map((t) => ({
        user_id: user.id,
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
// reports the bonus XP to award.
export async function checkAndCompleteQuests(
  stats: QuestStats
): Promise<{ completed: CompletedQuest[]; xpAwarded: number }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { completed: [], xpAwarded: 0 };

  const date = todayStr();
  const { data: rows } = await supabase
    .from("daily_quests")
    .select("id, quest_key, completed, xp_reward")
    .eq("user_id", user.id)
    .eq("quest_date", date);

  const completed: CompletedQuest[] = [];
  for (const row of rows ?? []) {
    if (row.completed) continue;
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
export async function completeManualQuest(
  key: string
): Promise<{ quest: CompletedQuest | null; xpAwarded: number }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { quest: null, xpAwarded: 0 };

  const tmpl = QUEST_TEMPLATES.find((q) => q.key === key && q.kind === "manual");
  if (!tmpl) return { quest: null, xpAwarded: 0 };

  const date = todayStr();
  const { data: row } = await supabase
    .from("daily_quests")
    .select("id, completed, xp_reward")
    .eq("user_id", user.id)
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
// possibly-mismatched one.
export async function chooseSplit(split: string): Promise<{ ok: boolean }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  const tmpl = QUEST_TEMPLATES.find((q) => q.key === split && q.group === "split");
  if (!tmpl) return { ok: false };

  const date = todayStr();

  await supabase
    .from("profiles")
    .update({ split_choice_date: date, split_choice: split })
    .eq("id", user.id);

  // Idempotent: adds today's matching split quest if it isn't already
  // there. Only sets the columns below, so it won't reset completion
  // status if the quest somehow already exists and is done.
  await supabase
    .from("daily_quests")
    .upsert(
      { user_id: user.id, quest_date: date, quest_key: split, xp_reward: tmpl.xpReward },
      { onConflict: "user_id,quest_date,quest_key" }
    );

  return { ok: true };
}
