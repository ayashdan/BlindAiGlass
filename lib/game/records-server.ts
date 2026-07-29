// Server-only: personal records. A "PR" is tracked per category (the
// overall longest workout, plus one per muscle group). The very first entry
// in a category just sets a quiet baseline — only beating a PRIOR best
// counts as a genuine PR (returned for celebration/achievements), so
// "First PR" rewards real improvement, not just showing up once.
import { createClient } from "@/lib/supabase/server";
import { MUSCLE_GROUPS } from "./muscle-groups";
import type { NewRecord } from "@/lib/types";

function labelFor(category: string): string {
  if (category === "overall") return "Longest Workout";
  return MUSCLE_GROUPS.find((g) => g.key === category)?.label ?? category;
}

export async function checkAndRecordPRs(
  muscleGroups: string[],
  durationMinutes: number
): Promise<{ newRecords: NewRecord[] }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { newRecords: [] };

  const categories = Array.from(new Set(["overall", ...muscleGroups]));
  const { data: existing } = await supabase
    .from("personal_records")
    .select("category, best_minutes")
    .eq("user_id", user.id)
    .in("category", categories);

  const bestByCategory = new Map(
    (existing ?? []).map((r: any) => [r.category as string, r.best_minutes as number])
  );

  const newRecords: NewRecord[] = [];
  for (const category of categories) {
    const prevBest = bestByCategory.get(category);
    if (prevBest === undefined) {
      // First time logging this category — set the baseline quietly.
      await supabase.from("personal_records").insert({
        user_id: user.id,
        category,
        best_minutes: durationMinutes,
      });
    } else if (durationMinutes > prevBest) {
      await supabase
        .from("personal_records")
        .update({ best_minutes: durationMinutes, achieved_at: new Date().toISOString() })
        .eq("user_id", user.id)
        .eq("category", category);
      newRecords.push({ category, label: labelFor(category), value: durationMinutes });
    }
  }

  return { newRecords };
}
