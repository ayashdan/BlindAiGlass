"use server";

// Server-side auth actions. Running on the server means passwords and the
// sign-up flow never depend on anything the browser can tamper with.
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminEmail } from "@/lib/admin";
import { sendEmail } from "@/lib/email-server";
import { welcomeEmail } from "@/lib/emails";

export async function signUp(formData: FormData) {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const username = String(formData.get("username") || "").trim();
  const ref = String(formData.get("ref") || "").trim();

  // Basic validation.
  if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
    redirect(
      "/signup?error=" +
        encodeURIComponent("Username must be 3–20 letters, numbers, or underscores.")
    );
  }
  if (password.length < 6) {
    redirect(
      "/signup?error=" + encodeURIComponent("Password must be at least 6 characters.")
    );
  }

  const supabase = createClient();

  // Pre-launch gate: until the app is launched, only the admin and anyone
  // explicitly invited from the waitlist can create an account. Everyone
  // else is sent to the waitlist.
  const { data: setting } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "launched")
    .maybeSingle();
  const launched = setting?.value === "true";

  if (!launched && !isAdminEmail(email)) {
    const { data: invited } = await supabase.rpc("is_invited", { p_email: email });
    if (invited !== true) {
      redirect(
        "/?error=" + encodeURIComponent("Forge hasn't launched yet — join the waitlist!")
      );
    }
  }

  // Make sure the username isn't already taken.
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();
  if (existing) {
    redirect("/signup?error=" + encodeURIComponent("That username is taken."));
  }

  // Create the account. The username rides along in `data` and our database
  // trigger uses it to create the matching profile row automatically.
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { username } },
  });
  if (error) {
    redirect("/signup?error=" + encodeURIComponent(error.message));
  }

  // Invite loop: arriving via a friend's ?ref link auto-friends the two, so
  // day one already has a rival and a weekly league. Service-role client
  // because the new session may not exist yet (email confirmation on) and
  // the friendship is written on the inviter's behalf. Best-effort — a bad
  // ref never breaks signup.
  if (data.user && ref && ref.toLowerCase() !== username.toLowerCase()) {
    try {
      const admin = createAdminClient();
      const { data: inviter } = await admin
        .from("profiles")
        .select("id")
        .ilike("username", ref)
        .maybeSingle();
      if (inviter && inviter.id !== data.user.id) {
        await admin
          .from("profiles")
          .update({ referred_by: inviter.id })
          .eq("id", data.user.id);
        await admin
          .from("friendships")
          .insert({ user_id: inviter.id, friend_id: data.user.id, status: "accepted" });
      }
    } catch {
      // Missing service key or a race — the invitee can still add manually.
    }
  }

  // Best-effort welcome email — never blocks or breaks signup if it fails
  // or isn't configured (see lib/email-server.ts).
  if (data.user) {
    const host = headers().get("host") ?? "";
    const proto = host.startsWith("localhost") ? "http" : "https";
    const appUrl = `${proto}://${host}`;
    const { subject, html } = welcomeEmail(username, appUrl);
    const result = await sendEmail(email, subject, html);
    if (result.sent) {
      await supabase
        .from("profiles")
        .update({ welcome_email_sent_at: new Date().toISOString() })
        .eq("id", data.user.id);
    }
  }

  redirect("/welcome");
}

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    redirect("/login?error=" + encodeURIComponent(error.message));
  }

  redirect("/dashboard");
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/");
}
