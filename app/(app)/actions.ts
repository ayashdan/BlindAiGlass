"use server";

// Server actions the app screens can call. For now: a temporary test button
// that grants XP so we can see leveling work before workouts exist (Phase 3).
import { revalidatePath } from "next/cache";
import { applyXp } from "@/lib/game/xp-server";

export async function gainTestXp() {
  const result = await applyXp(100);
  revalidatePath("/dashboard");
  return result;
}
