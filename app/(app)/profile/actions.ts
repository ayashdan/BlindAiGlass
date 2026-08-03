"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AVATARS } from "@/lib/game/avatars";
import { MAX_LEVEL } from "@/lib/game/leveling";
import { getUnlockedCosmetics } from "@/lib/game/cosmetics-server";
import { WEEKLY_SPLIT_DISPLAY_ORDER } from "@/lib/game/quests";
import { VALID_MUSCLE_GROUPS } from "@/lib/game/muscle-groups";

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
  revalidatePath("/welcome");
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

// Equips a border or title — only ones the user has actually unlocked are
// accepted (validated server-side via getUnlockedCosmetics, not trusted
// from the form). Covers achievement cosmetics, the Recruiter title, Plus
// vault items, and Plus season-track trophies — one shared source of truth
// so this can never accept something the profile page didn't also show.
export async function equipCosmetic(formData: FormData) {
  const border = formData.get("border");
  const title = formData.get("title");

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { borders, titles } = await getUnlockedCosmetics(user.id);
  const unlockedBorders = new Set(borders.map((b) => b.key));
  const unlockedTitles = new Set(titles.map((t) => t.key));

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

// Saves what to train on each day of the week (specific muscle groups, or
// "rest"). It stays in effect every week until manually changed here — the
// dashboard uses it to lock in a matching quest automatically each day
// instead of asking, and the workout log page suggests it when logging.
export async function setWeeklySplitSchedule(schedule: Record<string, string[] | "rest">) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const clean: Record<string, string[] | "rest"> = {};
  for (const day of WEEKLY_SPLIT_DISPLAY_ORDER) {
    const value = schedule[day];
    if (value === "rest") {
      clean[day] = "rest";
    } else if (Array.isArray(value)) {
      const groups = value.filter((g) => VALID_MUSCLE_GROUPS.includes(g));
      if (groups.length > 0) clean[day] = groups;
    }
  }

  await supabase.from("profiles").update({ weekly_split_schedule: clean }).eq("id", user.id);

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
