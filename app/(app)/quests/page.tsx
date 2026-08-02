import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ensureTodayQuests, ensureScheduledQuest } from "@/lib/game/quests-server";
import { scheduledQuestLabel } from "@/lib/game/quests";
import { localDayKey, localDateStr } from "@/lib/local-day";
import { completeQuest, chooseSplit } from "./actions";
import SubmitButton from "@/components/SubmitButton";
import type { Profile } from "@/lib/types";

const SPLIT_LABELS: Record<string, string> = {
  push_day: "💪 Push Day",
  pull_day: "🏋️ Pull Day",
  leg_day: "🦵 Leg Day",
};

// The Quest Log: what you're training today (from your recurring schedule,
// or picked on the spot) and today's missions — pulled off Home so the hub
// stays a status screen and this stays a focused, dedicated one.
export default async function QuestLogPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("profiles")
    .select("split_choice_date, split_choice, weekly_split_schedule")
    .eq("id", user.id)
    .single();
  const profile = data as Pick<Profile, "split_choice_date" | "split_choice" | "weekly_split_schedule"> | null;

  const todayStr = localDateStr();
  const todayDayKey = localDayKey();
  const todaysSchedule = profile?.weekly_split_schedule?.[todayDayKey];
  const scheduledGroups = Array.isArray(todaysSchedule) ? todaysSchedule : null;
  const scheduledRestToday = todaysSchedule === "rest";
  if (scheduledGroups && scheduledGroups.length > 0) {
    await ensureScheduledQuest(user.id, scheduledGroups);
  }

  const quests = await ensureTodayQuests(user.id);
  const splitChosenToday = profile?.split_choice_date === todayStr ? profile?.split_choice : null;

  return (
    <main className="mx-auto max-w-lg px-6 py-12">
      <Link href="/dashboard" className="text-sm text-muted hover:text-fg">
        ← Back
      </Link>
      <h1 className="mb-1 mt-3 text-2xl font-black tracking-tight">📜 Quest Log</h1>
      <p className="mb-6 text-sm text-muted">What you're training, and today's missions.</p>

      {/* Today's split */}
      <section className="game-card rounded-2xl border border-line bg-surface p-5">
        {scheduledGroups && scheduledGroups.length > 0 ? (
          <p className="text-sm">
            <span className="font-black uppercase tracking-wide text-muted">
              Today (scheduled):{" "}
            </span>
            <span className="font-bold">📅 {scheduledQuestLabel(scheduledGroups)}</span>
          </p>
        ) : scheduledRestToday ? (
          <p className="text-sm">
            <span className="font-black uppercase tracking-wide text-muted">
              Today (scheduled):{" "}
            </span>
            <span className="font-bold">😴 Rest Day</span>
          </p>
        ) : splitChosenToday ? (
          <p className="text-sm">
            <span className="font-black uppercase tracking-wide text-muted">Today: </span>
            <span className="font-bold">{SPLIT_LABELS[splitChosenToday] ?? splitChosenToday}</span>
          </p>
        ) : (
          <>
            <p className="mb-3 text-sm font-black uppercase tracking-wide text-muted">
              What are you training today?
            </p>
            <div className="grid grid-cols-3 gap-2">
              {(["push_day", "pull_day", "leg_day"] as const).map((key) => (
                <form key={key} action={chooseSplit}>
                  <input type="hidden" name="split" value={key} />
                  <SubmitButton className="press w-full rounded-lg border border-line bg-bg py-2.5 text-sm font-bold text-fg transition hover:border-forge/50">
                    {SPLIT_LABELS[key]}
                  </SubmitButton>
                </form>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted">
              Locks in a matching quest instead of a random one.{" "}
              <Link href="/profile" className="text-forge hover:underline">
                Set a recurring plan
              </Link>{" "}
              to skip this every day.
            </p>
          </>
        )}
      </section>

      {/* Today's quests */}
      {quests.length > 0 && (
        <section className="game-card mt-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5">
          <p className="mb-3 text-sm font-black uppercase tracking-wide text-emerald-400">
            🎯 Today's missions
          </p>
          <div className="space-y-2">
            {quests.map((q) => (
              <div
                key={q.key}
                className={
                  "flex items-center gap-3 rounded-lg border px-3 py-2 transition " +
                  (q.completed ? "border-forge/40 bg-forge/5" : "border-line bg-bg")
                }
              >
                <span className="text-xl">{q.completed ? "✅" : q.icon}</span>
                <div className="flex-1">
                  <p className={"text-sm font-bold " + (q.completed ? "text-muted line-through" : "")}>
                    {q.title}
                  </p>
                  <p className="text-xs text-muted">{q.description}</p>
                </div>
                {q.kind === "manual" && !q.completed ? (
                  <form action={completeQuest}>
                    <input type="hidden" name="key" value={q.key} />
                    <SubmitButton className="press rounded-lg border border-forge/40 px-2 py-1 text-xs font-bold text-forge transition hover:bg-forge/10">
                      Mark done
                    </SubmitButton>
                  </form>
                ) : (
                  <span className="text-xs font-semibold text-forge">+{q.xpReward} XP</span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
