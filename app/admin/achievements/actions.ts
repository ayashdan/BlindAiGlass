"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";

export async function updateAchievement(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") || "");
  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const xpReward = Number(formData.get("xp_reward") || 0);
  if (!id || !name || !description) return;

  const admin = createAdminClient();
  await admin
    .from("achievements")
    .update({ name, description, xp_reward: xpReward })
    .eq("id", id);

  revalidatePath("/admin/achievements");
}

export async function deleteAchievement(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") || "");
  if (!id) return;

  const admin = createAdminClient();
  await admin.from("achievements").delete().eq("id", id);

  revalidatePath("/admin/achievements");
}

// New achievements only get shown/tracked in the catalog here — an unlock
// rule for them still needs to be added to lib/game/achievements.ts before
// anyone can actually earn one.
export async function createAchievement(formData: FormData) {
  await requireAdmin();
  const key = String(formData.get("key") || "").trim();
  const icon = String(formData.get("icon") || "🏅").trim() || "🏅";
  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const xpReward = Number(formData.get("xp_reward") || 0);
  if (!key || !name || !description) return;

  const admin = createAdminClient();
  await admin.from("achievements").insert({
    key,
    icon,
    name,
    description,
    xp_reward: xpReward,
    sort_order: 999,
  });

  revalidatePath("/admin/achievements");
}
