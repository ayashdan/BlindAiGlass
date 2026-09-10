import { createClient } from "@/lib/supabase/server";
import EntityTable, { type FieldDef } from "@/components/EntityTable";
import { DESIGN_STATUS_LABEL } from "@/lib/types";
import { createDesignSelection, updateDesignSelection, deleteDesignSelection } from "./actions";

const fields: FieldDef[] = [
  { key: "area", label: "Area / Room", type: "text" },
  { key: "item", label: "Item / Selection", type: "text", required: true },
  { key: "description", label: "Description", type: "textarea" },
  {
    key: "status",
    label: "Status",
    type: "select",
    options: Object.entries(DESIGN_STATUS_LABEL).map(([value, label]) => ({ value, label })),
  },
  { key: "selected_by", label: "Selected By", type: "text" },
  { key: "date_selected", label: "Date Selected", type: "date" },
  { key: "notes", label: "Notes", type: "textarea" },
];

export default async function DesignPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: rows } = await supabase
    .from("design_selections")
    .select("*")
    .eq("project_id", params.id)
    .order("created_at", { ascending: true });

  return (
    <div>
      <h2 className="mb-3 text-lg font-semibold">Design &amp; selections</h2>
      <EntityTable
        fields={fields}
        rows={rows ?? []}
        projectId={params.id}
        createAction={createDesignSelection}
        updateAction={updateDesignSelection}
        deleteAction={deleteDesignSelection}
        emptyLabel="No selections yet."
        addLabel="Add selection"
      />
    </div>
  );
}
