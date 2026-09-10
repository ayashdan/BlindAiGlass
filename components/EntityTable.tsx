"use client";

import { useState } from "react";
import StatusBadge from "@/components/StatusBadge";
import { formatCurrency, formatDate, formatNumber, toDateInputValue } from "@/lib/format";

export type FieldType = "text" | "textarea" | "number" | "currency" | "date" | "select";

export interface FieldOption {
  value: string;
  label: string;
}

export interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  options?: FieldOption[];
  readOnly?: boolean; // database-computed column: shown, never editable
  required?: boolean;
  placeholder?: string;
}

interface Row {
  id: string;
  [key: string]: unknown;
}

interface EntityTableProps {
  fields: FieldDef[];
  rows: Row[];
  projectId: string;
  createAction: (formData: FormData) => Promise<void>;
  updateAction: (formData: FormData) => Promise<void>;
  deleteAction: (formData: FormData) => Promise<void>;
  emptyLabel?: string;
  addLabel?: string;
}

function displayValue(field: FieldDef, row: Row): string {
  const value = row[field.key];
  if (field.type === "currency") return formatCurrency(Number(value ?? 0));
  if (field.type === "number") return value == null || value === "" ? "—" : formatNumber(Number(value), 2);
  if (field.type === "date") return formatDate(value as string | null);
  if (field.type === "select") {
    const opt = field.options?.find((o) => o.value === value);
    return opt?.label ?? String(value ?? "—");
  }
  return value ? String(value) : "—";
}

function EditableCell({ field, defaultValue, formId }: { field: FieldDef; defaultValue: unknown; formId: string }) {
  if (field.type === "select") {
    return (
      <select
        form={formId}
        name={field.key}
        defaultValue={String(defaultValue ?? field.options?.[0]?.value ?? "")}
        className="w-full min-w-[8rem] rounded-md border border-line bg-surface2 px-2 py-1.5 text-sm outline-none focus:border-brand"
      >
        {field.options?.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    );
  }
  if (field.type === "textarea") {
    return (
      <textarea
        form={formId}
        name={field.key}
        defaultValue={(defaultValue as string) ?? ""}
        rows={1}
        placeholder={field.placeholder}
        className="w-full min-w-[10rem] resize-y rounded-md border border-line bg-surface2 px-2 py-1.5 text-sm outline-none focus:border-brand"
      />
    );
  }
  const inputType = field.type === "currency" || field.type === "number" ? "number" : field.type;
  return (
    <input
      form={formId}
      name={field.key}
      type={inputType}
      step={field.type === "currency" || field.type === "number" ? "any" : undefined}
      required={field.required}
      placeholder={field.placeholder}
      defaultValue={
        field.type === "date" ? toDateInputValue(defaultValue as string) : ((defaultValue as string) ?? "")
      }
      className="w-full min-w-[7rem] rounded-md border border-line bg-surface2 px-2 py-1.5 text-sm outline-none focus:border-brand"
    />
  );
}

export default function EntityTable({
  fields,
  rows,
  projectId,
  createAction,
  updateAction,
  deleteAction,
  emptyLabel = "Nothing here yet.",
  addLabel = "Add row",
}: EntityTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [addKey, setAddKey] = useState(0);
  const addFormId = `add-form-${addKey}`;

  return (
    <div className="overflow-x-auto rounded-xl border border-line">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-line bg-surface2/60">
            {fields.map((f) => (
              <th key={f.key} className="whitespace-nowrap px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted">
                {f.label}
              </th>
            ))}
            <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-muted">
              &nbsp;
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && !adding && (
            <tr>
              <td colSpan={fields.length + 1} className="px-3 py-6 text-center text-sm text-muted">
                {emptyLabel}
              </td>
            </tr>
          )}

          {rows.map((row) => {
            const editing = editingId === row.id;
            const formId = `edit-form-${row.id}`;
            return (
              <tr key={row.id} className="border-b border-line last:border-0 hover:bg-surface2/30">
                {fields.map((field) => (
                  <td key={field.key} className="px-3 py-2 align-top">
                    {editing && !field.readOnly ? (
                      <EditableCell field={field} defaultValue={row[field.key]} formId={formId} />
                    ) : field.type === "select" ? (
                      <StatusBadge status={String(row[field.key])} label={displayValue(field, row)} />
                    ) : (
                      <span className={field.readOnly ? "text-muted" : ""}>{displayValue(field, row)}</span>
                    )}
                  </td>
                ))}
                <td className="whitespace-nowrap px-3 py-2 text-right align-top">
                  {editing ? (
                    <>
                      <input type="hidden" form={formId} name="id" value={row.id} />
                      <form
                        id={formId}
                        action={updateAction}
                        onSubmit={() => setEditingId(null)}
                        className="hidden"
                      />
                      <button
                        type="submit"
                        form={formId}
                        className="press rounded-md px-2 py-1 text-xs font-semibold text-brand hover:bg-brand/10"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="press rounded-md px-2 py-1 text-xs font-semibold text-muted hover:bg-surface2"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => setEditingId(row.id)}
                        className="press rounded-md px-2 py-1 text-xs font-semibold text-muted hover:bg-surface2 hover:text-fg"
                      >
                        Edit
                      </button>
                      <form
                        action={deleteAction}
                        className="inline"
                        onSubmit={(e) => {
                          if (!confirm("Delete this row?")) e.preventDefault();
                        }}
                      >
                        <input type="hidden" name="id" value={row.id} />
                        <button
                          type="submit"
                          className="press rounded-md px-2 py-1 text-xs font-semibold text-red-400 hover:bg-red-500/10"
                        >
                          Delete
                        </button>
                      </form>
                    </>
                  )}
                </td>
              </tr>
            );
          })}

          {adding && (
            <tr key={addKey} className="border-b border-line bg-surface2/20 last:border-0">
              {fields.map((field) => (
                <td key={field.key} className="px-3 py-2 align-top">
                  {field.readOnly ? (
                    <span className="text-xs text-muted">auto</span>
                  ) : (
                    <EditableCell field={field} defaultValue={undefined} formId={addFormId} />
                  )}
                </td>
              ))}
              <td className="whitespace-nowrap px-3 py-2 text-right align-top">
                <input type="hidden" form={addFormId} name="project_id" value={projectId} />
                <form
                  id={addFormId}
                  action={createAction}
                  onSubmit={() => {
                    setAdding(false);
                    setAddKey((k) => k + 1);
                  }}
                  className="hidden"
                />
                <button
                  type="submit"
                  form={addFormId}
                  className="press rounded-md px-2 py-1 text-xs font-semibold text-brand hover:bg-brand/10"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setAdding(false)}
                  className="press rounded-md px-2 py-1 text-xs font-semibold text-muted hover:bg-surface2"
                >
                  Cancel
                </button>
              </td>
            </tr>
          )}
        </tbody>
      </table>
      {!adding && (
        <div className="border-t border-line p-2">
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="press rounded-md px-3 py-1.5 text-sm font-semibold text-brand hover:bg-brand/10"
          >
            + {addLabel}
          </button>
        </div>
      )}
    </div>
  );
}
