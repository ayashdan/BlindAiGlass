import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { levelProgress } from "@/lib/game/leveling";
import { getSeasonStatus } from "@/lib/game/season-server";
import { levelRewardLadder, levelRewardLabel } from "@/lib/game/rewards";
import WorldMapPath from "@/components/WorldMapPath";
import type { Profile } from "@/lib/types";

const EMBERS = Array.from({ length: 14 }, (_, i) => ({
  left: (i * 37) % 100,
  size: 3 + ((i * 13) % 5),
  delay: (i * 0.6) % 6,
  duration: 5 + ((i * 7) % 5),
  drift: (i % 2 === 0 ? 1 : -1) * (10 + (i % 3) * 6),
}));

// The journey, visualized — every 5 levels is a waypoint (a Rare Chest),
// rank thresholds are the bigger landmarks, and the current season is
// shown as the stretch of road you're on right now.
export default async function WorldMapPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase.from("profiles").select("xp, tier").eq("id", user.id).single();
  const profile = data as Pick<Profile, "xp" | "tier"> | null;
  if (!profile) redirect("/dashboard");

  const [progress, season] = await Promise.all([
    Promise.resolve(levelProgress(profile.xp)),
    getSeasonStatus(user.id, profile.tier === "premium"),
  ]);

  const rewardLadder = levelRewardLadder();
  const nextRewardLevel = rewardLadder.find((r) => r.level > progress.level)?.level;

  return (
    <main className="mx-auto max-w-lg px-6 py-12">
      <Link href="/dashboard" className="text-sm text-muted hover:text-fg">
        ← Back
      </Link>
      <h1 className="mb-1 mt-3 text-2xl font-black tracking-tight">🗺️ World Map</h1>
      <p className="mb-6 text-sm text-muted">
        ★ marks a rank-up. 📦 marks a Rare Chest. The glowing stop is you.
      </p>

      {season && (
        <section className="forge-panel forge-panel-hot mb-6 p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-black uppercase tracking-wide text-fuchsia-400">
              🎖️ Season {season.seasonNumber}
            </p>
            <p className="text-xs text-muted">{season.daysLeft} days left</p>
          </div>
          <div className="flex gap-2">
            {season.tiers.map((t) => (
              <div key={t.tier} className="flex-1 text-center">
                <div className={"h-2 rounded-full " + (t.done ? "bg-fuchsia-500" : "bg-surface2")} />
                <div
                  className={
                    "mt-1 h-2 rounded-full " +
                    (t.plusDone ? "bg-amber-400" : season.isPremium ? "bg-surface2" : "bg-surface2/50")
                  }
                  title={
                    season.isPremium
                      ? "Plus season reward"
                      : "Plus season reward — subscribe to unlock"
                  }
                />
                <p className="mt-1 text-[10px] text-muted">{t.workouts}</p>
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted">{season.workoutsThisSeason} workouts this season</p>
          {!season.isPremium && (
            <Link
              href="/shop"
              className="mt-2 block text-xs font-semibold text-amber-400 hover:underline"
            >
              ⭐ Plus unlocks a bonus cosmetic reward at every tier above →
            </Link>
          )}
        </section>
      )}

      {/* Fixed to the viewport (not the tall scrolling map below) so the
          embers stay visible as ambient atmosphere no matter how far
          down the journey you've scrolled. */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 top-16 z-[1] overflow-hidden">
        {EMBERS.map((e, i) => (
          <span
            key={i}
            className="ember-particle"
            style={
              {
                left: `${e.left}%`,
                width: e.size,
                height: e.size,
                animationDelay: `${e.delay}s`,
                animationDuration: `${e.duration}s`,
                "--drift": `${e.drift}px`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      <div className="forge-panel relative overflow-hidden p-0">
        <WorldMapPath currentLevel={progress.level} />
      </div>

      {/* The path above is the visual — this is the full, readable list of
          exactly what every 5-level milestone gives, claimed and upcoming,
          since a medallion icon alone can't say "Rare Chest + Silver rank". */}
      <section className="relative z-[2] mt-6">
        <h2 className="mb-3 text-sm font-black uppercase tracking-wide text-muted">
          🎁 Reward ladder
        </h2>
        <div className="space-y-2">
          {rewardLadder.map((r) => {
            const done = progress.level >= r.level;
            const isNext = r.level === nextRewardLevel;
            return (
              <div
                key={r.level}
                className={
                  "flex items-center gap-3 rounded-xl border p-3 " +
                  (isNext
                    ? "forge-panel forge-panel-hot"
                    : done
                      ? "border-line bg-surface"
                      : "border-line bg-surface/50 opacity-60")
                }
              >
                <span
                  className={
                    "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-sm font-black " +
                    (done ? "bg-forge/15 text-forge" : "bg-surface2 text-muted")
                  }
                >
                  {done ? "✓" : r.level}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold">
                    Level {r.level} {isNext && <span className="text-amber-400">· next</span>}
                  </p>
                  <p className="text-xs text-muted">{levelRewardLabel(r)}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
