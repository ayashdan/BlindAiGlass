import { createAdminClient } from "@/lib/supabase/admin";
import { updateAchievement, deleteAchievement, createAchievement } from "./actions";

// Edit XP rewards / copy for existing badges, or add a new one to the
// catalog. Adjusting XP rewards here changes them app-wide immediately.
export default async function AdminAchievements() {
  const admin = createAdminClient();
  const { data } = await admin.from("achievements").select("*").order("sort_order");
  const list = (data ?? []) as any[];

  return (
    <div>
      <h2 className="mb-4 text-lg font-black">Achievements</h2>

      <div className="space-y-3">
        {list.map((a) => (
          <form
            key={a.id}
            action={updateAchievement}
            className="flex flex-wrap items-center gap-2 rounded-xl border border-line bg-surface p-4"
          >
            <input type="hidden" name="id" value={a.id} />
            <span className="text-2xl">{a.icon}</span>
            <input
              name="name"
              defaultValue={a.name}
              className="w-40 rounded-lg border border-line bg-bg px-2 py-1.5 text-sm outline-none focus:border-forge"
            />
            <input
              name="description"
              defaultValue={a.description}
              className="min-w-[160px] flex-1 rounded-lg border border-line bg-bg px-2 py-1.5 text-sm outline-none focus:border-forge"
            />
            <input
              name="xp_reward"
              type="number"
              defaultValue={a.xp_reward}
              className="w-20 rounded-lg border border-line bg-bg px-2 py-1.5 text-sm outline-none focus:border-forge"
            />
            <button className="rounded-lg bg-forge px-3 py-1.5 text-sm font-bold text-neutral-950 transition hover:bg-forge-soft">
              Save
            </button>
            <button
              formAction={deleteAchievement}
              className="rounded-lg border border-red-500/40 px-3 py-1.5 text-sm text-red-300 transition hover:bg-red-500/10"
            >
              Delete
            </button>
          </form>
        ))}
      </div>

      <h3 className="mb-3 mt-8 text-sm font-bold uppercase tracking-wide text-muted">
        Add achievement
      </h3>
      <form
        action={createAchievement}
        className="flex flex-wrap items-center gap-2 rounded-xl border border-dashed border-line p-4"
      >
        <input
          name="key"
          placeholder="key (e.g. night_owl)"
          required
          className="w-40 rounded-lg border border-line bg-bg px-2 py-1.5 text-sm outline-none focus:border-forge"
        />
        <input
          name="icon"
          placeholder="🦉"
          defaultValue="🏅"
          className="w-16 rounded-lg border border-line bg-bg px-2 py-1.5 text-sm outline-none focus:border-forge"
        />
        <input
          name="name"
          placeholder="Name"
          required
          className="w-40 rounded-lg border border-line bg-bg px-2 py-1.5 text-sm outline-none focus:border-forge"
        />
        <input
          name="description"
          placeholder="Description"
          required
          className="min-w-[160px] flex-1 rounded-lg border border-line bg-bg px-2 py-1.5 text-sm outline-none focus:border-forge"
        />
        <input
          name="xp_reward"
          type="number"
          placeholder="XP"
          defaultValue={50}
          className="w-20 rounded-lg border border-line bg-bg px-2 py-1.5 text-sm outline-none focus:border-forge"
        />
        <button className="rounded-lg bg-forge px-3 py-1.5 text-sm font-bold text-neutral-950 transition hover:bg-forge-soft">
          Add
        </button>
      </form>
      <p className="mt-3 text-xs text-muted">
        Heads up: a brand-new achievement needs a matching unlock rule added
        to <code>lib/game/achievements.ts</code> in code before anyone can
        actually earn it — this page only manages the catalog (name,
        description, icon, XP reward).
      </p>
    </div>
  );
}
