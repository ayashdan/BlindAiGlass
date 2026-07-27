import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

// The public home screen. A full marketing landing page comes in Phase 5;
// for now this just routes people into the app.
export default async function Home() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-6 text-center">
      <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-forge">
        Forge
      </p>
      <h1 className="text-4xl font-black leading-tight tracking-tight sm:text-6xl">
        Work out like it&apos;s a{" "}
        <span className="text-forge">video game.</span>
      </h1>
      <p className="mt-5 max-w-lg text-lg text-neutral-400">
        Earn XP for every workout. Level up. Keep your streak alive. Rank from
        Beginner all the way to Elite.
      </p>

      <div className="mt-10 flex gap-3">
        {user ? (
          <Link
            href="/dashboard"
            className="rounded-lg bg-forge px-6 py-3 font-bold text-neutral-950 transition hover:bg-forge-soft"
          >
            Enter the Forge
          </Link>
        ) : (
          <>
            <Link
              href="/signup"
              className="rounded-lg bg-forge px-6 py-3 font-bold text-neutral-950 transition hover:bg-forge-soft"
            >
              Get started
            </Link>
            <Link
              href="/login"
              className="rounded-lg border border-neutral-800 px-6 py-3 font-bold transition hover:border-neutral-600"
            >
              Log in
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
