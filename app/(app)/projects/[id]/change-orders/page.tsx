import { createClient } from "@/lib/supabase/server";
import EntityTable, { type FieldDef } from "@/components/EntityTable";
import { CHANGE_ORDER_STATUS_LABEL } from "@/lib/types";
import { createChangeOrder, updateChangeOrder, deleteChangeOrder } from "./actions";

const fields: FieldDef[] = [
  { key: "co_number", label: "CO #", type: "number" },
  { key: "description", label: "Description", type: "text", required: true },
  { key: "date_submitted", label: "Date Submitted", type: "date" },
  { key: "date_approved", label: "Date Approved", type: "date" },
  { key: "amount", label: "Amount", type: "currency" },
  {
    key: "status",
    label: "Status",
    type: "select",
    options: Object.entries(CHANGE_ORDER_STATUS_LABEL).map(([value, label]) => ({ value, label })),
  },
  { key: "amount_received", label: "Amount Received", type: "currency" },
  { key: "balance_remaining", label: "Balance Remaining", type: "currency", readOnly: true },
  { key: "notes", label: "Notes", type: "textarea" },
];

export default async function ChangeOrdersPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: rows } = await supabase
    .from("change_orders")
    .select("*")
    .eq("project_id", params.id)
    .order("co_number", { ascending: true, nullsFirst: false });

  return (
    <div>
      <h2 className="mb-3 text-lg font-semibold">Change orders</h2>
      <EntityTable
        fields={fields}
        rows={rows ?? []}
        projectId={params.id}
        createAction={createChangeOrder}
        updateAction={updateChangeOrder}
        deleteAction={deleteChangeOrder}
        emptyLabel="No change orders yet."
        addLabel="Add change order"
      />
    </div>
  );
}
