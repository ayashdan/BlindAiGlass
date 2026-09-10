"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function str(fd: FormData, key: string): string | null {
  const v = String(fd.get(key) ?? "").trim();
  return v === "" ? null : v;
}

function revalidateProject(projectId: string) {
  revalidatePath(`/projects/${projectId}/scope`);
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/dashboard");
}

export async function createTradeScope(formData: FormData) {
  const supabase = createClient();
  const project_id = String(formData.get("project_id") || "");
  if (!project_id) return;

  await supabase.from("trade_scope").insert({
    project_id,
    trade: str(formData, "trade") ?? "Untitled trade",
    scope_item: str(formData, "scope_item"),
    description: str(formData, "description"),
    status: str(formData, "status") ?? "not_started",
    assigned_sub: str(formData, "assigned_sub"),
    start_date: str(formData, "start_date"),
    complete_date: str(formData, "complete_date"),
    notes: str(formData, "notes"),
  });

  revalidateProject(project_id);
}

export async function updateTradeScope(formData: FormData) {
  const supabase = createClient();
  const id = String(formData.get("id") || "");
  if (!id) return;

  const { data } = await supabase
    .from("trade_scope")
    .update({
      trade: str(formData, "trade") ?? "Untitled trade",
      scope_item: str(formData, "scope_item"),
      description: str(formData, "description"),
      status: str(formData, "status") ?? "not_started",
      assigned_sub: str(formData, "assigned_sub"),
      start_date: str(formData, "start_date"),
      complete_date: str(formData, "complete_date"),
      notes: str(formData, "notes"),
    })
    .eq("id", id)
    .select("project_id")
    .single();

  if (data) revalidateProject(data.project_id);
}

export async function deleteTradeScope(formData: FormData) {
  const supabase = createClient();
  const id = String(formData.get("id") || "");
  if (!id) return;

  const { data } = await supabase.from("trade_scope").select("project_id").eq("id", id).single();
  await supabase.from("trade_scope").delete().eq("id", id);
  if (data) revalidateProject(data.project_id);
}
