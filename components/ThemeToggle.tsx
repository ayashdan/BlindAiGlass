"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const stored = localStorage.getItem("forge-theme");
    setTheme(stored === "light" ? "light" : "dark");
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("forge-theme", next);
    document.documentElement.classList.toggle("light", next === "light");
  }

  return (
    <button
      onClick={toggle}
      aria-label="Toggle light/dark mode"
      title="Toggle light/dark mode"
      className="press rounded-lg border border-line bg-surface px-3 py-2 text-sm transition hover:border-forge/50"
    >
      {theme === "dark" ? "☀️" : "🌙"}
    </button>
  );
}
