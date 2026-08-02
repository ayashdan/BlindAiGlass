"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logSteps, setStepGoal } from "@/lib/game/steps-server";
import type { StepResult } from "@/lib/game/steps-server";

export async function logStepsAction(steps: number): Promise<StepResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "You are not logged in." };

  const result = await logSteps(user.id, steps);
  if (result.ok) {
    revalidatePath("/dashboard");
    if (result.chestEarned) revalidatePath("/chests");
  }
  return result;
}

export async function setStepGoalAction(goal: number): Promise<{ ok: boolean; goal: number; error?: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, goal, error: "You are not logged in." };

  const result = await setStepGoal(user.id, goal);
  if (result.ok) revalidatePath("/dashboard");
  return result;
}
