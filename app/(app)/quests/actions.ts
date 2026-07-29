"use server";

import { revalidatePath } from "next/cache";
import { completeManualQuest } from "@/lib/game/quests-server";
import { applyXp } from "@/lib/game/xp-server";

// Self-reported quests (stretch, hydrate, sleep, steps) can't be verified
// from workout data — this is what "Mark done" on the dashboard calls.
export async function completeQuest(formData: FormData) {
  const key = String(formData.get("key") || "");
  const result = await completeManualQuest(key);
  if (result.xpAwarded > 0) {
    await applyXp(result.xpAwarded);
  }
  revalidatePath("/dashboard");
}
