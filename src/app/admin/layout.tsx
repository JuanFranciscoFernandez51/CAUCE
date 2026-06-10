import type { ReactNode } from "react";
import { auth } from "@/lib/auth";
import { n8nConfigured } from "@/lib/n8n";
import { AdminShell } from "./_components/admin-shell";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  // El middleware ya garantiza sesión ADMIN; acá solo leemos el nombre.
  const session = await auth();
  const adminName = session?.user?.name ?? "Admin";

  return (
    <AdminShell adminName={adminName} n8nConnected={n8nConfigured()}>
      {children}
    </AdminShell>
  );
}
