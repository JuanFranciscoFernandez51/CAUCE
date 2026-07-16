"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState, type ReactNode } from "react";
import { ThemeToggle } from "@/components/theme";
import { Badge, Button } from "@/components/ui";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: "📊" },
  { href: "/admin/pipeline", label: "Pipeline", icon: "🛠️" },
  { href: "/admin/leads", label: "Leads", icon: "🎯" },
  { href: "/admin/clientes", label: "Clientes", icon: "🏢" },
  { href: "/admin/consultorias", label: "Consultorías", icon: "🗓️" },
  { href: "/admin/pricing", label: "Presupuestos", icon: "💵" },
  { href: "/admin/propuestas", label: "Propuestas", icon: "📨" },
  { href: "/admin/estilos", label: "Estilos", icon: "🎨" },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLinks({ pathname, onNavigate, newLeads }: { pathname: string; onNavigate?: () => void; newLeads?: number }) {
  return (
    <nav className="flex flex-col gap-1">
      {NAV.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              active
                ? "bg-primary-soft text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <span aria-hidden>{item.icon}</span>
            {item.label}
            {item.href === "/admin/leads" && newLeads ? (
              <span className="ml-auto rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-accent-foreground">
                {newLeads}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminShell({
  adminName,
  newLeads = 0,
  children,
}: {
  adminName: string;
  newLeads?: number;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const userBlock = (
    <div className="flex flex-col gap-3 border-t pt-4">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{adminName}</p>
          <p className="text-xs text-muted-foreground">Admin</p>
        </div>
        <ThemeToggle />
      </div>
      <div className="flex gap-2">
        <Link
          href="/admin/cuenta"
          className="flex-1 rounded-md border bg-card px-3 py-1.5 text-center text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          Mi cuenta
        </Link>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          Salir
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh bg-background text-foreground">
      {/* Sidebar desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col gap-4 border-r bg-card p-4 lg:flex">
        <Link href="/admin" className="flex items-center gap-2 px-2 py-1">
          <span className="text-xl">🌊</span>
          <span className="text-lg font-bold tracking-tight">Cauce</span>
          <span className="text-xs font-medium text-muted-foreground">admin</span>
        </Link>
        <div className="flex-1 overflow-y-auto">
          <NavLinks pathname={pathname} newLeads={newLeads} />
        </div>
        {userBlock}
      </aside>

      {/* Topbar mobile */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-2 border-b bg-card px-4 py-3 lg:hidden">
        <Link href="/admin" className="flex items-center gap-2">
          <span className="text-xl">🌊</span>
          <span className="font-bold">Cauce admin</span>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={menuOpen}
            className="flex h-9 w-9 items-center justify-center rounded-md border bg-card text-lg hover:bg-muted"
          >
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>
      </header>
      {menuOpen ? (
        <div className="border-b bg-card p-4 lg:hidden">
          <NavLinks pathname={pathname} newLeads={newLeads} onNavigate={() => setMenuOpen(false)} />
          <div className="mt-4 flex items-center justify-between gap-3 border-t pt-4">
            <div>
              <p className="text-sm font-medium">{adminName}</p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              Salir
            </Button>
          </div>
        </div>
      ) : null}

      <main className="px-4 py-6 lg:ml-60 lg:px-8">{children}</main>
    </div>
  );
}
