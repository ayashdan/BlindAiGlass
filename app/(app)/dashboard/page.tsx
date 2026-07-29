import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/(auth)/actions";
import { levelProgress, rankForLevel } from "@/lib/game/leveling";
import { isAdminEmail } from "@/lib/admin";
import { ensureTodayQuests } from "@/lib/game/quests-server";
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
        <p className="text-neutral-400">
          Setting up your profile… refresh in a moment.
        </p>
      </main>
    );
  }

  const progress = levelProgress(profile.xp);
  const rank = rankForLevel(progress.level);
  const quests = await ensureTodayQuests();

  return (
    <main className="mx-auto max-w-lg px-6 py-12">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <p className="text-sm text-neutral-400">Welcome back,</p>
          <h1 className="text-2xl font-black tracking-tight">{profile.username}</h1>
        </div>
        <div className="flex items-center gap-2">
          {isAdminEmail(user.email) && (
            <Link
              href="/admin"
              className="rounded-lg border border-forge/40 px-3 py-2 text-sm text-forge transition hover:bg-forge/10"
            >
              Admin
            </Link>
          )}
          <form action={signOut}>
            <button className="rounded-lg border border-neutral-800 px-3 py-2 text-sm text-neutral-300 transition hover:border-neutral-600">
              Log out
            </button>
          </form>
        </div>
      </header>

      {/* Level + XP card */}
      <section className="fade-in-up rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
        <div className="mb-3 flex items-baseline justify-between">
          <span className="text-lg font-bold">Level {progress.level}</span>
          <span className="rounded-full bg-forge/15 px-3 py-1 text-sm font-semibold text-forge">
            {rank}
          </span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-neutral-800">
          <div
            className="h-full rounded-full bg-forge transition-all duration-700 ease-out"
            style={{ width: `${progress.percent}%` }}
          />
        </div>
        <p className="mt-2 text-sm text-neutral-400">
          {progress.atMax
            ? "Max level reached!"
            : `${progress.into} / ${progress.need} XP · ${progress.remaining} to next level`}
        </p>
      </section>

      {/* Main action */}
      <Link
        href="/workout"
        className="press fade-in-up mt-4 block rounded-2xl bg-forge py-5 text-center text-lg font-black text-neutral-950 transition hover:bg-forge-soft"
        style={{ animationDelay: "0.05s" }}
      >
        + Log a workout
      </Link>

      {/* Quick stats */}
      <section
        className="fade-in-up mt-4 grid grid-cols-3 gap-3"
        style={{ animationDelay: "0.1s" }}
      >
        <Stat label="Streak" value={`${profile.current_streak}🔥`} />
        <Stat label="Best" value={`${profile.longest_streak}`} />
        <Stat label="Workouts" value={`${profile.total_workouts}`} />
      </section>

      {/* Achievements */}
      <Link
        href="/achievements"
        className="fade-in-up mt-4 flex items-center justify-between rounded-2xl border border-neutral-800 bg-neutral-900 px-5 py-4 transition hover:border-neutral-600"
        style={{ animationDelay: "0.15s" }}
      >
        <span className="font-bold">🏅 Achievements</span>
        <span className="text-neutral-400">View →</span>
      </Link>

      {/* Today's quests */}
      {quests.length > 0 && (
        <section
          className="fade-in-up mt-4 rounded-2xl border border-neutral-800 bg-neutral-900 p-5"
          style={{ animationDelay: "0.2s" }}
        >
          <p className="mb-3 text-sm font-black uppercase tracking-wide text-neutral-400">
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
                    : "border-neutral-800 bg-neutral-950")
                }
              >
                <span className="text-xl">{q.completed ? "✅" : q.icon}</span>
                <div className="flex-1">
                  <p
                    className={
                      "text-sm font-bold " +
                      (q.completed ? "text-neutral-400 line-through" : "")
                    }
                  >
                    {q.title}
                  </p>
                  <p className="text-xs text-neutral-500">{q.description}</p>
                </div>
                <span className="text-xs font-semibold text-forge">+{q.xpReward} XP</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4 text-center">
      <div className="text-xl font-black">{value}</div>
      <div className="mt-1 text-xs uppercase tracking-wide text-neutral-500">
        {label}
      </div>
    </div>
  );
}
