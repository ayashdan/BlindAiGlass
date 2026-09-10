"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function str(formData: FormData, key: string): string | null {
  const v = String(formData.get(key) ?? "").trim();
  return v === "" ? null : v;
}

function num(formData: FormData, key: string): number {
  const v = Number(formData.get(key));
  return Number.isFinite(v) ? v : 0;
}

export async function createProject(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const name = str(formData, "name");
  const client_name = str(formData, "client_name");
  if (!name || !client_name) {
    redirect(
      "/projects/new?error=" + encodeURIComponent("Project name and client name are required.")
    );
  }

  const { data, error } = await supabase
    .from("projects")
    .insert({
      name,
      client_name,
      client_email: str(formData, "client_email"),
      client_phone: str(formData, "client_phone"),
      address: str(formData, "address"),
      project_type: str(formData, "project_type"),
      roc_number: str(formData, "roc_number"),
      status: str(formData, "status") ?? "active",
      start_date: str(formData, "start_date"),
      target_completion_date: str(formData, "target_completion_date"),
      contract_value: num(formData, "contract_value"),
      created_by: user.id,
      pm_id: user.id,
    })
    .select("id")
    .single();

  if (error || !data) {
    redirect(
      "/projects/new?error=" + encodeURIComponent(error?.message ?? "Could not create project.")
    );
  }

  revalidatePath("/dashboard");
  revalidatePath("/projects");
  redirect(`/projects/${data.id}`);
}

export async function updateProject(formData: FormData) {
  const supabase = createClient();
  const id = String(formData.get("id") || "");
  if (!id) redirect("/projects");

  const name = str(formData, "name");
  const client_name = str(formData, "client_name");
  if (!name || !client_name) {
    redirect(
      `/projects/${id}/edit?error=` + encodeURIComponent("Project name and client name are required.")
    );
  }

  const { error } = await supabase
    .from("projects")
    .update({
      name,
      client_name,
      client_email: str(formData, "client_email"),
      client_phone: str(formData, "client_phone"),
      address: str(formData, "address"),
      project_type: str(formData, "project_type"),
      roc_number: str(formData, "roc_number"),
      status: str(formData, "status") ?? "active",
      start_date: str(formData, "start_date"),
      target_completion_date: str(formData, "target_completion_date"),
      contract_value: num(formData, "contract_value"),
    })
    .eq("id", id);

  if (error) {
    redirect(`/projects/${id}/edit?error=` + encodeURIComponent(error.message));
  }

  revalidatePath("/dashboard");
  revalidatePath("/projects");
  revalidatePath(`/projects/${id}`);
  redirect(`/projects/${id}`);
}

export async function deleteProject(formData: FormData) {
  const supabase = createClient();
  const id = String(formData.get("id") || "");
  if (!id) redirect("/projects");

  await supabase.from("projects").delete().eq("id", id);

  revalidatePath("/dashboard");
  revalidatePath("/projects");
  redirect("/projects");
}
