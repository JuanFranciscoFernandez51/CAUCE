"use client";

import Link from "next/link";
import { useState } from "react";
import { ThemeToggle } from "@/components/theme";
import { ButtonLink } from "@/components/ui";
import { CauceMark } from "@/components/public/cauce-mark";

const NAV = [
  { href: "/#como-funciona", label: "Cómo funciona" },
  { href: "/precios", label: "Precios" },
  { href: "/casos", label: "Casos" },
  { href: "/consultoria", label: "Consultoría" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2.5 text-xl font-bold"
          onClick={() => setOpen(false)}
        >
          <CauceMark className="h-8 w-8" />
          <span className="font-display tracking-tight">Cauce</span>
        </Link>

        {/* Nav desktop */}
        <nav className="hidden items-center gap-6 md:flex" aria-label="Principal">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <ThemeToggle />
          <ButtonLink href="/login" variant="ghost" size="sm">
            Entrar
          </ButtonLink>
        </div>

        {/* Mobile: toggle */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={open}
            className="flex h-9 w-9 items-center justify-center rounded-md transition-colors hover:bg-muted"
          >
            <span aria-hidden className="text-lg leading-none">
              {open ? "✕" : "☰"}
            </span>
          </button>
        </div>
      </div>

      {/* Menú mobile */}
      {open ? (
        <nav
          className="border-t bg-background px-4 pb-4 pt-2 md:hidden"
          aria-label="Principal móvil"
        >
          <ul className="flex flex-col gap-1">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-md px-3 py-2 text-sm font-medium hover:bg-muted"
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li className="mt-2">
              <ButtonLink
                href="/login"
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => setOpen(false)}
              >
                Entrar
              </ButtonLink>
            </li>
          </ul>
        </nav>
      ) : null}
    </header>
  );
}
