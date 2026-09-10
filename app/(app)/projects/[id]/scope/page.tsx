import { createClient } from "@/lib/supabase/server";
import EntityTable, { type FieldDef } from "@/components/EntityTable";
import { TRADE_SCOPE_STATUS_LABEL } from "@/lib/types";
import { createTradeScope, updateTradeScope, deleteTradeScope } from "./actions";

const fields: FieldDef[] = [
  { key: "trade", label: "Trade", type: "text", required: true },
  { key: "scope_item", label: "Scope Item", type: "text" },
  { key: "description", label: "Description", type: "textarea" },
  {
    key: "status",
    label: "Status",
    type: "select",
    options: Object.entries(TRADE_SCOPE_STATUS_LABEL).map(([value, label]) => ({ value, label })),
  },
  { key: "assigned_sub", label: "Assigned Sub", type: "text" },
  { key: "start_date", label: "Start Date", type: "date" },
  { key: "complete_date", label: "Complete Date", type: "date" },
  { key: "notes", label: "Notes", type: "textarea" },
];

export default async function TradeScopePage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: rows } = await supabase
    .from("trade_scope")
    .select("*")
    .eq("project_id", params.id)
    .order("created_at", { ascending: true });

  return (
    <div>
      <h2 className="mb-3 text-lg font-semibold">Scope of work by trade</h2>
      <EntityTable
        fields={fields}
        rows={rows ?? []}
        projectId={params.id}
        createAction={createTradeScope}
        updateAction={updateTradeScope}
        deleteAction={deleteTradeScope}
        emptyLabel="No trade scope items yet."
        addLabel="Add scope item"
      />
    </div>
  );
}
