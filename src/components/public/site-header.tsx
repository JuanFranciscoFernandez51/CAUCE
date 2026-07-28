"use client";

import Link from "next/link";
import { useState } from "react";
import { CauceMark } from "@/components/public/cauce-mark";

const NAV = [
  { href: "/#como-funciona", label: "Cómo funciona" },
  { href: "/precios", label: "Precios" },
  { href: "/casos", label: "Casos" },
  { href: "/consultoria", label: "Consultoría" },
] as const;

/** Header flotante tipo píldora (estética menta): sticky, redondeado, sombra suave. */
export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <div className="sticky top-0 z-40 px-3 pt-3 sm:px-4 sm:pt-4">
      <header className="mx-auto max-w-5xl rounded-[28px] border border-black/5 bg-white/90 shadow-[0_10px_36px_-12px_rgba(17,17,17,0.18)] backdrop-blur-md">
        <div className="flex h-14 items-center justify-between gap-3 pl-4 pr-2.5">
          <Link
            href="/"
            className="flex items-center gap-2.5 text-lg font-bold"
            onClick={() => setOpen(false)}
          >
            <CauceMark className="h-8 w-8" />
            <span className="font-display tracking-tight">Cauce</span>
          </Link>

          {/* Nav desktop */}
          <nav className="hidden items-center gap-1 md:flex" aria-label="Principal">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-black/5 hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex">
            <Link
              href="/login"
              className="inline-flex h-9 items-center rounded-full bg-[#111111] px-5 text-sm font-medium text-white transition hover:bg-black"
            >
              Entrar
            </Link>
          </div>

          {/* Mobile: toggle */}
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={open}
            className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-black/5 md:hidden"
          >
            <span aria-hidden className="text-lg leading-none">
              {open ? "✕" : "☰"}
            </span>
          </button>
        </div>
      </header>

      {/* Menú mobile: tarjeta flotante */}
      {open ? (
        <nav
          className="mx-auto mt-2 max-w-5xl rounded-3xl border border-black/5 bg-white p-3 shadow-[0_18px_50px_-16px_rgba(17,17,17,0.25)] md:hidden"
          aria-label="Principal móvil"
        >
          <ul className="flex flex-col gap-1">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-2xl px-4 py-2.5 text-sm font-medium hover:bg-black/5"
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li className="mt-1">
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="flex h-11 items-center justify-center rounded-full bg-[#111111] text-sm font-medium text-white"
              >
                Entrar
              </Link>
            </li>
          </ul>
        </nav>
      ) : null}
    </div>
  );
}
