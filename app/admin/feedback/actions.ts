"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";

export async function markFeedbackReviewed(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") || "");
  if (!id) return;

  const admin = createAdminClient();
  await admin.from("feedback").update({ status: "reviewed" }).eq("id", id);
  revalidatePath("/admin/feedback");
}
