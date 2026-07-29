"use client";

import { useEffect, useState } from "react";
import { subscribeToPush, unsubscribeFromPush } from "@/app/(app)/notifications/actions";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

// Reminders for when you HAVEN'T opened the app — everything else Forge
// does only works once you're already in it. Uses the browser's native
// Push API (free, no third-party notification service).
export default function NotificationOptIn() {
  const [status, setStatus] = useState<"idle" | "subscribed" | "unsupported" | "denied">("idle");

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("unsupported");
      return;
    }
    navigator.serviceWorker.register("/sw.js").then(async (reg) => {
      const existing = await reg.pushManager.getSubscription();
      if (existing) setStatus("subscribed");
    });
  }, []);

  async function enable() {
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!publicKey) return;

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      setStatus("denied");
      return;
    }

    const reg = await navigator.serviceWorker.register("/sw.js");
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
    const json = sub.toJSON() as any;
    await subscribeToPush({
      endpoint: json.endpoint,
      keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
    });
    setStatus("subscribed");
  }

  async function disable() {
    if (!("serviceWorker" in navigator)) return;
    const reg = await navigator.serviceWorker.getRegistration();
    const sub = await reg?.pushManager.getSubscription();
    if (sub) {
      await unsubscribeFromPush(sub.endpoint);
      await sub.unsubscribe();
    }
    setStatus("idle");
  }

  if (status === "unsupported") return null;

  if (status === "subscribed") {
    return (
      <button
        onClick={disable}
        className="press rounded-lg border border-line bg-surface px-3 py-2 text-sm text-fg transition hover:border-forge/50"
        title="Turn off streak reminders"
      >
        🔕
      </button>
    );
  }

  return (
    <button
      onClick={enable}
      className="press rounded-lg border border-forge/40 bg-forge/5 px-3 py-2 text-sm font-bold text-forge transition hover:bg-forge/10"
      title="Get a reminder if you haven't worked out and your streak is at risk"
    >
      🔔
    </button>
  );
}
