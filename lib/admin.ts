// Who counts as an admin, and a guard for admin-only pages/actions.
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// The email(s) allowed into the admin dashboard.
export const ADMIN_EMAILS = ["yoniayash007@gmail.com"];

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.map((e) => e.toLowerCase()).includes(email.toLowerCase());
}

// Use at the top of any admin page or action. Redirects non-admins away.
export async function requireAdmin() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isAdminEmail(user.email)) redirect("/login");
  return user;
}
