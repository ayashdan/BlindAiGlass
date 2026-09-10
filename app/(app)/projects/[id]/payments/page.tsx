import { createClient } from "@/lib/supabase/server";
import EntityTable, { type FieldDef } from "@/components/EntityTable";
import { PAYMENT_STATUS_LABEL } from "@/lib/types";
import { createCustomerPayment, updateCustomerPayment, deleteCustomerPayment } from "./actions";

const fields: FieldDef[] = [
  { key: "payment_number", label: "Payment #", type: "number" },
  { key: "description", label: "Description / Milestone", type: "text" },
  { key: "amount_due", label: "Amount Due", type: "currency" },
  { key: "amount_received", label: "Amount Received", type: "currency" },
  { key: "balance_remaining", label: "Balance Remaining", type: "currency", readOnly: true },
  { key: "date_received", label: "Date Received", type: "date" },
  { key: "payment_method", label: "Payment Method", type: "text" },
  {
    key: "status",
    label: "Status",
    type: "select",
    options: Object.entries(PAYMENT_STATUS_LABEL).map(([value, label]) => ({ value, label })),
  },
  { key: "notes", label: "Notes", type: "textarea" },
];

export default async function PaymentsPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: rows } = await supabase
    .from("customer_payments")
    .select("*")
    .eq("project_id", params.id)
    .order("payment_number", { ascending: true, nullsFirst: false });

  return (
    <div>
      <h2 className="mb-3 text-lg font-semibold">Customer payments (incoming)</h2>
      <EntityTable
        fields={fields}
        rows={rows ?? []}
        projectId={params.id}
        createAction={createCustomerPayment}
        updateAction={updateCustomerPayment}
        deleteAction={deleteCustomerPayment}
        emptyLabel="No payments recorded yet."
        addLabel="Add payment"
      />
    </div>
  );
}
