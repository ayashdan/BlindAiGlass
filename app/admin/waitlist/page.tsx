import { createAdminClient } from "@/lib/supabase/admin";
import { inviteFromWaitlist, uninviteFromWaitlist } from "./actions";

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

      <div className="overflow-x-auto rounded-xl border border-line">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface text-muted">
            <tr>
              <th className="px-4 py-2">#</th>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Referrals</th>
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
                  {new Date(w.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-2">
                  {w.invited ? (
                    <form action={uninviteFromWaitlist}>
                      <input type="hidden" name="id" value={w.id} />
                      <button className="rounded-lg border border-amber-500/40 px-3 py-1 text-xs font-semibold text-amber-400 transition hover:bg-amber-500/10">
                        ⭐ Invited — revoke
                      </button>
                    </form>
                  ) : (
                    <form action={inviteFromWaitlist}>
                      <input type="hidden" name="id" value={w.id} />
                      <input type="hidden" name="email" value={w.email} />
                      <input type="hidden" name="name" value={w.name || ""} />
                      <button className="rounded-lg border border-line px-3 py-1 text-xs font-semibold text-fg transition hover:border-forge hover:text-forge">
                        Invite
                      </button>
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
