// A CSS-drawn phone frame with a miniature preview of the dashboard inside
// — no screenshot image needed (and none exists to embed), just the same
// building blocks (xp-bar, forge colors, bottom nav shape) shrunk down, so
// it stays accurate as the real UI evolves instead of going stale like a
// static image would.
export default function PhoneMockup() {
  return (
    <div className="relative mx-auto" style={{ width: 240 }}>
      <div className="absolute -left-[3px] top-16 h-7 w-[3px] rounded-r bg-neutral-700" />
      <div className="absolute -right-[3px] top-24 h-10 w-[3px] rounded-l bg-neutral-700" />

      <div className="relative rounded-[2.2rem] border-[6px] border-neutral-800 bg-neutral-950 p-1.5 shadow-2xl shadow-black/40">
        <div className="absolute left-1/2 top-1.5 z-10 h-3.5 w-16 -translate-x-1/2 rounded-full bg-neutral-950" />

        <div
          className="overflow-hidden rounded-[1.7rem] bg-gradient-to-b from-neutral-900 to-black"
          style={{ aspectRatio: "9 / 19.5" }}
        >
          <div className="flex h-full flex-col px-3 pb-2 pt-7">
            {/* Header */}
            <div className="flex items-center gap-1.5">
              <div className="h-6 w-6 flex-shrink-0 rounded-full bg-gradient-to-br from-forge to-rose-500" />
              <div className="min-w-0">
                <p className="truncate text-[8px] font-black text-white">ForgeUser</p>
                <p className="text-[6px] font-semibold text-amber-400">🥉 Bronze</p>
              </div>
            </div>

            {/* Level card */}
            <div className="mt-2.5 rounded-lg border border-forge/40 bg-gradient-to-br from-forge/25 via-transparent to-transparent p-2">
              <div className="flex items-baseline justify-between">
                <span className="text-[8px] font-black text-white">Level 7</span>
                <span className="rounded-full bg-amber-500/20 px-1.5 py-[1px] text-[6px] font-bold text-amber-300">
                  Bronze
                </span>
              </div>
              <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-forge to-amber-400" />
              </div>
            </div>

            {/* Stat pills */}
            <div className="mt-1.5 grid grid-cols-3 gap-1">
              {[
                { v: "12🔥", l: "STREAK" },
                { v: "48", l: "WORKOUTS" },
                { v: "📦3", l: "CHESTS" },
              ].map((s) => (
                <div key={s.l} className="rounded-md bg-white/5 py-1.5 text-center">
                  <p className="text-[7.5px] font-black text-white">{s.v}</p>
                  <p className="text-[5px] font-semibold tracking-wide text-white/40">{s.l}</p>
                </div>
              ))}
            </div>

            {/* Fake content rows */}
            <div className="mt-2 space-y-1">
              <div className="h-3 w-full rounded bg-white/5" />
              <div className="h-3 w-4/5 rounded bg-white/5" />
            </div>

            <div className="flex-1" />

            {/* Bottom nav */}
            <div className="flex items-center justify-between rounded-full bg-white/5 px-3 py-1.5">
              <span className="text-[10px] opacity-90">🏠</span>
              <span className="text-[10px] opacity-60">🏆</span>
              <span className="-mt-3 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-forge to-rose-500 text-[9px]">
                ➕
              </span>
              <span className="text-[10px] opacity-60">🤝</span>
              <span className="text-[10px] opacity-60">👤</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
