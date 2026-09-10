"use client";

import { useState } from "react";

// Uses the native share sheet on phones (navigator.share); falls back to
// copying the text on desktop browsers that don't support it. No external
// service, no image generation — just an honest, free way to share a stat.
export default function ShareButton({
  text,
  label = "Share",
  className = "",
}: {
  text: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({ text, title: "Forge" });
        return;
      } catch {
        // User cancelled or share failed — fall back to clipboard below.
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard blocked — nothing more we can do.
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className={
        "press rounded-lg border border-line bg-surface px-3 py-2 text-sm font-bold transition hover:border-forge/50 " +
        className
      }
    >
      {copied ? "Copied! ✅" : `📤 ${label}`}
    </button>
  );
}
