import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email-server";
import { inactivityEmail, educationEmail, EDUCATION_STEP_COUNT } from "@/lib/emails";

const DAY_MS = 86400000;
const INACTIVITY_DAYS = 7;
const EDUCATION_FIRST_DAY = 2; // first feature-education email 2 days after signup
const EDUCATION_GAP_DAYS = 4; // then one every 4 days after that

// Runs once daily (see vercel.json). Two independent sequences in one pass:
// re-engage anyone inactive for 7+ days (once per inactive stretch — resets
// the moment they log a new workout), and drip a short feature-education
// series to everyone regardless of activity. `profiles` has no email column
// (that lives in auth.users), so addresses come from listUsers() once and
// get matched up by id instead of a per-user auth lookup.
export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const admin = createAdminClient();
  const host = headers().get("host") ?? "";
  const proto = host.startsWith("localhost") ? "http" : "https";
  const appUrl = `${proto}://${host}`;

  const [{ data: profiles }, { data: userList }] = await Promise.all([
    admin
      .from("profiles")
      .select(
        "id, username, created_at, last_workout_date, inactivity_email_sent_at, education_email_step, education_email_sent_at"
      ),
    admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
  ]);
  const emailById = new Map((userList?.users ?? []).map((u) => [u.id, u.email]));

  const now = Date.now();
  let inactivitySent = 0;
  let educationSent = 0;

  for (const p of profiles ?? []) {
    const email = emailById.get(p.id as string);
    if (!email) continue;

    // ---- 7-day inactivity nudge ----
    const lastActiveMs = p.last_workout_date
      ? new Date(`${p.last_workout_date}T00:00:00Z`).getTime()
      : new Date(p.created_at as string).getTime();
    const daysInactive = (now - lastActiveMs) / DAY_MS;
    const sentAt = p.inactivity_email_sent_at ? new Date(p.inactivity_email_sent_at as string).getTime() : null;
    const alreadySentThisStretch = sentAt !== null && sentAt > lastActiveMs;

    if (daysInactive >= INACTIVITY_DAYS && !alreadySentThisStretch) {
      const { subject, html } = inactivityEmail(p.username as string, appUrl);
      const result = await sendEmail(email, subject, html);
      if (result.sent) {
        await admin
          .from("profiles")
          .update({ inactivity_email_sent_at: new Date().toISOString() })
          .eq("id", p.id);
        inactivitySent++;
      }
    }

    // ---- Feature-education drip ----
    const step = (p.education_email_step as number) ?? 0;
    if (step < EDUCATION_STEP_COUNT) {
      const daysSinceSignup = (now - new Date(p.created_at as string).getTime()) / DAY_MS;
      const daysSinceLastEdu = p.education_email_sent_at
        ? (now - new Date(p.education_email_sent_at as string).getTime()) / DAY_MS
        : Infinity;
      const due = step === 0 ? daysSinceSignup >= EDUCATION_FIRST_DAY : daysSinceLastEdu >= EDUCATION_GAP_DAYS;

      if (due) {
        const content = educationEmail(step, p.username as string, appUrl);
        if (content) {
          const result = await sendEmail(email, content.subject, content.html);
          if (result.sent) {
            await admin
              .from("profiles")
              .update({ education_email_step: step + 1, education_email_sent_at: new Date().toISOString() })
              .eq("id", p.id);
            educationSent++;
          }
        }
      }
    }
  }

  return NextResponse.json({ ok: true, inactivitySent, educationSent });
}
