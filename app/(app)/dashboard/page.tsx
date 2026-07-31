import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { levelProgress, rankForLevel } from "@/lib/game/leveling";
import { isAdminEmail } from "@/lib/admin";
import { ensureTodayQuests, chooseSplit as applyScheduledSplit } from "@/lib/game/quests-server";
import { completeQuest, chooseSplit } from "@/app/(app)/quests/actions";
import { SUNDAY_FIRST_DAY_KEYS } from "@/lib/game/quests";
import { logRestDay } from "@/app/(app)/recovery/actions";
import { dailyMotivation } from "@/lib/game/motivation";
import { deriveClass, CLASS_INFO } from "@/lib/game/stats";
import { getSeasonStatus } from "@/lib/game/season-server";
import ThemeToggle from "@/components/ThemeToggle";
import ShareButton from "@/components/ShareButton";
import AvatarDisplay from "@/components/AvatarDisplay";
import NotificationOptIn from "@/components/NotificationOptIn";
import InstallPrompt from "@/components/InstallPrompt";
import SubmitButton from "@/components/SubmitButton";
import type { Profile } from "@/lib/types";

// The logged-in home hub. Shows your character build, level/XP/rank,
// quests, season progress, and a rival to chase, plus the main action:
// log a workout.
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
  const todayStr = new Date().toISOString().slice(0, 10);
  const motivation = dailyMotivation(`${user.id}:${todayStr}`);

  // If today hasn't had a split chosen yet, and the user has a recurring
  // weekly plan set for today's day of the week, lock that in automatically
  // instead of asking — same effect as tapping the button themselves.
  if (profile.split_choice_date !== todayStr) {
    const todayKey = SUNDAY_FIRST_DAY_KEYS[new Date().getDay()];
    const scheduled = profile.weekly_split_schedule?.[todayKey];
    if (scheduled) {
      await applyScheduledSplit(scheduled);
      profile.split_choice_date = todayStr;
      profile.split_choice = scheduled;
    }
  }

  // Independent of each other and of the profile fetch above — run together
  // instead of one-at-a-time round trips.
  const [quests, season, friendRowsRes] = await Promise.all([
    ensureTodayQuests(),
    getSeasonStatus(),
    supabase
      .from("friendships")
      .select("user_id, friend_id")
      .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
      .eq("status", "accepted"),
  ]);

  const characterStats = {
    power: profile.stat_power,
    grit: profile.stat_grit,
    endurance: profile.stat_endurance,
    discipline: profile.stat_discipline,
  };
  const charClass = deriveClass(characterStats);
  const classInfo = CLASS_INFO[charClass];
  const maxStat = Math.max(
    1,
    characterStats.power,
    characterStats.grit,
    characterStats.endurance,
    characterStats.discipline
  );

  // ---- Rival spotlight: the closest friend ahead of you in XP ----
  const friendIds = (friendRowsRes.data ?? []).map((r: any) =>
    r.user_id === user.id ? r.friend_id : r.user_id
  );
  let rival: any = null;
  let leadingFriends = false;
  if (friendIds.length > 0) {
    const { data: friendProfiles } = await supabase
      .from("profiles")
      .select("username, xp, avatar, avatar_url")
      .in("id", friendIds);
    const above = (friendProfiles ?? [])
      .filter((p: any) => p.xp > profile.xp)
      .sort((a: any, b: any) => a.xp - b.xp)[0];
    if (above) rival = above;
    else if ((friendProfiles ?? []).length > 0) leadingFriends = true;
  }

  const canLogRest = profile.last_workout_date !== todayStr && profile.last_rest_date !== todayStr;
  const splitChosenToday = profile.split_choice_date === todayStr ? profile.split_choice : null;
  const SPLIT_LABELS: Record<string, string> = {
    push_day: "💪 Push Day",
    pull_day: "🏋️ Pull Day",
    leg_day: "🦵 Leg Day",
  };

  return (
    <main className="mx-auto max-w-lg px-6 py-12">
      <header className="mb-8 flex items-center justify-between">
        <Link href="/profile" className="flex items-center gap-3">
          <AvatarDisplay
            avatarUrl={profile.avatar_url}
            avatar={profile.avatar}
            borderClass={profile.equipped_border}
            size={44}
          />
          <div>
            <p className="text-sm text-muted">
              {classInfo.icon} {charClass}
              {profile.equipped_title ? ` · ${profile.equipped_title}` : ""}
            </p>
            <h1 className="text-2xl font-black tracking-tight">
              {profile.prestige > 0 && (
                <span className="mr-1 text-amber-400">⭐×{profile.prestige}</span>
              )}
              {profile.username}
            </h1>
          </div>
        </Link>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <InstallPrompt />
          <NotificationOptIn />
          <ThemeToggle />
          {isAdminEmail(user.email) && (
            <Link
              href="/admin"
              className="rounded-lg border border-forge/40 px-3 py-2 text-sm text-forge transition hover:bg-forge/10"
            >
              Admin
            </Link>
          )}
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

      {/* Character build */}
      <section
        className="fade-in-up mt-4 rounded-2xl border border-line bg-surface p-5"
        style={{ animationDelay: "0.03s" }}
      >
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-black uppercase tracking-wide text-muted">
            {classInfo.icon} {charClass} build
          </p>
          <Link href="/profile" className="text-xs text-forge hover:underline">
            Full sheet →
          </Link>
        </div>
        <div className="space-y-2">
          <StatBar label="Power" icon="🔥" value={characterStats.power} max={maxStat} color="bg-rose-500" />
          <StatBar label="Grit" icon="🗡️" value={characterStats.grit} max={maxStat} color="bg-sky-500" />
          <StatBar
            label="Endurance"
            icon="🏃"
            value={characterStats.endurance}
            max={maxStat}
            color="bg-emerald-500"
          />
          <StatBar
            label="Discipline"
            icon="🧠"
            value={characterStats.discipline}
            max={maxStat}
            color="bg-violet-500"
          />
        </div>
      </section>

      {/* Rival spotlight */}
      {rival && (
        <div
          className="fade-in-up mt-4 flex items-center gap-3 rounded-2xl border border-red-500/30 bg-red-500/5 p-4"
          style={{ animationDelay: "0.06s" }}
        >
          <AvatarDisplay avatarUrl={rival.avatar_url} avatar={rival.avatar} size={32} />
          <p className="flex-1 text-sm">
            <span className="font-bold text-red-400">Rival:</span> {rival.username} is{" "}
            <span className="font-black">{rival.xp - profile.xp} XP</span> ahead. Catch up!
          </p>
        </div>
      )}
      {leadingFriends && (
        <p
          className="fade-in-up mt-4 text-center text-sm text-emerald-400"
          style={{ animationDelay: "0.06s" }}
        >
          👑 You're leading your friends' leaderboard. Defend it.
        </p>
      )}

      {/* Main action */}
      <Link
        href="/workout"
        className="press fade-in-up mt-4 block rounded-2xl bg-gradient-to-r from-forge to-rose-500 py-5 text-center text-lg font-black text-neutral-950 shadow-lg shadow-forge/20 transition hover:from-forge-soft hover:to-rose-400"
        style={{ animationDelay: "0.08s" }}
      >
        + Log a workout
      </Link>

      {canLogRest && (
        <form action={logRestDay} className="fade-in-up mt-2" style={{ animationDelay: "0.09s" }}>
          <SubmitButton
            pendingText="Logging…"
            className="press w-full rounded-xl border border-sky-500/30 bg-sky-500/5 py-2 text-sm font-bold text-sky-400 transition hover:border-sky-500/60"
          >
            😴 Log a rest day (+10% XP on your next workout)
          </SubmitButton>
        </form>
      )}
      {profile.recovery_bonus_pct > 0 && (
        <p className="mt-2 text-center text-xs text-sky-300/80">
          🌙 Recovery active: +{profile.recovery_bonus_pct}% XP on your next workout.
        </p>
      )}

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

      {/* Season pass */}
      {season && (
        <section
          className="fade-in-up mt-4 rounded-2xl border border-fuchsia-500/30 bg-fuchsia-500/5 p-5"
          style={{ animationDelay: "0.13s" }}
        >
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-black uppercase tracking-wide text-fuchsia-400">
              🎖️ Season {season.seasonNumber}
            </p>
            <p className="text-xs text-muted">{season.daysLeft} days left</p>
          </div>
          <div className="flex gap-2">
            {season.tiers.map((t) => (
              <div key={t.tier} className="flex-1 text-center">
                <div
                  className={
                    "h-2 rounded-full " + (t.done ? "bg-fuchsia-500" : "bg-surface2")
                  }
                />
                <p className="mt-1 text-[10px] text-muted">{t.workouts}</p>
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted">
            {season.workoutsThisSeason} workouts this season
          </p>
        </section>
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

      {/* Choose today's split */}
      <section
        className="fade-in-up mt-4 rounded-2xl border border-line bg-surface p-5"
        style={{ animationDelay: "0.19s" }}
      >
        {splitChosenToday ? (
          <p className="text-sm">
            <span className="font-black uppercase tracking-wide text-muted">Today: </span>
            <span className="font-bold">{SPLIT_LABELS[splitChosenToday] ?? splitChosenToday}</span>
          </p>
        ) : (
          <>
            <p className="mb-3 text-sm font-black uppercase tracking-wide text-muted">
              What are you training today?
            </p>
            <div className="grid grid-cols-3 gap-2">
              {(["push_day", "pull_day", "leg_day"] as const).map((key) => (
                <form key={key} action={chooseSplit}>
                  <input type="hidden" name="split" value={key} />
                  <SubmitButton className="press w-full rounded-lg border border-line bg-bg py-2.5 text-sm font-bold text-fg transition hover:border-forge/50">
                    {SPLIT_LABELS[key]}
                  </SubmitButton>
                </form>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted">
              Locks in a matching quest instead of a random one.
            </p>
          </>
        )}
      </section>

      {/* Today's quests */}
      {quests.length > 0 && (
        <section
          className="fade-in-up mt-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5"
          style={{ animationDelay: "0.2s" }}
        >
          <p className="mb-3 text-sm font-black uppercase tracking-wide text-emerald-400">
            🎯 Today's missions
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
                    <SubmitButton className="press rounded-lg border border-forge/40 px-2 py-1 text-xs font-bold text-forge transition hover:bg-forge/10">
                      Mark done
                    </SubmitButton>
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

function StatBar({
  label,
  icon,
  value,
  max,
  color,
}: {
  label: string;
  icon: string;
  value: number;
  max: number;
  color: string;
}) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="font-semibold">
          {icon} {label}
        </span>
        <span className="text-muted">{value}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-surface2">
        <div
          className={`h-full rounded-full ${color} transition-all duration-700 ease-out`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
