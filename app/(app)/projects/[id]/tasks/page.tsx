import { createClient } from "@/lib/supabase/server";
import EntityTable, { type FieldDef } from "@/components/EntityTable";
import { TASK_STATUS_LABEL } from "@/lib/types";
import { createTask, updateTask, deleteTask } from "./actions";

const fields: FieldDef[] = [
  { key: "title", label: "Task", type: "text", required: true },
  { key: "category", label: "Category", type: "text" },
  { key: "assigned_to", label: "Assigned To", type: "text" },
  { key: "start_date", label: "Start Date", type: "date" },
  { key: "due_date", label: "Due Date", type: "date" },
  {
    key: "status",
    label: "Status",
    type: "select",
    options: Object.entries(TASK_STATUS_LABEL).map(([value, label]) => ({ value, label })),
  },
  { key: "notes", label: "Notes", type: "textarea" },
];

export default async function TasksPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: rows } = await supabase
    .from("tasks")
    .select("*")
    .eq("project_id", params.id)
    .order("due_date", { ascending: true, nullsFirst: false });

  return (
    <div>
      <h2 className="mb-3 text-lg font-semibold">Tasks</h2>
      <EntityTable
        fields={fields}
        rows={rows ?? []}
        projectId={params.id}
        createAction={createTask}
        updateAction={updateTask}
        deleteAction={deleteTask}
        emptyLabel="No tasks yet."
        addLabel="Add task"
      />
    </div>
  );
}
