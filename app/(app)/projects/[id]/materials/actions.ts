"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function str(fd: FormData, key: string): string | null {
  const v = String(fd.get(key) ?? "").trim();
  return v === "" ? null : v;
}

function num(fd: FormData, key: string): number | null {
  const v = String(fd.get(key) ?? "").trim();
  if (v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function revalidateProject(projectId: string) {
  revalidatePath(`/projects/${projectId}/materials`);
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/dashboard");
}

export async function createMaterial(formData: FormData) {
  const supabase = createClient();
  const project_id = String(formData.get("project_id") || "");
  if (!project_id) return;

  await supabase.from("materials").insert({
    project_id,
    area: str(formData, "area"),
    material: str(formData, "material") ?? "Untitled material",
    vendor: str(formData, "vendor"),
    qty: num(formData, "qty"),
    unit: str(formData, "unit"),
    unit_cost: num(formData, "unit_cost"),
    status: str(formData, "status") ?? "needed",
    order_date: str(formData, "order_date"),
    po_number: str(formData, "po_number"),
    charged_to_customer: num(formData, "charged_to_customer") ?? 0,
    notes: str(formData, "notes"),
  });

  revalidateProject(project_id);
}

export async function updateMaterial(formData: FormData) {
  const supabase = createClient();
  const id = String(formData.get("id") || "");
  if (!id) return;

  const { data } = await supabase
    .from("materials")
    .update({
      area: str(formData, "area"),
      material: str(formData, "material") ?? "Untitled material",
      vendor: str(formData, "vendor"),
      qty: num(formData, "qty"),
      unit: str(formData, "unit"),
      unit_cost: num(formData, "unit_cost"),
      status: str(formData, "status") ?? "needed",
      order_date: str(formData, "order_date"),
      po_number: str(formData, "po_number"),
      charged_to_customer: num(formData, "charged_to_customer") ?? 0,
      notes: str(formData, "notes"),
    })
    .eq("id", id)
    .select("project_id")
    .single();

  if (data) revalidateProject(data.project_id);
}

export async function deleteMaterial(formData: FormData) {
  const supabase = createClient();
  const id = String(formData.get("id") || "");
  if (!id) return;

  const { data } = await supabase.from("materials").select("project_id").eq("id", id).single();
  await supabase.from("materials").delete().eq("id", id);
  if (data) revalidateProject(data.project_id);
}
