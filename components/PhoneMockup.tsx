// A CSS-drawn phone frame with a miniature preview of the ACTUAL Home
// dashboard inside — no screenshot image needed (and none exists to embed
// from this environment), just the same building blocks shrunk down:
// avatar + class-emblem ring, the forge-panel-hot Level/XP card, the
// streak/best/workouts stat row, the "Where to next" doors grid, and the
// bottom nav. Staying in sync with the real layout (app/(app)/dashboard)
// matters more than pixel-perfect fidelity — a static screenshot would go
// stale the next time that page changes; this doesn't.
const DOORS = [
  { icon: "📜", accent: "border-emerald-500/50 bg-emerald-500/10" },
  { icon: "🗺️", accent: "border-fuchsia-500/50 bg-fuchsia-500/10" },
  { icon: "🏅", accent: "border-amber-500/50 bg-amber-500/10" },
  { icon: "📖", accent: "border-sky-500/50 bg-sky-500/10" },
  { icon: "📦", accent: "border-amber-500/50 bg-amber-500/10" },
  { icon: "🛒", accent: "border-fuchsia-500/50 bg-fuchsia-500/10" },
];

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
          <div className="flex h-full flex-col px-2.5 pb-1.5 pt-7">
            {/* Header: avatar in a hex-emblem ring, username, class · rank */}
            <div className="flex items-center gap-1.5">
              <div className="relative flex h-7 w-7 flex-shrink-0 items-center justify-center">
                <div
                  className="absolute inset-0 bg-gradient-to-br from-rose-500 to-amber-500 opacity-80"
                  style={{
                    clipPath:
                      "polygon(50% 0%, 95% 25%, 95% 75%, 50% 100%, 5% 75%, 5% 25%)",
                  }}
                />
                <div className="relative h-4 w-4 rounded-full bg-neutral-800" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-[8px] font-black text-white">ForgeUser</p>
                <p className="text-[6px] font-semibold text-amber-400">🔥 Titan · Bronze</p>
              </div>
            </div>

            {/* Level + XP card, forge-panel-hot style */}
            <div className="relative mt-2 overflow-hidden rounded-lg border-2 border-forge/60 bg-neutral-900 p-2">
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "radial-gradient(120% 80% at 50% 120%, rgb(255 106 26 / 0.25), transparent 60%)",
                }}
              />
              <div className="relative flex items-baseline justify-between">
                <span className="text-[9px] font-black text-white">Level 7</span>
                <span className="rounded-full bg-amber-500/20 px-1.5 py-[1px] text-[6px] font-bold text-amber-300">
                  Bronze
                </span>
              </div>
              <div className="relative mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-forge to-amber-400" />
              </div>
              <p className="relative mt-1 text-[5.5px] font-semibold text-forge">· View on the map →</p>
            </div>

            {/* Streak / Best / Workouts */}
            <div className="mt-1.5 grid grid-cols-3 gap-1">
              {[
                { v: "12🔥", l: "STREAK" },
                { v: "18", l: "BEST" },
                { v: "48", l: "WORKOUTS" },
              ].map((s) => (
                <div key={s.l} className="rounded-md bg-white/5 py-1.5 text-center">
                  <p className="text-[7.5px] font-black text-white">{s.v}</p>
                  <p className="text-[4.5px] font-semibold tracking-wide text-white/40">{s.l}</p>
                </div>
              ))}
            </div>

            {/* Where to next — the doors grid */}
            <p className="mt-2 text-[5px] font-black uppercase tracking-wide text-white/40">Where to next</p>
            <div className="mt-1 grid grid-cols-3 gap-1">
              {DOORS.map((d, i) => (
                <div
                  key={i}
                  className={`flex items-center justify-center rounded-md border py-2 text-[10px] ${d.accent}`}
                >
                  {d.icon}
                </div>
              ))}
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
