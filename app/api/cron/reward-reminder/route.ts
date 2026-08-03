import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPushToUser } from "@/lib/push-server";
import { levelFromXp } from "@/lib/game/leveling";

// Runs twice daily (see vercel.json). Nudges anyone exactly one level away
// from their next Rare Chest (dropped every 5 levels) — the "so close"
// moment where a reminder is most likely to get one more workout logged.
export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const admin = createAdminClient();
  const { data: candidates } = await admin.from("profiles").select("id, xp");

  let sent = 0;
  for (const p of candidates ?? []) {
    const level = levelFromXp((p.xp as number) ?? 0);
    const nextChestLevel = (Math.floor(level / 5) + 1) * 5;
    if (nextChestLevel - level !== 1) continue; // only exactly one level away

    await sendPushToUser(p.id, {
      title: "One level from a Rare Chest! 💎",
      body: `You're 1 level from Level ${nextChestLevel} and a Rare Chest — one more workout could do it.`,
      url: "/dashboard",
    });
    sent++;
  }

  return NextResponse.json({ ok: true, sent });
}
