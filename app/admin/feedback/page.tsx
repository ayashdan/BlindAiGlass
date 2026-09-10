import { createAdminClient } from "@/lib/supabase/admin";
import SubmitButton from "@/components/SubmitButton";
import { markFeedbackReviewed } from "./actions";

const CATEGORY_LABEL: Record<string, string> = { bug: "🐛 Bug", idea: "💡 Idea", other: "💬 Other" };

export default async function AdminFeedback() {
  const admin = createAdminClient();
  const { data: rows } = await admin
    .from("feedback")
    .select("id, user_id, category, message, status, created_at")
    .order("created_at", { ascending: false });

  const list = (rows ?? []) as any[];
  const userIds = Array.from(new Set(list.map((r) => r.user_id)));
  const { data: profiles } = userIds.length
    ? await admin.from("profiles").select("id, username").in("id", userIds)
    : { data: [] as any[] };
  const usernameById = new Map((profiles ?? []).map((p: any) => [p.id, p.username]));

  const newCount = list.filter((r) => r.status === "new").length;

  return (
    <div>
      <p className="mb-4 text-sm text-muted">
        {list.length} total · <span className="font-semibold text-forge">{newCount} new</span>
      </p>

      <div className="space-y-3">
        {list.map((f) => (
          <div
            key={f.id}
            className={
              "rounded-xl border p-4 " +
              (f.status === "new" ? "border-forge/40 bg-forge/5" : "border-line bg-surface")
            }
          >
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-bold">
                {CATEGORY_LABEL[f.category] ?? f.category} · {usernameById.get(f.user_id) ?? "unknown"}
              </span>
              <span className="text-xs text-muted">{new Date(f.created_at).toLocaleString()}</span>
            </div>
            <p className="whitespace-pre-wrap text-sm text-fg">{f.message}</p>
            {f.status === "new" && (
              <form action={markFeedbackReviewed} className="mt-3">
                <input type="hidden" name="id" value={f.id} />
                <SubmitButton className="press rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-muted transition hover:border-forge hover:text-forge">
                  Mark reviewed
                </SubmitButton>
              </form>
            )}
          </div>
        ))}
        {list.length === 0 && <p className="text-sm text-muted">No feedback yet.</p>}
      </div>
    </div>
  );
}
