import Link from "next/link";
import { notFound } from "next/navigation";
import { getProjectWithFinancials } from "@/lib/data";
import StatusBadge from "@/components/StatusBadge";
import { PROJECT_STATUS_LABEL } from "@/lib/types";
import ProjectTabs from "@/components/ProjectTabs";

export default async function ProjectDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { id: string };
}) {
  const project = await getProjectWithFinancials(params.id);
  if (!project) notFound();

  return (
    <div className="space-y-5">
      <div>
        <Link href="/projects" className="text-sm text-muted hover:text-fg">
          ← All projects
        </Link>
        <div className="mt-1 flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
              <StatusBadge status={project.status} label={PROJECT_STATUS_LABEL[project.status]} />
            </div>
            <p className="text-sm text-muted">{project.client_name}</p>
          </div>
          <Link
            href={`/projects/${project.id}/edit`}
            className="press rounded-lg border border-line px-4 py-2 text-sm font-semibold hover:border-brand/50"
          >
            Edit project
          </Link>
        </div>
      </div>

      <ProjectTabs projectId={project.id} />

      {children}
    </div>
  );
}
