"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { ThemeToggle } from "@/components/theme";

export type NavItem = { label: string; href: string; icon: string; exact?: boolean };
export type NavGroup = { label: string; icon: string; items: NavItem[] };
export type NavEntry = NavItem | NavGroup;

function isGroup(e: NavEntry): e is NavGroup {
  return "items" in e;
}

function useActive() {
  const pathname = usePathname();
  return (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Navegación del Cauce OS del cliente: vertical (izquierda) u horizontal
 * (arriba), según el estilo elegido por el tenant. Usa SIEMPRE los colores
 * de la marca (tokens aplicados por el layout).
 */
export function OsSidebar({
  displayName,
  logo,
  initial,
  nav,
  posicion = "izquierda",
}: {
  displayName: string;
  logo: string | null;
  initial: string;
  nav: NavEntry[];
  posicion?: "izquierda" | "arriba";
}) {
  const [open, setOpen] = useState(false); // drawer en mobile
  const active = useActive();

  const brand = (
    <div className="flex items-center gap-2.5 px-3 py-4">
      {logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logo} alt={displayName} className="h-9 w-9 rounded-full border object-cover" />
      ) : (
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
          {initial}
        </span>
      )}
      <span className="min-w-0 truncate text-base font-semibold">{displayName}</span>
    </div>
  );

  const link = (it: NavItem) => {
    const on = active(it.href, it.exact);
    return (
      <Link
        key={it.href}
        href={it.href}
        onClick={() => setOpen(false)}
        className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
          on
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:bg-primary-soft hover:text-foreground"
        }`}
      >
        <span className="w-5 shrink-0 text-center" aria-hidden>
          {it.icon}
        </span>
        <span className="truncate">{it.label}</span>
      </Link>
    );
  };

  const navContent = (
    <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2">
      {nav.map((e) =>
        isGroup(e) ? (
          <div key={e.label} className="mt-3">
            <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              <span className="mr-1.5" aria-hidden>
                {e.icon}
              </span>
              {e.label}
            </p>
            <div className="flex flex-col gap-0.5">{e.items.map(link)}</div>
          </div>
        ) : (
          link(e)
        )
      )}
    </nav>
  );

  const footer = (
    <div className="mt-auto flex items-center justify-between gap-2 border-t px-3 py-3">
      <ThemeToggle />
      <button
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="rounded-md px-2.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        Salir
      </button>
    </div>
  );

  return (
    <>
      {/* Topbar solo en mobile: marca + hamburguesa */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b bg-card/95 px-3 py-2 backdrop-blur lg:hidden">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
            {initial}
          </span>
          <span className="truncate text-sm font-semibold">{displayName}</span>
        </div>
        <button
          onClick={() => setOpen((v) => !v)}
          aria-label="Abrir menú"
          className="flex h-9 w-9 items-center justify-center rounded-md border bg-card text-lg"
        >
          {open ? "✕" : "☰"}
        </button>
      </div>

      {/* Desktop: sidebar a la izquierda o barra horizontal arriba */}
      {posicion === "arriba" ? (
        <header className="sticky top-0 z-30 hidden border-b bg-card lg:block">
          <div className="mx-auto flex max-w-6xl items-center gap-4 px-4">
            <div className="flex shrink-0 items-center gap-2 py-2.5">
              {logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logo} alt={displayName} className="h-8 w-8 rounded-full border object-cover" />
              ) : (
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {initial}
                </span>
              )}
              <span className="max-w-40 truncate text-sm font-semibold">{displayName}</span>
            </div>
            <nav className="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto py-1.5">
              {nav
                .flatMap((e) => (isGroup(e) ? e.items : [e]))
                .map((it) => {
                  const on = active(it.href, it.exact);
                  return (
                    <Link
                      key={it.href}
                      href={it.href}
                      className={`flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors ${
                        on
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:bg-primary-soft hover:text-foreground"
                      }`}
                    >
                      <span aria-hidden>{it.icon}</span>
                      <span>{it.label}</span>
                    </Link>
                  );
                })}
            </nav>
            <div className="flex shrink-0 items-center gap-1.5">
              <ThemeToggle />
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="rounded-md px-2.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                Salir
              </button>
            </div>
          </div>
        </header>
      ) : (
        <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r bg-card lg:flex">
          {brand}
          {navContent}
          {footer}
        </aside>
      )}

      {/* Drawer en mobile */}
      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 flex h-full w-64 flex-col border-r bg-card">
            {brand}
            {navContent}
            {footer}
          </aside>
        </div>
      ) : null}
    </>
  );
}
