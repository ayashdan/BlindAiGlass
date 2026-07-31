// Daily quest RULES (pure logic, no database). Each day, a handful of these
// get picked for a user and tracked in the `daily_quests` table. Written so
// swapping this hardcoded catalog for AI-generated quests later only means
// replacing how QUEST_TEMPLATES/pickDailyQuestKeys are produced — everything
// downstream (checking completion, awarding XP) stays the same.

import { MUSCLE_GROUPS } from "./muscle-groups";

export type QuestStats = {
  workoutsToday: number;
  muscleGroupsToday: string[]; // muscle groups trained today (e.g. "chest", "quads")
  maxDurationToday: number; // longest single workout today, in minutes
  hardToday: boolean; // any "hard" difficulty workout today
};

export type QuestTemplate = {
  key: string;
  title: string;
  description: string;
  icon: string;
  xpReward: number;
  // "workout" quests auto-complete by checking today's logged workouts.
  // "manual" quests can't be verified from workout data (no step counter or
  // water tracker in a web app) — the user self-reports by tapping a button.
  kind: "workout" | "manual";
  check: (s: QuestStats) => boolean; // unused for "manual" quests
  // Quests sharing a group are mutually exclusive within a single day's
  // picks — e.g. Push/Pull/Leg Day all belong to "split" so you never get
  // two different splits assigned on a day you're only doing one workout.
  group?: string;
};

export const QUEST_TEMPLATES: QuestTemplate[] = [
  {
    key: "any_workout",
    title: "Show Up",
    description: "Complete any workout today.",
    icon: "✅",
    xpReward: 20,
    kind: "workout",
    check: (s) => s.workoutsToday >= 1,
  },
  {
    key: "push_day",
    title: "Push Day",
    description: "Train chest, shoulders, or triceps.",
    icon: "💪",
    xpReward: 25,
    kind: "workout",
    group: "split",
    check: (s) => ["chest", "shoulders", "triceps"].some((g) => s.muscleGroupsToday.includes(g)),
  },
  {
    key: "pull_day",
    title: "Pull Day",
    description: "Train back or biceps.",
    icon: "🏋️",
    xpReward: 25,
    kind: "workout",
    group: "split",
    check: (s) => ["back", "biceps"].some((g) => s.muscleGroupsToday.includes(g)),
  },
  {
    key: "leg_day",
    title: "Leg Day",
    description: "Train quads, hamstrings, glutes, or calves.",
    icon: "🦵",
    xpReward: 25,
    kind: "workout",
    group: "split",
    check: (s) =>
      ["quads", "hamstrings", "glutes", "calves"].some((g) => s.muscleGroupsToday.includes(g)),
  },
  {
    key: "endurance",
    title: "Endurance",
    description: "Complete a workout 30+ minutes long.",
    icon: "⏱️",
    xpReward: 30,
    kind: "workout",
    check: (s) => s.maxDurationToday >= 30,
  },
  {
    key: "go_hard",
    title: "Go Hard",
    description: "Complete a Hard difficulty workout.",
    icon: "🔥",
    xpReward: 35,
    kind: "workout",
    check: (s) => s.hardToday,
  },
  {
    key: "stretch",
    title: "Stretch It Out",
    description: "Stretch or do mobility work for 10 minutes.",
    icon: "🧘",
    xpReward: 15,
    kind: "manual",
    check: () => false,
  },
  {
    key: "hydrate",
    title: "Hydrate",
    description: "Drink enough water today.",
    icon: "💧",
    xpReward: 10,
    kind: "manual",
    check: () => false,
  },
  {
    key: "sleep_well",
    title: "Rest Up",
    description: "Get a good night's sleep.",
    icon: "😴",
    xpReward: 10,
    kind: "manual",
    check: () => false,
  },
  {
    key: "steps",
    title: "Get Moving",
    description: "Walk 8,000+ steps today.",
    icon: "🚶",
    xpReward: 15,
    kind: "manual",
    check: () => false,
  },
];

export const QUESTS_PER_DAY = 3;

// Keys the weekly split schedule stores per day. SUNDAY_FIRST_DAY_KEYS is
// indexed to match JS's Date.getDay() (0 = Sunday); DISPLAY_ORDER is just
// how the profile page lists the days (Monday first).
export const SUNDAY_FIRST_DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
export const WEEKLY_SPLIT_DISPLAY_ORDER = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
export const WEEKLY_SPLIT_DAY_LABELS: Record<string, string> = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
};
export type WeeklySplitDayKey = (typeof WEEKLY_SPLIT_DISPLAY_ORDER)[number];

// "split" quests (Push/Pull/Leg Day) are never part of the random daily
// draw — they only ever get added when the user explicitly chooses their
// split for the day (see chooseSplit in app/(app)/quests/actions.ts), so
// they're always accurate to what's actually being trained, never random.
export const RANDOM_POOL = QUEST_TEMPLATES.filter((q) => q.group !== "split");

// A quest generated from the weekly split schedule (see WeeklySplitEditor /
// setWeeklySplitSchedule) targets whatever specific muscle groups that day
// is scheduled for, which varies per user/day — too open-ended to live in
// the static QUEST_TEMPLATES catalog. Instead the exact groups are encoded
// right into the quest_key so no extra DB column is needed; these helpers
// build/parse that key and derive its title/check function on the fly.
const SCHEDULED_QUEST_PREFIX = "sched:";
export const SCHEDULED_QUEST_XP = 25;

export function buildScheduledQuestKey(groups: string[]): string {
  return SCHEDULED_QUEST_PREFIX + groups.slice().sort().join(",");
}

export function parseScheduledQuestKey(key: string): string[] | null {
  if (!key.startsWith(SCHEDULED_QUEST_PREFIX)) return null;
  return key.slice(SCHEDULED_QUEST_PREFIX.length).split(",").filter(Boolean);
}

export function scheduledQuestLabel(groups: string[]): string {
  return groups
    .map((g) => MUSCLE_GROUPS.find((m) => m.key === g)?.label ?? g)
    .join(" + ");
}

export function scheduledQuestCheck(groups: string[]): (s: QuestStats) => boolean {
  return (s) => groups.some((g) => s.muscleGroupsToday.includes(g));
}

// Picks QUESTS_PER_DAY template keys, seeded so the same (user, date) pair
// always gets the same set — no reshuffling if this runs more than once
// before the DB rows are created.
export function pickDailyQuestKeys(seed: string, pool: QuestTemplate[] = RANDOM_POOL): string[] {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;

  const candidates = pool.slice();
  const picked: string[] = [];

  while (picked.length < QUESTS_PER_DAY && candidates.length > 0) {
    h = (h * 1103515245 + 12345) >>> 0;
    const idx = h % candidates.length;
    picked.push(candidates.splice(idx, 1)[0].key);
  }
  return picked;
}
