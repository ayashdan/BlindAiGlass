"use client";

import { useEffect, useState } from "react";

// Android/Chrome/Edge fire `beforeinstallprompt` and let us trigger the
// native install flow. iOS Safari doesn't support that API at all — the
// only way to install there is the manual Share -> Add to Home Screen
// flow, so we show a hint instead of a real prompt.
export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [installed, setInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSHint, setShowIOSHint] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    setInstalled(standalone);
    setIsIOS(/iPad|iPhone|iPod/.test(window.navigator.userAgent));

    function onBeforeInstallPrompt(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e);
    }
    function onInstalled() {
      setInstalled(true);
      setDeferredPrompt(null);
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed) return null;

  async function install() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  }

  if (deferredPrompt) {
    return (
      <button
        onClick={install}
        className="press rounded-lg border border-forge/40 bg-forge/5 px-3 py-2 text-sm font-bold text-forge transition hover:bg-forge/10"
      >
        📲 Install
      </button>
    );
  }

  if (isIOS) {
    return (
      <div className="relative">
        <button
          onClick={() => setShowIOSHint((v) => !v)}
          className="press rounded-lg border border-forge/40 bg-forge/5 px-3 py-2 text-sm font-bold text-forge transition hover:bg-forge/10"
        >
          📲 Install
        </button>
        {showIOSHint && (
          <div className="absolute right-0 top-full z-20 mt-2 w-56 rounded-lg border border-line bg-surface p-3 text-left text-xs font-normal text-fg shadow-lg">
            Tap the Share icon <span className="font-bold">⬆️</span>, then{" "}
            <span className="font-bold">"Add to Home Screen."</span>
          </div>
        )}
      </div>
    );
  }

  return null;
}
