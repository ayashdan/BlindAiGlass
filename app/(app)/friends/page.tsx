import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AvatarDisplay from "@/components/AvatarDisplay";
import SubmitButton from "@/components/SubmitButton";
import { sendFriendRequest, acceptFriendRequest, removeFriend } from "./actions";

// A small-group leaderboard: competing against people you actually know
// drives daily check-ins far better than a global list full of strangers.
export default async function FriendsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

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
  const allIds = Array.from(new Set([...friendIds, ...incomingIds, ...outgoingIds]));

  const { data: profilesData } = allIds.length
    ? await supabase
        .from("profiles")
        .select("id, username, avatar, avatar_url, xp, level, rank, prestige")
        .in("id", allIds)
    : { data: [] as any[] };
  const byId = new Map((profilesData ?? []).map((p: any) => [p.id, p]));

  const friendProfiles = friendIds
    .map((id) => byId.get(id))
    .filter((p): p is any => Boolean(p))
    .sort((a, b) => b.xp - a.xp);

  return (
    <main className="mx-auto max-w-lg px-6 py-12">
      <Link href="/dashboard" className="text-sm text-muted hover:text-fg">
        ← Back
      </Link>
      <h1 className="mb-1 mt-3 text-2xl font-black tracking-tight">Friends</h1>
      <p className="mb-6 text-sm text-muted">Compete with people you actually know.</p>

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

      <section>
        <p className="mb-2 text-sm font-black uppercase tracking-wide text-muted">
          Friends leaderboard ({friendProfiles.length})
        </p>
        <div className="space-y-2">
          {friendProfiles.map((p, i) => (
            <div
              key={p.id}
              className={
                "fade-in-up game-card flex items-center gap-3 rounded-xl border p-3 " +
                (i < 3 ? "border-amber-500/30 bg-amber-500/5" : "border-line bg-surface")
              }
              style={{ animationDelay: `${Math.min(i, 10) * 0.03}s` }}
            >
              <span className={"w-8 text-center font-black " + (i < 3 ? "flame-flicker text-lg" : "text-muted")}>
                {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
              </span>
              <AvatarDisplay avatarUrl={p.avatar_url} avatar={p.avatar} size={32} />
              <div className="flex-1">
                <p className="font-bold">
                  {p.prestige > 0 && <span className="mr-1 text-amber-400">⭐×{p.prestige}</span>}
                  {p.username}
                </p>
                <p className="text-xs text-muted">
                  Level {p.level} · {p.rank}
                </p>
              </div>
              <span className="font-semibold text-forge">{p.xp} XP</span>
            </div>
          ))}
          {friendProfiles.length === 0 && (
            <p className="text-sm text-muted">No friends yet — add someone by username above.</p>
          )}
        </div>
      </section>
    </main>
  );
}
