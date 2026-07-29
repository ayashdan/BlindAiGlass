import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/(auth)/actions";
import { levelProgress, rankForLevel } from "@/lib/game/leveling";
import { isAdminEmail } from "@/lib/admin";
import { ensureTodayQuests } from "@/lib/game/quests-server";
import { completeQuest } from "@/app/(app)/quests/actions";
import { dailyMotivation } from "@/lib/game/motivation";
import ThemeToggle from "@/components/ThemeToggle";
import ShareButton from "@/components/ShareButton";
import AvatarDisplay from "@/components/AvatarDisplay";
import type { Profile } from "@/lib/types";

// The logged-in home hub. Shows your level/XP/rank and stats, plus the main
// action: log a workout.
export default async function Dashboard() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  const profile = data as Profile | null;

  if (!profile) {
    return (
      <main className="mx-auto max-w-lg px-6 py-16">
        <p className="text-muted">
          Setting up your profile… refresh in a moment.
        </p>
      </main>
    );
  }

  const progress = levelProgress(profile.xp);
  const rank = rankForLevel(progress.level);
  const quests = await ensureTodayQuests();
  const todayStr = new Date().toISOString().slice(0, 10);
  const motivation = dailyMotivation(`${user.id}:${todayStr}`);

  return (
    <main className="mx-auto max-w-lg px-6 py-12">
      <header className="mb-8 flex items-center justify-between">
        <Link href="/profile" className="flex items-center gap-3">
          <AvatarDisplay avatarUrl={profile.avatar_url} avatar={profile.avatar} size={44} />
          <div>
            <p className="text-sm text-muted">Welcome back,</p>
            <h1 className="text-2xl font-black tracking-tight">
              {profile.prestige > 0 && (
                <span className="mr-1 text-amber-400">⭐×{profile.prestige}</span>
              )}
              {profile.username}
            </h1>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {isAdminEmail(user.email) && (
            <Link
              href="/admin"
              className="rounded-lg border border-forge/40 px-3 py-2 text-sm text-forge transition hover:bg-forge/10"
            >
              Admin
            </Link>
          )}
          <form action={signOut}>
            <button className="rounded-lg border border-line px-3 py-2 text-sm text-fg transition hover:border-forge/50">
              Log out
            </button>
          </form>
        </div>
      </header>

      {/* Daily motivational message */}
      <p className="fade-in-up mb-4 text-center text-sm italic text-muted">
        "{motivation}"
      </p>

      {/* Level + XP card */}
      <section className="fade-in-up rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-surface to-surface p-6">
        <div className="mb-3 flex items-baseline justify-between">
          <span className="text-lg font-bold">Level {progress.level}</span>
          <span className="rounded-full bg-amber-500/15 px-3 py-1 text-sm font-semibold text-amber-400">
            {rank}
          </span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-surface2">
          <div
            className="h-full rounded-full bg-gradient-to-r from-forge to-amber-400 transition-all duration-700 ease-out"
            style={{ width: `${progress.percent}%` }}
          />
        </div>
        <p className="mt-2 text-sm text-muted">
          {progress.atMax
            ? "Max level reached!"
            : `${progress.into} / ${progress.need} XP · ${progress.remaining} to next level`}
        </p>
        <div className="mt-3">
          <ShareButton
            text={`I just hit Level ${progress.level} (${rank}) on Forge! 🔥 ${profile.current_streak} day streak.`}
            label="Share progress"
          />
        </div>
      </section>

      {/* Main action */}
      <Link
        href="/workout"
        className="press fade-in-up mt-4 block rounded-2xl bg-gradient-to-r from-forge to-rose-500 py-5 text-center text-lg font-black text-neutral-950 shadow-lg shadow-forge/20 transition hover:from-forge-soft hover:to-rose-400"
        style={{ animationDelay: "0.05s" }}
      >
        + Log a workout
      </Link>

      {/* Quick stats */}
      <section
        className="fade-in-up mt-4 grid grid-cols-3 gap-3"
        style={{ animationDelay: "0.1s" }}
      >
        <Stat label="Streak" value={`${profile.current_streak}🔥`} accent="sky" />
        <Stat label="Best" value={`${profile.longest_streak}`} accent="violet" />
        <Stat label="Workouts" value={`${profile.total_workouts}`} accent="emerald" />
      </section>
      {profile.streak_freezes > 0 && (
        <p className="mt-2 text-center text-xs text-sky-300/80">
          🧊 {profile.streak_freezes} streak freeze{profile.streak_freezes === 1 ? "" : "s"}{" "}
          banked — protects your streak if you miss a day.
        </p>
      )}

      {/* Achievements */}
      <Link
        href="/achievements"
        className="fade-in-up mt-4 flex items-center justify-between rounded-2xl border border-amber-500/30 bg-amber-500/5 px-5 py-4 transition hover:border-amber-500/60"
        style={{ animationDelay: "0.15s" }}
      >
        <span className="font-bold">🏅 Achievements</span>
        <span className="text-muted">View →</span>
      </Link>

      {/* Leaderboard + friends + history + profile */}
      <div
        className="fade-in-up mt-4 grid grid-cols-2 gap-3"
        style={{ animationDelay: "0.18s" }}
      >
        <Link
          href="/leaderboard"
          className="flex flex-col items-center justify-center rounded-2xl border border-rose-500/30 bg-rose-500/5 px-2 py-4 text-center transition hover:border-rose-500/60"
        >
          <span className="text-sm font-bold">🏆 Leaderboard</span>
        </Link>
        <Link
          href="/friends"
          className="flex flex-col items-center justify-center rounded-2xl border border-fuchsia-500/30 bg-fuchsia-500/5 px-2 py-4 text-center transition hover:border-fuchsia-500/60"
        >
          <span className="text-sm font-bold">🤝 Friends</span>
        </Link>
        <Link
          href="/history"
          className="flex flex-col items-center justify-center rounded-2xl border border-sky-500/30 bg-sky-500/5 px-2 py-4 text-center transition hover:border-sky-500/60"
        >
          <span className="text-sm font-bold">📜 History</span>
        </Link>
        <Link
          href="/profile"
          className="flex flex-col items-center justify-center rounded-2xl border border-violet-500/30 bg-violet-500/5 px-2 py-4 text-center transition hover:border-violet-500/60"
        >
          <span className="text-sm font-bold">👤 Profile</span>
        </Link>
      </div>

      {/* Today's quests */}
      {quests.length > 0 && (
        <section
          className="fade-in-up mt-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5"
          style={{ animationDelay: "0.2s" }}
        >
          <p className="mb-3 text-sm font-black uppercase tracking-wide text-emerald-400">
            🎯 Today's quests
          </p>
          <div className="space-y-2">
            {quests.map((q) => (
              <div
                key={q.key}
                className={
                  "flex items-center gap-3 rounded-lg border px-3 py-2 transition " +
                  (q.completed
                    ? "border-forge/40 bg-forge/5"
                    : "border-line bg-bg")
                }
              >
                <span className="text-xl">{q.completed ? "✅" : q.icon}</span>
                <div className="flex-1">
                  <p
                    className={
                      "text-sm font-bold " +
                      (q.completed ? "text-muted line-through" : "")
                    }
                  >
                    {q.title}
                  </p>
                  <p className="text-xs text-muted">{q.description}</p>
                </div>
                {q.kind === "manual" && !q.completed ? (
                  <form action={completeQuest}>
                    <input type="hidden" name="key" value={q.key} />
                    <button className="press rounded-lg border border-forge/40 px-2 py-1 text-xs font-bold text-forge transition hover:bg-forge/10">
                      Mark done
                    </button>
                  </form>
                ) : (
                  <span className="text-xs font-semibold text-forge">+{q.xpReward} XP</span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

const ACCENTS = {
  sky: "border-sky-500/30 bg-sky-500/5",
  violet: "border-violet-500/30 bg-violet-500/5",
  emerald: "border-emerald-500/30 bg-emerald-500/5",
  amber: "border-amber-500/30 bg-amber-500/5",
  rose: "border-rose-500/30 bg-rose-500/5",
} as const;

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: keyof typeof ACCENTS;
}) {
  return (
    <div className={`rounded-xl border p-4 text-center ${accent ? ACCENTS[accent] : "border-line bg-surface"}`}>
      <div className="text-xl font-black">{value}</div>
      <div className="mt-1 text-xs uppercase tracking-wide text-muted">
        {label}
      </div>
    </div>
  );
}
