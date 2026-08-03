import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AvatarDisplay from "@/components/AvatarDisplay";
import SubmitButton from "@/components/SubmitButton";
import TabScreenHeader from "@/components/TabScreenHeader";
import CopyLink from "@/components/CopyLink";
import ShareButton from "@/components/ShareButton";
import { effectiveWeeklyXp, previousWeekStart, daysUntilReset } from "@/lib/game/league";
import { MUSCLE_GROUPS } from "@/lib/game/muscle-groups";
import { sendFriendRequest, acceptFriendRequest, removeFriend, hypeEvent } from "./actions";

// The weekly league: friends (you included) ranked by XP earned THIS WEEK,
// not lifetime — so whoever shows up most this week wins, no matter who
// installed first. Lifetime XP is still there behind the "All time" toggle.
export default async function FriendsPage({
  searchParams,
}: {
  searchParams: { by?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const byAllTime = searchParams.by === "all";

  const { data: rowsData } = await supabase
    .from("friendships")
    .select("id, user_id, friend_id, status")
    .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);
  const rows = (rowsData ?? []) as any[];

  const accepted = rows.filter((r) => r.status === "accepted");
  const incoming = rows.filter((r) => r.status === "pending" && r.friend_id === user.id);
  const outgoing = rows.filter((r) => r.status === "pending" && r.user_id === user.id);

  const friendIds = accepted.map((r) => (r.user_id === user.id ? r.friend_id : r.user_id));
  const incomingIds = incoming.map((r) => r.user_id);
  const outgoingIds = outgoing.map((r) => r.friend_id);
  const allIds = Array.from(
    new Set([user.id, ...friendIds, ...incomingIds, ...outgoingIds])
  );

  const lastWeek = previousWeekStart();

  const [{ data: profilesData }, { data: lastWeekRows }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, username, avatar, avatar_url, xp, level, rank, prestige, weekly_xp, week_start")
      .in("id", allIds),
    supabase
      .from("league_weeks")
      .select("user_id, points, won")
      .eq("week_start", lastWeek)
      .in("user_id", allIds),
  ]);

  const byId = new Map((profilesData ?? []).map((p: any) => [p.id, p]));
  const me = byId.get(user.id);

  // ---- The league table: you + accepted friends ----
  const leagueRows = [user.id, ...friendIds]
    .map((id) => byId.get(id))
    .filter((p): p is any => Boolean(p))
    .map((p) => ({ ...p, weekly: effectiveWeeklyXp(p) }))
    .sort((a, b) => (byAllTime ? b.xp - a.xp : b.weekly - a.weekly));

  const lastWeekWinners = new Set(
    ((lastWeekRows ?? []) as any[]).filter((r) => r.won).map((r) => r.user_id)
  );
  const myLastWeek = ((lastWeekRows ?? []) as any[]).find((r) => r.user_id === user.id);

  // ---- Activity feed: the last week of you + your friends' workouts ----
  const feedSince = new Date(Date.now() - 7 * 86400000).toISOString();
  const { data: feedData } = await supabase
    .from("friend_events")
    .select("id, user_id, payload, created_at")
    .in("user_id", [user.id, ...friendIds])
    .gte("created_at", feedSince)
    .order("created_at", { ascending: false })
    .limit(30);
  const feed = (feedData ?? []) as any[];

  const { data: hypesData } = feed.length
    ? await supabase
        .from("hypes")
        .select("event_id, from_user")
        .in("event_id", feed.map((e) => e.id))
    : { data: [] as any[] };
  const hypeCounts = new Map<string, number>();
  const myHypes = new Set<string>();
  for (const h of (hypesData ?? []) as any[]) {
    hypeCounts.set(h.event_id, (hypeCounts.get(h.event_id) ?? 0) + 1);
    if (h.from_user === user.id) myHypes.add(h.event_id);
  }

  // ---- Invite link (the in-app referral loop) ----
  const host = headers().get("host") ?? "";
  const proto = host.startsWith("localhost") ? "http" : "https";
  const inviteUrl = me ? `${proto}://${host}/signup?ref=${encodeURIComponent(me.username)}` : "";
  const inviteText = me
    ? `⚔️ I'm challenging you on Forge — workouts as a game, and we compete weekly. Join my league: ${inviteUrl}`
    : "";

  const hasFriends = friendIds.length > 0;
  const resetDays = daysUntilReset();

  return (
    <main className="mx-auto max-w-lg px-6 py-12">
      <TabScreenHeader
        icon="🤝"
        title="Friends"
        subtitle="A weekly race — everyone's back to 0 on Monday."
      />

      <form action={sendFriendRequest} className="mb-6 flex gap-2">
        <input
          type="text"
          name="username"
          placeholder="Add by username"
          required
          className="flex-1 rounded-lg border border-line bg-surface px-4 py-2 text-sm outline-none focus:border-forge"
        />
        <SubmitButton
          pendingText="Adding…"
          className="press rounded-lg bg-forge px-4 py-2 text-sm font-bold text-neutral-950 transition hover:bg-forge-soft"
        >
          Add
        </SubmitButton>
      </form>

      {incoming.length > 0 && (
        <section className="mb-6">
          <p className="mb-2 text-sm font-black uppercase tracking-wide text-muted">Requests</p>
          <div className="space-y-2">
            {incoming.map((r) => {
              const p = byId.get(r.user_id);
              if (!p) return null;
              return (
                <div
                  key={r.id}
                  className="game-card flex items-center gap-3 rounded-xl border border-line bg-surface p-3"
                >
                  <AvatarDisplay avatarUrl={p.avatar_url} avatar={p.avatar} size={32} />
                  <p className="flex-1 font-bold">{p.username}</p>
                  <form action={acceptFriendRequest}>
                    <input type="hidden" name="id" value={r.id} />
                    <SubmitButton className="press rounded-lg bg-forge px-3 py-1.5 text-xs font-bold text-neutral-950 transition hover:bg-forge-soft">
                      Accept
                    </SubmitButton>
                  </form>
                  <form action={removeFriend}>
                    <input type="hidden" name="id" value={r.id} />
                    <SubmitButton className="press rounded-lg border border-line px-3 py-1.5 text-xs text-muted transition hover:border-red-500/40 hover:text-red-300">
                      Decline
                    </SubmitButton>
                  </form>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {outgoing.length > 0 && (
        <section className="mb-6">
          <p className="mb-2 text-sm font-black uppercase tracking-wide text-muted">Pending</p>
          <div className="space-y-2">
            {outgoing.map((r) => {
              const p = byId.get(r.friend_id);
              if (!p) return null;
              return (
                <div
                  key={r.id}
                  className="game-card flex items-center gap-3 rounded-xl border border-line bg-surface p-3"
                >
                  <AvatarDisplay avatarUrl={p.avatar_url} avatar={p.avatar} size={32} />
                  <p className="flex-1 text-muted">{p.username} — waiting</p>
                  <form action={removeFriend}>
                    <input type="hidden" name="id" value={r.id} />
                    <SubmitButton className="press text-xs text-muted transition hover:text-red-300">
                      Cancel
                    </SubmitButton>
                  </form>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {hasFriends ? (
        <>
          {/* ---- This week's league ---- */}
          <section className="mb-6">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-black uppercase tracking-wide text-muted">
                {byAllTime ? "All-time XP" : "This week's league"}
              </p>
              <span className="rounded-full border border-line px-2.5 py-0.5 text-xs text-muted">
                {byAllTime ? " lifetime " : `resets in ${resetDays}d`}
              </span>
            </div>
            <div className="mb-3 flex gap-2">
              <Link
                href="/friends"
                className={
                  "press rounded-lg border px-3 py-1.5 text-xs font-semibold transition " +
                  (!byAllTime
                    ? "border-forge bg-forge/15 text-forge"
                    : "border-line text-fg hover:border-forge/50")
                }
              >
                This week
              </Link>
              <Link
                href="/friends?by=all"
                className={
                  "press rounded-lg border px-3 py-1.5 text-xs font-semibold transition " +
                  (byAllTime
                    ? "border-forge bg-forge/15 text-forge"
                    : "border-line text-fg hover:border-forge/50")
                }
              >
                All time
              </Link>
            </div>

            <div className="space-y-2">
              {leagueRows.map((p, i) => {
                const mineRow = p.id === user.id;
                return (
                  <div
                    key={p.id}
                    className={
                      "fade-in-up game-card flex items-center gap-3 rounded-xl border p-3 " +
                      (mineRow
                        ? "border-forge/50 bg-forge/10"
                        : i === 0
                          ? "border-amber-500/30 bg-amber-500/5"
                          : "border-line bg-surface")
                    }
                    style={{ animationDelay: `${Math.min(i, 10) * 0.03}s` }}
                  >
                    <span
                      className={
                        "w-8 text-center font-black " +
                        (i < 3 ? "flame-flicker text-lg" : "text-muted")
                      }
                    >
                      {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                    </span>
                    <AvatarDisplay avatarUrl={p.avatar_url} avatar={p.avatar} size={32} />
                    <div className="flex-1">
                      <p className="font-bold">
                        {p.prestige > 0 && (
                          <span className="mr-1 text-amber-400">⭐×{p.prestige}</span>
                        )}
                        {p.username}
                        {mineRow && <span className="ml-2 text-xs text-forge">(you)</span>}
                        {lastWeekWinners.has(p.id) && (
                          <span
                            className="ml-2 text-xs"
                            title="Won their league last week"
                          >
                            👑
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-muted">
                        Level {p.level} · {p.rank}
                      </p>
                    </div>
                    <span className="font-semibold text-forge">
                      {byAllTime
                        ? `${p.xp.toLocaleString()} XP`
                        : `+${p.weekly.toLocaleString()} XP`}
                    </span>
                  </div>
                );
              })}
            </div>
            {!byAllTime && (
              <p className="mt-2 text-center text-xs text-muted">
                Only workout XP counts, max 3 workouts a day — showing up beats grinding.
              </p>
            )}
          </section>

          {/* ---- Activity feed ---- */}
          <section className="mb-6">
            <p className="mb-2 text-sm font-black uppercase tracking-wide text-muted">
              Recent activity
            </p>
            {feed.length === 0 ? (
              <p className="text-sm text-muted">
                Quiet week so far — the first workout anyone logs shows up here.
              </p>
            ) : (
              <div className="space-y-2">
                {feed.map((ev) => {
                  const p = byId.get(ev.user_id);
                  if (!p) return null;
                  const own = ev.user_id === user.id;
                  const hyped = myHypes.has(ev.id);
                  const count = hypeCounts.get(ev.id) ?? 0;
                  return (
                    <div
                      key={ev.id}
                      className="game-card flex items-center gap-3 rounded-xl border border-line bg-surface p-3"
                    >
                      <AvatarDisplay avatarUrl={p.avatar_url} avatar={p.avatar} size={32} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm">
                          <span className="font-bold">{own ? "You" : p.username}</span>{" "}
                          <span className="text-muted">{describeEvent(ev.payload)}</span>
                        </p>
                        <p className="text-xs text-muted">
                          {eventBadges(ev.payload)} {timeAgo(ev.created_at)}
                        </p>
                      </div>
                      {own || hyped ? (
                        <span
                          className={
                            "flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-bold " +
                            (hyped
                              ? "border-forge/50 bg-forge/10 text-forge"
                              : "border-line text-muted")
                          }
                        >
                          🔥 {count}
                        </span>
                      ) : (
                        <form action={hypeEvent}>
                          <input type="hidden" name="eventId" value={ev.id} />
                          <SubmitButton className="press flex items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 text-xs font-bold text-fg transition hover:border-forge/60 hover:text-forge">
                            🔥 {count > 0 ? count : "Hype"}
                          </SubmitButton>
                        </form>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </>
      ) : (
        /* ---- Zero friends: this is a recruiting screen, not a dead end ---- */
        <section className="mb-6 space-y-4">
          <div className="forge-panel forge-accent-rose p-5 text-center">
            <p className="text-3xl">⚔️</p>
            <p className="mt-2 font-display text-lg font-bold">Forge is better with a rival</p>
            <p className="mx-auto mt-1 max-w-xs text-sm text-muted">
              Friends race on XP earned each week — fresh start every Monday, so
              anyone can win. Invite someone and they join your league the moment
              they sign up.
            </p>
          </div>

          <div className="game-card rounded-xl border border-line bg-surface p-4 text-center">
            <p className="mb-1 text-sm font-black uppercase tracking-wide text-muted">
              You vs. last week
            </p>
            <p className="text-2xl font-black">
              <span className="text-forge">
                +{(me ? effectiveWeeklyXp(me) : 0).toLocaleString()}
              </span>{" "}
              <span className="text-sm font-semibold text-muted">
                vs {(myLastWeek?.points ?? 0).toLocaleString()} XP last week
              </span>
            </p>
            <p className="mt-1 text-xs text-muted">
              No friends yet? Beat your own last week — resets in {resetDays}d.
            </p>
          </div>
        </section>
      )}

      {/* ---- Invite link — always available, front and centre when alone ---- */}
      {me && (
        <section className="mb-2">
          <p className="mb-2 text-sm font-black uppercase tracking-wide text-muted">
            Invite a rival
          </p>
          <div className="game-card space-y-2 rounded-xl border border-line bg-surface p-4">
            <p className="break-all rounded-lg bg-bg px-3 py-2 font-mono text-xs text-muted">
              {inviteUrl}
            </p>
            <CopyLink url={inviteUrl} />
            <ShareButton text={inviteText} label="Share invite" className="w-full" />
            <p className="text-xs text-muted">
              They start auto-friended with you — and when they log their 3rd
              workout, you unlock the 🎖️ Recruiter title.
            </p>
          </div>
        </section>
      )}
    </main>
  );
}

// "logged Chest + Triceps · 45 min · +180 XP" from an event payload.
function describeEvent(payload: any): string {
  const groups: string[] = Array.isArray(payload?.muscle_groups) ? payload.muscle_groups : [];
  const labels = groups
    .map((g) => MUSCLE_GROUPS.find((m) => m.key === g)?.label ?? g)
    .slice(0, 3);
  const what =
    payload?.custom_name ||
    (labels.length > 0 ? labels.join(" + ") : "a workout");
  const bits = [`logged ${what}`];
  if (payload?.duration) bits.push(`${payload.duration} min`);
  if (payload?.xp) bits.push(`+${Number(payload.xp).toLocaleString()} XP`);
  return bits.join(" · ");
}

function eventBadges(payload: any): string {
  const badges: string[] = [];
  if (payload?.leveled_up) badges.push(`⬆️ Level ${payload.level}`);
  if ((payload?.prs ?? 0) > 0) badges.push("🏆 New PR");
  if (Array.isArray(payload?.achievements) && payload.achievements.length > 0) {
    badges.push(`🏅 ${payload.achievements[0]}`);
  }
  return badges.length > 0 ? badges.join(" · ") + " ·" : "";
}

function timeAgo(iso: string): string {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 3600) return `${Math.max(1, Math.floor(s / 60))}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}
