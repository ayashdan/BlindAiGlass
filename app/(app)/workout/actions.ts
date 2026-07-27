"use server";

// Saving a workout: validate on the server, store it, bump the workout count,
// and award XP through the same server-side "referee" the whole game uses.
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { applyXp } from "@/lib/game/xp-server";

export type WorkoutResult =
  | { ok: false; error: string }
  | {
      ok: true;
      xpEarned: number;
      leveledUp: boolean;
      level: number;
      rank: string;
      rankChanged: boolean;
    };

const VALID_TYPES = ["push", "pull", "legs", "full", "custom"];
// Completing a workout is worth a base 100 XP, plus a bonus for difficulty.
const BASE_XP = 100;
const DIFFICULTY_BONUS: Record<string, number> = { easy: 0, medium: 25, hard: 50 };

export async function logWorkout(input: {
  type: string;
  customName?: string;
  duration: number;
  difficulty: string;
  notes?: string;
}): Promise<WorkoutResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "You are not logged in." };

  // ---- Validate the input ----
  const type = input.type;
  const difficulty = input.difficulty;
  const duration = Math.round(Number(input.duration));

  if (!VALID_TYPES.includes(type)) return { ok: false, error: "Pick a workout type." };
  if (!(difficulty in DIFFICULTY_BONUS)) return { ok: false, error: "Pick a difficulty." };
  if (!Number.isFinite(duration) || duration <= 0 || duration > 600) {
    return { ok: false, error: "Enter a duration between 1 and 600 minutes." };
  }

  const customName =
    type === "custom" ? (input.customName || "").trim().slice(0, 60) : null;
  if (type === "custom" && !customName) {
    return { ok: false, error: "Give your custom workout a name." };
  }
  const notes = (input.notes || "").trim().slice(0, 500) || null;

  const xpEarned = BASE_XP + DIFFICULTY_BONUS[difficulty];

  // ---- Save the workout ----
  const { error: insErr } = await supabase.from("workouts").insert({
    user_id: user.id,
    type,
    custom_name: customName,
    duration_minutes: duration,
    difficulty,
    notes,
    xp_earned: xpEarned,
  });
  if (insErr) return { ok: false, error: "Could not save the workout." };

  // ---- Bump total workouts ----
  const { data: prof } = await supabase
    .from("profiles")
    .select("total_workouts")
    .eq("id", user.id)
    .single();
  await supabase
    .from("profiles")
    .update({ total_workouts: (prof?.total_workouts ?? 0) + 1 })
    .eq("id", user.id);

  // ---- Award XP (recalculates level + rank server-side) ----
  const xp = await applyXp(xpEarned);

  revalidatePath("/dashboard");
  return {
    ok: true,
    xpEarned,
    leveledUp: xp.leveledUp,
    level: xp.level,
    rank: xp.rank,
    rankChanged: xp.rankChanged,
  };
}
