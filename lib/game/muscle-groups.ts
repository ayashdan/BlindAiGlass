// The full multi-select list of muscle groups a workout can target. Shared
// between the client form (rendering the checkboxes) and the server action
// (validating what actually gets saved).
export const MUSCLE_GROUPS: { key: string; label: string }[] = [
  { key: "chest", label: "Chest" },
  { key: "back", label: "Back" },
  { key: "shoulders", label: "Shoulders" },
  { key: "biceps", label: "Biceps" },
  { key: "triceps", label: "Triceps" },
  { key: "forearms", label: "Forearms" },
  { key: "abs", label: "Abs / Core" },
  { key: "quads", label: "Quads" },
  { key: "hamstrings", label: "Hamstrings" },
  { key: "glutes", label: "Glutes" },
  { key: "calves", label: "Calves" },
  { key: "full_body", label: "Full Body" },
  { key: "cardio", label: "Cardio" },
];

export const VALID_MUSCLE_GROUPS = MUSCLE_GROUPS.map((g) => g.key);
