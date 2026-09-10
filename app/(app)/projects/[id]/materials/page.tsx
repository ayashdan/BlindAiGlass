import { createClient } from "@/lib/supabase/server";
import EntityTable, { type FieldDef } from "@/components/EntityTable";
import { MATERIAL_STATUS_LABEL } from "@/lib/types";
import { createMaterial, updateMaterial, deleteMaterial } from "./actions";

const fields: FieldDef[] = [
  { key: "area", label: "Area / Room", type: "text" },
  { key: "material", label: "Material", type: "text", required: true },
  { key: "vendor", label: "Vendor / Supplier", type: "text" },
  { key: "qty", label: "Qty", type: "number" },
  { key: "unit", label: "Unit", type: "text" },
  { key: "unit_cost", label: "Unit Cost", type: "currency" },
  { key: "total_cost", label: "Total Cost", type: "currency", readOnly: true },
  {
    key: "status",
    label: "Status",
    type: "select",
    options: Object.entries(MATERIAL_STATUS_LABEL).map(([value, label]) => ({ value, label })),
  },
  { key: "order_date", label: "Order Date", type: "date" },
  { key: "po_number", label: "PO #", type: "text" },
  { key: "charged_to_customer", label: "Charged to Customer", type: "currency" },
  { key: "materials_profit", label: "Profit", type: "currency", readOnly: true },
  { key: "notes", label: "Notes", type: "textarea" },
];

export default async function MaterialsPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: rows } = await supabase
    .from("materials")
    .select("*")
    .eq("project_id", params.id)
    .order("created_at", { ascending: true });

  return (
    <div>
      <h2 className="mb-3 text-lg font-semibold">Material selections &amp; orders</h2>
      <EntityTable
        fields={fields}
        rows={rows ?? []}
        projectId={params.id}
        createAction={createMaterial}
        updateAction={updateMaterial}
        deleteAction={deleteMaterial}
        emptyLabel="No materials yet."
        addLabel="Add material"
      />
    </div>
  );
}
