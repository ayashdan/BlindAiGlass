import ProjectForm from "@/components/ProjectForm";
import { createProject } from "../actions";

export default function NewProjectPage({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold tracking-tight">New project</h1>
      <p className="mb-6 text-sm text-muted">Set up a new customer job.</p>

      {searchParams.error && (
        <p className="mb-6 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {searchParams.error}
        </p>
      )}

      <ProjectForm action={createProject} submitLabel="Create project" />
    </div>
  );
}
