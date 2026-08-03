"use client";

// Lets you assign specific muscle groups (or a rest day) to each day of the
// week, the same tap-to-toggle chips used when logging a workout. It repeats
// every week until changed here — the dashboard and workout log page both
// read it to suggest/auto-assign today's training instead of asking.
import { useState, useTransition } from "react";
import { MUSCLE_GROUPS } from "@/lib/game/muscle-groups";
import { WEEKLY_SPLIT_DISPLAY_ORDER, WEEKLY_SPLIT_DAY_LABELS } from "@/lib/game/quests";
import { setWeeklySplitSchedule } from "@/app/(app)/profile/actions";

type Schedule = Record<string, string[] | "rest">;

export default function WeeklySplitEditor({ initial }: { initial: Schedule }) {
  const [schedule, setSchedule] = useState<Schedule>(initial);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function toggleGroup(day: string, group: string) {
    setSaved(false);
    setSchedule((prev) => {
      const current = prev[day];
      const groups = Array.isArray(current) ? current : [];
      const next = groups.includes(group)
        ? groups.filter((g) => g !== group)
        : [...groups, group];
      const copy = { ...prev };
      if (next.length === 0) delete copy[day];
      else copy[day] = next;
      return copy;
    });
  }

  function toggleRest(day: string) {
    setSaved(false);
    setSchedule((prev) => {
      const copy = { ...prev };
      if (prev[day] === "rest") delete copy[day];
      else copy[day] = "rest";
      return copy;
    });
  }

  function save() {
    startTransition(async () => {
      await setWeeklySplitSchedule(schedule);
      setSaved(true);
    });
  }

  return (
    <div className="space-y-3">
      {WEEKLY_SPLIT_DISPLAY_ORDER.map((day) => {
        const value = schedule[day];
        const isRest = value === "rest";
        const groups = Array.isArray(value) ? value : [];
        return (
          <div key={day} className="rounded-xl border border-line bg-bg p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-bold">{WEEKLY_SPLIT_DAY_LABELS[day]}</p>
              <button
                type="button"
                onClick={() => toggleRest(day)}
                aria-pressed={isRest}
                className={
                  "press rounded-lg border px-3 py-1 text-xs font-bold transition " +
                  (isRest
                    ? "border-sky-500 bg-sky-500/15 text-sky-400"
                    : "border-line text-muted hover:border-sky-500/50")
                }
              >
                😴 Rest day
              </button>
            </div>
            {isRest ? (
              <p className="text-xs text-muted">No muscle groups scheduled — rest day.</p>
            ) : (
              <div className="grid grid-cols-3 gap-1.5">
                {MUSCLE_GROUPS.map((g) => {
                  const active = groups.includes(g.key);
                  return (
                    <button
                      key={g.key}
                      type="button"
                      onClick={() => toggleGroup(day, g.key)}
                      aria-pressed={active}
                      className={
                        "press rounded-lg border py-2 text-xs font-bold transition " +
                        (active
                          ? "border-forge bg-forge/15 text-forge"
                          : "border-line bg-surface text-fg hover:border-forge/50")
                      }
                    >
                      {g.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      <button
        type="button"
        onClick={save}
        disabled={pending}
        className="press w-full rounded-lg border border-line py-2.5 text-sm font-bold text-fg transition hover:border-forge/50 disabled:opacity-50"
      >
        {pending ? "Saving…" : saved ? "Saved ✓" : "Save weekly plan"}
      </button>
    </div>
  );
}
