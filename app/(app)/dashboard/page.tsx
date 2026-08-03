import Link from "next/link";
import type { ComponentType, SVGProps } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { levelProgress, rankForLevel } from "@/lib/game/leveling";
import { isAdminEmail } from "@/lib/admin";
import { localDateStr } from "@/lib/local-day";
import { logRestDay } from "@/app/(app)/recovery/actions";
import { dailyMotivation } from "@/lib/game/motivation";
import { deriveClass, CLASS_INFO } from "@/lib/game/stats";
import { getNextAchievementProgress } from "@/lib/game/achievements-server";
import { ensureTodayQuests } from "@/lib/game/quests-server";
import NextRewardTeaser from "@/components/NextRewardTeaser";
import ThemeToggle from "@/components/ThemeToggle";
import SoundToggle from "@/components/SoundToggle";
import ShareButton from "@/components/ShareButton";
import AvatarDisplay from "@/components/AvatarDisplay";
import NotificationOptIn from "@/components/NotificationOptIn";
import InstallPrompt from "@/components/InstallPrompt";
import SubmitButton from "@/components/SubmitButton";
import AnimatedNumber from "@/components/AnimatedNumber";
import {
  ScrollIcon,
  MapPinIcon,
  MedalIcon,
  BookIcon,
  ChestIcon,
  CartIcon,
} from "@/components/icons/GameIcons";
import type { Profile } from "@/lib/types";

// The home hub — a lean "at a glance" status screen (level, build, streak)
// plus doors into the focused screens (Quest Log, World Map, Chests, Shop,
// Achievements, History) rather than one giant page with everything on it.
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
  const todayStr = localDateStr();
  const motivation = dailyMotivation(`${user.id}:${todayStr}`);

  // Independent of each other and of the profile fetch above — run together
  // instead of one-at-a-time round trips.
  const [friendRowsRes, nextAchievement, quests] = await Promise.all([
    supabase
      .from("friendships")
      .select("user_id, friend_id")
      .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
      .eq("status", "accepted"),
    getNextAchievementProgress({
      totalWorkouts: profile.total_workouts,
      currentStreak: profile.current_streak,
      level: progress.level,
      hasNewPR: false,
      muscleGroupVariety: profile.trained_muscle_groups?.length ?? 0,
    }),
    ensureTodayQuests(user.id),
  ]);
  const questsCompleted = quests.filter((q) => q.completed).length;

  // Rare Chests drop every 5 levels — how close is the next one.
  const nextChestLevel = (Math.floor(progress.level / 5) + 1) * 5;
  const levelsToNextChest = nextChestLevel - progress.level;

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
  const totalChests =
    (profile.chests_common ?? 0) + (profile.chests_rare ?? 0) + (profile.chests_legendary ?? 0);

  return (
    <main className="mx-auto max-w-lg px-6 py-12">
      <header className="mb-8 flex items-center justify-between">
        <Link href="/profile" className="flex items-center gap-3">
          <AvatarDisplay
            avatarUrl={profile.avatar_url}
            avatar={profile.avatar}
            borderClass={profile.equipped_border}
            size={56}
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
          <SoundToggle />
          <ThemeToggle />
          <Link
            href="/feedback"
            aria-label="Send feedback"
            title="Send feedback"
            className="press rounded-lg border border-line bg-surface px-3 py-2 text-sm transition hover:border-forge/50"
          >
            💬
          </Link>
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

      {/* Level + XP card — the bar itself is a door to the World Map */}
      <div className="fade-in-up forge-panel forge-panel-hot glow-pulse relative overflow-hidden p-6">
        <Link href="/world" className="block">
          <div className="mb-3 flex items-baseline justify-between">
            <span className="text-lg font-bold">
              Level{" "}
              <AnimatedNumber
                value={progress.level}
                className="font-display text-3xl font-bold text-amber-300"
              />
            </span>
            <span className="rounded-full bg-amber-500/15 px-3 py-1 text-sm font-semibold text-amber-400">
              {rank}
            </span>
          </div>
          <div className="xp-bar h-3 w-full rounded-full bg-surface2">
            <div
              className="h-full rounded-full bg-gradient-to-r from-forge to-amber-400 transition-all duration-700 ease-out"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
          <p className="mt-2 text-sm text-muted">
            {progress.atMax ? (
              "Max level reached!"
            ) : (
              <>
                <AnimatedNumber value={progress.into} className="font-semibold text-fg" /> /{" "}
                {progress.need} XP · {progress.remaining} to next level
              </>
            )}
            <span className="ml-1 text-forge">· View on the map →</span>
          </p>
        </Link>
        <div className="mt-3">
          <ShareButton
            text={`I just hit Level ${progress.level} (${rank}) on Forge! 🔥 ${profile.current_streak} day streak.`}
            label="Share progress"
          />
        </div>
      </div>

      {/* Today's quests — pulled up onto Home instead of only living behind
          a door, so "what should I do today" doesn't require a detour. */}
      {quests.length > 0 && (
        <Link
          href="/quests"
          className="fade-in-up forge-panel forge-accent-emerald mt-4 flex items-center justify-between p-4 transition hover:brightness-110"
          style={{ animationDelay: "0.02s" }}
        >
          <div className="flex items-center gap-3">
            <ScrollIcon width={22} height={22} className="text-emerald-400" />
            <div>
              <p className="font-display text-base font-bold text-emerald-300">Today's Quests</p>
              <p className="text-xs text-muted">
                {questsCompleted} of {quests.length} complete
              </p>
            </div>
          </div>
          <span className="text-muted">→</span>
        </Link>
      )}

      <NextRewardTeaser levelsToNextChest={levelsToNextChest} nextAchievement={nextAchievement} />

      {/* Character build */}
      <section
        className="fade-in-up game-card mt-4 rounded-2xl border border-line bg-surface p-5"
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
        className="press fade-in-up glow-pulse mt-4 block rounded-2xl bg-gradient-to-r from-forge to-rose-500 py-5 text-center text-lg font-black text-neutral-950 shadow-lg shadow-forge/20 transition hover:from-forge-soft hover:to-rose-400"
        style={{ animationDelay: "0.08s" }}
      >
        ⚔️ Log a workout
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
        <Stat label="Streak" value={profile.current_streak} icon="🔥" flicker accent="sky" />
        <Stat label="Best" value={profile.longest_streak} accent="violet" />
        <Stat label="Workouts" value={profile.total_workouts} accent="emerald" />
      </section>
      {profile.streak_freezes > 0 && (
        <p className="mt-2 text-center text-xs text-sky-300/80">
          🧊 {profile.streak_freezes} streak freeze{profile.streak_freezes === 1 ? "" : "s"}{" "}
          banked — protects your streak if you miss a day.
        </p>
      )}

      {/* Doors — everywhere else in Forge */}
      <p
        className="fade-in-up mb-2 mt-6 text-xs font-black uppercase tracking-wide text-muted"
        style={{ animationDelay: "0.13s" }}
      >
        Where to next
      </p>
      <div className="grid grid-cols-3 gap-3">
        <Door href="/quests" icon={ScrollIcon} label="Quest Log" accent="emerald" delay={0.14} />
        <Door href="/world" icon={MapPinIcon} label="World Map" accent="fuchsia" delay={0.15} />
        <Door href="/achievements" icon={MedalIcon} label="Achievements" accent="amber" delay={0.16} />
        <Door href="/history" icon={BookIcon} label="History" accent="sky" delay={0.17} />
        <Door
          href="/chests"
          icon={ChestIcon}
          label="Chests"
          accent="amber"
          delay={0.18}
          badge={totalChests > 0 ? totalChests : undefined}
        />
        <Door href="/shop" icon={CartIcon} label="Shop" accent="fuchsia" delay={0.19} />
      </div>
    </main>
  );
}

const ACCENTS = {
  sky: "border-sky-500/30 bg-sky-500/5",
  violet: "border-violet-500/30 bg-violet-500/5",
  emerald: "border-emerald-500/30 bg-emerald-500/5",
  amber: "border-amber-500/30 bg-amber-500/5",
  rose: "border-rose-500/30 bg-rose-500/5",
  fuchsia: "border-fuchsia-500/30 bg-fuchsia-500/5",
} as const;

const DOOR_GLOW: Record<keyof typeof ACCENTS, string> = {
  sky: "rgb(2 132 199 / 0.5)",
  violet: "rgb(109 40 217 / 0.5)",
  emerald: "rgb(4 120 87 / 0.5)",
  amber: "rgb(180 83 9 / 0.5)",
  rose: "rgb(190 18 60 / 0.5)",
  fuchsia: "rgb(162 28 175 / 0.5)",
};

function Door({
  href,
  icon: Icon,
  label,
  accent,
  delay,
  badge,
}: {
  href: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  label: string;
  accent: keyof typeof ACCENTS;
  delay: number;
  badge?: number;
}) {
  return (
    <Link
      href={href}
      className={`fade-in-up forge-panel press-3d forge-accent-${accent} relative flex flex-col items-center justify-center gap-1.5 px-2 py-4 text-center transition hover:brightness-110`}
      style={{ animationDelay: `${delay}s`, "--press-shadow": DOOR_GLOW[accent] } as React.CSSProperties}
    >
      {badge !== undefined && (
        <span className="absolute -right-1.5 -top-1.5 flex h-6 min-w-6 items-center justify-center rounded-full bg-forge px-1.5 text-xs font-black text-neutral-950">
          {badge}
        </span>
      )}
      <Icon width={24} height={24} />
      <span className="font-display text-xs font-semibold tracking-wide">{label}</span>
    </Link>
  );
}

function Stat({
  label,
  value,
  icon,
  flicker,
  accent,
}: {
  label: string;
  value: number;
  icon?: string;
  flicker?: boolean;
  accent?: keyof typeof ACCENTS;
}) {
  return (
    <div
      className={`game-card rounded-xl border p-4 text-center ${accent ? ACCENTS[accent] : "border-line bg-surface"}`}
    >
      <div className="font-display text-2xl font-bold">
        <AnimatedNumber value={value} />
        {icon && <span className={flicker ? "flame-flicker ml-0.5" : "ml-0.5"}>{icon}</span>}
      </div>
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
