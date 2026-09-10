"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function str(fd: FormData, key: string): string | null {
  const v = String(fd.get(key) ?? "").trim();
  return v === "" ? null : v;
}

function revalidateProject(projectId: string) {
  revalidatePath(`/projects/${projectId}/tasks`);
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/dashboard");
}

export async function createTask(formData: FormData) {
  const supabase = createClient();
  const project_id = String(formData.get("project_id") || "");
  if (!project_id) return;

  await supabase.from("tasks").insert({
    project_id,
    title: str(formData, "title") ?? "Untitled task",
    category: str(formData, "category"),
    assigned_to: str(formData, "assigned_to"),
    start_date: str(formData, "start_date"),
    due_date: str(formData, "due_date"),
    status: str(formData, "status") ?? "not_started",
    notes: str(formData, "notes"),
  });

  revalidateProject(project_id);
}

export async function updateTask(formData: FormData) {
  const supabase = createClient();
  const id = String(formData.get("id") || "");
  if (!id) return;

  const { data } = await supabase
    .from("tasks")
    .update({
      title: str(formData, "title") ?? "Untitled task",
      category: str(formData, "category"),
      assigned_to: str(formData, "assigned_to"),
      start_date: str(formData, "start_date"),
      due_date: str(formData, "due_date"),
      status: str(formData, "status") ?? "not_started",
      notes: str(formData, "notes"),
    })
    .eq("id", id)
    .select("project_id")
    .single();

  if (data) revalidateProject(data.project_id);
}

export async function deleteTask(formData: FormData) {
  const supabase = createClient();
  const id = String(formData.get("id") || "");
  if (!id) return;

  const { data } = await supabase.from("tasks").select("project_id").eq("id", id).single();
  await supabase.from("tasks").delete().eq("id", id);
  if (data) revalidateProject(data.project_id);
}
