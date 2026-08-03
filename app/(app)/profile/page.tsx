import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/(auth)/actions";
import { levelProgress, rankForLevel, MAX_LEVEL } from "@/lib/game/leveling";
import { AVATARS, resolveAvatar } from "@/lib/game/avatars";
import {
  updateAvatar,
  uploadAvatarPhoto,
  removeAvatarPhoto,
  prestige,
  equipCosmetic,
  changePassword,
} from "./actions";
import { deriveClass, CLASS_INFO } from "@/lib/game/stats";
import { ACHIEVEMENT_COSMETICS, RECRUITER_TITLE } from "@/lib/game/cosmetics";
import AvatarDisplay from "@/components/AvatarDisplay";
import ShareButton from "@/components/ShareButton";
import SubmitButton from "@/components/SubmitButton";
import WeeklySplitEditor from "@/components/WeeklySplitEditor";
import InstallPrompt from "@/components/InstallPrompt";
import NotificationOptIn from "@/components/NotificationOptIn";
import SoundToggle from "@/components/SoundToggle";
import ThemeToggle from "@/components/ThemeToggle";
import type { Profile } from "@/lib/types";

// Identity hub: pick an avatar, see your stat card, show off unlocked
// achievements, manage your password, and sign out.
export default async function ProfilePage({
  searchParams,
}: {
  searchParams: { error?: string; success?: string };
}) {
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

  const characterStats = {
    power: profile.stat_power,
    grit: profile.stat_grit,
    endurance: profile.stat_endurance,
    discipline: profile.stat_discipline,
  };
  const charClass = deriveClass(characterStats);
  const classInfo = CLASS_INFO[charClass];
  const maxStat = Math.max(
    1,
    characterStats.power,
    characterStats.grit,
    characterStats.endurance,
    characterStats.discipline
  );

  const unlockedKeys = new Set(unlocked.map((a: any) => a.key as string));
  const unlockedCosmetics = Array.from(unlockedKeys)
    .map((k) => ({ key: k, ...ACHIEVEMENT_COSMETICS[k] }))
    .filter((c) => c.border || c.title);
  // The one non-achievement cosmetic: earned by recruiting a friend who
  // sticks (3 workouts) — see the invite section on /friends.
  if ((profile.recruit_count ?? 0) > 0) {
    unlockedCosmetics.push({ key: "recruiter", title: RECRUITER_TITLE });
  }

  return (
    <main className="mx-auto max-w-lg px-6 py-12">
      {/* Identity card */}
      <section className="fade-in-up forge-panel forge-panel-hot glow-pulse p-6 text-center">
        <div className="relative mx-auto flex h-[130px] w-[130px] items-center justify-center">
          <AvatarDisplay
            avatarUrl={profile.avatar_url}
            avatar={profile.avatar}
            borderClass={profile.equipped_border}
            size={110}
          />
        </div>
        <h1 className="mt-3 text-2xl font-black tracking-tight">
          {profile.prestige > 0 && <span className="mr-1 text-amber-400">⭐×{profile.prestige}</span>}
          {profile.username}
        </h1>
        {profile.equipped_title && (
          <p className="mt-0.5 text-sm text-muted">"{profile.equipped_title}"</p>
        )}
        <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
          <span className="inline-block rounded-full bg-amber-500/15 px-3 py-1 text-sm font-semibold text-amber-400">
            {rank} · Level {progress.level}
          </span>
          {profile.tier === "premium" && (
            <span className="inline-block rounded-full bg-amber-500/15 px-3 py-1 text-sm font-semibold text-amber-400">
              ⭐ Premium
            </span>
          )}
        </div>
        <p className="mt-2 text-sm text-muted">
          {classInfo.icon} <span className="font-bold">{charClass}</span> — {classInfo.blurb}
        </p>
        <div className="xp-bar mt-4 h-3 w-full rounded-full bg-surface2">
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
            imageUrl={`/api/share-card?u=${encodeURIComponent(profile.username)}&l=${
              progress.level
            }&r=${encodeURIComponent(rank)}&s=${profile.current_streak}&c=${encodeURIComponent(
              `${classInfo.icon} ${charClass}`
            )}&p=${profile.prestige}`}
          />
        </div>

        {progress.atMax && (
          <form action={prestige} className="mt-4">
            <p className="mb-2 text-xs text-muted">
              You've hit Level {MAX_LEVEL}. Prestige to reset your level/XP and earn a
              permanent ⭐ star next to your name — your streaks, workouts, and
              achievements stay untouched.
            </p>
            <SubmitButton className="press rounded-lg bg-gradient-to-r from-amber-400 to-forge px-4 py-2 text-sm font-black text-neutral-950 transition hover:opacity-90">
              ⭐ Prestige
            </SubmitButton>
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
              <SubmitButton
                className={
                  "press flex h-12 w-full items-center justify-center rounded-lg border text-2xl transition " +
                  (!profile.avatar_url && avatar === a
                    ? "border-forge bg-forge/15"
                    : "border-line bg-bg hover:border-forge/50")
                }
              >
                {a}
              </SubmitButton>
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
            <SubmitButton
              pendingText="Uploading…"
              className="press rounded-lg bg-forge px-3 py-1.5 text-sm font-bold text-neutral-950 transition hover:bg-forge-soft"
            >
              Upload
            </SubmitButton>
          </form>
          {profile.avatar_url && (
            <form action={removeAvatarPhoto} className="mt-2">
              <SubmitButton className="text-xs text-muted underline transition hover:text-fg">
                Remove photo, use emoji instead
              </SubmitButton>
            </form>
          )}
        </div>
      </section>

      {/* Character sheet */}
      <section
        className="fade-in-up mt-4 rounded-2xl border border-line bg-surface p-5"
        style={{ animationDelay: "0.07s" }}
      >
        <p className="mb-3 text-sm font-black uppercase tracking-wide text-muted">
          {classInfo.icon} Character sheet
        </p>
        <div className="space-y-3">
          <StatBar label="Power" icon="🔥" value={characterStats.power} max={maxStat} color="bg-rose-500" />
          <StatBar label="Grit" icon="🗡️" value={characterStats.grit} max={maxStat} color="bg-sky-500" />
          <StatBar
            label="Endurance"
            icon="🏃"
            value={characterStats.endurance}
            max={maxStat}
            color="bg-emerald-500"
          />
          <StatBar
            label="Discipline"
            icon="🧠"
            value={characterStats.discipline}
            max={maxStat}
            color="bg-violet-500"
          />
        </div>
      </section>

      {/* Cosmetics */}
      {unlockedCosmetics.length > 0 && (
        <section
          className="fade-in-up mt-4 rounded-2xl border border-line bg-surface p-5"
          style={{ animationDelay: "0.09s" }}
        >
          <p className="mb-3 text-sm font-black uppercase tracking-wide text-muted">
            Unlocked cosmetics
          </p>
          <p className="mb-3 text-xs text-muted">
            Earned from achievements — nothing here is random or purchasable.
          </p>

          {unlockedCosmetics.some((c) => c.title) && (
            <div className="mb-3">
              <p className="mb-1.5 text-xs font-semibold text-muted">Title</p>
              <div className="flex flex-wrap gap-2">
                <form action={equipCosmetic}>
                  <input type="hidden" name="title" value="" />
                  <SubmitButton
                    className={
                      "press rounded-lg border px-3 py-1.5 text-xs font-bold transition " +
                      (!profile.equipped_title
                        ? "border-forge bg-forge/15 text-forge"
                        : "border-line text-muted hover:border-forge/50")
                    }
                  >
                    None
                  </SubmitButton>
                </form>
                {unlockedCosmetics
                  .filter((c) => c.title)
                  .map((c) => (
                    <form key={c.key} action={equipCosmetic}>
                      <input type="hidden" name="title" value={c.title} />
                      <SubmitButton
                        className={
                          "press rounded-lg border px-3 py-1.5 text-xs font-bold transition " +
                          (profile.equipped_title === c.title
                            ? "border-forge bg-forge/15 text-forge"
                            : "border-line text-fg hover:border-forge/50")
                        }
                      >
                        {c.title}
                      </SubmitButton>
                    </form>
                  ))}
              </div>
            </div>
          )}

          {unlockedCosmetics.some((c) => c.border) && (
            <div>
              <p className="mb-1.5 text-xs font-semibold text-muted">Avatar border</p>
              <div className="flex flex-wrap gap-2">
                <form action={equipCosmetic}>
                  <input type="hidden" name="border" value="" />
                  <SubmitButton
                    className={
                      "press h-9 w-9 rounded-full border-2 transition " +
                      (!profile.equipped_border ? "border-forge" : "border-line")
                    }
                  >
                    ✕
                  </SubmitButton>
                </form>
                {unlockedCosmetics
                  .filter((c) => c.border)
                  .map((c) => (
                    <form key={c.key} action={equipCosmetic}>
                      <input type="hidden" name="border" value={c.border} />
                      <SubmitButton
                        className={`press h-9 w-9 rounded-full border-[3px] bg-surface2 ${c.border} ${
                          profile.equipped_border === c.border ? "ring-2 ring-forge" : ""
                        }`}
                      >
                        {""}
                      </SubmitButton>
                    </form>
                  ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Stats */}
      <section
        className="fade-in-up mt-4 grid grid-cols-3 gap-3"
        style={{ animationDelay: "0.1s" }}
      >
        <Stat label="Streak" value={`${profile.current_streak}🔥`} accent="sky" />
        <Stat label="Best" value={`${profile.longest_streak}`} accent="amber" />
        <Stat label="Workouts" value={`${profile.total_workouts}`} accent="emerald" />
        <Stat label="Freezes" value={`${profile.streak_freezes}🧊`} accent="sky" />
        <Stat label="Muscle groups" value={`${profile.trained_muscle_groups?.length ?? 0}`} accent="emerald" />
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

      {/* Weekly training split */}
      <section
        className="fade-in-up mt-4 rounded-2xl border border-line bg-surface p-5"
        style={{ animationDelay: "0.18s" }}
      >
        <p className="mb-1 text-sm font-black uppercase tracking-wide text-muted">
          Weekly training split
        </p>
        <p className="mb-3 text-xs text-muted">
          Set what you're training each day — it repeats every week until you
          change it, locks in a matching quest automatically, and gets
          suggested when you log a workout. Leave a day blank to keep
          choosing it manually.
        </p>
        <WeeklySplitEditor initial={profile.weekly_split_schedule ?? {}} />
      </section>

      {/* Settings — the app/device toggles that used to crowd the dashboard
          header. Identity stays up top; plumbing lives here. */}
      <section
        id="settings"
        className="fade-in-up mt-4 rounded-2xl border border-line bg-surface p-5"
        style={{ animationDelay: "0.19s" }}
      >
        <p className="mb-3 text-sm font-black uppercase tracking-wide text-muted">Settings</p>
        <div className="flex flex-wrap items-center gap-2">
          <InstallPrompt />
          <NotificationOptIn />
          <SoundToggle />
          <ThemeToggle />
        </div>
        <p className="mt-2 text-xs text-muted">
          Install Forge to your home screen, turn on streak/league reminders,
          and switch sound or theme.
        </p>
      </section>

      {/* Account */}
      <section
        className="fade-in-up mt-4 rounded-2xl border border-line bg-surface p-5"
        style={{ animationDelay: "0.2s" }}
      >
        <p className="mb-3 text-sm font-black uppercase tracking-wide text-muted">Account</p>

        {searchParams.error && (
          <p className="mb-3 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {searchParams.error}
          </p>
        )}
        {searchParams.success && (
          <p className="mb-3 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
            {searchParams.success}
          </p>
        )}

        <form action={changePassword} className="space-y-2">
          <label className="block text-xs font-semibold text-muted">Change password</label>
          <input
            type="password"
            name="password"
            required
            minLength={6}
            placeholder="New password"
            className="w-full rounded-lg border border-line bg-bg px-4 py-2.5 text-sm outline-none focus:border-forge"
          />
          <input
            type="password"
            name="confirm"
            required
            minLength={6}
            placeholder="Confirm new password"
            className="w-full rounded-lg border border-line bg-bg px-4 py-2.5 text-sm outline-none focus:border-forge"
          />
          <SubmitButton
            pendingText="Updating…"
            className="press w-full rounded-lg border border-line py-2.5 text-sm font-bold text-fg transition hover:border-forge/50"
          >
            Update password
          </SubmitButton>
        </form>

        <Link
          href="/feedback"
          className="mt-4 flex items-center justify-between rounded-lg border border-line px-4 py-2.5 text-sm font-bold text-fg transition hover:border-forge/50"
        >
          💬 Send feedback
          <span className="text-muted">→</span>
        </Link>

        <form action={signOut} className="mt-4 border-t border-line pt-4">
          <SubmitButton
            pendingText="Logging out…"
            className="press w-full rounded-lg bg-red-600 py-2.5 text-sm font-bold text-white transition hover:bg-red-500"
          >
            Log out
          </SubmitButton>
        </form>
      </section>
    </main>
  );
}

const ACCENTS = {
  sky: "border-sky-500/30 bg-sky-500/5",
  amber: "border-amber-500/30 bg-amber-500/5",
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

function StatBar({
  label,
  icon,
  value,
  max,
  color,
}: {
  label: string;
  icon: string;
  value: number;
  max: number;
  color: string;
}) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="font-semibold">
          {icon} {label}
        </span>
        <span className="text-muted">{value}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-surface2">
        <div
          className={`h-full rounded-full ${color} transition-all duration-700 ease-out`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
