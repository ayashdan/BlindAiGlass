"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sendPushToUser } from "@/lib/push-server";

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

// One-tap 🔥 on a friend's feed event. RLS enforces you can only hype a
// friend's event, once (unique constraint) — a duplicate tap is a silent
// no-op, which also means the push below can never be spammed.
export async function hypeEvent(formData: FormData) {
  const eventId = String(formData.get("eventId") || "");
  if (!eventId) return;

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: inserted, error } = await supabase
    .from("hypes")
    .insert({ event_id: eventId, from_user: user.id })
    .select("id")
    .maybeSingle();

  if (!error && inserted) {
    // Recognition from a real person is the whole point — tell them.
    const [{ data: ev }, { data: me }] = await Promise.all([
      supabase.from("friend_events").select("user_id").eq("id", eventId).single(),
      supabase.from("profiles").select("username").eq("id", user.id).single(),
    ]);
    if (ev) {
      await sendPushToUser(ev.user_id, {
        title: "🔥 Hyped!",
        body: `${me?.username ?? "A friend"} hyped your workout.`,
        url: "/friends",
      });
    }
  }

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
