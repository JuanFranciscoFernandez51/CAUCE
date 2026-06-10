import type { ReactNode } from "react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { n8nConfigured } from "@/lib/n8n";
import { AdminShell } from "./_components/admin-shell";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  // El middleware ya garantiza sesión ADMIN; acá solo leemos el nombre.
  const session = await auth();
  const adminName = session?.user?.name ?? "Admin";
  const newLeads = await db.lead.count({ where: { status: "NEW" } }).catch(() => 0);

  return (
    <AdminShell adminName={adminName} n8nConnected={n8nConfigured()} newLeads={newLeads}>
      {children}
    </AdminShell>
  );
}
