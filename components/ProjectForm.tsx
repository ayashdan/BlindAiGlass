import SubmitButton from "@/components/SubmitButton";
import { toDateInputValue } from "@/lib/format";
import { PROJECT_STATUS_LABEL, type Project } from "@/lib/types";

const inputClass =
  "w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm outline-none focus:border-brand";
const labelClass = "mb-1 block text-xs font-medium uppercase tracking-wide text-muted";

export default function ProjectForm({
  action,
  project,
  submitLabel,
}: {
  action: (formData: FormData) => Promise<void>;
  project?: Project;
  submitLabel: string;
}) {
  return (
    <form action={action} className="space-y-6">
      {project && <input type="hidden" name="id" value={project.id} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="name">
            Project name
          </label>
          <input
            id="name"
            name="name"
            required
            defaultValue={project?.name}
            placeholder="Wilson Master Bath Remodel"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="client_name">
            Client name
          </label>
          <input
            id="client_name"
            name="client_name"
            required
            defaultValue={project?.client_name}
            placeholder="Deanda & George Wilson"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="client_email">
            Client email
          </label>
          <input
            id="client_email"
            name="client_email"
            type="email"
            defaultValue={project?.client_email ?? ""}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="client_phone">
            Client phone
          </label>
          <input
            id="client_phone"
            name="client_phone"
            defaultValue={project?.client_phone ?? ""}
            className={inputClass}
          />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="address">
            Project address
          </label>
          <input
            id="address"
            name="address"
            defaultValue={project?.address ?? ""}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="project_type">
            Project type
          </label>
          <input
            id="project_type"
            name="project_type"
            placeholder="Master Bath Remodel"
            defaultValue={project?.project_type ?? ""}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="roc_number">
            ROC #
          </label>
          <input
            id="roc_number"
            name="roc_number"
            defaultValue={project?.roc_number ?? ""}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="status">
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={project?.status ?? "active"}
            className={inputClass}
          >
            {Object.entries(PROJECT_STATUS_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="contract_value">
            Contract value
          </label>
          <input
            id="contract_value"
            name="contract_value"
            type="number"
            step="any"
            min="0"
            defaultValue={project?.contract_value ?? ""}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="start_date">
            Start date
          </label>
          <input
            id="start_date"
            name="start_date"
            type="date"
            defaultValue={toDateInputValue(project?.start_date)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="target_completion_date">
            Target completion
          </label>
          <input
            id="target_completion_date"
            name="target_completion_date"
            type="date"
            defaultValue={toDateInputValue(project?.target_completion_date)}
            className={inputClass}
          />
        </div>
      </div>

      <SubmitButton
        pendingText="Saving…"
        className="press w-full rounded-lg bg-brand py-3 font-semibold text-white hover:bg-brand-soft sm:w-auto sm:px-8"
      >
        {submitLabel}
      </SubmitButton>
    </form>
  );
}
