import { createClient } from "@/lib/supabase/server";
import EntityTable, { type FieldDef } from "@/components/EntityTable";
import { createRoomMeasurement, updateRoomMeasurement, deleteRoomMeasurement } from "./actions";

const fields: FieldDef[] = [
  { key: "area", label: "Area / Room", type: "text", required: true },
  { key: "width_ft", label: "Width (ft)", type: "number" },
  { key: "length_ft", label: "Length (ft)", type: "number" },
  { key: "height_ft", label: "Height (ft)", type: "number" },
  { key: "floor_sqft", label: "Floor Sq Ft", type: "number", readOnly: true },
  { key: "perimeter_lf", label: "Perimeter (LF)", type: "number", readOnly: true },
  { key: "wall_sqft", label: "Wall Sq Ft", type: "number", readOnly: true },
  { key: "notes", label: "Notes", type: "textarea" },
];

export default async function MeasurementsPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: rows } = await supabase
    .from("room_measurements")
    .select("*")
    .eq("project_id", params.id)
    .order("created_at", { ascending: true });

  const totalFloor = (rows ?? []).reduce((sum, r) => sum + Number(r.floor_sqft ?? 0), 0);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Room measurements</h2>
        <span className="text-sm text-muted">Total floor: {totalFloor.toLocaleString()} sq ft</span>
      </div>
      <EntityTable
        fields={fields}
        rows={rows ?? []}
        projectId={params.id}
        createAction={createRoomMeasurement}
        updateAction={updateRoomMeasurement}
        deleteAction={deleteRoomMeasurement}
        emptyLabel="No measurements yet."
        addLabel="Add area"
      />
    </div>
  );
}
