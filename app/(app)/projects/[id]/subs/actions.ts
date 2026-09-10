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
  revalidatePath(`/projects/${projectId}/subs`);
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/dashboard");
}

export async function createSubcontractor(formData: FormData) {
  const supabase = createClient();
  const project_id = String(formData.get("project_id") || "");
  if (!project_id) return;

  await supabase.from("subcontractors").insert({
    project_id,
    trade: str(formData, "trade"),
    company: str(formData, "company") ?? "Untitled sub",
    contact: str(formData, "contact"),
    contract_amount: num(formData, "contract_amount") ?? 0,
    amount_paid: num(formData, "amount_paid") ?? 0,
    last_payment_date: str(formData, "last_payment_date"),
    status: str(formData, "status") ?? "not_started",
    notes: str(formData, "notes"),
  });

  revalidateProject(project_id);
}

export async function updateSubcontractor(formData: FormData) {
  const supabase = createClient();
  const id = String(formData.get("id") || "");
  if (!id) return;

  const { data } = await supabase
    .from("subcontractors")
    .update({
      trade: str(formData, "trade"),
      company: str(formData, "company") ?? "Untitled sub",
      contact: str(formData, "contact"),
      contract_amount: num(formData, "contract_amount") ?? 0,
      amount_paid: num(formData, "amount_paid") ?? 0,
      last_payment_date: str(formData, "last_payment_date"),
      status: str(formData, "status") ?? "not_started",
      notes: str(formData, "notes"),
    })
    .eq("id", id)
    .select("project_id")
    .single();

  if (data) revalidateProject(data.project_id);
}

export async function deleteSubcontractor(formData: FormData) {
  const supabase = createClient();
  const id = String(formData.get("id") || "");
  if (!id) return;

  const { data } = await supabase
    .from("subcontractors")
    .select("project_id")
    .eq("id", id)
    .single();
  await supabase.from("subcontractors").delete().eq("id", id);
  if (data) revalidateProject(data.project_id);
}
