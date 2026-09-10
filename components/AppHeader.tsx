"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { Profile } from "@/lib/types";
import { signOut } from "@/app/(app)/actions";
import SubmitButton from "@/components/SubmitButton";
import ThemeToggle from "@/components/ThemeToggle";

const NAV = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/projects", label: "Projects" },
];

export default function AppHeader({ profile }: { profile: Profile | null }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const initials =
    (profile?.full_name ?? profile?.email ?? "?")
      .split(" ")
      .map((s) => s[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?";

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-bg/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2 font-black tracking-tight">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-sm text-white">
              BR
            </span>
            <span className="hidden sm:inline">
              Bay<span className="text-brand">Ran</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-1 sm:flex">
            {NAV.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                    active ? "bg-surface2 text-fg" : "text-muted hover:text-fg"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2">
        <ThemeToggle />
        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-xs font-bold text-white"
            aria-label="Account menu"
          >
            {initials}
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 z-20 mt-2 w-56 rounded-lg border border-line bg-surface p-2 shadow-lg">
                <div className="border-b border-line px-2 pb-2 pt-1">
                  <p className="truncate text-sm font-semibold">
                    {profile?.full_name ?? "Team member"}
                  </p>
                  <p className="truncate text-xs text-muted">{profile?.email}</p>
                </div>
                <form action={signOut} className="pt-2">
                  <SubmitButton
                    pendingText="Signing out…"
                    className="w-full rounded-md px-2 py-2 text-left text-sm font-medium text-red-400 hover:bg-surface2"
                  >
                    Sign out
                  </SubmitButton>
                </form>
              </div>
            </>
          )}
        </div>
        </div>
      </div>
      <nav className="flex items-center gap-1 overflow-x-auto border-t border-line px-4 py-1.5 sm:hidden">
        {NAV.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                active ? "bg-surface2 text-fg" : "text-muted"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
