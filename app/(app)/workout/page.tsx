import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { localDayKey } from "@/lib/local-day";
import WorkoutForm from "@/components/game/WorkoutForm";
import TabScreenHeader from "@/components/TabScreenHeader";

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

  const todayKey = localDayKey();
  const todaysSchedule = (profile?.weekly_split_schedule as Record<string, string[] | "rest"> | null)?.[
    todayKey
  ];
  const suggestedGroups = Array.isArray(todaysSchedule) ? todaysSchedule : null;
  const isScheduledRest = todaysSchedule === "rest";

  return (
    <main className="mx-auto max-w-lg px-6 py-12">
      <TabScreenHeader icon="⚔️" title="Log a Workout" subtitle="Every rep forges progress." />
      <WorkoutForm suggestedGroups={suggestedGroups} isScheduledRest={isScheduledRest} />
    </main>
  );
}
