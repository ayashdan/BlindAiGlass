import { MAX_LEVEL } from "@/lib/game/leveling";

// A winding path of waypoints from level 5 to MAX_LEVEL, one every 5 levels
// (matching Rare Chest drops) — the classic "level map" mobile-game layout,
// applied to real progress instead of unlockable stages. Rank thresholds
// get a bigger, starred landmark; everything else is a plain waypoint.
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

  // The next not-yet-reached node is "where you are headed" — gets the
  // glowing marker instead of trying to interpolate a fractional position
  // along the curve. -1 (everything reached, i.e. max level) means the
  // whole path has been traveled.
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

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height }}>
      <path d={pathD} fill="none" stroke="#262626" strokeWidth="6" strokeLinecap="round" />
      {traveledUpTo > 0 && (
        <path
          d={buildPartialPath(points, traveledUpTo)}
          fill="none"
          stroke="#ff6a1a"
          strokeWidth="6"
          strokeLinecap="round"
        />
      )}

      {points.map((p, i) => {
        const isCurrent = i === currentIndex;
        const isFinalReached = currentLevel >= MAX_LEVEL && p.level === MAX_LEVEL;
        const lit = p.reached || isFinalReached;
        const r = p.isRank ? 20 : 14;

        return (
          <g key={p.level}>
            {isCurrent && <circle cx={p.x} cy={p.y} r={r + 10} fill="#ff6a1a" opacity="0.25" />}
            <circle
              cx={p.x}
              cy={p.y}
              r={r}
              fill={lit ? (p.isRank ? "#fbbf24" : "#ff6a1a") : "#171717"}
              stroke={lit ? (p.isRank ? "#d97706" : "#c2410c") : "#3f3f46"}
              strokeWidth="2.5"
            />
            <text
              x={p.x}
              y={p.y + 5}
              textAnchor="middle"
              fontSize={p.isRank ? 13 : 11}
              fontWeight="900"
              fill={lit ? "#0a0a0a" : "#71717a"}
            >
              {p.isRank ? "★" : lit ? "📦" : "🔒"}
            </text>
            <text
              x={p.x}
              y={p.y + r + 16}
              textAnchor="middle"
              fontSize="10"
              fontWeight="700"
              fill={lit ? "#f5f5f5" : "#71717a"}
            >
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
