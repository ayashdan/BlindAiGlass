"use client";

// Supabase invite/reset-password links hand back a session as a URL
// fragment (#access_token=...) rather than a ?code= query param — but our
// browser client is configured for PKCE flow, which only ever looks for
// ?code= and ignores fragments. So auto-detection never fires here; we
// have to parse the fragment ourselves and set the session directly.
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

    async function run() {
      const hash = window.location.hash.startsWith("#")
        ? window.location.hash.slice(1)
        : "";
      const hashParams = new URLSearchParams(hash);
      const access_token = hashParams.get("access_token");
      const refresh_token = hashParams.get("refresh_token");

      if (access_token && refresh_token) {
        const { error } = await supabase.auth.setSession({ access_token, refresh_token });
        if (!error) {
          router.replace(next);
          return;
        }
      }

      const code = searchParams.get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
          router.replace(next);
          return;
        }
      }

      const { data } = await supabase.auth.getSession();
      if (data.session) {
        router.replace(next);
        return;
      }

      setError(true);
    }

    run();
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
