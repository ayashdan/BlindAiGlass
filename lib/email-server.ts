// Server-only: sends transactional email via Resend (free tier, no card
// needed — see .env.local.example). Mirrors lib/push-server.ts's pattern:
// gracefully no-ops instead of throwing when RESEND_API_KEY isn't
// configured, so the rest of the app works fine without it — you just
// don't get emails sent until it's set up.
import { Resend } from "resend";

let client: Resend | null = null;
function getClient(): Resend | null {
  if (client) return client;
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  client = new Resend(key);
  return client;
}

export async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<{ sent: boolean; error?: string }> {
  const resend = getClient();
  if (!resend) return { sent: false, error: "not configured" };

  const from = process.env.EMAIL_FROM || "Forge <onboarding@resend.dev>";
  try {
    const { error } = await resend.emails.send({ from, to, subject, html });
    if (error) return { sent: false, error: error.message };
    return { sent: true };
  } catch (err: any) {
    return { sent: false, error: err?.message ?? "unknown error" };
  }
}
