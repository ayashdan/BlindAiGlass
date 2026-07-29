import { createAdminClient } from "@/lib/supabase/admin";
import { deleteUser } from "./actions";

// Search, view, and delete users. Uses the service-role client so it can see
// everyone regardless of RLS.
export default async function AdminUsers({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const q = (searchParams.q ?? "").trim();
  const admin = createAdminClient();

  let query = admin.from("profiles").select("*").order("created_at", { ascending: false });
  if (q) query = query.ilike("username", `%${q}%`);
  const { data } = await query;
  const users = (data ?? []) as any[];

  return (
    <div>
      <form className="mb-6 flex gap-2">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Search by username…"
          className="flex-1 rounded-lg border border-line bg-surface px-4 py-2 text-sm outline-none focus:border-forge"
        />
        <button className="rounded-lg border border-line px-4 py-2 text-sm font-semibold hover:border-forge hover:text-forge">
          Search
        </button>
      </form>

      <p className="mb-3 text-sm text-muted">{users.length} user(s)</p>

      <div className="space-y-3">
        {users.map((u) => (
          <div
            key={u.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-surface p-4"
          >
            <div>
              <p className="font-bold">
                {u.username}{" "}
                {u.is_admin && <span className="text-xs text-forge">admin</span>}
              </p>
              <p className="text-sm text-muted">
                Level {u.level} · {u.rank} · 🔥{u.current_streak} (best {u.longest_streak}) ·{" "}
                {u.total_workouts} workouts
              </p>
              <p className="text-xs text-muted">
                Joined {new Date(u.created_at).toLocaleDateString()}
              </p>
            </div>
            <form action={deleteUser}>
              <input type="hidden" name="id" value={u.id} />
              <button className="rounded-lg border border-red-500/40 px-3 py-1.5 text-sm text-red-300 transition hover:bg-red-500/10">
                Delete
              </button>
            </form>
          </div>
        ))}
        {users.length === 0 && (
          <p className="text-muted">No users found.</p>
        )}
      </div>
    </div>
  );
}
