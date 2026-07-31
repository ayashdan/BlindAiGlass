"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AVATARS } from "@/lib/game/avatars";
import { MAX_LEVEL } from "@/lib/game/leveling";
import { ACHIEVEMENT_COSMETICS } from "@/lib/game/cosmetics";
import { WEEKLY_SPLIT_DISPLAY_ORDER } from "@/lib/game/quests";

const SPLIT_KEYS = new Set(["push_day", "pull_day", "leg_day"]);

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

// Equips a border or title — only ones unlocked via an earned achievement
// are accepted (validated server-side against the user's actual unlocks,
// not trusted from the form).
export async function equipCosmetic(formData: FormData) {
  const border = formData.get("border");
  const title = formData.get("title");

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: catalog } = await supabase.from("achievements").select("id, key");
  const { data: mine } = await supabase.from("user_achievements").select("achievement_id");
  const have = new Set((mine ?? []).map((r: any) => r.achievement_id));
  const unlockedKeys = new Set(
    (catalog ?? []).filter((a: any) => have.has(a.id)).map((a: any) => a.key as string)
  );

  const unlockedBorders = new Set(
    Array.from(unlockedKeys)
      .map((k) => ACHIEVEMENT_COSMETICS[k]?.border)
      .filter((b): b is string => Boolean(b))
  );
  const unlockedTitles = new Set(
    Array.from(unlockedKeys)
      .map((k) => ACHIEVEMENT_COSMETICS[k]?.title)
      .filter((t): t is string => Boolean(t))
  );

  const update: Record<string, string | null> = {};
  if (typeof border === "string") {
    update.equipped_border = border === "" ? null : unlockedBorders.has(border) ? border : null;
  }
  if (typeof title === "string") {
    update.equipped_title = title === "" ? null : unlockedTitles.has(title) ? title : null;
  }
  if (Object.keys(update).length === 0) return;

  await supabase.from("profiles").update(update).eq("id", user.id);

  revalidatePath("/profile");
  revalidatePath("/dashboard");
  revalidatePath("/leaderboard");
}

// Saves what to train on each day of the week. It stays in effect every
// week until manually changed here — the dashboard uses it to lock in
// today's Push/Pull/Leg Day quest automatically instead of asking.
export async function setWeeklySplitSchedule(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const schedule: Record<string, string> = {};
  for (const day of WEEKLY_SPLIT_DISPLAY_ORDER) {
    const value = String(formData.get(day) || "");
    if (SPLIT_KEYS.has(value)) schedule[day] = value;
  }

  await supabase.from("profiles").update({ weekly_split_schedule: schedule }).eq("id", user.id);

  revalidatePath("/profile");
  revalidatePath("/dashboard");
}

// Sets a new password. Doesn't need the old one (you're already
// authenticated) — there is no way to show your existing password, because
// Forge never stores it in a readable form, only a one-way hash.
export async function changePassword(formData: FormData) {
  const password = String(formData.get("password") || "");
  const confirm = String(formData.get("confirm") || "");

  if (password.length < 6) {
    redirect("/profile?error=" + encodeURIComponent("Password must be at least 6 characters."));
  }
  if (password !== confirm) {
    redirect("/profile?error=" + encodeURIComponent("Passwords don't match."));
  }

  const supabase = createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    redirect("/profile?error=" + encodeURIComponent(error.message));
  }

  redirect("/profile?success=" + encodeURIComponent("Password updated."));
}
