// SERVER-ONLY Supabase client using the service-role key. It bypasses Row
// Level Security, so it can read the private waitlist, delete users, and change
// settings. NEVER import this into a client component, and never expose the
// service-role key with a NEXT_PUBLIC_ name.
import { createClient } from "@supabase/supabase-js";

export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
