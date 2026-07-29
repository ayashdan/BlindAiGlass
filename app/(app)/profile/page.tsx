import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { levelProgress, rankForLevel } from "@/lib/game/leveling";
import { AVATARS, resolveAvatar } from "@/lib/game/avatars";
import { updateAvatar } from "./actions";
import type { Profile } from "@/lib/types";

// Identity hub: pick an avatar, see your stat card, and show off unlocked
// achievements as a trophy case.
export default async function ProfilePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  const profile = data as Profile | null;
  if (!profile) {
    return (
      <main className="mx-auto max-w-lg px-6 py-16">
        <p className="text-neutral-400">Setting up your profile… refresh in a moment.</p>
      </main>
    );
  }

  const { data: catalog } = await supabase
    .from("achievements")
    .select("id, key, name, icon, xp_reward")
    .order("sort_order");
  const { data: mine } = await supabase.from("user_achievements").select("achievement_id");
  const have = new Set((mine ?? []).map((r: any) => r.achievement_id));
  const unlocked = (catalog ?? []).filter((a: any) => have.has(a.id));

  const progress = levelProgress(profile.xp);
  const rank = rankForLevel(progress.level);
  const avatar = resolveAvatar(profile.avatar);

  return (
    <main className="mx-auto max-w-lg px-6 py-12">
      <Link href="/dashboard" className="text-sm text-neutral-400 hover:text-neutral-200">
        ← Back
      </Link>

      {/* Identity card */}
      <section className="fade-in-up mt-3 rounded-2xl border border-neutral-800 bg-neutral-900 p-6 text-center">
        <div className="text-6xl">{avatar}</div>
        <h1 className="mt-3 text-2xl font-black tracking-tight">{profile.username}</h1>
        <span className="mt-2 inline-block rounded-full bg-forge/15 px-3 py-1 text-sm font-semibold text-forge">
          {rank} · Level {progress.level}
        </span>
        <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-neutral-800">
          <div
            className="h-full rounded-full bg-forge transition-all duration-700 ease-out"
            style={{ width: `${progress.percent}%` }}
          />
        </div>
        <p className="mt-2 text-sm text-neutral-400">
          {progress.atMax
            ? "Max level reached!"
            : `${progress.into} / ${progress.need} XP · ${progress.remaining} to next level`}
        </p>
      </section>

      {/* Avatar picker */}
      <section
        className="fade-in-up mt-4 rounded-2xl border border-neutral-800 bg-neutral-900 p-5"
        style={{ animationDelay: "0.05s" }}
      >
        <p className="mb-3 text-sm font-black uppercase tracking-wide text-neutral-400">
          Choose your avatar
        </p>
        <div className="grid grid-cols-6 gap-2">
          {AVATARS.map((a) => (
            <form key={a} action={updateAvatar}>
              <input type="hidden" name="avatar" value={a} />
              <button
                type="submit"
                aria-pressed={avatar === a}
                className={
                  "press flex h-12 w-full items-center justify-center rounded-lg border text-2xl transition " +
                  (avatar === a
                    ? "border-forge bg-forge/15"
                    : "border-neutral-800 bg-neutral-950 hover:border-neutral-600")
                }
              >
                {a}
              </button>
            </form>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section
        className="fade-in-up mt-4 grid grid-cols-3 gap-3"
        style={{ animationDelay: "0.1s" }}
      >
        <Stat label="Streak" value={`${profile.current_streak}🔥`} />
        <Stat label="Best" value={`${profile.longest_streak}`} />
        <Stat label="Workouts" value={`${profile.total_workouts}`} />
        <Stat label="Freezes" value={`${profile.streak_freezes}🧊`} />
        <Stat label="Muscle groups" value={`${profile.trained_muscle_groups?.length ?? 0}`} />
        <Stat
          label="Member since"
          value={new Date(profile.created_at).toLocaleDateString(undefined, {
            month: "short",
            year: "numeric",
          })}
        />
      </section>

      {/* Achievement showcase */}
      <section
        className="fade-in-up mt-4 rounded-2xl border border-neutral-800 bg-neutral-900 p-5"
        style={{ animationDelay: "0.15s" }}
      >
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-black uppercase tracking-wide text-neutral-400">
            🏅 Achievements
          </p>
          <Link href="/achievements" className="text-xs text-forge hover:underline">
            {unlocked.length} of {(catalog ?? []).length} →
          </Link>
        </div>
        {unlocked.length > 0 ? (
          <div className="grid grid-cols-5 gap-2">
            {unlocked.map((a: any) => (
              <div
                key={a.id}
                title={a.name}
                className="flex h-12 items-center justify-center rounded-lg border border-forge/40 bg-forge/5 text-2xl shadow-[0_0_18px_rgba(255,106,26,0.15)]"
              >
                {a.icon}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-neutral-500">
            No achievements yet — log a workout to earn your first one.
          </p>
        )}
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4 text-center">
      <div className="text-lg font-black">{value}</div>
      <div className="mt-1 text-xs uppercase tracking-wide text-neutral-500">{label}</div>
    </div>
  );
}
