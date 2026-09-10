"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function str(fd: FormData, key: string): string | null {
  const v = String(fd.get(key) ?? "").trim();
  return v === "" ? null : v;
}

function revalidateProject(projectId: string) {
  revalidatePath(`/projects/${projectId}/design`);
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/dashboard");
}

export async function createDesignSelection(formData: FormData) {
  const supabase = createClient();
  const project_id = String(formData.get("project_id") || "");
  if (!project_id) return;

  await supabase.from("design_selections").insert({
    project_id,
    area: str(formData, "area"),
    item: str(formData, "item") ?? "Untitled selection",
    description: str(formData, "description"),
    status: str(formData, "status") ?? "not_selected",
    selected_by: str(formData, "selected_by"),
    date_selected: str(formData, "date_selected"),
    notes: str(formData, "notes"),
  });

  revalidateProject(project_id);
}

export async function updateDesignSelection(formData: FormData) {
  const supabase = createClient();
  const id = String(formData.get("id") || "");
  if (!id) return;

  const { data } = await supabase
    .from("design_selections")
    .update({
      area: str(formData, "area"),
      item: str(formData, "item") ?? "Untitled selection",
      description: str(formData, "description"),
      status: str(formData, "status") ?? "not_selected",
      selected_by: str(formData, "selected_by"),
      date_selected: str(formData, "date_selected"),
      notes: str(formData, "notes"),
    })
    .eq("id", id)
    .select("project_id")
    .single();

  if (data) revalidateProject(data.project_id);
}

export async function deleteDesignSelection(formData: FormData) {
  const supabase = createClient();
  const id = String(formData.get("id") || "");
  if (!id) return;

  const { data } = await supabase
    .from("design_selections")
    .select("project_id")
    .eq("id", id)
    .single();
  await supabase.from("design_selections").delete().eq("id", id);
  if (data) revalidateProject(data.project_id);
}
