// Domain types mirroring the Supabase schema (supabase/migrations/0001_bayran_schema.sql).

export type ProjectStatus = "active" | "on_hold" | "complete" | "cancelled";
export type TaskStatus = "not_started" | "in_progress" | "complete" | "blocked";
export type DesignStatus = "not_selected" | "selected" | "ordered" | "received";
export type MaterialStatus = "needed" | "ordered" | "backordered" | "delivered" | "installed";
export type SubStatus = "not_started" | "in_progress" | "complete";
export type PaymentStatus = "pending" | "invoiced" | "paid";
export type ChangeOrderStatus = "pending" | "approved" | "rejected";
export type TradeScopeStatus = "not_started" | "in_progress" | "complete";
export type Role = "admin" | "member";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: Role;
  created_at: string;
}

export interface Project {
  id: string;
  name: string;
  client_name: string;
  client_email: string | null;
  client_phone: string | null;
  address: string | null;
  project_type: string | null;
  roc_number: string | null;
  pm_id: string | null;
  status: ProjectStatus;
  start_date: string | null;
  target_completion_date: string | null;
  contract_value: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectFinancials {
  project_id: string;
  total_contract_value: number;
  approved_change_orders: number;
  pending_change_orders: number;
  adjusted_contract_value: number;
  received_from_client: number;
  balance_due_from_client: number;
  total_sub_contracts: number;
  paid_to_subs: number;
  balance_owed_to_subs: number;
  materials_cost: number;
  materials_charged_to_customer: number;
  materials_profit: number;
  est_job_margin: number;
  tasks_total: number;
  tasks_complete: number;
  materials_pending: number;
  design_items_pending: number;
}

export interface Task {
  id: string;
  project_id: string;
  title: string;
  category: string | null;
  assigned_to: string | null;
  start_date: string | null;
  due_date: string | null;
  status: TaskStatus;
  notes: string | null;
  created_at: string;
}

export interface DesignSelection {
  id: string;
  project_id: string;
  area: string | null;
  item: string;
  description: string | null;
  status: DesignStatus;
  selected_by: string | null;
  date_selected: string | null;
  notes: string | null;
  created_at: string;
}

export interface RoomMeasurement {
  id: string;
  project_id: string;
  area: string;
  width_ft: number | null;
  length_ft: number | null;
  height_ft: number | null;
  floor_sqft: number;
  perimeter_lf: number;
  wall_sqft: number;
  notes: string | null;
  created_at: string;
}

export interface Material {
  id: string;
  project_id: string;
  area: string | null;
  material: string;
  vendor: string | null;
  qty: number | null;
  unit: string | null;
  unit_cost: number | null;
  total_cost: number;
  status: MaterialStatus;
  order_date: string | null;
  po_number: string | null;
  charged_to_customer: number;
  materials_profit: number;
  notes: string | null;
  created_at: string;
}

export interface Subcontractor {
  id: string;
  project_id: string;
  trade: string | null;
  company: string;
  contact: string | null;
  contract_amount: number;
  amount_paid: number;
  balance_due: number;
  last_payment_date: string | null;
  status: SubStatus;
  notes: string | null;
  created_at: string;
}

export interface CustomerPayment {
  id: string;
  project_id: string;
  payment_number: number | null;
  description: string | null;
  amount_due: number;
  amount_received: number;
  balance_remaining: number;
  date_received: string | null;
  payment_method: string | null;
  status: PaymentStatus;
  notes: string | null;
  created_at: string;
}

export interface ChangeOrder {
  id: string;
  project_id: string;
  co_number: number | null;
  description: string;
  date_submitted: string | null;
  date_approved: string | null;
  amount: number;
  status: ChangeOrderStatus;
  amount_received: number;
  balance_remaining: number;
  notes: string | null;
  created_at: string;
}

export interface TradeScopeItem {
  id: string;
  project_id: string;
  trade: string;
  scope_item: string | null;
  description: string | null;
  status: TradeScopeStatus;
  assigned_sub: string | null;
  start_date: string | null;
  complete_date: string | null;
  notes: string | null;
  created_at: string;
}

export const PROJECT_STATUS_LABEL: Record<ProjectStatus, string> = {
  active: "Active",
  on_hold: "On Hold",
  complete: "Complete",
  cancelled: "Cancelled",
};

export const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
  not_started: "Not Started",
  in_progress: "In Progress",
  complete: "Complete",
  blocked: "Blocked",
};

export const DESIGN_STATUS_LABEL: Record<DesignStatus, string> = {
  not_selected: "Not Selected",
  selected: "Selected",
  ordered: "Ordered",
  received: "Received",
};

export const MATERIAL_STATUS_LABEL: Record<MaterialStatus, string> = {
  needed: "Needed",
  ordered: "Ordered",
  backordered: "Backordered",
  delivered: "Delivered",
  installed: "Installed",
};

export const SUB_STATUS_LABEL: Record<SubStatus, string> = {
  not_started: "Not Started",
  in_progress: "In Progress",
  complete: "Complete",
};

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  pending: "Pending",
  invoiced: "Invoiced",
  paid: "Paid",
};

export const CHANGE_ORDER_STATUS_LABEL: Record<ChangeOrderStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

export const TRADE_SCOPE_STATUS_LABEL: Record<TradeScopeStatus, string> = {
  not_started: "Not Started",
  in_progress: "In Progress",
  complete: "Complete",
};
