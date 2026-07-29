"use client";

import Link from "next/link";
import { useState } from "react";
import { CauceMark } from "@/components/public/cauce-mark";
import { LangButton, ThemeButton, useLang } from "@/components/public/site-controls";
import { t } from "@/lib/i18n";

const NAV = [
  { href: "/#como-funciona", clave: "nav.como" },
  { href: "/precios", clave: "nav.precios" },
  { href: "/casos", clave: "nav.casos" },
  { href: "/consultoria", clave: "nav.consultoria" },
] as const;

/** Header flotante tipo píldora (estética menta): sticky, redondeado, sombra suave. */
export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const lang = useLang();

  return (
    <div className="sticky top-0 z-40 px-3 pt-3 sm:px-4 sm:pt-4">
      <header className="mx-auto max-w-5xl rounded-[28px] border border-black/5 bg-white/90 shadow-[0_10px_36px_-12px_rgba(17,17,17,0.18)] backdrop-blur-md dark:border-white/10 dark:bg-[#101319]/90 dark:shadow-[0_10px_36px_-12px_rgba(0,0,0,0.6)]">
        <div className="flex h-14 items-center justify-between gap-3 pl-4 pr-2.5">
          <Link href="/" className="flex items-center gap-2.5 text-lg font-bold" onClick={() => setOpen(false)}>
            <CauceMark className="h-8 w-8" />
            <span className="font-display tracking-tight">Cauce</span>
          </Link>

          {/* Nav desktop */}
          <nav className="hidden items-center gap-1 md:flex" aria-label={t(lang, "nav.principal")}>
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-black/5 hover:text-foreground dark:hover:bg-white/10"
              >
                {t(lang, item.clave)}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1">
            {/* Idioma y tema: siempre visibles, también en celular */}
            <LangButton />
            <ThemeButton />

            <div className="hidden md:flex">
              <Link
                href="/login"
                className="ml-1 inline-flex h-9 items-center rounded-full bg-[#111111] px-5 text-sm font-medium text-white transition hover:bg-black dark:bg-white dark:text-[#111111] dark:hover:bg-white/90"
              >
                {t(lang, "nav.entrar")}
              </Link>
            </div>

            {/* Mobile: menú */}
            <button
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? t(lang, "nav.cerrar") : t(lang, "nav.abrir")}
              aria-expanded={open}
              className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-black/5 dark:hover:bg-white/10 md:hidden"
            >
              <span aria-hidden className="text-lg leading-none">{open ? "✕" : "☰"}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Menú mobile: tarjeta flotante */}
      {open ? (
        <nav
          className="mx-auto mt-2 max-w-5xl rounded-3xl border border-black/5 bg-white p-3 shadow-[0_18px_50px_-16px_rgba(17,17,17,0.25)] dark:border-white/10 dark:bg-[#101319] md:hidden"
          aria-label={t(lang, "nav.principal")}
        >
          <ul className="flex flex-col gap-1">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-2xl px-4 py-2.5 text-sm font-medium hover:bg-black/5 dark:hover:bg-white/10"
                >
                  {t(lang, item.clave)}
                </Link>
              </li>
            ))}
            <li className="mt-1">
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="flex h-11 items-center justify-center rounded-full bg-[#111111] text-sm font-medium text-white dark:bg-white dark:text-[#111111]"
              >
                {t(lang, "nav.entrar")}
              </Link>
            </li>
          </ul>
        </nav>
      ) : null}
    </div>
  );
}
