// The monetisation surface, post-detox (see docs/social-growth-review.md).
//
// What used to be here — purchasable XP, XP boosts, paid randomised chests,
// and a paid Streak Restore — was cut deliberately:
//  - Selling XP makes every leaderboard pay-to-win the day payments go live.
//  - A paid randomised chest is a loot box, whatever the disclosed odds —
//    not something to sell to a young audience.
//  - Streak Restore monetises the app's most painful moment.
//
// What remains is the plan Forge can defend: one subscription ("Forge Plus")
// that bundles exclusive cosmetics and comfort features, previewed honestly
// before any payment processor exists. Core logging, streaks, quests,
// leaderboards, friends, and the league stay free forever.

export type ShopBorder = {
  key: string;
  name: string;
  description: string;
  icon: string;
  // Animated ring preview classes (see globals.css .shop-ring-*) —
  // deliberately fancier than the solid borders achievements unlock.
  previewClass: string;
};

export const PLUS_BORDERS: ShopBorder[] = [
  {
    key: "border_inferno",
    name: "Inferno Ring",
    description: "A molten, ever-shifting ring of orange and red.",
    icon: "🔥",
    previewClass: "shop-ring-inferno",
  },
  {
    key: "border_frostbite",
    name: "Frostbite Ring",
    description: "A cold shimmer of blue and white.",
    icon: "❄️",
    previewClass: "shop-ring-frost",
  },
  {
    key: "border_royal",
    name: "Royal Gold",
    description: "A slow-spinning band of gold.",
    icon: "👑",
    previewClass: "shop-ring-gold",
  },
  {
    key: "border_void",
    name: "Void Ring",
    description: "A deep violet-to-black gradient.",
    icon: "🌌",
    previewClass: "shop-ring-void",
  },
];

export type ShopTitle = { key: string; name: string; description: string };

// Direct-pick titles, same "vault" principle as the borders above —
// deterministic, never a randomized pull.
export const PLUS_TITLES: ShopTitle[] = [
  { key: "title_ironwill", name: "Iron Will", description: "A Plus-exclusive title." },
  { key: "title_unbreakable", name: "Unbreakable", description: "A Plus-exclusive title." },
  { key: "title_forged", name: "Forged", description: "A Plus-exclusive title." },
];

export const PLUS_PRICE_LABEL = "$2.99/mo · planned";

export const PLUS_FEATURES: string[] = [
  "The cosmetic vault: every animated border and exclusive title, pick freely, no randomness",
  "Insights: muscle-group balance, training trends, a weekly recap, and your full PR board",
  "A parallel season-pass track — bonus cosmetics at the same tiers everyone earns for free",
  "A custom quest slot — write your own daily mission",
  "Streak-freeze bank raised from 2 to 3",
];

export const FREE_FOREVER: string[] = [
  "Logging workouts (as many as you want), streaks, and quests",
  "Leaderboards, friends, the weekly league, and hype",
  "Achievements, earned chests, and season pass",
];
