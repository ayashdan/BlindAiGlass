// Daily quest RULES (pure logic, no database). Each day, a handful of these
// get picked for a user and tracked in the `daily_quests` table. Written so
// swapping this hardcoded catalog for AI-generated quests later only means
// replacing how QUEST_TEMPLATES/pickDailyQuestKeys are produced — everything
// downstream (checking completion, awarding XP) stays the same.

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

// "split" quests (Push/Pull/Leg Day) are never part of the random daily
// draw — they only ever get added when the user explicitly chooses their
// split for the day (see chooseSplit in app/(app)/quests/actions.ts), so
// they're always accurate to what's actually being trained, never random.
export const RANDOM_POOL = QUEST_TEMPLATES.filter((q) => q.group !== "split");

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
