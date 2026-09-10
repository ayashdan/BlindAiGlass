"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPushToUser } from "@/lib/push-server";

export async function setLaunched(formData: FormData) {
  await requireAdmin();
  const launched = String(formData.get("launched") || "false");

  const admin = createAdminClient();
  await admin.from("app_settings").upsert({ key: "launched", value: launched });

  revalidatePath("/admin/settings");
  revalidatePath("/");
}

// Starts a fresh season: bumps the season number and resets the clock.
// Nobody's XP/level/stats reset — only the season-pass tier track (workout
// count since season_started_at) restarts.
export async function startNewSeason() {
  await requireAdmin();

  const admin = createAdminClient();
  const { data } = await admin
    .from("app_settings")
    .select("value")
    .eq("key", "season_number")
    .maybeSingle();
  const current = parseInt(data?.value ?? "1", 10) || 1;

  await admin
    .from("app_settings")
    .upsert({ key: "season_number", value: String(current + 1) });
  await admin
    .from("app_settings")
    .upsert({ key: "season_started_at", value: new Date().toISOString() });

  revalidatePath("/admin/settings");
  revalidatePath("/dashboard");
}

// Sends a push notification to whichever admin account clicks the button
// (only fires to devices where that account already enabled 🔔). Useful for
// checking the push pipeline actually works without waiting for the daily
// cron or faking a streak.
export async function sendTestNotification() {
  const user = await requireAdmin();
  const result = await sendPushToUser(user.id, {
    title: "🔥 Forge test",
    body: "If you can see this, push notifications are working!",
    url: "/dashboard",
  });

  let message: string;
  if (!result.configured) {
    message =
      "VAPID keys aren't set in this environment (NEXT_PUBLIC_VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY) — the server can't send anything until those are added in Vercel and redeployed.";
  } else if (result.subscriptionCount === 0) {
    message =
      "No push subscription found for your account. Tap 🔔 on the dashboard — if nothing prompts you for permission, the public VAPID key isn't reaching the browser, or (on iOS) Forge isn't added to your Home Screen yet.";
  } else if (result.successCount === 0) {
    message = `Found ${result.subscriptionCount} subscription(s), but every send failed: ${result.errors.join("; ")}`;
  } else {
    message = `Sent to ${result.successCount}/${result.subscriptionCount} device(s). If it still didn't show up, check that device's OS-level notification permission for this app/browser.`;
  }

  redirect("/admin/settings?notify=" + encodeURIComponent(message));
}
