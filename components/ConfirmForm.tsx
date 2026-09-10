"use client";

import SubmitButton from "@/components/SubmitButton";

export default function ConfirmForm({
  action,
  hiddenId,
  confirmText,
  pendingText,
  className,
  children,
}: {
  action: (formData: FormData) => Promise<void>;
  hiddenId: string;
  confirmText: string;
  pendingText: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(confirmText)) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={hiddenId} />
      <SubmitButton pendingText={pendingText} className={className}>
        {children}
      </SubmitButton>
    </form>
  );
}
