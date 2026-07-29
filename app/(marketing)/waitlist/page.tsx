import Link from "next/link";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import CopyLink from "@/components/CopyLink";

// Shows a person's waitlist position and their referral link.
export default async function WaitlistPage({
  searchParams,
}: {
  searchParams: { code?: string };
}) {
  const code = searchParams.code ?? "";
  const supabase = createClient();
  const { data } = await supabase.rpc("waitlist_position", { p_code: code });

  if (!code || !data) {
    return (
      <main className="mx-auto max-w-md px-6 py-20 text-center">
        <p className="text-muted">
          We couldn&apos;t find that waitlist spot.
        </p>
        <Link href="/" className="mt-4 inline-block font-semibold text-forge">
          ← Back to the waitlist
        </Link>
      </main>
    );
  }

  const info = data as {
    position: number;
    referral_count: number;
    total: number;
    code: string;
  };

  // Build the shareable invite link from the current host.
  const host = headers().get("host") ?? "";
  const proto = host.startsWith("localhost") ? "http" : "https";
  const inviteUrl = `${proto}://${host}/?ref=${info.code}`;

  return (
    <main className="mx-auto max-w-md px-6 py-16 text-center">
      <div className="text-5xl">🔥</div>
      <h1 className="mt-4 text-2xl font-black">You&apos;re on the list!</h1>

      <div className="mt-6 rounded-2xl border border-line bg-surface p-8">
        <p className="text-sm uppercase tracking-widest text-muted">
          Your position
        </p>
        <p className="mt-1 text-5xl font-black text-forge">#{info.position}</p>
        <p className="mt-1 text-sm text-muted">of {info.total} in line</p>
      </div>

      <div className="mt-6 rounded-2xl border border-line bg-surface p-6">
        <p className="font-bold">Invite friends to move up ⬆️</p>
        <p className="mt-1 text-sm text-muted">
          Every friend who joins with your link bumps you higher. You&apos;ve
          referred <span className="font-semibold text-forge">{info.referral_count}</span>{" "}
          so far.
        </p>
        <div className="mt-4 break-all rounded-lg border border-line bg-bg px-3 py-2 text-sm text-fg">
          {inviteUrl}
        </div>
        <div className="mt-3">
          <CopyLink url={inviteUrl} />
        </div>
      </div>

      <Link href="/" className="mt-8 inline-block text-sm text-muted hover:text-fg">
        ← Back home
      </Link>
    </main>
  );
}
