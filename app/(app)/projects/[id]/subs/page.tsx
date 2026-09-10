import { createClient } from "@/lib/supabase/server";
import EntityTable, { type FieldDef } from "@/components/EntityTable";
import { SUB_STATUS_LABEL } from "@/lib/types";
import { createSubcontractor, updateSubcontractor, deleteSubcontractor } from "./actions";

const fields: FieldDef[] = [
  { key: "trade", label: "Trade", type: "text" },
  { key: "company", label: "Sub / Company", type: "text", required: true },
  { key: "contact", label: "Contact", type: "text" },
  { key: "contract_amount", label: "Contract Amount", type: "currency" },
  { key: "amount_paid", label: "Amount Paid", type: "currency" },
  { key: "balance_due", label: "Balance Due", type: "currency", readOnly: true },
  { key: "last_payment_date", label: "Last Payment Date", type: "date" },
  {
    key: "status",
    label: "Status",
    type: "select",
    options: Object.entries(SUB_STATUS_LABEL).map(([value, label]) => ({ value, label })),
  },
  { key: "notes", label: "Notes", type: "textarea" },
];

export default async function SubsPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: rows } = await supabase
    .from("subcontractors")
    .select("*")
    .eq("project_id", params.id)
    .order("created_at", { ascending: true });

  return (
    <div>
      <h2 className="mb-3 text-lg font-semibold">Subcontractors &amp; payments out</h2>
      <EntityTable
        fields={fields}
        rows={rows ?? []}
        projectId={params.id}
        createAction={createSubcontractor}
        updateAction={updateSubcontractor}
        deleteAction={deleteSubcontractor}
        emptyLabel="No subcontractors yet."
        addLabel="Add subcontractor"
      />
    </div>
  );
}
