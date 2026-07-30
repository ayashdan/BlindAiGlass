"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";

// Lets someone on the waitlist sign up early, before public launch — the
// signUp action checks this via the is_invited() DB function. No email is
// sent (Forge has no outbound email set up) — tell them yourself.
export async function inviteFromWaitlist(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") || "");
  if (!id) return;

  const admin = createAdminClient();
  await admin
    .from("waitlist")
    .update({ invited: true, invited_at: new Date().toISOString() })
    .eq("id", id);

  revalidatePath("/admin/waitlist");
}

export async function uninviteFromWaitlist(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") || "");
  if (!id) return;

  const admin = createAdminClient();
  await admin.from("waitlist").update({ invited: false, invited_at: null }).eq("id", id);

  revalidatePath("/admin/waitlist");
}
