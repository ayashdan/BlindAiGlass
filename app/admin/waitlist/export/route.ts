import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";

// Downloads the whole waitlist as a CSV. Admin-only.
export async function GET() {
  await requireAdmin();

  const admin = createAdminClient();
  const { data } = await admin
    .from("waitlist")
    .select("email, name, referral_count, created_at")
    .order("created_at", { ascending: true });

  const rows = (data ?? []) as any[];
  const escape = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = [
    "email,name,referral_count,created_at",
    ...rows.map((r) =>
      [escape(r.email), escape(r.name), r.referral_count, escape(r.created_at)].join(",")
    ),
  ].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="forge-waitlist.csv"',
    },
  });
}
