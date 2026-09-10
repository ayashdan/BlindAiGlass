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
  revalidatePath(`/projects/${projectId}/measurements`);
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/dashboard");
}

export async function createRoomMeasurement(formData: FormData) {
  const supabase = createClient();
  const project_id = String(formData.get("project_id") || "");
  if (!project_id) return;

  await supabase.from("room_measurements").insert({
    project_id,
    area: str(formData, "area") ?? "Untitled area",
    width_ft: num(formData, "width_ft"),
    length_ft: num(formData, "length_ft"),
    height_ft: num(formData, "height_ft"),
    notes: str(formData, "notes"),
  });

  revalidateProject(project_id);
}

export async function updateRoomMeasurement(formData: FormData) {
  const supabase = createClient();
  const id = String(formData.get("id") || "");
  if (!id) return;

  const { data } = await supabase
    .from("room_measurements")
    .update({
      area: str(formData, "area") ?? "Untitled area",
      width_ft: num(formData, "width_ft"),
      length_ft: num(formData, "length_ft"),
      height_ft: num(formData, "height_ft"),
      notes: str(formData, "notes"),
    })
    .eq("id", id)
    .select("project_id")
    .single();

  if (data) revalidateProject(data.project_id);
}

export async function deleteRoomMeasurement(formData: FormData) {
  const supabase = createClient();
  const id = String(formData.get("id") || "");
  if (!id) return;

  const { data } = await supabase
    .from("room_measurements")
    .select("project_id")
    .eq("id", id)
    .single();
  await supabase.from("room_measurements").delete().eq("id", id);
  if (data) revalidateProject(data.project_id);
}
