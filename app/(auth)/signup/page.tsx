import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signUp } from "../actions";
import SubmitButton from "@/components/SubmitButton";
import AvatarDisplay from "@/components/AvatarDisplay";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: { error?: string; ref?: string };
}) {
  // Arriving via a friend's invite link (?ref=username): show who's
  // challenging them, and pass the ref through the form so signup can
  // auto-friend the two. `profiles` is public game stats, so this lookup
  // needs no special access.
  const ref = (searchParams.ref || "").trim();
  type Inviter = { username: string; avatar: string; avatar_url: string | null };
  let inviter: Inviter | null = null;
  if (ref) {
    const supabase = createClient();
    const { data } = await supabase
      .from("profiles")
      .select("username, avatar, avatar_url")
      .ilike("username", ref)
      .maybeSingle();
    inviter = (data as Inviter | null) ?? null;
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <h1 className="mb-1 text-3xl font-black tracking-tight">
        Join <span className="text-forge">Forge</span>
      </h1>
      <p className="mb-8 text-muted">Create your account and start at Level 1.</p>

      {inviter && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-rose-500/30 bg-rose-500/5 p-4">
          <AvatarDisplay avatarUrl={inviter.avatar_url} avatar={inviter.avatar} size={40} />
          <p className="text-sm">
            <span className="font-bold">{inviter.username}</span> challenged you.
            Sign up and you're instantly in their weekly league — everyone
            starts from 0 on Monday.
          </p>
        </div>
      )}

      {searchParams.error && (
        <p className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {searchParams.error}
        </p>
      )}

      <form action={signUp} className="space-y-4">
        {inviter && <input type="hidden" name="ref" value={inviter.username} />}
        <input
          type="text"
          name="username"
          required
          placeholder="Username"
          className="w-full rounded-lg border border-line bg-surface px-4 py-3 outline-none focus:border-forge"
        />
        <input
          type="email"
          name="email"
          required
          placeholder="Email"
          className="w-full rounded-lg border border-line bg-surface px-4 py-3 outline-none focus:border-forge"
        />
        <input
          type="password"
          name="password"
          required
          placeholder="Password (min 6 characters)"
          className="w-full rounded-lg border border-line bg-surface px-4 py-3 outline-none focus:border-forge"
        />
        <SubmitButton
          pendingText="Creating account…"
          className="w-full rounded-lg bg-forge py-3 font-bold text-neutral-950 transition hover:bg-forge-soft"
        >
          Create account
        </SubmitButton>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-forge">
          Log in
        </Link>
      </p>
    </main>
  );
}
