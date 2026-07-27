import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/(auth)/actions";
import XpPanel from "@/components/game/XpPanel";
import type { Profile } from "@/lib/types";

// The logged-in home hub. The Level + XP card is now interactive (XpPanel);
// streak/workout stats stay server-rendered.
export default async function Dashboard() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();

  if (!profile) {
    return (
      <main className="mx-auto max-w-lg px-6 py-16">
        <p className="text-neutral-400">
          Setting up your profile… refresh in a moment.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-lg px-6 py-12">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <p className="text-sm text-neutral-400">Welcome back,</p>
          <h1 className="text-2xl font-black tracking-tight">
            {profile.username}
          </h1>
        </div>
        <form action={signOut}>
          <button className="rounded-lg border border-neutral-800 px-3 py-2 text-sm text-neutral-300 transition hover:border-neutral-600">
            Log out
          </button>
        </form>
      </header>

      <XpPanel initialXp={profile.xp} />

      <section className="mt-4 grid grid-cols-3 gap-3">
        <Stat label="Streak" value={`${profile.current_streak}🔥`} />
        <Stat label="Best" value={`${profile.longest_streak}`} />
        <Stat label="Workouts" value={`${profile.total_workouts}`} />
      </section>

      <p className="mt-8 text-center text-sm text-neutral-500">
        Workout logging and daily quests arrive in the next phases.
      </p>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4 text-center">
      <div className="text-xl font-black">{value}</div>
      <div className="mt-1 text-xs uppercase tracking-wide text-neutral-500">
        {label}
      </div>
    </div>
  );
}
