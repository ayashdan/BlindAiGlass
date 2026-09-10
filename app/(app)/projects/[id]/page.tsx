import { notFound } from "next/navigation";
import { getProjectWithFinancials } from "@/lib/data";
import StatCard from "@/components/StatCard";
import { formatCurrency, formatDate, formatPercent } from "@/lib/format";

const infoRow = "flex justify-between gap-4 py-2 text-sm";

export default async function ProjectOverviewPage({ params }: { params: { id: string } }) {
  const project = await getProjectWithFinancials(params.id);
  if (!project) notFound();
  const f = project.financials;
  const pctComplete = f.tasks_total > 0 ? (f.tasks_complete / f.tasks_total) * 100 : 0;

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-3 text-lg font-semibold">Project information</h2>
        <div className="grid gap-x-8 divide-y divide-line rounded-xl border border-line bg-surface p-4 sm:grid-cols-2 sm:divide-y-0">
          <div className="divide-y divide-line">
            <div className={infoRow}>
              <span className="text-muted">Client</span>
              <span className="text-right font-medium">{project.client_name}</span>
            </div>
            <div className={infoRow}>
              <span className="text-muted">Phone</span>
              <span className="text-right font-medium">{project.client_phone || "—"}</span>
            </div>
            <div className={infoRow}>
              <span className="text-muted">Email</span>
              <span className="text-right font-medium">{project.client_email || "—"}</span>
            </div>
            <div className={infoRow}>
              <span className="text-muted">Address</span>
              <span className="text-right font-medium">{project.address || "—"}</span>
            </div>
          </div>
          <div className="divide-y divide-line">
            <div className={infoRow}>
              <span className="text-muted">Project type</span>
              <span className="text-right font-medium">{project.project_type || "—"}</span>
            </div>
            <div className={infoRow}>
              <span className="text-muted">ROC #</span>
              <span className="text-right font-medium">{project.roc_number || "—"}</span>
            </div>
            <div className={infoRow}>
              <span className="text-muted">Start date</span>
              <span className="text-right font-medium">{formatDate(project.start_date)}</span>
            </div>
            <div className={infoRow}>
              <span className="text-muted">Target completion</span>
              <span className="text-right font-medium">
                {formatDate(project.target_completion_date)}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Progress snapshot</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            label="Tasks complete"
            value={`${f.tasks_complete} of ${f.tasks_total}`}
            sublabel={`${formatPercent(pctComplete)} complete`}
          />
          <StatCard
            label="Materials pending"
            value={String(f.materials_pending)}
            tone={f.materials_pending > 0 ? "warn" : "neutral"}
          />
          <StatCard
            label="Design items pending"
            value={String(f.design_items_pending)}
            tone={f.design_items_pending > 0 ? "warn" : "neutral"}
          />
          <StatCard
            label="Pending change orders"
            value={formatCurrency(f.pending_change_orders)}
            tone={f.pending_change_orders > 0 ? "warn" : "neutral"}
          />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Financial summary</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <StatCard label="Total contract value" value={formatCurrency(f.total_contract_value)} />
          <StatCard label="Approved change orders" value={formatCurrency(f.approved_change_orders)} />
          <StatCard label="Adjusted contract value" value={formatCurrency(f.adjusted_contract_value)} />
          <StatCard
            label="Received from client"
            value={formatCurrency(f.received_from_client)}
            tone="good"
          />
          <StatCard
            label="Balance due from client"
            value={formatCurrency(f.balance_due_from_client)}
            tone={f.balance_due_from_client > 0 ? "warn" : "neutral"}
          />
          <StatCard label="Est. job margin" value={formatCurrency(f.est_job_margin)} tone="good" />
          <StatCard label="Total sub contracts" value={formatCurrency(f.total_sub_contracts)} />
          <StatCard label="Paid to subs" value={formatCurrency(f.paid_to_subs)} />
          <StatCard
            label="Balance owed to subs"
            value={formatCurrency(f.balance_owed_to_subs)}
            tone={f.balance_owed_to_subs > 0 ? "warn" : "neutral"}
          />
          <StatCard label="Materials cost (ordered)" value={formatCurrency(f.materials_cost)} />
          <StatCard
            label="Materials charged to customer"
            value={formatCurrency(f.materials_charged_to_customer)}
          />
          <StatCard label="Materials profit" value={formatCurrency(f.materials_profit)} tone="good" />
        </div>
      </section>
    </div>
  );
}
