"use server";

// Joins the waitlist via the database function, then sends the person to their
// personal waitlist page (with their referral code).
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function joinWaitlist(formData: FormData) {
  const email = String(formData.get("email") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const ref = String(formData.get("ref") || "").trim();

  const backWithError = (msg: string) =>
    redirect(
      "/?error=" + encodeURIComponent(msg) + (ref ? "&ref=" + encodeURIComponent(ref) : "")
    );

  if (!email || !email.includes("@")) backWithError("Please enter a valid email.");

  const supabase = createClient();
  const { data, error } = await supabase.rpc("join_waitlist", {
    p_email: email,
    p_name: name || null,
    p_ref: ref || null,
  });

  if (error || !data) backWithError("Something went wrong. Please try again.");

  redirect("/waitlist?code=" + encodeURIComponent(String(data)));
}
