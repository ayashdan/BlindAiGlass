"use client";

// Every "Buy" button here is a placeholder — no payment processor is wired
// up yet (see the README note on why: Stripe/PayPal both require an adult
// account holder). Clicking it shows that honestly instead of pretending to
// charge a card or silently granting the item for free.
import { useState } from "react";
import type { ShopItem } from "@/lib/game/shop";
import { formatPrice } from "@/lib/game/shop";

export default function ShopItemCard({ item }: { item: ShopItem }) {
  const [clicked, setClicked] = useState(false);

  return (
    <div className="forge-panel p-4">
      <div className="flex items-start gap-3">
        {item.previewClass ? (
          <div className={`shop-ring ${item.previewClass} flex-shrink-0`}>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-bg text-2xl">
              {item.icon}
            </div>
          </div>
        ) : (
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border border-line bg-bg text-2xl">
            {item.icon}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="font-bold leading-tight">{item.name}</p>
          <p className="mt-0.5 text-xs text-muted">{item.description}</p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="font-mono text-sm font-black text-forge">
          {formatPrice(item.priceCents)}
        </span>
        {clicked ? (
          <span className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-muted">
            🚧 Coming soon
          </span>
        ) : (
          <button
            onClick={() => setClicked(true)}
            className="press-3d rounded-lg bg-forge px-3 py-1.5 text-xs font-bold text-neutral-950 transition hover:bg-forge-soft"
          >
            Buy
          </button>
        )}
      </div>
    </div>
  );
}
