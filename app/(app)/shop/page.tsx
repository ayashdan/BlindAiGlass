import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  PLUS_BORDERS,
  PLUS_FEATURES,
  PLUS_PRICE_LABEL,
  FREE_FOREVER,
} from "@/lib/game/shop";
import SubmitButton from "@/components/SubmitButton";
import { togglePlusInterest } from "./actions";

// The Forge Plus preview. Nothing is purchasable (no payment processor is
// wired up, deliberately — see the README product note), so this screen does
// two honest things: shows exactly what Plus will and won't be, and counts
// who wants it via the "Notify me" list.
export default async function ShopPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: interest } = await supabase
    .from("plus_interest")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  const interested = Boolean(interest);

  return (
    <main className="mx-auto max-w-lg px-6 py-12">
      <Link href="/dashboard" className="text-sm text-muted hover:text-fg">
        ← Back
      </Link>
      <h1 className="mb-1 mt-3 text-2xl font-black tracking-tight">⭐ Forge Plus</h1>
      <p className="mb-6 text-sm text-muted">
        One subscription, cosmetics and comfort only — never XP, never a
        shortcut past the people actually putting the work in.
      </p>

      {/* The Plus card */}
      <section className="forge-panel forge-panel-hot p-5">
        <div className="flex items-baseline justify-between">
          <p className="font-display text-lg font-bold">Forge Plus</p>
          <span className="rounded-full bg-amber-500/15 px-3 py-1 text-sm font-semibold text-amber-400">
            {PLUS_PRICE_LABEL}
          </span>
        </div>
        <ul className="mt-3 space-y-2">
          {PLUS_FEATURES.map((f) => (
            <li key={f} className="flex gap-2 text-sm">
              <span className="text-amber-400">✦</span>
              <span>{f}</span>
            </li>
          ))}
        </ul>

        <form action={togglePlusInterest} className="mt-4">
          {interested ? (
            <SubmitButton className="press w-full rounded-lg border border-emerald-500/50 bg-emerald-500/10 py-2.5 text-sm font-bold text-emerald-300 transition hover:border-emerald-400">
              ✅ You're on the list — we'll tell you when Plus launches
            </SubmitButton>
          ) : (
            <SubmitButton
              pendingText="Adding…"
              className="press w-full rounded-lg bg-forge py-2.5 text-sm font-bold text-neutral-950 transition hover:bg-forge-soft"
            >
              🔔 Notify me when Plus launches
            </SubmitButton>
          )}
        </form>
        <p className="mt-2 text-center text-xs text-muted">
          Payments aren't live yet — this just registers interest, nothing is
          charged.
        </p>
      </section>

      {/* Border previews */}
      <section className="mt-6">
        <p className="text-sm font-black uppercase tracking-wide text-amber-400">
          Plus borders
        </p>
        <p className="mb-3 mt-0.5 text-xs text-muted">
          Animated rings included with Plus — permanent, cosmetic only, never
          affects gameplay.
        </p>
        <div className="grid grid-cols-2 gap-3">
          {PLUS_BORDERS.map((b) => (
            <div key={b.key} className="forge-panel flex flex-col items-center gap-2 p-4 text-center">
              <div className={`shop-ring ${b.previewClass}`}>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-bg text-2xl">
                  {b.icon}
                </div>
              </div>
              <p className="text-sm font-bold leading-tight">{b.name}</p>
              <p className="text-xs text-muted">{b.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* The free-forever promise, stated where the money lives */}
      <section className="mt-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5">
        <p className="text-sm font-black uppercase tracking-wide text-emerald-400">
          Free forever
        </p>
        <ul className="mt-2 space-y-1.5">
          {FREE_FOREVER.map((f) => (
            <li key={f} className="flex gap-2 text-sm">
              <span className="text-emerald-400">✓</span>
              <span>{f}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-muted">
          Everything you need to play and compete stays free. Plus is extras,
          not the game.
        </p>
      </section>
    </main>
  );
}
