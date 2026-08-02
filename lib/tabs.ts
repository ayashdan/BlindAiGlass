// The five main screens — shared by BottomNav (tap) and SwipeNav (swipe) so
// both agree on what "next" and "previous" mean.
export type Tab = { href: string; label: string; icon: string; primary?: boolean };

export const TAB_ORDER: Tab[] = [
  { href: "/dashboard", label: "Home", icon: "🏠" },
  { href: "/leaderboard", label: "Ranks", icon: "🏆" },
  { href: "/workout", label: "Log", icon: "➕", primary: true },
  { href: "/friends", label: "Friends", icon: "🤝" },
  { href: "/profile", label: "You", icon: "👤" },
];
