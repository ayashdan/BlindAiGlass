import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import GoogleSignInButton from "@/components/GoogleSignInButton";

export default async function LandingPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 text-center">
      <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand text-2xl font-black text-white">
        BR
      </div>
      <h1 className="mb-2 text-4xl font-black tracking-tight">
        Bay<span className="text-brand">Ran</span>
      </h1>
      <p className="mb-10 text-muted">
        Run every job from one place — schedules, selections, materials, subs,
        and payments, across every active project.
      </p>

      {searchParams.error && (
        <p className="mb-6 w-full rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {searchParams.error}
        </p>
      )}

      <GoogleSignInButton className="w-full" />

      <p className="mt-8 text-xs text-muted">
        Sign in with your company Google account to access your projects.
      </p>
    </main>
  );
}
