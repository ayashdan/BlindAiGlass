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
    check: (s) => ["chest", "shoulders", "triceps"].some((g) => s.muscleGroupsToday.includes(g)),
  },
  {
    key: "pull_day",
    title: "Pull Day",
    description: "Train back or biceps.",
    icon: "🏋️",
    xpReward: 25,
    kind: "workout",
    check: (s) => ["back", "biceps"].some((g) => s.muscleGroupsToday.includes(g)),
  },
  {
    key: "leg_day",
    title: "Leg Day",
    description: "Train quads, hamstrings, glutes, or calves.",
    icon: "🦵",
    xpReward: 25,
    kind: "workout",
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
    key: "double_up",
    title: "Double Up",
    description: "Complete 2 workouts today.",
    icon: "2️⃣",
    xpReward: 40,
    kind: "workout",
    check: (s) => s.workoutsToday >= 2,
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

// Picks QUESTS_PER_DAY template keys, seeded so the same (user, date) pair
// always gets the same set — no reshuffling if this runs more than once
// before the DB rows are created.
export function pickDailyQuestKeys(seed: string): string[] {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;

  const pool = QUEST_TEMPLATES.map((q) => q.key);
  const picked: string[] = [];
  for (let i = 0; i < QUESTS_PER_DAY && pool.length > 0; i++) {
    h = (h * 1103515245 + 12345) >>> 0;
    const idx = h % pool.length;
    picked.push(pool.splice(idx, 1)[0]);
  }
  return picked;
}
