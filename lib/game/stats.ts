// The character sheet. Instead of one flat XP number, every workout grows
// specific stats based on what was actually trained — turning "I did a
// workout" into "I made my character stronger in a specific way."

export type StatKey = "power" | "grit" | "endurance" | "discipline";

export type CharacterStats = {
  power: number;
  grit: number;
  endurance: number;
  discipline: number;
};

const GROUP_TO_STAT: Record<string, StatKey> = {
  chest: "power",
  shoulders: "power",
  triceps: "power",
  back: "grit",
  biceps: "grit",
  quads: "endurance",
  hamstrings: "endurance",
  glutes: "endurance",
  calves: "endurance",
  cardio: "endurance",
  full_body: "endurance",
  abs: "endurance",
  forearms: "endurance",
};

const DIFFICULTY_STAT_BONUS: Record<string, number> = { easy: 0, medium: 1, hard: 2 };
const BASE_STAT_POINTS = 4;

// Points awarded per (power/grit/endurance) stat for a single workout.
export function computeStatGains(
  muscleGroups: string[],
  difficulty: string
): Partial<Record<StatKey, number>> {
  const gains: Partial<Record<StatKey, number>> = {};
  const points = BASE_STAT_POINTS + (DIFFICULTY_STAT_BONUS[difficulty] ?? 0);
  for (const g of muscleGroups) {
    const stat = GROUP_TO_STAT[g];
    if (!stat) continue;
    gains[stat] = (gains[stat] ?? 0) + points;
  }
  return gains;
}

// Discipline tracks consistency, not training volume — it grows from
// showing up on schedule, separate from what you actually trained.
export const DISCIPLINE_PER_STREAK_DAY = 2;
export const DISCIPLINE_PER_QUEST = 1;

export type CharacterClass = "Titan" | "Warden" | "Ranger" | "Adept";

export const CLASS_INFO: Record<CharacterClass, { icon: string; blurb: string }> = {
  Titan: { icon: "🛡️", blurb: "Built on raw Power. Push day is your domain." },
  Warden: { icon: "🗡️", blurb: "Built on Grit. Nothing pulls harder than you." },
  Ranger: { icon: "🏹", blurb: "Built on Endurance. You outlast everyone." },
  Adept: { icon: "⚖️", blurb: "A balanced build — no single weakness." },
};

// Derived from the combat triangle (power/grit/endurance) — discipline is
// orthogonal (consistency, not style) so it doesn't factor into class.
export function deriveClass(stats: CharacterStats): CharacterClass {
  const { power, grit, endurance } = stats;
  const total = power + grit + endurance;
  if (total === 0) return "Adept";

  const max = Math.max(power, grit, endurance);
  const avgOthers = (total - max) / 2;
  if (max - avgOthers < avgOthers * 0.15 + 5) return "Adept";
  if (max === power) return "Titan";
  if (max === grit) return "Warden";
  return "Ranger";
}
