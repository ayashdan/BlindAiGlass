import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Shows every achievement badge, unlocked ones lit up and locked ones dimmed.
export default async function AchievementsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: catalog } = await supabase
    .from("achievements")
    .select("*")
    .order("sort_order");
  const { data: mine } = await supabase
    .from("user_achievements")
    .select("achievement_id");

  const have = new Set((mine ?? []).map((r: any) => r.achievement_id));
  const list = (catalog ?? []) as any[];
  const unlockedCount = list.filter((a) => have.has(a.id)).length;

  return (
    <main className="mx-auto max-w-lg px-6 py-12">
      <Link href="/dashboard" className="text-sm text-neutral-400 hover:text-neutral-200">
        ← Back
      </Link>
      <h1 className="mb-1 mt-3 text-2xl font-black tracking-tight">Achievements</h1>
      <p className="mb-6 text-sm text-neutral-400">
        {unlockedCount} of {list.length} unlocked
      </p>

      <div className="space-y-3">
        {list.map((a, i) => {
          const unlocked = have.has(a.id);
          return (
            <div
              key={a.id}
              className={
                "fade-in-up flex items-center gap-4 rounded-xl border p-4 transition " +
                (unlocked
                  ? "border-forge/40 bg-forge/5 shadow-[0_0_18px_rgba(255,106,26,0.15)]"
                  : "border-neutral-800 bg-neutral-900 opacity-60")
              }
              style={{ animationDelay: `${Math.min(i, 8) * 0.05}s` }}
            >
              <div className="text-3xl">{unlocked ? a.icon : "🔒"}</div>
              <div className="flex-1">
                <p className="font-bold">{a.name}</p>
                <p className="text-sm text-neutral-400">{a.description}</p>
              </div>
              <div className="text-sm font-semibold text-forge">+{a.xp_reward} XP</div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
