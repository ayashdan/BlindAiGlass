import { MAX_LEVEL } from "@/lib/game/leveling";

// A winding path of waypoints from level 5 to MAX_LEVEL, one every 5 levels
// (matching Rare Chest drops) — the classic "level map" mobile-game layout,
// reskinned as a descent into the forge: a dusk sky up top cooling into an
// ember-lit depth as the journey goes on, with glowing distant light
// sources and drifting cloud wisps for depth instead of a flat line on a
// plain card.
const RANK_LEVELS = new Set([10, 20, 35, 55, 75, 90]);
const NODE_SPACING = 108;
const TOP_PADDING = 50;
const BOTTOM_PADDING = 50;

export default function WorldMapPath({ currentLevel }: { currentLevel: number }) {
  const levels: number[] = [];
  for (let l = 5; l <= MAX_LEVEL; l += 5) levels.push(l);

  const width = 300;
  const height = TOP_PADDING + (levels.length - 1) * NODE_SPACING + BOTTOM_PADDING;

  const points = levels.map((level, i) => ({
    level,
    x: i % 2 === 0 ? width * 0.32 : width * 0.68,
    y: TOP_PADDING + i * NODE_SPACING,
    isRank: RANK_LEVELS.has(level),
    reached: currentLevel >= level,
  }));

  const currentIndex = points.findIndex((p) => !p.reached);
  const traveledUpTo = currentIndex === -1 ? points.length - 1 : currentIndex;

  let pathD = "";
  points.forEach((p, i) => {
    if (i === 0) {
      pathD += `M ${p.x} ${p.y}`;
    } else {
      const prev = points[i - 1];
      const midY = (prev.y + p.y) / 2;
      pathD += ` C ${prev.x} ${midY}, ${p.x} ${midY}, ${p.x} ${p.y}`;
    }
  });

  // Deterministic "random" glow blobs and cloud wisps, seeded off the
  // level number so it's stable across re-renders instead of reshuffling.
  const glowBlobs = points.filter((_, i) => i % 3 === 1);
  const clouds = Array.from({ length: Math.ceil(height / 260) }, (_, i) => {
    const seed = (i * 37) % 100;
    return {
      x: 20 + ((seed * 2.6) % (width - 60)),
      y: 40 + i * 260 + (seed % 40),
      w: 46 + (seed % 30),
    };
  });

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height }}>
      <defs>
        <linearGradient id="map-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1b1230" />
          <stop offset="45%" stopColor="#1a1512" />
          <stop offset="100%" stopColor="#3a1608" />
        </linearGradient>
        <radialGradient id="map-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ff6a1a" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#ff6a1a" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Sky */}
      <rect x="0" y="0" width={width} height={height} fill="url(#map-sky)" />

      {/* Distant glow blobs, brighter the deeper (further along) they are */}
      {glowBlobs.map((p, i) => (
        <circle
          key={`glow-${p.level}`}
          cx={p.x > width / 2 ? p.x - 60 : p.x + 60}
          cy={p.y}
          r={70}
          fill="url(#map-glow)"
          opacity={0.3 + (i / glowBlobs.length) * 0.5}
        />
      ))}

      {/* Cloud wisps */}
      {clouds.map((c, i) => (
        <ellipse key={i} cx={c.x} cy={c.y} rx={c.w} ry={c.w * 0.22} fill="#f5f5f5" opacity="0.045" />
      ))}

      {/* Path — a dim base trail, an ember-lit trail over the ground already covered */}
      <path d={pathD} fill="none" stroke="#000000" strokeOpacity="0.25" strokeWidth="10" strokeLinecap="round" />
      <path d={pathD} fill="none" stroke="#3f3f46" strokeWidth="6" strokeLinecap="round" />
      {traveledUpTo > 0 && (
        <>
          <path
            d={buildPartialPath(points, traveledUpTo)}
            fill="none"
            stroke="#ff6a1a"
            strokeWidth="12"
            strokeLinecap="round"
            opacity="0.35"
          />
          <path
            d={buildPartialPath(points, traveledUpTo)}
            fill="none"
            stroke="#ffb347"
            strokeWidth="6"
            strokeLinecap="round"
          />
        </>
      )}

      {points.map((p, i) => {
        const isCurrent = i === currentIndex;
        const isFinalReached = currentLevel >= MAX_LEVEL && p.level === MAX_LEVEL;
        const lit = p.reached || isFinalReached;
        const r = p.isRank ? 20 : 14;
        const fillTop = lit ? (p.isRank ? "#fde68a" : "#ffb347") : "#262626";
        const fillBottom = lit ? (p.isRank ? "#d97706" : "#c2410c") : "#171717";

        return (
          <g key={p.level}>
            {isCurrent && (
              <circle className="beacon-pulse" cx={p.x} cy={p.y} r={r + 8} fill="#ff6a1a" />
            )}
            {isCurrent && <circle cx={p.x} cy={p.y} r={r + 10} fill="#ff6a1a" opacity="0.22" />}

            {/* Medallion: outer ring, gradient face, shine highlight */}
            <circle cx={p.x} cy={p.y} r={r + 4} fill={lit ? "#78350f" : "#0a0a0a"} />
            <defs>
              <linearGradient id={`node-${p.level}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={fillTop} />
                <stop offset="100%" stopColor={fillBottom} />
              </linearGradient>
            </defs>
            <circle
              cx={p.x}
              cy={p.y}
              r={r}
              fill={`url(#node-${p.level})`}
              stroke={lit ? "#451a03" : "#3f3f46"}
              strokeWidth="2"
            />
            <ellipse cx={p.x - r * 0.35} cy={p.y - r * 0.4} rx={r * 0.35} ry={r * 0.18} fill="#ffffff" opacity={lit ? 0.35 : 0.08} />

            <text x={p.x} y={p.y + 5} textAnchor="middle" fontSize={p.isRank ? 13 : 11} fontWeight="900" fill={lit ? "#1c0a00" : "#71717a"}>
              {p.isRank ? "★" : lit ? "📦" : "🔒"}
            </text>
            <text x={p.x} y={p.y + r + 17} textAnchor="middle" fontSize="10" fontWeight="800" fill={lit ? "#f5f5f5" : "#71717a"}>
              Lv {p.level}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function buildPartialPath(points: { x: number; y: number }[], upTo: number): string {
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i <= upTo; i++) {
    const prev = points[i - 1];
    const p = points[i];
    const midY = (prev.y + p.y) / 2;
    d += ` C ${prev.x} ${midY}, ${p.x} ${midY}, ${p.x} ${p.y}`;
  }
  return d;
}
