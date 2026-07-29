import Link from "next/link";
import { signUp } from "../actions";

export default function SignupPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <h1 className="mb-1 text-3xl font-black tracking-tight">
        Join <span className="text-forge">Forge</span>
      </h1>
      <p className="mb-8 text-muted">Create your account and start at Level 1.</p>

      {searchParams.error && (
        <p className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {searchParams.error}
        </p>
      )}

      <form action={signUp} className="space-y-4">
        <input
          type="text"
          name="username"
          required
          placeholder="Username"
          className="w-full rounded-lg border border-line bg-surface px-4 py-3 outline-none focus:border-forge"
        />
        <input
          type="email"
          name="email"
          required
          placeholder="Email"
          className="w-full rounded-lg border border-line bg-surface px-4 py-3 outline-none focus:border-forge"
        />
        <input
          type="password"
          name="password"
          required
          placeholder="Password (min 6 characters)"
          className="w-full rounded-lg border border-line bg-surface px-4 py-3 outline-none focus:border-forge"
        />
        <button
          type="submit"
          className="w-full rounded-lg bg-forge py-3 font-bold text-neutral-950 transition hover:bg-forge-soft"
        >
          Create account
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-forge">
          Log in
        </Link>
      </p>
    </main>
  );
}
