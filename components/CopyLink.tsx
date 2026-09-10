"use client";

import { useState } from "react";

export default function CopyLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard blocked — the link is still shown for manual copying
    }
  }

  return (
    <button
      onClick={copy}
      className="w-full rounded-lg bg-forge py-3 font-bold text-neutral-950 transition hover:bg-forge-soft"
    >
      {copied ? "Copied! ✅" : "Copy invite link"}
    </button>
  );
}
