import { createAdminClient } from "@/lib/supabase/admin";
import { setLaunched } from "./actions";

// The one switch that matters pre-launch: flips public sign-up on/off.
// While off, app/(auth)/actions.ts blocks everyone but the admin from
// creating an account, and the marketing page only offers the waitlist.
export default async function AdminSettings() {
  const admin = createAdminClient();
  const { data } = await admin
    .from("app_settings")
    .select("value")
    .eq("key", "launched")
    .maybeSingle();
  const launched = data?.value === "true";

  return (
    <div>
      <h2 className="mb-4 text-lg font-black">Launch control</h2>
      <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
        <p className="mb-1 font-bold">
          Status:{" "}
          {launched ? (
            <span className="text-forge">🚀 Launched — public sign-up is open</span>
          ) : (
            <span className="text-neutral-400">🔒 Pre-launch — only the waitlist is public</span>
          )}
        </p>
        <p className="mb-4 text-sm text-neutral-400">
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
    </div>
  );
}
