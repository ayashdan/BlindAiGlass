"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";

export async function setLaunched(formData: FormData) {
  await requireAdmin();
  const launched = String(formData.get("launched") || "false");

  const admin = createAdminClient();
  await admin.from("app_settings").upsert({ key: "launched", value: launched });

  revalidatePath("/admin/settings");
  revalidatePath("/");
}

// Starts a fresh season: bumps the season number and resets the clock.
// Nobody's XP/level/stats reset — only the season-pass tier track (workout
// count since season_started_at) restarts.
export async function startNewSeason() {
  await requireAdmin();

  const admin = createAdminClient();
  const { data } = await admin
    .from("app_settings")
    .select("value")
    .eq("key", "season_number")
    .maybeSingle();
  const current = parseInt(data?.value ?? "1", 10) || 1;

  await admin
    .from("app_settings")
    .upsert({ key: "season_number", value: String(current + 1) });
  await admin
    .from("app_settings")
    .upsert({ key: "season_started_at", value: new Date().toISOString() });

  revalidatePath("/admin/settings");
  revalidatePath("/dashboard");
}
