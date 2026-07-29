import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { levelProgress, rankForLevel, MAX_LEVEL } from "@/lib/game/leveling";
import { AVATARS, resolveAvatar } from "@/lib/game/avatars";
import { updateAvatar, uploadAvatarPhoto, removeAvatarPhoto, prestige } from "./actions";
import AvatarDisplay from "@/components/AvatarDisplay";
import ShareButton from "@/components/ShareButton";
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
        <p className="text-muted">Setting up your profile… refresh in a moment.</p>
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
      <Link href="/dashboard" className="text-sm text-muted hover:text-fg">
        ← Back
      </Link>

      {/* Identity card */}
      <section className="fade-in-up mt-3 rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-surface to-surface p-6 text-center">
        <div className="flex justify-center">
          <AvatarDisplay avatarUrl={profile.avatar_url} avatar={profile.avatar} size={80} />
        </div>
        <h1 className="mt-3 text-2xl font-black tracking-tight">
          {profile.prestige > 0 && <span className="mr-1 text-amber-400">⭐×{profile.prestige}</span>}
          {profile.username}
        </h1>
        <span className="mt-2 inline-block rounded-full bg-amber-500/15 px-3 py-1 text-sm font-semibold text-amber-400">
          {rank} · Level {progress.level}
        </span>
        <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-surface2">
          <div
            className="h-full rounded-full bg-gradient-to-r from-forge to-amber-400 transition-all duration-700 ease-out"
            style={{ width: `${progress.percent}%` }}
          />
        </div>
        <p className="mt-2 text-sm text-muted">
          {progress.atMax
            ? "Max level reached!"
            : `${progress.into} / ${progress.need} XP · ${progress.remaining} to next level`}
        </p>

        <div className="mt-4 flex justify-center">
          <ShareButton
            text={`Check out my Forge profile: Level ${progress.level} ${rank}${
              profile.prestige > 0 ? ` (⭐×${profile.prestige} Prestige)` : ""
            }, ${profile.current_streak} day streak. 🔥`}
            label="Share profile"
          />
        </div>

        {progress.atMax && (
          <form action={prestige} className="mt-4">
            <p className="mb-2 text-xs text-muted">
              You've hit Level {MAX_LEVEL}. Prestige to reset your level/XP and earn a
              permanent ⭐ star next to your name — your streaks, workouts, and
              achievements stay untouched.
            </p>
            <button className="press rounded-lg bg-gradient-to-r from-amber-400 to-forge px-4 py-2 text-sm font-black text-neutral-950 transition hover:opacity-90">
              ⭐ Prestige
            </button>
          </form>
        )}
      </section>

      {/* Avatar picker */}
      <section
        className="fade-in-up mt-4 rounded-2xl border border-line bg-surface p-5"
        style={{ animationDelay: "0.05s" }}
      >
        <p className="mb-3 text-sm font-black uppercase tracking-wide text-muted">
          Choose your avatar
        </p>
        <div className="grid grid-cols-6 gap-2">
          {AVATARS.map((a) => (
            <form key={a} action={updateAvatar}>
              <input type="hidden" name="avatar" value={a} />
              <button
                type="submit"
                aria-pressed={!profile.avatar_url && avatar === a}
                className={
                  "press flex h-12 w-full items-center justify-center rounded-lg border text-2xl transition " +
                  (!profile.avatar_url && avatar === a
                    ? "border-forge bg-forge/15"
                    : "border-line bg-bg hover:border-forge/50")
                }
              >
                {a}
              </button>
            </form>
          ))}
        </div>

        <div className="mt-4 border-t border-line pt-4">
          <p className="mb-2 text-xs text-muted">Or upload a photo (max 3MB):</p>
          <form action={uploadAvatarPhoto} className="flex flex-wrap items-center gap-2">
            <input
              type="file"
              name="photo"
              accept="image/*"
              required
              className="text-sm text-muted"
            />
            <button className="press rounded-lg bg-forge px-3 py-1.5 text-sm font-bold text-neutral-950 transition hover:bg-forge-soft">
              Upload
            </button>
          </form>
          {profile.avatar_url && (
            <form action={removeAvatarPhoto} className="mt-2">
              <button className="text-xs text-muted underline transition hover:text-fg">
                Remove photo, use emoji instead
              </button>
            </form>
          )}
        </div>
      </section>

      {/* Stats */}
      <section
        className="fade-in-up mt-4 grid grid-cols-3 gap-3"
        style={{ animationDelay: "0.1s" }}
      >
        <Stat label="Streak" value={`${profile.current_streak}🔥`} accent="sky" />
        <Stat label="Best" value={`${profile.longest_streak}`} accent="violet" />
        <Stat label="Workouts" value={`${profile.total_workouts}`} accent="emerald" />
        <Stat label="Freezes" value={`${profile.streak_freezes}🧊`} accent="sky" />
        <Stat label="Muscle groups" value={`${profile.trained_muscle_groups?.length ?? 0}`} accent="violet" />
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
        className="fade-in-up mt-4 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5"
        style={{ animationDelay: "0.15s" }}
      >
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-black uppercase tracking-wide text-muted">
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
          <p className="text-sm text-muted">
            No achievements yet — log a workout to earn your first one.
          </p>
        )}
      </section>
    </main>
  );
}

const ACCENTS = {
  sky: "border-sky-500/30 bg-sky-500/5",
  violet: "border-violet-500/30 bg-violet-500/5",
  emerald: "border-emerald-500/30 bg-emerald-500/5",
} as const;

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: keyof typeof ACCENTS;
}) {
  return (
    <div className={`rounded-xl border p-4 text-center ${accent ? ACCENTS[accent] : "border-line bg-surface"}`}>
      <div className="text-lg font-black">{value}</div>
      <div className="mt-1 text-xs uppercase tracking-wide text-muted">{label}</div>
    </div>
  );
}
