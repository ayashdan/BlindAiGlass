"use client";

// A "stock ticker" style chart for the admin analytics page: a big headline
// number, a period-over-period change badge, and a thin gradient-filled
// line underneath with a crosshair + tooltip on hover. Single series per
// chart, so no legend box — the section heading above it names the series
// (see the dataviz skill: one series needs no legend).
import { useId, useMemo, useState } from "react";

export default function TickerChart({
  values,
  labels,
  color,
}: {
  values: number[];
  labels: string[];
  color: string; // hex
}) {
  const gradientId = useId();
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const width = 600;
  const height = 130;
  const padTop = 14;
  const padBottom = 6;
  const n = values.length;
  const max = Math.max(1, ...values);

  const points = useMemo(
    () =>
      values.map((v, i) => ({
        x: n === 1 ? width / 2 : (i / (n - 1)) * width,
        y: height - padBottom - (v / max) * (height - padTop - padBottom),
        v,
      })),
    [values, max, n]
  );

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");
  const areaPath = `${linePath} L ${width} ${height} L 0 ${height} Z`;

  const total = values.reduce((s, v) => s + v, 0);
  const half = Math.floor(n / 2);
  const prevSum = values.slice(0, half).reduce((s, v) => s + v, 0);
  const recentSum = values.slice(half).reduce((s, v) => s + v, 0);
  const pctChange =
    prevSum > 0 ? Math.round(((recentSum - prevSum) / prevSum) * 100) : recentSum > 0 ? 100 : 0;

  function handleMove(e: React.MouseEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / rect.width;
    const idx = Math.round(relX * (n - 1));
    setHoverIdx(Math.max(0, Math.min(n - 1, idx)));
  }

  const activeIdx = hoverIdx ?? n - 1;
  const active = points[activeIdx];
  const leftPct = Math.min(92, Math.max(8, (active.x / width) * 100));

  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <div className="mb-2 flex items-baseline justify-between">
        <div className="flex items-baseline gap-2">
          <span className="font-display text-2xl font-black">
            {active.v.toLocaleString()}
          </span>
          <span className="text-xs text-muted">
            {labels[activeIdx]} · {total.toLocaleString()} total
          </span>
        </div>
        {half > 0 && (
          <span
            className={
              "flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-bold " +
              (pctChange >= 0
                ? "bg-emerald-500/15 text-emerald-400"
                : "bg-rose-500/15 text-rose-400")
            }
          >
            {pctChange >= 0 ? "▲" : "▼"} {Math.abs(pctChange)}%
          </span>
        )}
      </div>

      <div className="relative">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
          className="h-28 w-full cursor-crosshair"
          onMouseMove={handleMove}
          onMouseLeave={() => setHoverIdx(null)}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.32" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={areaPath} fill={`url(#${gradientId})`} stroke="none" />
          <path
            d={linePath}
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {hoverIdx !== null && (
            <line
              x1={active.x}
              x2={active.x}
              y1={0}
              y2={height}
              stroke={color}
              strokeOpacity="0.35"
              strokeWidth="1"
            />
          )}
          <circle cx={active.x} cy={active.y} r="4" fill={color} stroke="rgb(var(--surface))" strokeWidth="2" />
        </svg>

        {hoverIdx !== null && (
          <div
            className="pointer-events-none absolute -top-1 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md border border-line bg-surface px-2 py-1 text-xs shadow-lg"
            style={{ left: `${leftPct}%` }}
          >
            <span className="font-bold" style={{ color }}>
              {active.v}
            </span>{" "}
            <span className="text-muted">{labels[activeIdx]}</span>
          </div>
        )}
      </div>
    </div>
  );
}
