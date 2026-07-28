import { createAdminClient } from "@/lib/supabase/admin";

// The waitlist table has RLS on with zero public policies, so the only way to
// read the raw list (emails, referral counts) is through this service-role
// client — never exposed to the browser.
export default async function AdminWaitlist() {
  const admin = createAdminClient();
  const { data } = await admin
    .from("waitlist")
    .select("*")
    .order("referral_count", { ascending: false })
    .order("created_at", { ascending: true });

  const list = (data ?? []) as any[];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-neutral-400">{list.length} on the waitlist</p>
        <a
          href="/admin/waitlist/export"
          className="rounded-lg border border-neutral-800 px-3 py-1.5 text-sm font-semibold hover:border-forge hover:text-forge"
        >
          Export CSV
        </a>
      </div>

      <div className="overflow-x-auto rounded-xl border border-neutral-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-900 text-neutral-400">
            <tr>
              <th className="px-4 py-2">#</th>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Referrals</th>
              <th className="px-4 py-2">Joined</th>
            </tr>
          </thead>
          <tbody>
            {list.map((w, i) => (
              <tr key={w.id} className="border-t border-neutral-800">
                <td className="px-4 py-2 text-neutral-500">{i + 1}</td>
                <td className="px-4 py-2">{w.email}</td>
                <td className="px-4 py-2 text-neutral-400">{w.name || "—"}</td>
                <td className="px-4 py-2 font-semibold text-forge">{w.referral_count}</td>
                <td className="px-4 py-2 text-neutral-500">
                  {new Date(w.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {list.length === 0 && (
          <p className="px-4 py-6 text-neutral-500">Nobody has joined yet.</p>
        )}
      </div>
    </div>
  );
}
