// Supabase auth callback. Magic-link / invite emails redirect here with a
// `?code=...` param — this exchanges it for a real session (setting the
// auth cookies) BEFORE sending the user on, so they land already logged in
// instead of hitting a protected page with no session and bouncing to /login.
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") || "/dashboard";

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(
    `${origin}/login?error=${encodeURIComponent("That link is invalid or expired.")}`
  );
}
