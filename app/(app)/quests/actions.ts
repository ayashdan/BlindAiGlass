"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { completeManualQuest, chooseSplit as chooseSplitServer } from "@/lib/game/quests-server";
import { applyXp } from "@/lib/game/xp-server";

// Self-reported quests (stretch, hydrate, sleep, steps) can't be verified
// from workout data — this is what "Mark done" on the dashboard calls.
export async function completeQuest(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const key = String(formData.get("key") || "");
  const result = await completeManualQuest(user.id, key);
  if (result.xpAwarded > 0) {
    await applyXp(user.id, result.xpAwarded);
  }
  revalidatePath("/dashboard");
}

// "I'm training Push/Pull/Legs today" — guarantees the matching quest
// shows up instead of a randomly-assigned, possibly-mismatched one.
export async function chooseSplit(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const split = String(formData.get("split") || "");
  await chooseSplitServer(user.id, split);
  revalidatePath("/dashboard");
}
