"use client";

// Supabase invite/reset-password links hand back a session as a URL
// fragment (#access_token=...) rather than a query param — fragments never
// reach the server, so this HAS to run in the browser. The Supabase client
// auto-detects and consumes that fragment (or a ?code= param) on load; we
// just wait for the resulting session and then move on to the dashboard.
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    const next = searchParams.get("next") || "/dashboard";

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) router.replace(next);
    });

    // In case a session already exists by the time this mounts (or the
    // fragment never had one to begin with).
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace(next);
    });

    const timeout = setTimeout(() => setError(true), 6000);

    return () => {
      subscription.subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [router, searchParams]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
      {error ? (
        <>
          <p className="text-fg">That link is invalid or expired.</p>
          <a href="/login" className="text-sm font-semibold text-forge">
            Go to login
          </a>
        </>
      ) : (
        <p className="text-muted">Signing you in…</p>
      )}
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div className="min-h-[60vh]" />}>
      <AuthCallback />
    </Suspense>
  );
}
