"use client";

import { useEffect, useState } from "react";

// A dismissible "install as an app" banner for the public marketing pages
// (home, waitlist) — unlike InstallPrompt (a small button in the
// authenticated dashboard header that can trigger Android/Chrome's native
// `beforeinstallprompt` flow), there's no signed-in user here yet, so this
// just teaches the manual Share -> Add to Home Screen steps for both
// platforms. Dismissal and "already installed" both persist/suppress via
// localStorage/display-mode so it doesn't nag on every visit.
const DISMISS_KEY = "forge-install-banner-dismissed";

export default function InstallBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    const dismissed = localStorage.getItem(DISMISS_KEY) === "1";
    setVisible(!standalone && !dismissed);
  }, []);

  if (!visible) return null;

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  }

  return (
    <div className="forge-panel forge-accent-emerald mt-8 px-5 py-4 text-left">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="text-2xl">📲</span>
          <div>
            <p className="font-bold">Install Forge as an app — it&apos;s better</p>
            <p className="mt-0.5 text-sm text-muted">
              Add it to your home screen: no browser bar, opens instantly, and
              push notifications actually work.
            </p>
          </div>
        </div>
        <button
          onClick={dismiss}
          aria-label="Dismiss install instructions"
          className="press flex-shrink-0 text-lg text-muted transition hover:text-fg"
        >
          ✕
        </button>
      </div>

      <div className="mt-4 grid gap-4 border-t border-line pt-4 text-sm sm:grid-cols-2">
        <div>
          <p className="font-bold">🍎 iPhone / iPad</p>
          <ol className="mt-1.5 list-decimal space-y-1 pl-4 text-muted">
            <li>
              Open in <span className="font-semibold text-fg">Safari</span>
            </li>
            <li>
              Tap the <span className="font-semibold text-fg">Share</span> icon
            </li>
            <li>
              <span className="font-semibold text-fg">Add to Home Screen</span>
            </li>
            <li>
              Tap <span className="font-semibold text-fg">Add</span>
            </li>
          </ol>
        </div>
        <div>
          <p className="font-bold">🤖 Android</p>
          <ol className="mt-1.5 list-decimal space-y-1 pl-4 text-muted">
            <li>
              Open in <span className="font-semibold text-fg">Chrome</span>
            </li>
            <li>
              Tap the <span className="font-semibold text-fg">menu ⋮</span>
            </li>
            <li>
              <span className="font-semibold text-fg">Add to Home Screen</span>
            </li>
            <li>
              Tap <span className="font-semibold text-fg">Add</span>
            </li>
          </ol>
        </div>
      </div>

      <p className="mt-3 text-center text-xs text-muted">
        Already installed?{" "}
        <button onClick={dismiss} className="font-semibold text-forge hover:underline">
          Dismiss this notice
        </button>
      </p>
    </div>
  );
}
