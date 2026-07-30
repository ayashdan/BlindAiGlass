import { createAdminClient } from "@/lib/supabase/admin";
import { setLaunched, startNewSeason, sendTestNotification } from "./actions";

// The one switch that matters pre-launch: flips public sign-up on/off.
// While off, app/(auth)/actions.ts blocks everyone but the admin from
// creating an account, and the marketing page only offers the waitlist.
export default async function AdminSettings() {
  const admin = createAdminClient();
  const { data } = await admin
    .from("app_settings")
    .select("key, value")
    .in("key", ["launched", "season_number", "season_started_at"]);
  const map = new Map((data ?? []).map((r: any) => [r.key as string, r.value as string]));
  const launched = map.get("launched") === "true";
  const seasonNumber = map.get("season_number") ?? "1";
  const seasonStartedAt = map.get("season_started_at");

  return (
    <div>
      <h2 className="mb-4 text-lg font-black">Launch control</h2>
      <div className="rounded-xl border border-line bg-surface p-6">
        <p className="mb-1 font-bold">
          Status:{" "}
          {launched ? (
            <span className="text-forge">🚀 Launched — public sign-up is open</span>
          ) : (
            <span className="text-muted">🔒 Pre-launch — only the waitlist is public</span>
          )}
        </p>
        <p className="mb-4 text-sm text-muted">
          While pre-launch, visitors can only join the waitlist — sign-up is
          blocked for everyone except the admin account. Flip this on when
          you're ready to open Forge to everyone.
        </p>
        <form action={setLaunched}>
          <input type="hidden" name="launched" value={launched ? "false" : "true"} />
          <button
            className={
              "rounded-lg px-4 py-2 font-bold transition " +
              (launched
                ? "border border-red-500/40 text-red-300 hover:bg-red-500/10"
                : "bg-forge text-neutral-950 hover:bg-forge-soft")
            }
          >
            {launched ? "Close sign-ups (back to waitlist-only)" : "🚀 Launch Forge"}
          </button>
        </form>
      </div>

      <h2 className="mb-4 mt-8 text-lg font-black">Season</h2>
      <div className="rounded-xl border border-line bg-surface p-6">
        <p className="mb-1 font-bold">Season {seasonNumber}</p>
        <p className="mb-4 text-sm text-muted">
          Started{" "}
          {seasonStartedAt ? new Date(seasonStartedAt).toLocaleDateString() : "—"}. Starting a
          new season doesn't touch anyone's XP, level, or stats — it only
          resets the season-pass workout-count track on the dashboard.
        </p>
        <form action={startNewSeason}>
          <button className="rounded-lg border border-line px-4 py-2 font-bold text-fg transition hover:border-forge/50">
            Start Season {parseInt(seasonNumber, 10) + 1}
          </button>
        </form>
      </div>

      <h2 className="mb-4 mt-8 text-lg font-black">Notifications</h2>
      <div className="rounded-xl border border-line bg-surface p-6">
        <p className="mb-1 font-bold">Streak reminders</p>
        <p className="mb-4 text-sm text-muted">
          Fires twice daily (12pm and 8pm UTC — see <code>vercel.json</code>) to
          anyone with an active streak who hasn't worked out yet that day.
          Click below to send yourself a one-off test right now (only
          reaches devices where you've already tapped 🔔 on the dashboard).
        </p>
        <form action={sendTestNotification}>
          <button className="rounded-lg border border-line px-4 py-2 font-bold text-fg transition hover:border-forge/50">
            🔔 Send me a test notification
          </button>
        </form>
      </div>
    </div>
  );
}
