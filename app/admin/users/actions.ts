"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";

// Deletes the auth user outright (not just the profile row). `profiles`,
// `workouts`, and `user_achievements` all reference auth.users with
// `on delete cascade`, so their rows disappear along with it.
export async function deleteUser(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") || "");
  if (!id) return;

  const admin = createAdminClient();
  await admin.auth.admin.deleteUser(id);

  revalidatePath("/admin/users");
  revalidatePath("/admin");
}
