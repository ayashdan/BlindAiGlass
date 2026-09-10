"use client";

import { useEffect, useState } from "react";
import { isSoundMuted, setSoundMuted } from "@/lib/sound";

export default function SoundToggle() {
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    setMuted(isSoundMuted());
  }, []);

  function toggle() {
    const next = !muted;
    setMuted(next);
    setSoundMuted(next);
  }

  return (
    <button
      onClick={toggle}
      aria-label={muted ? "Unmute sound effects" : "Mute sound effects"}
      title={muted ? "Unmute sound effects" : "Mute sound effects"}
      className="press rounded-lg border border-line bg-surface px-3 py-2 text-sm transition hover:border-forge/50"
    >
      {muted ? "🔇" : "🔊"}
    </button>
  );
}
