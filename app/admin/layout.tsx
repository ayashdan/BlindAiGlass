import Link from "next/link";
import { requireAdmin } from "@/lib/admin";

const TABS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/waitlist", label: "Waitlist" },
  { href: "/admin/achievements", label: "Achievements" },
  { href: "/admin/settings", label: "Settings" },
];

// Every /admin/* page runs through this. requireAdmin() bounces anyone who
// isn't the founder's email straight to /login.
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-forge">
            Forge Admin
          </p>
          <h1 className="text-2xl font-black tracking-tight">Control room</h1>
        </div>
        <Link href="/dashboard" className="text-sm text-neutral-400 hover:text-neutral-200">
          ← Back to app
        </Link>
      </div>

      <nav className="mb-8 flex flex-wrap gap-2 border-b border-neutral-800 pb-4">
        {TABS.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className="rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-sm text-neutral-300 transition hover:border-forge hover:text-forge"
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {children}
    </div>
  );
}
