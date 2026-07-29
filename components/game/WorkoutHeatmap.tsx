// A GitHub-contributions-style heatmap: columns are weeks, rows are days
// (Sun-Sat), color intensity scales with workout count that day. Pure
// display, no client JS needed — safe to render straight from a server
// component.
type Cell = { date: string; count: number } | null;

function buildCells(counts: Record<string, number>, weeks: number): Cell[] {
  const totalDays = weeks * 7;
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const start = new Date(today.getTime() - (totalDays - 1) * 86400000);
  const startDow = start.getUTCDay(); // 0 = Sunday

  const cells: Cell[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null); // pad to align columns to weeks
  for (let i = 0; i < totalDays; i++) {
    const d = new Date(start.getTime() + i * 86400000);
    const key = d.toISOString().slice(0, 10);
    cells.push({ date: key, count: counts[key] ?? 0 });
  }
  return cells;
}

function levelClass(count: number): string {
  if (count <= 0) return "bg-neutral-800";
  if (count === 1) return "bg-forge/35";
  if (count === 2) return "bg-forge/65";
  return "bg-forge";
}

export default function WorkoutHeatmap({
  counts,
  weeks = 14,
}: {
  counts: Record<string, number>;
  weeks?: number;
}) {
  const cells = buildCells(counts, weeks);

  return (
    <div className="overflow-x-auto">
      <div
        className="grid gap-1"
        style={{
          gridTemplateRows: "repeat(7, 1fr)",
          gridAutoFlow: "column",
          width: "max-content",
        }}
      >
        {cells.map((c, i) =>
          c ? (
            <div
              key={c.date}
              title={`${c.date}: ${c.count} workout${c.count === 1 ? "" : "s"}`}
              className={`h-3 w-3 rounded-sm ${levelClass(c.count)}`}
            />
          ) : (
            <div key={`pad-${i}`} className="h-3 w-3" />
          )
        )}
      </div>
      <div className="mt-2 flex items-center gap-1.5 text-xs text-neutral-500">
        <span>Less</span>
        <div className="h-3 w-3 rounded-sm bg-neutral-800" />
        <div className="h-3 w-3 rounded-sm bg-forge/35" />
        <div className="h-3 w-3 rounded-sm bg-forge/65" />
        <div className="h-3 w-3 rounded-sm bg-forge" />
        <span>More</span>
      </div>
    </div>
  );
}
