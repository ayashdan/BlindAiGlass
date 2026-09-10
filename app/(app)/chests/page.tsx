import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CHEST_ORDER } from "@/lib/game/chests";
import ChestOpener from "@/components/ChestOpener";
import type { Profile } from "@/lib/types";

export default async function ChestsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("profiles")
    .select("chests_common, chests_rare, chests_legendary")
    .eq("id", user.id)
    .single();
  const profile = data as Pick<Profile, "chests_common" | "chests_rare" | "chests_legendary"> | null;

  const counts = {
    common: profile?.chests_common ?? 0,
    rare: profile?.chests_rare ?? 0,
    legendary: profile?.chests_legendary ?? 0,
  };

  return (
    <main className="mx-auto max-w-lg px-6 py-12">
      <Link href="/dashboard" className="text-sm text-muted hover:text-fg">
        ← Back
      </Link>
      <h1 className="mb-1 mt-3 text-2xl font-black tracking-tight">Chests</h1>
      <p className="mb-6 text-sm text-muted">
        Common drops every workout you log. Rare drops every 5 levels. Legendary is shop-only.
        Every reward's range is shown up front — no blind luck.
      </p>

      <div className="space-y-4">
        {CHEST_ORDER.map((tier) => (
          <ChestOpener key={tier} tier={tier} initialCount={counts[tier]} />
        ))}
      </div>

      <Link
        href="/shop"
        className="forge-panel press-3d forge-accent-fuchsia mt-6 flex items-center justify-between px-5 py-4 transition"
        style={{ "--press-shadow": "rgb(162 28 175 / 0.5)" } as React.CSSProperties}
      >
        <span className="font-bold">🛒 Buy more in the Shop</span>
        <span className="text-muted">→</span>
      </Link>
    </main>
  );
}
