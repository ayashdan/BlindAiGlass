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

export type PushSendResult = {
  configured: boolean;
  subscriptionCount: number;
  successCount: number;
  errors: string[];
};

// Sends to every device a user has subscribed on. Cleans up (rather than
// retrying) subscriptions the browser has revoked — expected, not an error.
// Returns what actually happened instead of failing silently, so callers
// (like the admin test-notification button) can show exactly where the
// pipeline broke instead of just "nothing happened."
export async function sendPushToUser(
  userId: string,
  payload: { title: string; body: string; url?: string }
): Promise<PushSendResult> {
  ensureConfigured();
  if (!configured) {
    return { configured: false, subscriptionCount: 0, successCount: 0, errors: [] };
  }

  const admin = createAdminClient();
  const { data: subs } = await admin
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("user_id", userId);
  const list = subs ?? [];

  let successCount = 0;
  const errors: string[] = [];

  for (const sub of list) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        JSON.stringify(payload)
      );
      successCount++;
    } catch (err: any) {
      // 404/410 = the browser unsubscribed; clean it up so we stop trying.
      if (err?.statusCode === 404 || err?.statusCode === 410) {
        await admin.from("push_subscriptions").delete().eq("id", sub.id);
        errors.push(`stale subscription removed (${err.statusCode})`);
      } else {
        errors.push(`${err?.statusCode ?? "error"}: ${err?.body || err?.message || "unknown"}`);
      }
    }
  }

  return { configured: true, subscriptionCount: list.length, successCount, errors };
}
