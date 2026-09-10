// The item shop catalog. Static for now (like QUEST_TEMPLATES /
// ACHIEVEMENT_COSMETICS) since nothing here is actually purchasable yet —
// no payment processor is wired up (see ShopItemCard), so there's no real
// fulfillment/entitlement flow to build until that exists. Prices are in
// whole US cents, priced like typical mobile-game cosmetic IAPs.
export type ShopItem = {
  key: string;
  name: string;
  description: string;
  icon: string;
  priceCents: number;
  // Shop-exclusive border preview classes — deliberately fancier (gradient/
  // animated) than the plain solid-color borders achievements unlock, so
  // paying for one feels distinct from earning one.
  previewClass?: string;
};

export type ShopCategory = {
  key: string;
  title: string;
  blurb: string;
  accent: string; // tailwind color token used for the section's icon/heading
  items: ShopItem[];
};

export const SHOP_CATEGORIES: ShopCategory[] = [
  {
    key: "chests",
    title: "Chests",
    blurb:
      "Common and Rare also drop free from playing — buying just skips the wait. Legendary is shop-only.",
    accent: "amber",
    items: [
      {
        key: "chest_common",
        name: "Common Chest",
        description: "10-25 XP. Same one that drops from logging a workout.",
        icon: "📦",
        priceCents: 99,
      },
      {
        key: "chest_rare",
        name: "Rare Chest",
        description: "40-80 XP, 25% chance of a bonus streak freeze.",
        icon: "💎",
        priceCents: 199,
      },
      {
        key: "chest_legendary",
        name: "Legendary Chest",
        description: "150-300 XP, always includes a streak freeze. Not earnable any other way.",
        icon: "👑",
        priceCents: 499,
      },
    ],
  },
  {
    key: "borders",
    title: "Avatar Borders",
    blurb: "Exclusive animated rings — permanent, cosmetic only, never affects gameplay.",
    accent: "fuchsia",
    items: [
      {
        key: "border_inferno",
        name: "Inferno Ring",
        description: "A molten, ever-shifting ring of orange and red.",
        icon: "🔥",
        priceCents: 299,
        previewClass: "shop-ring-inferno",
      },
      {
        key: "border_frostbite",
        name: "Frostbite Ring",
        description: "A cold shimmer of blue and white.",
        icon: "❄️",
        priceCents: 299,
        previewClass: "shop-ring-frost",
      },
      {
        key: "border_royal",
        name: "Royal Gold",
        description: "A slow-spinning band of gold.",
        icon: "👑",
        priceCents: 399,
        previewClass: "shop-ring-gold",
      },
      {
        key: "border_void",
        name: "Void Ring",
        description: "A deep violet-to-black gradient.",
        icon: "🌌",
        priceCents: 399,
        previewClass: "shop-ring-void",
      },
    ],
  },
  {
    key: "boosts",
    title: "XP Boosts",
    blurb: "Temporary or one-time XP — never required to keep up, just a shortcut.",
    accent: "amber",
    items: [
      {
        key: "boost_25_24h",
        name: "+25% XP — 24 Hours",
        description: "Every workout logged in the next day earns 25% more XP.",
        icon: "⚡",
        priceCents: 199,
      },
      {
        key: "boost_50_3d",
        name: "+50% XP — 3 Days",
        description: "A bigger boost for a long weekend push.",
        icon: "⚡",
        priceCents: 499,
      },
      {
        key: "boost_instant_500",
        name: "Instant +500 XP",
        description: "Applied immediately to your total — no expiry, no conditions.",
        icon: "💥",
        priceCents: 299,
      },
    ],
  },
  {
    key: "missions",
    title: "Custom Missions",
    blurb: "Write your own daily quest instead of picking from the catalog.",
    accent: "sky",
    items: [
      {
        key: "custom_quest_week",
        name: "Custom Quest Slot — 1 Week",
        description: "Set your own daily mission (title, XP, target) for 7 days.",
        icon: "📝",
        priceCents: 399,
      },
      {
        key: "custom_quest_month",
        name: "Custom Quest Slot — 1 Month",
        description: "Same as above, locked in for 30 days.",
        icon: "📝",
        priceCents: 999,
      },
    ],
  },
  {
    key: "utility",
    title: "Streak Protection",
    blurb: "Freezes are also earned for free every 7-day streak — these are shortcuts, not requirements.",
    accent: "cyan",
    items: [
      {
        key: "freeze_pack_2",
        name: "2× Streak Freeze",
        description: "Adds 2 streak freezes to your bank, up to the usual cap. Protects a future missed day.",
        icon: "🧊",
        priceCents: 199,
      },
      {
        key: "streak_restore",
        name: "Streak Restore",
        description: "Already broke your streak? Brings it back to what it was before the miss — one-time, retroactive.",
        icon: "⏪",
        priceCents: 499,
      },
    ],
  },
];

export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}
