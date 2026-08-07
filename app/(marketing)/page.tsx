import Link from "next/link";
import { joinWaitlist } from "./actions";
import ThemeToggle from "@/components/ThemeToggle";
import SubmitButton from "@/components/SubmitButton";
import PhoneMockup from "@/components/PhoneMockup";
import InstallBanner from "@/components/InstallBanner";

// Public landing + waitlist signup. (A referral link "?ref=CODE" pre-fills the
// hidden ref field so the inviter gets credit.)
export default function Home({
  searchParams,
}: {
  searchParams: { ref?: string; error?: string };
}) {
  const ref = searchParams.ref ?? "";

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <div className="flex justify-end">
        <ThemeToggle />
      </div>
      <p className="mt-4 text-center text-sm font-semibold uppercase tracking-[0.3em] text-forge">
        Forge
      </p>
      <h1 className="mt-4 text-center text-4xl font-black leading-tight tracking-tight sm:text-6xl">
        Turn your workouts into a <span className="text-forge">game.</span>
      </h1>
      <p className="mx-auto mt-5 max-w-lg text-center text-lg text-muted">
        Earn XP for every workout. Level up, keep your streak alive, unlock
        achievements, and rank from Beginner to Elite. Fitness that actually
        keeps you coming back.
      </p>
      <p className="mt-4 text-center">
        <Link href="/features" className="text-sm font-semibold text-forge hover:underline">
          See everything Forge does →
        </Link>
      </p>

      {/* A little mockup of the app itself, no screenshot needed */}
      <div className="mt-10">
        <PhoneMockup />
      </div>

      <InstallBanner />

      {/* Waitlist signup */}
      <section className="mx-auto mt-12 max-w-md">
        <h2 className="text-center text-xl font-black">Join the Forge waitlist</h2>
        <p className="mt-1 text-center text-sm text-muted">
          Be first in line for launch.
        </p>

        {searchParams.error && (
          <p className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {searchParams.error}
          </p>
        )}

        <form action={joinWaitlist} className="mt-5 space-y-3">
          <input type="hidden" name="ref" value={ref} />
          <input
            type="text"
            name="name"
            placeholder="Name (optional)"
            className="w-full rounded-lg border border-line bg-surface px-4 py-3 outline-none focus:border-forge"
          />
          <input
            type="email"
            name="email"
            required
            placeholder="Email"
            className="w-full rounded-lg border border-line bg-surface px-4 py-3 outline-none focus:border-forge"
          />
          <SubmitButton
            pendingText="Joining…"
            className="w-full rounded-lg bg-forge py-3 font-black text-neutral-950 transition hover:bg-forge-soft"
          >
            Join the Forge waitlist
          </SubmitButton>
        </form>

        {ref && (
          <p className="mt-3 text-center text-xs text-forge">
            🎉 You were invited by a friend!
          </p>
        )}
      </section>

      <p className="mt-10 text-center text-sm text-muted">
        Already have access?{" "}
        <Link href="/login" className="font-semibold text-forge">
          Log in
        </Link>
      </p>
    </main>
  );
}
