import Link from "next/link";
import { getActionItems, getProjectsWithFinancials } from "@/lib/data";
import StatCard from "@/components/StatCard";
import ProjectCard from "@/components/ProjectCard";
import { formatCurrency } from "@/lib/format";

const ACTION_ICON: Record<string, string> = {
  overdue_task: "⚠️",
  upcoming_task: "🗓️",
  pending_change_order: "📝",
  backordered_material: "📦",
  pending_design: "🎨",
};

const SEVERITY_STYLE: Record<string, string> = {
  high: "border-red-500/30 bg-red-500/5",
  medium: "border-amber-500/30 bg-amber-500/5",
  low: "border-line bg-surface",
};

export default async function DashboardPage() {
  const [projects, actionItems] = await Promise.all([getProjectsWithFinancials(), getActionItems()]);

  const active = projects.filter((p) => p.status === "active" || p.status === "on_hold");
  const totals = active.reduce(
    (acc, p) => {
      acc.contractValue += p.financials.adjusted_contract_value;
      acc.balanceDue += p.financials.balance_due_from_client;
      acc.owedToSubs += p.financials.balance_owed_to_subs;
      acc.margin += p.financials.est_job_margin;
      return acc;
    },
    { contractValue: 0, balanceDue: 0, owedToSubs: 0, margin: 0 }
  );

  const recentProjects = [...projects]
    .sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1))
    .slice(0, 6);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted">
          {active.length} active project{active.length === 1 ? "" : "s"} · overall status and open action items.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Active projects" value={String(active.length)} />
        <StatCard label="Contract value" value={formatCurrency(totals.contractValue)} />
        <StatCard label="Due from clients" value={formatCurrency(totals.balanceDue)} tone="warn" />
        <StatCard label="Est. total margin" value={formatCurrency(totals.margin)} tone="good" />
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Open action items</h2>
          <span className="text-sm text-muted">{actionItems.length} open</span>
        </div>
        {actionItems.length === 0 ? (
          <div className="rounded-xl border border-line bg-surface p-6 text-center text-sm text-muted">
            Nothing needs attention right now — nice work.
          </div>
        ) : (
          <ul className="space-y-2">
            {actionItems.slice(0, 25).map((item, i) => (
              <li key={i}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 transition hover:border-brand/50 ${SEVERITY_STYLE[item.severity]}`}
                >
                  <span aria-hidden="true">{ACTION_ICON[item.type]}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.title}</p>
                    <p className="truncate text-xs text-muted">
                      {item.projectName} · {item.detail}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent projects</h2>
          <Link href="/projects" className="text-sm font-medium text-brand hover:underline">
            View all
          </Link>
        </div>
        {recentProjects.length === 0 ? (
          <div className="rounded-xl border border-line bg-surface p-6 text-center text-sm text-muted">
            No projects yet.{" "}
            <Link href="/projects/new" className="font-medium text-brand hover:underline">
              Create your first project
            </Link>
            .
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {recentProjects.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
