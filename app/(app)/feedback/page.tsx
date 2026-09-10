import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SubmitButton from "@/components/SubmitButton";
import { submitFeedback } from "./actions";

const CATEGORIES = [
  { key: "bug", label: "🐛 Bug" },
  { key: "idea", label: "💡 Idea" },
  { key: "other", label: "💬 Other" },
];

export default async function FeedbackPage({
  searchParams,
}: {
  searchParams: { error?: string; success?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <main className="mx-auto max-w-lg px-6 py-12">
      <Link href="/profile" className="text-sm text-muted hover:text-fg">
        ← Back
      </Link>
      <h1 className="mb-1 mt-3 text-2xl font-black tracking-tight">💬 Feedback</h1>
      <p className="mb-6 text-sm text-muted">
        Found a bug, have an idea, or just want to say something? It goes straight to me.
      </p>

      {searchParams.success && (
        <div className="celebrate-pop forge-panel forge-accent-emerald mb-6 p-4 text-sm text-emerald-300">
          🎉 Sent — thanks for taking the time.
        </div>
      )}
      {searchParams.error && (
        <p className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {searchParams.error}
        </p>
      )}

      <form action={submitFeedback} className="forge-panel space-y-4 p-5">
        <div>
          <label className="mb-2 block text-sm font-semibold text-fg">What's this about?</label>
          <div className="grid grid-cols-3 gap-2">
            {CATEGORIES.map((c) => (
              <label
                key={c.key}
                className="flex cursor-pointer items-center justify-center rounded-lg border border-line bg-bg py-3 text-sm font-bold transition has-[:checked]:border-forge has-[:checked]:bg-forge/15 has-[:checked]:text-forge"
              >
                <input type="radio" name="category" value={c.key} defaultChecked={c.key === "other"} className="sr-only" />
                {c.label}
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-fg">Message</label>
          <textarea
            name="message"
            required
            maxLength={2000}
            rows={6}
            placeholder="Tell me what's up…"
            className="w-full resize-none rounded-lg border border-line bg-bg px-4 py-3 outline-none focus:border-forge"
          />
        </div>

        <SubmitButton
          pendingText="Sending…"
          className="press-3d w-full rounded-lg bg-forge py-3 font-bold text-neutral-950 transition hover:bg-forge-soft"
        >
          Send feedback
        </SubmitButton>
      </form>
    </main>
  );
}
