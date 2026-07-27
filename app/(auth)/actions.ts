"use server";

// Server-side auth actions. Running on the server means passwords and the
// sign-up flow never depend on anything the browser can tamper with.
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signUp(formData: FormData) {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const username = String(formData.get("username") || "").trim();

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
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { username } },
  });
  if (error) {
    redirect("/signup?error=" + encodeURIComponent(error.message));
  }

  redirect("/dashboard");
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
