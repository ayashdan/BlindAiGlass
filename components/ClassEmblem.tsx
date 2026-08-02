import type { CharacterClass } from "@/lib/game/stats";

// A class-colored heraldic badge behind the avatar — right now "your
// character" is just an emoji in a plain circle with no visual identity of
// its own. Meant to sit behind AvatarDisplay in a position:relative wrapper.
const PALETTES: Record<CharacterClass, { from: string; to: string; glow: string }> = {
  Titan: { from: "#fb7185", to: "#7f1d1d", glow: "rgb(251 113 133 / 0.4)" },
  Warden: { from: "#38bdf8", to: "#0c4a6e", glow: "rgb(56 189 248 / 0.4)" },
  Ranger: { from: "#34d399", to: "#064e3b", glow: "rgb(52 211 153 / 0.4)" },
  Adept: { from: "#a78bfa", to: "#4c1d95", glow: "rgb(167 139 250 / 0.4)" },
};

export default function ClassEmblem({
  charClass,
  size = 130,
}: {
  charClass: CharacterClass;
  size?: number;
}) {
  const p = PALETTES[charClass];
  const points = hexPoints(size / 2, size / 2, size / 2 - 4);

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      className="pointer-events-none absolute inset-0"
      style={{ filter: `drop-shadow(0 0 16px ${p.glow})` }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`emblem-${charClass}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={p.from} stopOpacity="0.4" />
          <stop offset="100%" stopColor={p.to} stopOpacity="0.08" />
        </linearGradient>
      </defs>
      <polygon
        points={points}
        fill={`url(#emblem-${charClass})`}
        stroke={p.from}
        strokeOpacity="0.55"
        strokeWidth="2"
      />
    </svg>
  );
}

function hexPoints(cx: number, cy: number, r: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 2;
    pts.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
  }
  return pts.join(" ");
}
