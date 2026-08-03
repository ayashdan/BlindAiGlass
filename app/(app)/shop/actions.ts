"use server";

// The "Notify me" toggle for Forge Plus — a free, honest demand measurement
// before any payment processor exists. One row per interested user
// (plus_interest, RLS: own rows only); the count shows up in /admin/analytics.
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function togglePlusInterest() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: existing } = await supabase
    .from("plus_interest")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    await supabase.from("plus_interest").delete().eq("user_id", user.id);
  } else {
    await supabase.from("plus_interest").insert({ user_id: user.id });
  }

  revalidatePath("/shop");
}
