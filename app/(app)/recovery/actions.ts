"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { localDateStr } from "@/lib/local-day";

const RECOVERY_BONUS_PCT = 10;

// Deliberate rest, done right: logging a rest day (max once per day, and
// only on a day you haven't already worked out) grants a one-shot XP bonus
// on your next workout — rewards planned recovery instead of just not
// punishing rest.
export async function logRestDay() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const todayStr = localDateStr();

  const { data: prof } = await supabase
    .from("profiles")
    .select("last_rest_date, last_workout_date")
    .eq("id", user.id)
    .single();
  if (!prof) return;
  if (prof.last_rest_date === todayStr) return;
  if (prof.last_workout_date === todayStr) return;

  await supabase
    .from("profiles")
    .update({ last_rest_date: todayStr, recovery_bonus_pct: RECOVERY_BONUS_PCT })
    .eq("id", user.id);

  revalidatePath("/dashboard");
}
