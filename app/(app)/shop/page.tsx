import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SHOP_CATEGORIES } from "@/lib/game/shop";
import ShopItemCard from "@/components/ShopItemCard";

const ACCENT_TEXT: Record<string, string> = {
  fuchsia: "text-fuchsia-400",
  amber: "text-amber-400",
  sky: "text-sky-400",
  cyan: "text-cyan-400",
};

export default async function ShopPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <main className="mx-auto max-w-lg px-6 py-12">
      <Link href="/dashboard" className="text-sm text-muted hover:text-fg">
        ← Back
      </Link>
      <h1 className="mb-1 mt-3 text-2xl font-black tracking-tight">🛒 Shop</h1>
      <p className="mb-6 text-sm text-muted">
        Cosmetics and shortcuts — nothing here is required to play or to keep
        up on the leaderboard.
      </p>

      <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-300">
        🚧 The shop is a preview — payments aren't live yet, so nothing can
        be purchased right now. Prices below are what's planned at launch.
      </div>

      <div className="space-y-8">
        {SHOP_CATEGORIES.map((cat) => (
          <section key={cat.key}>
            <p className={`text-sm font-black uppercase tracking-wide ${ACCENT_TEXT[cat.accent] ?? "text-forge"}`}>
              {cat.title}
            </p>
            <p className="mb-3 mt-0.5 text-xs text-muted">{cat.blurb}</p>
            <div className="space-y-3">
              {cat.items.map((item) => (
                <ShopItemCard key={item.key} item={item} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
