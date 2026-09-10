const TONE: Record<string, string> = {
  good: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  warn: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  bad: "bg-red-500/15 text-red-400 border-red-500/30",
  neutral: "bg-surface2 text-muted border-line",
  brand: "bg-brand/15 text-brand border-brand/30",
};

// Maps every status value used across the app to a color tone. Falls back to
// neutral for anything unrecognized.
const STATUS_TONE: Record<string, keyof typeof TONE> = {
  active: "good",
  on_hold: "warn",
  complete: "good",
  cancelled: "bad",
  not_started: "neutral",
  in_progress: "brand",
  blocked: "bad",
  not_selected: "warn",
  selected: "good",
  ordered: "brand",
  received: "good",
  needed: "neutral",
  backordered: "bad",
  delivered: "brand",
  installed: "good",
  pending: "warn",
  invoiced: "brand",
  paid: "good",
  approved: "good",
  rejected: "bad",
};

export default function StatusBadge({ status, label }: { status: string; label: string }) {
  const tone = TONE[STATUS_TONE[status] ?? "neutral"];
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium ${tone}`}
    >
      {label}
    </span>
  );
}
