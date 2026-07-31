import type { ChestTier } from "@/lib/game/chests";

// An actual illustrated chest per tier — wood+bronze for Common, silver+blue
// for Rare, gold+purple gems for Legendary — instead of a single emoji, so
// the rarity reads at a glance the way it does in Clash Royale/Brawl Stars.
const PALETTES: Record<
  ChestTier,
  {
    bodyFrom: string;
    bodyTo: string;
    outline: string;
    lidFrom: string;
    lidTo: string;
    metal: string;
    metalDark: string;
    gem: string;
    gemDark: string;
  }
> = {
  common: {
    bodyFrom: "#b07b45",
    bodyTo: "#7a4e28",
    outline: "#4a2e15",
    lidFrom: "#c48c52",
    lidTo: "#8a5a30",
    metal: "#d97706",
    metalDark: "#78350f",
    gem: "#34d399",
    gemDark: "#047857",
  },
  rare: {
    bodyFrom: "#aebccb",
    bodyTo: "#546074",
    outline: "#242c38",
    lidFrom: "#cdd9e6",
    lidTo: "#6b7889",
    metal: "#38bdf8",
    metalDark: "#0369a1",
    gem: "#7dd3fc",
    gemDark: "#0284c7",
  },
  legendary: {
    bodyFrom: "#fcd34d",
    bodyTo: "#b45309",
    outline: "#6b3a06",
    lidFrom: "#fde68a",
    lidTo: "#d97706",
    metal: "#c084fc",
    metalDark: "#6d28d9",
    gem: "#e879f9",
    gemDark: "#a21caf",
  },
};

export default function ChestGraphic({
  tier,
  open = false,
  className = "",
}: {
  tier: ChestTier;
  open?: boolean;
  className?: string;
}) {
  const p = PALETTES[tier];
  const uid = tier; // one instance per tier per page — safe as a gradient id

  return (
    <svg viewBox="0 0 120 104" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={`body-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={p.bodyFrom} />
          <stop offset="100%" stopColor={p.bodyTo} />
        </linearGradient>
        <linearGradient id={`lid-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={p.lidFrom} />
          <stop offset="100%" stopColor={p.lidTo} />
        </linearGradient>
      </defs>

      <ellipse cx="60" cy="97" rx="40" ry="5" fill="black" opacity="0.28" />

      {/* dark interior, revealed once the lid swings back */}
      <rect x="16" y="44" width="88" height="16" rx="4" fill="#1a1006" opacity={open ? 1 : 0} />

      {/* body */}
      <rect
        x="12"
        y="52"
        width="96"
        height="42"
        rx="8"
        fill={`url(#body-${uid})`}
        stroke={p.outline}
        strokeWidth="2"
      />
      <rect x="12" y="67" width="96" height="10" fill={p.metal} stroke={p.metalDark} strokeWidth="1.5" />
      <circle cx="20" cy="60" r="2.4" fill={p.metal} stroke={p.metalDark} strokeWidth="0.5" />
      <circle cx="100" cy="60" r="2.4" fill={p.metal} stroke={p.metalDark} strokeWidth="0.5" />
      <circle cx="20" cy="86" r="2.4" fill={p.metal} stroke={p.metalDark} strokeWidth="0.5" />
      <circle cx="100" cy="86" r="2.4" fill={p.metal} stroke={p.metalDark} strokeWidth="0.5" />

      {/* the lock — only shown closed */}
      {!open && (
        <g>
          <rect x="51" y="63" width="18" height="15" rx="3" fill={p.gem} stroke={p.gemDark} strokeWidth="1.5" />
          <circle cx="60" cy="70" r="2.2" fill={p.gemDark} />
        </g>
      )}

      {/* lid — hinges open (2D rotate/translate, no 3D perspective needed) */}
      <g
        style={{
          transformOrigin: "16px 52px",
          transform: open ? "translate(2px, -20px) rotate(-32deg)" : "translate(0, 0) rotate(0deg)",
          transition: "transform 0.55s cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
      >
        <path
          d="M 12 52 Q 12 16 60 14 Q 108 16 108 52 Z"
          fill={`url(#lid-${uid})`}
          stroke={p.outline}
          strokeWidth="2"
        />
        <rect x="12" y="41" width="96" height="8" fill={p.metal} stroke={p.metalDark} strokeWidth="1.5" />
        {tier === "legendary" && (
          <polygon points="60,19 65,28 55,28" fill={p.gem} stroke={p.gemDark} strokeWidth="1" />
        )}
        {tier === "rare" && <circle cx="60" cy="24" r="4" fill={p.gem} stroke={p.gemDark} strokeWidth="1" />}
      </g>
    </svg>
  );
}
