"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";

// Turns a waitlist name/email into a valid starting username
// (^[a-zA-Z0-9_]{3,20}$) — they can change it later from their profile.
function deriveUsername(name: string | null, email: string): string {
  const raw = (name || email.split("@")[0]).toLowerCase().replace(/[^a-z0-9_]/g, "");
  const base = (raw || "forger").slice(0, 14);
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base}_${suffix}`;
}

// Sends a real Supabase-hosted invite email: clicking the link creates
// their account and logs them straight in — no signup form, no password
// needed to get started. This is Supabase Auth's built-in email sending
// (separate from a general marketing-email service, which Forge still
// doesn't have) — it just needs the Supabase project's email to be set up
// (works out of the box on the free tier, rate-limited).
export async function inviteFromWaitlist(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") || "");
  const email = String(formData.get("email") || "").trim();
  const name = String(formData.get("name") || "").trim() || null;
  if (!id || !email) return;

  const admin = createAdminClient();

  const host = headers().get("host");
  const protocol = host?.startsWith("localhost") ? "http" : "https";
  const redirectTo = host ? `${protocol}://${host}/auth/callback?next=/dashboard` : undefined;

  await admin.auth.admin.inviteUserByEmail(email, {
    data: { username: deriveUsername(name, email) },
    redirectTo,
  });

  // Also mark them invited so the manual sign-up form (is_invited check)
  // works too, as a fallback if the emailed link ever fails to arrive.
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
