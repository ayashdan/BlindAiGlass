import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import { formatCurrency, formatDate, formatPercent } from "@/lib/format";
import { PROJECT_STATUS_LABEL } from "@/lib/types";
import type { ProjectWithFinancials } from "@/lib/data";

export default function ProjectCard({ project }: { project: ProjectWithFinancials }) {
  const f = project.financials;
  const pct = f.tasks_total > 0 ? (f.tasks_complete / f.tasks_total) * 100 : 0;

  return (
    <Link
      href={`/projects/${project.id}`}
      className="block rounded-xl border border-line bg-surface p-4 transition hover:border-brand/50"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-display text-xl font-semibold">{project.name}</p>
          <p className="truncate text-sm text-muted">{project.client_name}</p>
        </div>
        <StatusBadge status={project.status} label={PROJECT_STATUS_LABEL[project.status]} />
      </div>

      <div className="mt-3 flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface2">
          <div className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
        </div>
        <span className="whitespace-nowrap text-xs text-muted">{formatPercent(pct)} tasks</span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs text-muted">Contract value</p>
          <p className="font-medium">{formatCurrency(f.adjusted_contract_value)}</p>
        </div>
        <div>
          <p className="text-xs text-muted">Balance due</p>
          <p className="font-medium">{formatCurrency(f.balance_due_from_client)}</p>
        </div>
        <div>
          <p className="text-xs text-muted">Target completion</p>
          <p className="font-medium">{formatDate(project.target_completion_date)}</p>
        </div>
        <div>
          <p className="text-xs text-muted">Address</p>
          <p className="truncate font-medium">{project.address || "—"}</p>
        </div>
      </div>
    </Link>
  );
}
