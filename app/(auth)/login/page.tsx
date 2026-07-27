import Link from "next/link";
import { signIn } from "../actions";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <h1 className="mb-1 text-3xl font-black tracking-tight">
        Welcome back to <span className="text-forge">Forge</span>
      </h1>
      <p className="mb-8 text-neutral-400">Log in to continue your streak.</p>

      {searchParams.error && (
        <p className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {searchParams.error}
        </p>
      )}

      <form action={signIn} className="space-y-4">
        <input
          type="email"
          name="email"
          required
          placeholder="Email"
          className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-3 outline-none focus:border-forge"
        />
        <input
          type="password"
          name="password"
          required
          placeholder="Password"
          className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-3 outline-none focus:border-forge"
        />
        <button
          type="submit"
          className="w-full rounded-lg bg-forge py-3 font-bold text-neutral-950 transition hover:bg-forge-soft"
        >
          Log in
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-neutral-400">
        New here?{" "}
        <Link href="/signup" className="font-semibold text-forge">
          Create an account
        </Link>
      </p>
    </main>
  );
}
