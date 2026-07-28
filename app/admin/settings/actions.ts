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
