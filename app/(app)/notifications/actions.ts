"use server";

import { createClient } from "@/lib/supabase/server";

type PushSubscriptionInput = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

// `timezone` is the browser's own IANA zone (Intl.DateTimeFormat().resolvedOptions().timeZone)
// — the cron job that sends reminders has no request/visitor to read a
// timezone from, so this is the only way it can know what "today" means
// for this specific person.
export async function subscribeToPush(subscription: PushSubscriptionInput, timezone?: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: user.id,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
    { onConflict: "endpoint" }
  );

  if (timezone) {
    await supabase.from("profiles").update({ timezone }).eq("id", user.id);
  }

  return { ok: !error };
}

export async function unsubscribeFromPush(endpoint: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint).eq("user_id", user.id);
}
