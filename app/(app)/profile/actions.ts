"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { AVATARS } from "@/lib/game/avatars";

export async function updateAvatar(formData: FormData) {
  const avatar = String(formData.get("avatar") || "");
  if (!AVATARS.includes(avatar)) return;

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("profiles").update({ avatar }).eq("id", user.id);

  revalidatePath("/profile");
  revalidatePath("/dashboard");
  revalidatePath("/leaderboard");
}
