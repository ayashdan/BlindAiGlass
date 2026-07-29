"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { AVATARS } from "@/lib/game/avatars";
import { MAX_LEVEL } from "@/lib/game/leveling";

const MAX_PHOTO_BYTES = 3 * 1024 * 1024; // 3MB

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

export async function uploadAvatarPhoto(formData: FormData) {
  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0) return;
  if (file.size > MAX_PHOTO_BYTES) return;
  if (!file.type.startsWith("image/")) return;

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const path = `${user.id}/avatar.${ext}`;

  const { error: upErr } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true, contentType: file.type });
  if (upErr) return;

  const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
  // Cache-bust so a re-upload shows immediately at the same path.
  const url = `${pub.publicUrl}?t=${Date.now()}`;

  await supabase.from("profiles").update({ avatar_url: url }).eq("id", user.id);

  revalidatePath("/profile");
  revalidatePath("/dashboard");
  revalidatePath("/leaderboard");
}

export async function removeAvatarPhoto() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("profiles").update({ avatar_url: null }).eq("id", user.id);

  revalidatePath("/profile");
  revalidatePath("/dashboard");
  revalidatePath("/leaderboard");
}

// Only available at MAX_LEVEL. Purely cosmetic: resets XP/level/rank back
// to the start but permanently marks a prestige star — lifetime stats
// (workouts, streaks, achievements) are untouched.
export async function prestige() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: prof } = await supabase
    .from("profiles")
    .select("level, prestige")
    .eq("id", user.id)
    .single();
  if (!prof || prof.level < MAX_LEVEL) return;

  await supabase
    .from("profiles")
    .update({ xp: 0, level: 1, rank: "Beginner", prestige: (prof.prestige ?? 0) + 1 })
    .eq("id", user.id);

  revalidatePath("/profile");
  revalidatePath("/dashboard");
  revalidatePath("/leaderboard");
}
