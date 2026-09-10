import { notFound } from "next/navigation";
import Link from "next/link";
import { getProjectWithFinancials } from "@/lib/data";
import ProjectForm from "@/components/ProjectForm";
import ConfirmForm from "@/components/ConfirmForm";
import { updateProject, deleteProject } from "../../actions";

export default async function EditProjectPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { error?: string };
}) {
  const project = await getProjectWithFinancials(params.id);
  if (!project) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <Link href={`/projects/${project.id}`} className="text-sm text-muted hover:text-fg">
          ← Back to project
        </Link>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">Edit project</h1>
      </div>

      {searchParams.error && (
        <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {searchParams.error}
        </p>
      )}

      <ProjectForm action={updateProject} project={project} submitLabel="Save changes" />

      <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-4">
        <p className="mb-2 text-sm font-semibold text-red-300">Danger zone</p>
        <p className="mb-3 text-sm text-muted">
          Deleting a project permanently removes all of its tasks, selections, materials, subs,
          payments, and change orders.
        </p>
        <ConfirmForm
          action={deleteProject}
          hiddenId={project.id}
          confirmText={`Delete "${project.name}"? This cannot be undone.`}
          pendingText="Deleting…"
          className="press rounded-lg border border-red-500/40 px-4 py-2 text-sm font-semibold text-red-400 hover:bg-red-500/10"
        >
          Delete project
        </ConfirmForm>
      </div>
    </div>
  );
}
