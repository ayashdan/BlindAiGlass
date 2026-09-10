"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function submitFeedback(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const category = String(formData.get("category") || "other");
  const message = String(formData.get("message") || "").trim();

  if (!["bug", "idea", "other"].includes(category)) {
    redirect("/feedback?error=" + encodeURIComponent("Pick a valid category."));
  }
  if (message.length === 0 || message.length > 2000) {
    redirect(
      "/feedback?error=" + encodeURIComponent("Say something (up to 2000 characters).")
    );
  }

  const { error } = await supabase.from("feedback").insert({
    user_id: user.id,
    category,
    message,
  });
  if (error) {
    redirect("/feedback?error=" + encodeURIComponent("Could not send that — try again."));
  }

  redirect("/feedback?success=1");
}
