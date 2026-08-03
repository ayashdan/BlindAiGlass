"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { openChest, type OpenChestResult } from "@/lib/game/chests-server";
import type { ChestTier } from "@/lib/game/chests";

export async function openChestAction(tier: ChestTier): Promise<OpenChestResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "You are not logged in." };

  const result = await openChest(user.id, tier);

  revalidatePath("/chests");
  revalidatePath("/dashboard");
  revalidatePath("/profile");

  return result;
}
