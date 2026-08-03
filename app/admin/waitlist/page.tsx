import { createAdminClient } from "@/lib/supabase/admin";
import { inviteFromWaitlist, uninviteFromWaitlist } from "./actions";
import SubmitButton from "@/components/SubmitButton";

// The waitlist table has RLS on with zero public policies, so the only way to
// read the raw list (emails, referral counts) is through this service-role
// client — never exposed to the browser.
export default async function AdminWaitlist({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("waitlist")
    .select("*")
    .order("referral_count", { ascending: false })
    .order("created_at", { ascending: true });

  const list = (data ?? []) as any[];

  return (
    <div>
      {searchParams?.error && (
        <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {searchParams.error}
        </div>
      )}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted">{list.length} on the waitlist</p>
        <a
          href="/admin/waitlist/export"
          className="rounded-lg border border-line px-3 py-1.5 text-sm font-semibold hover:border-forge hover:text-forge"
        >
          Export CSV
        </a>
      </div>
      <p className="mb-4 text-xs text-muted">
        "Invite" emails that person a magic link (Supabase's built-in invite
        email) — clicking it creates their account and logs them straight
        in, no signup form or password needed to get started.
      </p>

      {/* Referral clusters: invite people in waves WITH the friends who
          referred them, so they arrive to a league that already has people
          they know in it — instead of a cold, empty friends tab. */}
      {(() => {
        const byCode = new Map(list.map((w) => [w.referral_code, w]));
        const clusters = list
          .filter((w) => (w.referral_count ?? 0) > 0)
          .map((w) => ({
            referrer: w,
            members: list.filter((m) => m.referred_by === w.referral_code),
          }))
          .filter((c) => c.members.length > 0)
          .sort((a, b) => b.members.length - a.members.length)
          .slice(0, 5);
        if (clusters.length === 0) return null;
        return (
          <div className="mb-6 rounded-xl border border-forge/30 bg-forge/5 p-4">
            <p className="mb-1 text-sm font-black uppercase tracking-wide text-forge">
              🚀 Launch in clusters
            </p>
            <p className="mb-3 text-xs text-muted">
              These people brought friends — invite each group together and
              they arrive with their weekly league already populated.
            </p>
            <div className="space-y-2">
              {clusters.map((c) => (
                <div key={c.referrer.id} className="rounded-lg border border-line bg-surface p-3 text-sm">
                  <p className="font-bold">
                    {c.referrer.name || c.referrer.email}
                    <span className="ml-2 text-xs font-normal text-muted">
                      + {c.members.length} referred
                    </span>
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {c.members.map((m) => m.name || m.email).join(" · ")}
                  </p>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      <div className="overflow-x-auto rounded-xl border border-line">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface text-muted">
            <tr>
              <th className="px-4 py-2">#</th>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Referrals</th>
              <th className="px-4 py-2">Referred by</th>
              <th className="px-4 py-2">Joined</th>
              <th className="px-4 py-2">Invite</th>
            </tr>
          </thead>
          <tbody>
            {list.map((w, i) => (
              <tr key={w.id} className="border-t border-line">
                <td className="px-4 py-2 text-muted">{i + 1}</td>
                <td className="px-4 py-2">{w.email}</td>
                <td className="px-4 py-2 text-muted">{w.name || "—"}</td>
                <td className="px-4 py-2 font-semibold text-forge">{w.referral_count}</td>
                <td className="px-4 py-2 text-muted">
                  {(() => {
                    const ref = w.referred_by
                      ? list.find((x) => x.referral_code === w.referred_by)
                      : null;
                    return ref ? ref.name || ref.email : "—";
                  })()}
                </td>
                <td className="px-4 py-2 text-muted">
                  {new Date(w.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-2">
                  {w.invited ? (
                    <form action={uninviteFromWaitlist}>
                      <input type="hidden" name="id" value={w.id} />
                      <SubmitButton className="rounded-lg border border-amber-500/40 px-3 py-1 text-xs font-semibold text-amber-400 transition hover:bg-amber-500/10">
                        ⭐ Invited — revoke
                      </SubmitButton>
                    </form>
                  ) : (
                    <form action={inviteFromWaitlist}>
                      <input type="hidden" name="id" value={w.id} />
                      <input type="hidden" name="email" value={w.email} />
                      <input type="hidden" name="name" value={w.name || ""} />
                      <SubmitButton
                        pendingText="Sending…"
                        className="rounded-lg border border-line px-3 py-1 text-xs font-semibold text-fg transition hover:border-forge hover:text-forge"
                      >
                        Invite
                      </SubmitButton>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {list.length === 0 && (
          <p className="px-4 py-6 text-muted">Nobody has joined yet.</p>
        )}
      </div>
    </div>
  );
}
