import Link from "next/link";
import { getProjectsWithFinancials } from "@/lib/data";
import ProjectCard from "@/components/ProjectCard";
import { PROJECT_STATUS_LABEL, type ProjectStatus } from "@/lib/types";

const FILTERS: { value: ProjectStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: PROJECT_STATUS_LABEL.active },
  { value: "on_hold", label: PROJECT_STATUS_LABEL.on_hold },
  { value: "complete", label: PROJECT_STATUS_LABEL.complete },
  { value: "cancelled", label: PROJECT_STATUS_LABEL.cancelled },
];

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const projects = await getProjectsWithFinancials();
  const filter = (searchParams.status as ProjectStatus | undefined) ?? "all";
  const filtered = filter === "all" ? projects : projects.filter((p) => p.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-sm text-muted">
            {projects.length} project{projects.length === 1 ? "" : "s"} total.
          </p>
        </div>
        <Link
          href="/projects/new"
          className="press whitespace-nowrap rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-soft"
        >
          + New project
        </Link>
      </div>

      <div className="flex flex-wrap gap-1">
        {FILTERS.map((f) => (
          <Link
            key={f.value}
            href={f.value === "all" ? "/projects" : `/projects?status=${f.value}`}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              filter === f.value ? "bg-surface2 text-fg" : "text-muted hover:text-fg"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-line bg-surface p-8 text-center text-sm text-muted">
          No projects match this filter.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}
    </div>
  );
}
