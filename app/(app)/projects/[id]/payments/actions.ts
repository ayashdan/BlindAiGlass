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
  revalidatePath(`/projects/${projectId}/payments`);
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/dashboard");
}

export async function createCustomerPayment(formData: FormData) {
  const supabase = createClient();
  const project_id = String(formData.get("project_id") || "");
  if (!project_id) return;

  await supabase.from("customer_payments").insert({
    project_id,
    payment_number: num(formData, "payment_number"),
    description: str(formData, "description"),
    amount_due: num(formData, "amount_due") ?? 0,
    amount_received: num(formData, "amount_received") ?? 0,
    date_received: str(formData, "date_received"),
    payment_method: str(formData, "payment_method"),
    status: str(formData, "status") ?? "pending",
    notes: str(formData, "notes"),
  });

  revalidateProject(project_id);
}

export async function updateCustomerPayment(formData: FormData) {
  const supabase = createClient();
  const id = String(formData.get("id") || "");
  if (!id) return;

  const { data } = await supabase
    .from("customer_payments")
    .update({
      payment_number: num(formData, "payment_number"),
      description: str(formData, "description"),
      amount_due: num(formData, "amount_due") ?? 0,
      amount_received: num(formData, "amount_received") ?? 0,
      date_received: str(formData, "date_received"),
      payment_method: str(formData, "payment_method"),
      status: str(formData, "status") ?? "pending",
      notes: str(formData, "notes"),
    })
    .eq("id", id)
    .select("project_id")
    .single();

  if (data) revalidateProject(data.project_id);
}

export async function deleteCustomerPayment(formData: FormData) {
  const supabase = createClient();
  const id = String(formData.get("id") || "");
  if (!id) return;

  const { data } = await supabase
    .from("customer_payments")
    .select("project_id")
    .eq("id", id)
    .single();
  await supabase.from("customer_payments").delete().eq("id", id);
  if (data) revalidateProject(data.project_id);
}
