// Server-only: sends a web push notification via VAPID (the browser's
// native Push API) — free, no third-party notification service, no cost
// per message.
import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";

let configured = false;
function ensureConfigured() {
  if (configured) return;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return;
  webpush.setVapidDetails("mailto:forge@example.com", publicKey, privateKey);
  configured = true;
}

// Sends to every device a user has subscribed on. Silently drops
// subscriptions the browser has revoked (expected, not an error).
export async function sendPushToUser(userId: string, payload: { title: string; body: string; url?: string }) {
  ensureConfigured();
  if (!configured) return;

  const admin = createAdminClient();
  const { data: subs } = await admin
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("user_id", userId);

  for (const sub of subs ?? []) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        JSON.stringify(payload)
      );
    } catch (err: any) {
      // 404/410 = the browser unsubscribed; clean it up so we stop trying.
      if (err?.statusCode === 404 || err?.statusCode === 410) {
        await admin.from("push_subscriptions").delete().eq("id", sub.id);
      }
    }
  }
}
