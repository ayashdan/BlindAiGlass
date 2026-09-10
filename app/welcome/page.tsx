import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AVATARS, resolveAvatar } from "@/lib/game/avatars";
import { updateAvatar } from "@/app/(app)/profile/actions";
import SubmitButton from "@/components/SubmitButton";
import type { Profile } from "@/lib/types";

// The one-time "character creation" moment right after signup — picking an
// avatar was always possible from the profile page, but burying it there
// means a brand new account just drops straight into a dashboard full of
// numbers with no ceremony. This gives the first few seconds a game intro
// instead of a spreadsheet.
export default async function WelcomePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("profiles")
    .select("username, avatar, avatar_url")
    .eq("id", user.id)
    .single();
  const profile = data as Pick<Profile, "username" | "avatar" | "avatar_url"> | null;
  if (!profile) redirect("/dashboard");

  const avatar = resolveAvatar(profile.avatar);

  return (
    <>
      <div className="ambient-glow" aria-hidden="true" />
      <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-6 py-16 text-center">
        <p className="fade-in-up text-xs font-black uppercase tracking-[0.3em] text-forge">
          Welcome to Forge
        </p>
        <h1 className="fade-in-up mt-2 text-3xl font-black tracking-tight" style={{ animationDelay: "0.05s" }}>
          Choose your hero, {profile.username}
        </h1>
        <p className="fade-in-up mt-2 max-w-sm text-sm text-muted" style={{ animationDelay: "0.08s" }}>
          Every workout you log builds this character — stats, class, and
          rank all grow from what you actually train. Pick a look to start.
        </p>

        <div
          className="fade-in-up glow-pulse mt-8 flex h-24 w-24 items-center justify-center rounded-full border-2 border-forge/50 bg-surface text-6xl"
          style={{ animationDelay: "0.1s" }}
        >
          {!profile.avatar_url && avatar}
        </div>

        <div
          className="fade-in-up game-card mt-8 grid w-full grid-cols-6 gap-2 rounded-2xl border border-line bg-surface p-4"
          style={{ animationDelay: "0.13s" }}
        >
          {AVATARS.map((a) => (
            <form key={a} action={updateAvatar}>
              <input type="hidden" name="avatar" value={a} />
              <SubmitButton
                className={
                  "press flex h-12 w-full items-center justify-center rounded-lg border text-2xl transition " +
                  (!profile.avatar_url && avatar === a
                    ? "border-forge bg-forge/15"
                    : "border-line bg-bg hover:border-forge/50")
                }
              >
                {a}
              </SubmitButton>
            </form>
          ))}
        </div>

        <Link
          href="/dashboard"
          className="press glow-pulse fade-in-up mt-8 w-full rounded-2xl bg-gradient-to-r from-forge to-rose-500 py-4 text-center text-lg font-black text-neutral-950 shadow-lg shadow-forge/20 transition hover:from-forge-soft hover:to-rose-400"
          style={{ animationDelay: "0.16s" }}
        >
          Enter Forge →
        </Link>
        <p className="fade-in-up mt-3 text-xs text-muted" style={{ animationDelay: "0.18s" }}>
          You can change this anytime from your profile.
        </p>
      </main>
    </>
  );
}
