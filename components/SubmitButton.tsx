"use client";

// Every button on Forge is a plain `<form action={...}>` submit — a server
// round trip with zero visual feedback while it's in flight, which is why
// taps were reading as "slow." Wrapping the button in useFormStatus() (it
// reads the nearest parent <form>'s pending state) gives instant feedback
// the moment you tap, regardless of how long the server actually takes.
import { useFormStatus } from "react-dom";

export default function SubmitButton({
  children,
  pendingText,
  className = "",
}: {
  children: React.ReactNode;
  pendingText?: React.ReactNode;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={`${className} disabled:cursor-not-allowed disabled:opacity-50`}
    >
      {pending ? pendingText ?? "…" : children}
    </button>
  );
}
