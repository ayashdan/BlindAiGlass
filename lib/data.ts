// Server-only data access shared by the dashboard and project pages.
import { createClient } from "@/lib/supabase/server";
import type { Profile, Project, ProjectFinancials } from "@/lib/types";

export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  return (data as Profile) ?? null;
}

export interface ProjectWithFinancials extends Project {
  financials: ProjectFinancials;
}

export async function getProjectsWithFinancials(): Promise<ProjectWithFinancials[]> {
  const supabase = createClient();
  const [{ data: projects }, { data: financials }] = await Promise.all([
    supabase.from("projects").select("*").order("created_at", { ascending: false }),
    supabase.from("project_financials").select("*"),
  ]);

  const financialsByProject = new Map((financials ?? []).map((f) => [f.project_id, f]));

  return ((projects ?? []) as Project[]).map((p) => ({
    ...p,
    financials:
      financialsByProject.get(p.id) ??
      ({
        project_id: p.id,
        total_contract_value: p.contract_value,
        approved_change_orders: 0,
        pending_change_orders: 0,
        adjusted_contract_value: p.contract_value,
        received_from_client: 0,
        balance_due_from_client: p.contract_value,
        total_sub_contracts: 0,
        paid_to_subs: 0,
        balance_owed_to_subs: 0,
        materials_cost: 0,
        materials_charged_to_customer: 0,
        materials_profit: 0,
        est_job_margin: p.contract_value,
        tasks_total: 0,
        tasks_complete: 0,
        materials_pending: 0,
        design_items_pending: 0,
      } satisfies ProjectFinancials),
  }));
}

export async function getProjectWithFinancials(id: string): Promise<ProjectWithFinancials | null> {
  const supabase = createClient();
  const [{ data: project }, { data: financials }] = await Promise.all([
    supabase.from("projects").select("*").eq("id", id).maybeSingle(),
    supabase.from("project_financials").select("*").eq("project_id", id).maybeSingle(),
  ]);
  if (!project) return null;
  return {
    ...(project as Project),
    financials: (financials as ProjectFinancials) ?? {
      project_id: id,
      total_contract_value: project.contract_value,
      approved_change_orders: 0,
      pending_change_orders: 0,
      adjusted_contract_value: project.contract_value,
      received_from_client: 0,
      balance_due_from_client: project.contract_value,
      total_sub_contracts: 0,
      paid_to_subs: 0,
      balance_owed_to_subs: 0,
      materials_cost: 0,
      materials_charged_to_customer: 0,
      materials_profit: 0,
      est_job_margin: project.contract_value,
      tasks_total: 0,
      tasks_complete: 0,
      materials_pending: 0,
      design_items_pending: 0,
    },
  };
}

export type ActionItemType =
  | "overdue_task"
  | "upcoming_task"
  | "pending_change_order"
  | "backordered_material"
  | "pending_design";

export interface ActionItem {
  type: ActionItemType;
  severity: "high" | "medium" | "low";
  title: string;
  projectId: string;
  projectName: string;
  detail: string;
  href: string;
}

// Pulls every open-item signal across active projects into one prioritized
// list for the main dashboard: overdue/upcoming tasks, pending change order
// approvals, backordered materials, and unmade design selections.
export async function getActionItems(): Promise<ActionItem[]> {
  const supabase = createClient();

  const { data: activeProjects } = await supabase
    .from("projects")
    .select("id, name, status")
    .in("status", ["active", "on_hold"]);

  const projectMap = new Map((activeProjects ?? []).map((p) => [p.id, p.name]));
  const projectIds = [...projectMap.keys()];
  if (projectIds.length === 0) return [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().slice(0, 10);
  const weekOut = new Date(today.getTime() + 7 * 86_400_000).toISOString().slice(0, 10);

  const [{ data: tasks }, { data: changeOrders }, { data: materials }, { data: designs }] =
    await Promise.all([
      supabase
        .from("tasks")
        .select("id, project_id, title, due_date, status")
        .in("project_id", projectIds)
        .neq("status", "complete")
        .not("due_date", "is", null)
        .order("due_date", { ascending: true }),
      supabase
        .from("change_orders")
        .select("id, project_id, description, amount, status")
        .in("project_id", projectIds)
        .eq("status", "pending"),
      supabase
        .from("materials")
        .select("id, project_id, material, status")
        .in("project_id", projectIds)
        .in("status", ["backordered", "ordered"]),
      supabase
        .from("design_selections")
        .select("id, project_id, item, area, status")
        .in("project_id", projectIds)
        .eq("status", "not_selected"),
    ]);

  const items: ActionItem[] = [];

  for (const t of tasks ?? []) {
    const projectName = projectMap.get(t.project_id);
    if (!projectName || !t.due_date) continue;
    const overdue = t.due_date < todayStr;
    const upcoming = !overdue && t.due_date <= weekOut;
    if (!overdue && !upcoming) continue;
    items.push({
      type: overdue ? "overdue_task" : "upcoming_task",
      severity: overdue ? "high" : "medium",
      title: t.title,
      projectId: t.project_id,
      projectName,
      detail: overdue ? `Overdue since ${t.due_date}` : `Due ${t.due_date}`,
      href: `/projects/${t.project_id}/tasks`,
    });
  }

  for (const co of changeOrders ?? []) {
    const projectName = projectMap.get(co.project_id);
    if (!projectName) continue;
    items.push({
      type: "pending_change_order",
      severity: "medium",
      title: co.description,
      projectId: co.project_id,
      projectName,
      detail: `Awaiting approval — $${Number(co.amount).toLocaleString("en-US")}`,
      href: `/projects/${co.project_id}/change-orders`,
    });
  }

  for (const m of materials ?? []) {
    const projectName = projectMap.get(m.project_id);
    if (!projectName) continue;
    items.push({
      type: "backordered_material",
      severity: m.status === "backordered" ? "high" : "low",
      title: m.material,
      projectId: m.project_id,
      projectName,
      detail: m.status === "backordered" ? "Backordered" : "Ordered, not yet delivered",
      href: `/projects/${m.project_id}/materials`,
    });
  }

  for (const d of designs ?? []) {
    const projectName = projectMap.get(d.project_id);
    if (!projectName) continue;
    items.push({
      type: "pending_design",
      severity: "low",
      title: d.item,
      projectId: d.project_id,
      projectName,
      detail: d.area ? `${d.area} — selection needed` : "Selection needed",
      href: `/projects/${d.project_id}/design`,
    });
  }

  const severityRank = { high: 0, medium: 1, low: 2 };
  return items.sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);
}
