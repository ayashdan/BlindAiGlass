"use client";

// Persistent tab bar across every logged-in screen. Before this, getting
// anywhere meant scrolling down to a grid of links buried mid-dashboard —
// now the five places you actually go are always one tap away, and it's
// always visible which one you're on.
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS: { href: string; label: string; icon: string; primary?: boolean }[] = [
  { href: "/dashboard", label: "Home", icon: "🏠" },
  { href: "/leaderboard", label: "Ranks", icon: "🏆" },
  { href: "/workout", label: "Log", icon: "➕", primary: true },
  { href: "/friends", label: "Friends", icon: "🤝" },
  { href: "/profile", label: "You", icon: "👤" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface/90 backdrop-blur-md"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto flex max-w-lg items-end justify-between px-4 pb-2 pt-2">
        {TABS.map((tab) => {
          const active = pathname === tab.href || pathname?.startsWith(tab.href + "/");

          if (tab.primary) {
            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-label="Log a workout"
                className="press -mt-6 flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-forge to-rose-500 text-2xl text-neutral-950 shadow-lg shadow-forge/30 transition hover:from-forge-soft hover:to-rose-400"
              >
                {tab.icon}
              </Link>
            );
          }

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={
                "press flex flex-1 flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 text-[10px] font-bold transition " +
                (active ? "text-forge" : "text-muted hover:text-fg")
              }
            >
              <span className={"text-lg leading-none " + (active ? "" : "opacity-70")}>
                {tab.icon}
              </span>
              {tab.label}
              {active && <span className="mt-0.5 h-1 w-1 rounded-full bg-forge" />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
