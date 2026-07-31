import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SUNDAY_FIRST_DAY_KEYS } from "@/lib/game/quests";
import WorkoutForm from "@/components/game/WorkoutForm";

export default async function WorkoutPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("weekly_split_schedule")
    .eq("id", user.id)
    .single();

  const todayKey = SUNDAY_FIRST_DAY_KEYS[new Date().getDay()];
  const todaysSchedule = (profile?.weekly_split_schedule as Record<string, string[] | "rest"> | null)?.[
    todayKey
  ];
  const suggestedGroups = Array.isArray(todaysSchedule) ? todaysSchedule : null;
  const isScheduledRest = todaysSchedule === "rest";

  return (
    <main className="mx-auto max-w-lg px-6 py-12">
      <Link href="/dashboard" className="text-sm text-muted hover:text-fg">
        ← Back
      </Link>
      <h1 className="mb-6 mt-3 text-2xl font-black tracking-tight">Log a workout</h1>
      <WorkoutForm suggestedGroups={suggestedGroups} isScheduledRest={isScheduledRest} />
    </main>
  );
}
