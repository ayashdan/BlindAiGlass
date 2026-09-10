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
  revalidatePath(`/projects/${projectId}/change-orders`);
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/dashboard");
}

export async function createChangeOrder(formData: FormData) {
  const supabase = createClient();
  const project_id = String(formData.get("project_id") || "");
  if (!project_id) return;

  await supabase.from("change_orders").insert({
    project_id,
    co_number: num(formData, "co_number"),
    description: str(formData, "description") ?? "Untitled change order",
    date_submitted: str(formData, "date_submitted"),
    date_approved: str(formData, "date_approved"),
    amount: num(formData, "amount") ?? 0,
    status: str(formData, "status") ?? "pending",
    amount_received: num(formData, "amount_received") ?? 0,
    notes: str(formData, "notes"),
  });

  revalidateProject(project_id);
}

export async function updateChangeOrder(formData: FormData) {
  const supabase = createClient();
  const id = String(formData.get("id") || "");
  if (!id) return;

  const { data } = await supabase
    .from("change_orders")
    .update({
      co_number: num(formData, "co_number"),
      description: str(formData, "description") ?? "Untitled change order",
      date_submitted: str(formData, "date_submitted"),
      date_approved: str(formData, "date_approved"),
      amount: num(formData, "amount") ?? 0,
      status: str(formData, "status") ?? "pending",
      amount_received: num(formData, "amount_received") ?? 0,
      notes: str(formData, "notes"),
    })
    .eq("id", id)
    .select("project_id")
    .single();

  if (data) revalidateProject(data.project_id);
}

export async function deleteChangeOrder(formData: FormData) {
  const supabase = createClient();
  const id = String(formData.get("id") || "");
  if (!id) return;

  const { data } = await supabase
    .from("change_orders")
    .select("project_id")
    .eq("id", id)
    .single();
  await supabase.from("change_orders").delete().eq("id", id);
  if (data) revalidateProject(data.project_id);
}
