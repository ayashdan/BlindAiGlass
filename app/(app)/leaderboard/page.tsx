import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const PAGE_SIZE = 50;

// Public game stats (profiles table) ranked by XP or streak. `profiles` is
// readable by anyone (see 0001_profiles.sql), so this uses the normal
// per-request client — no admin/service-role access needed.
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

  const by = searchParams.by === "streak" ? "current_streak" : "xp";

  const { data: top } = await supabase
    .from("profiles")
    .select("id, username, xp, level, rank, current_streak")
    .order(by, { ascending: false })
    .limit(PAGE_SIZE);

  const list = (top ?? []) as any[];
  const myIndex = list.findIndex((u) => u.id === user.id);

  // If the user isn't in the visible top list, work out their real rank
  // with a count query instead of pulling the whole table.
  let myRank: number | null = null;
  let mine: any = null;
  if (myIndex === -1) {
    const { data: me } = await supabase
      .from("profiles")
      .select("id, username, xp, level, rank, current_streak")
      .eq("id", user.id)
      .single();
    mine = me;
    if (me) {
      const { count } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gt(by, me[by]);
      myRank = (count ?? 0) + 1;
    }
  }

  const medal = (i: number) => (i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`);

  return (
    <main className="mx-auto max-w-lg px-6 py-12">
      <Link href="/dashboard" className="text-sm text-neutral-400 hover:text-neutral-200">
        ← Back
      </Link>
      <h1 className="mb-1 mt-3 text-2xl font-black tracking-tight">Leaderboard</h1>
      <p className="mb-6 text-sm text-neutral-400">
        Top Forgers, ranked by {by === "xp" ? "XP" : "streak"}.
      </p>

      <div className="mb-4 flex gap-2">
        <Link
          href="/leaderboard"
          className={
            "press rounded-lg border px-3 py-1.5 text-sm font-semibold transition " +
            (by === "xp"
              ? "border-forge bg-forge/15 text-forge"
              : "border-neutral-800 text-neutral-300 hover:border-neutral-600")
          }
        >
          By XP
        </Link>
        <Link
          href="/leaderboard?by=streak"
          className={
            "press rounded-lg border px-3 py-1.5 text-sm font-semibold transition " +
            (by === "current_streak"
              ? "border-forge bg-forge/15 text-forge"
              : "border-neutral-800 text-neutral-300 hover:border-neutral-600")
          }
        >
          By Streak
        </Link>
      </div>

      <div className="space-y-2">
        {list.map((u, i) => {
          const mineRow = u.id === user.id;
          return (
            <div
              key={u.id}
              className={
                "fade-in-up flex items-center gap-3 rounded-xl border p-3 " +
                (mineRow ? "border-forge/50 bg-forge/10" : "border-neutral-800 bg-neutral-900")
              }
              style={{ animationDelay: `${Math.min(i, 10) * 0.03}s` }}
            >
              <span className="w-8 text-center font-black text-neutral-500">{medal(i)}</span>
              <div className="flex-1">
                <p className="font-bold">
                  {u.username}
                  {mineRow && <span className="ml-2 text-xs text-forge">(you)</span>}
                </p>
                <p className="text-xs text-neutral-500">
                  Level {u.level} · {u.rank}
                </p>
              </div>
              <span className="font-semibold text-forge">
                {by === "current_streak" ? `${u.current_streak}🔥` : `${u.xp} XP`}
              </span>
            </div>
          );
        })}

        {list.length === 0 && <p className="text-neutral-500">No one on the board yet.</p>}
      </div>

      {myRank !== null && mine && (
        <div className="mt-4 rounded-xl border border-forge/50 bg-forge/10 p-3 text-center">
          <p className="text-sm text-neutral-300">
            You're ranked <span className="font-black text-forge">#{myRank}</span> —{" "}
            {mine.username}, Level {mine.level}
          </p>
        </div>
      )}
    </main>
  );
}
