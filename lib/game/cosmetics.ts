// Cosmetic unlocks, deterministic and tied to achievements you've already
// earned — deliberately NOT random loot boxes. Same "I want that" pull as
// AAA game gear, none of the gambling-adjacent mechanics.
export const ACHIEVEMENT_COSMETICS: Record<string, { border?: string; title?: string }> = {
  first_workout: { title: "Iron Apprentice" },
  getting_started: { border: "border-sky-400" },
  warrior_7: { title: "Week Warrior", border: "border-emerald-400" },
  beast_30: { title: "The Undying", border: "border-violet-400" },
  workouts_100: { title: "Century Club", border: "border-rose-400" },
  level_10: { border: "border-amber-400" },
  level_25: { title: "Halfway Hero" },
  level_50: { title: "Forge Legend", border: "border-fuchsia-400" },
  first_pr: { title: "Record Breaker" },
  well_rounded: { title: "Well Rounded", border: "border-cyan-400" },
};

// Unlocked by the invite loop, not an achievement: recruit someone who then
// logs their 3rd workout (see profiles.recruit_count). Deliberately the only
// reward for inviting — cosmetic, never XP, so the league stays clean.
export const RECRUITER_TITLE = "Recruiter";

// A handful of milestone achievements get a "boss fight" treatment in the
// celebration overlay instead of a normal card.
export const BOSS_ACHIEVEMENTS: Record<string, string> = {
  warrior_7: "The Grind",
  beast_30: "The Wall",
  workouts_100: "The Century",
  level_50: "The Plateau",
};
