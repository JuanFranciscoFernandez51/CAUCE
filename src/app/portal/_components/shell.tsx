"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { ThemeToggle } from "@/components/theme";
import { Button } from "@/components/ui";

const NAV = [
  { href: "/portal", label: "Inicio" },
  { href: "/portal/contenido", label: "Contenido del bot" },
  { href: "/portal/canal", label: "Canal" },
  { href: "/portal/uso", label: "Uso" },
  { href: "/portal/reportes", label: "Reportes" },
  { href: "/portal/facturacion", label: "Facturación" },
  { href: "/portal/pedir-mas", label: "Pedir más" },
] as const;

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <>
      {NAV.map((item) => {
        const active =
          item.href === "/portal"
            ? pathname === "/portal"
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={
              "rounded-md px-3 py-2 text-sm font-medium transition-colors " +
              (active
                ? "bg-primary-soft text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground")
            }
          >
            {item.label}
          </Link>
        );
      })}
    </>
  );
}

export function PortalShell({
  clientName,
  children,
}: {
  clientName: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4">
          <div className="flex min-w-0 items-center gap-3">
            <Link href="/portal" className="shrink-0 text-xl font-bold text-primary">
              Cauce
            </Link>
            <span className="hidden text-muted-foreground sm:inline">·</span>
            <span className="truncate text-sm font-medium sm:text-base">{clientName}</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="sm"
              className="hidden sm:inline-flex"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              Salir
            </Button>
            <button
              className="flex h-9 w-9 items-center justify-center rounded-md border bg-card lg:hidden"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? "Cerrar menú" : "Abrir menú"}
              aria-expanded={open}
            >
              {open ? "✕" : "☰"}
            </button>
          </div>
        </div>
        {/* Nav desktop */}
        <nav className="mx-auto hidden max-w-6xl items-center gap-1 px-4 pb-2 lg:flex">
          <NavLinks />
        </nav>
        {/* Nav mobile colapsable */}
        {open ? (
          <nav className="flex flex-col gap-1 border-t px-4 py-3 lg:hidden">
            <NavLinks onNavigate={() => setOpen(false)} />
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="rounded-md px-3 py-2 text-left text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              Salir
            </button>
          </nav>
        ) : null}
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 sm:py-8">{children}</main>
    </div>
  );
}
