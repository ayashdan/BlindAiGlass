"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function sendFriendRequest(formData: FormData) {
  const username = String(formData.get("username") || "").trim();
  if (!username) return;

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: target } = await supabase
    .from("profiles")
    .select("id")
    .ilike("username", username)
    .maybeSingle();
  if (!target || target.id === user.id) return;

  // Skip if a request/friendship already exists in either direction.
  const { data: existing } = await supabase
    .from("friendships")
    .select("id")
    .or(
      `and(user_id.eq.${user.id},friend_id.eq.${target.id}),and(user_id.eq.${target.id},friend_id.eq.${user.id})`
    )
    .maybeSingle();
  if (existing) return;

  await supabase.from("friendships").insert({ user_id: user.id, friend_id: target.id });
  revalidatePath("/friends");
}

export async function acceptFriendRequest(formData: FormData) {
  const id = String(formData.get("id") || "");
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !id) return;

  await supabase
    .from("friendships")
    .update({ status: "accepted" })
    .eq("id", id)
    .eq("friend_id", user.id);
  revalidatePath("/friends");
}

export async function removeFriend(formData: FormData) {
  const id = String(formData.get("id") || "");
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !id) return;

  await supabase.from("friendships").delete().eq("id", id);
  revalidatePath("/friends");
}
