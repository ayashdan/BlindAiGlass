import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AvatarDisplay from "@/components/AvatarDisplay";
import TabScreenHeader from "@/components/TabScreenHeader";
import { effectiveWeeklyXp, daysUntilReset } from "@/lib/game/league";

const PAGE_SIZE = 50;

// Public game stats (profiles table) ranked by weekly XP, lifetime XP, or
// streak. `profiles` is readable by anyone (see 0001_profiles.sql), so this
// uses the normal per-request client — no admin/service-role access needed.
// Weekly is the default: it resets every Monday, so a newcomer can actually
// win it — lifetime XP is a museum, this week is a race.
export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: { by?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const by =
    searchParams.by === "streak"
      ? "current_streak"
      : searchParams.by === "xp"
        ? "xp"
        : "weekly_xp";

  const { data: top } = await supabase
    .from("profiles")
    .select(
      "id, username, avatar, avatar_url, xp, level, rank, current_streak, prestige, equipped_border, equipped_title, weekly_xp, week_start"
    )
    .order(by, { ascending: false })
    .limit(PAGE_SIZE);

  // The stored weekly_xp can be stale (last week's score before the lazy
  // reset) — normalize through effectiveWeeklyXp and re-sort. Approximate
  // beyond the fetched page, which is fine for a top-50 board.
  let list = (top ?? []) as any[];
  if (by === "weekly_xp") {
    list = list
      .map((u) => ({ ...u, weekly: effectiveWeeklyXp(u) }))
      .sort((a, b) => b.weekly - a.weekly);
  }
  const myIndex = list.findIndex((u) => u.id === user.id);

  // If the user isn't in the visible top list, work out their real rank
  // with a count query instead of pulling the whole table.
  let myRank: number | null = null;
  let mine: any = null;
  if (myIndex === -1) {
    const { data: me } = await supabase
      .from("profiles")
      .select("id, username, xp, level, rank, current_streak, weekly_xp, week_start")
      .eq("id", user.id)
      .single();
    mine = me;
    if (me) {
      const myValue = by === "weekly_xp" ? effectiveWeeklyXp(me) : me[by];
      const { count } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gt(by, myValue);
      myRank = (count ?? 0) + 1;
    }
  }

  const medal = (i: number) => (i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`);
  const tabs = [
    { key: "weekly", href: "/leaderboard", label: "This week", active: by === "weekly_xp" },
    { key: "xp", href: "/leaderboard?by=xp", label: "All time", active: by === "xp" },
    {
      key: "streak",
      href: "/leaderboard?by=streak",
      label: "Streak",
      active: by === "current_streak",
    },
  ];

  return (
    <main className="mx-auto max-w-lg px-6 py-12">
      <TabScreenHeader
        icon="🏆"
        title="Leaderboard"
        subtitle={
          by === "weekly_xp"
            ? `This week's race — resets in ${daysUntilReset()}d.`
            : by === "xp"
              ? "Top Forgers of all time."
              : "Longest active streaks."
        }
      />

      <div className="mb-4 flex gap-2">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={t.href}
            className={
              "press rounded-lg border px-3 py-1.5 text-sm font-semibold transition " +
              (t.active
                ? "border-forge bg-forge/15 text-forge"
                : "border-line text-fg hover:border-forge/50")
            }
          >
            {t.label}
          </Link>
        ))}
      </div>

      <div className="space-y-2">
        {list.map((u, i) => {
          const mineRow = u.id === user.id;
          const podium = i < 3;
          return (
            <div
              key={u.id}
              className={
                "fade-in-up game-card flex items-center gap-3 rounded-xl border p-3 " +
                (mineRow
                  ? "border-forge/50 bg-forge/10"
                  : podium
                    ? "border-amber-500/30 bg-amber-500/5"
                    : "border-line bg-surface")
              }
              style={{ animationDelay: `${Math.min(i, 10) * 0.03}s` }}
            >
              <span className={"w-8 text-center font-black " + (podium ? "flame-flicker text-xl" : "text-muted")}>
                {medal(i)}
              </span>
              <AvatarDisplay
                avatarUrl={u.avatar_url}
                avatar={u.avatar}
                borderClass={u.equipped_border}
                size={32}
              />
              <div className="flex-1">
                <p className="font-bold">
                  {u.prestige > 0 && <span className="mr-1 text-amber-400">⭐×{u.prestige}</span>}
                  {u.username}
                  {mineRow && <span className="ml-2 text-xs text-forge">(you)</span>}
                </p>
                <p className="text-xs text-muted">
                  Level {u.level} · {u.rank}
                  {u.equipped_title ? ` · "${u.equipped_title}"` : ""}
                </p>
              </div>
              <span className="font-semibold text-forge">
                {by === "current_streak"
                  ? `${u.current_streak}🔥`
                  : by === "weekly_xp"
                    ? `+${u.weekly.toLocaleString()} XP`
                    : `${u.xp.toLocaleString()} XP`}
              </span>
            </div>
          );
        })}

        {list.length === 0 && (
          <div className="forge-panel p-6 text-center">
            <p className="text-3xl">🏆</p>
            <p className="mt-2 font-display font-bold">The board is empty</p>
            <p className="mt-1 text-sm text-muted">
              First workout logged this week takes #1.
            </p>
            <Link
              href="/workout"
              className="press mt-4 inline-block rounded-lg bg-forge px-4 py-2 text-sm font-bold text-neutral-950 transition hover:bg-forge-soft"
            >
              ⚔️ Log a workout
            </Link>
          </div>
        )}
      </div>

      {myRank !== null && mine && (
        <div className="mt-4 rounded-xl border border-forge/50 bg-forge/10 p-3 text-center">
          <p className="text-sm text-fg">
            You're ranked <span className="font-black text-forge">#{myRank}</span> —{" "}
            {mine.username}, Level {mine.level}
          </p>
        </div>
      )}
    </main>
  );
}
