"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * El marco del panel de Jess, como su diseño: barra negra con el logo y la
 * hora, banda crema con lo próximo del día, y las pestañas negras con el
 * subrayado activo y el contador de eventos.
 */
const TINTA = "#141210";
const CREMA = "#EDE8DE";

export type TabJess = { label: string; href: string; badge?: number };

export function JessTopbar({
  logo,
  tabs,
  proximo,
  base,
}: {
  logo: string | null;
  tabs: TabJess[];
  proximo: { texto: string; href: string } | null;
  base: string;
}) {
  const pathname = usePathname();
  const [hora, setHora] = useState("");
  useEffect(() => {
    const f = () =>
      setHora(
        new Date()
          .toLocaleString("es-AR", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
          .toUpperCase()
      );
    f();
    const t = setInterval(f, 30000);
    return () => clearInterval(t);
  }, []);

  const activo = (href: string) =>
    href === base ? pathname === base : pathname === href || pathname.startsWith(href + "/");

  return (
    <div className="w-full">
      {/* Barra superior negra */}
      <div style={{ backgroundColor: TINTA, color: CREMA }}>
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-5 py-3">
          <Link href={base} className="flex items-center gap-3">
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo} alt="" className="h-10 w-auto" />
            ) : null}
            <span className="border-l pl-3" style={{ borderColor: "rgba(237,232,222,.25)" }}>
              <span className="block text-[15px] font-semibold tracking-[0.3em]">JESS</span>
              <span className="block text-[8px] tracking-[0.45em] opacity-70">DESIGN</span>
            </span>
          </Link>
          <div className="flex items-center gap-3 text-[11px] tracking-[0.14em]">
            <span className="hidden border px-4 py-2 opacity-80 sm:block" style={{ borderColor: "rgba(237,232,222,.3)" }}>
              GUARDADO
            </span>
            <span className="border px-4 py-2" style={{ borderColor: "rgba(237,232,222,.3)" }}>{hora}</span>
            <Link href={`${base}/salir`} prefetch={false} className="hidden" aria-hidden />
          </div>
        </div>
      </div>

      {/* Banda: lo próximo del día */}
      {proximo ? (
        <div style={{ backgroundColor: CREMA, color: "#3a352e" }}>
          <Link href={proximo.href} className="mx-auto flex max-w-[1400px] items-center justify-center gap-2 px-5 py-2 text-[12px] font-semibold tracking-[0.14em] transition hover:opacity-70">
            <span style={{ color: "#9E9387" }}>✦</span>
            {proximo.texto.toUpperCase()}
            <span className="ml-1 underline underline-offset-4">VER →</span>
          </Link>
        </div>
      ) : null}

      {/* Pestañas negras */}
      <nav style={{ backgroundColor: TINTA, color: CREMA }}>
        <div className="mx-auto flex max-w-[1400px] items-center gap-1 overflow-x-auto px-5">
          {tabs.map((t) => {
            const on = activo(t.href);
            return (
              <Link
                key={t.href}
                href={t.href}
                className="relative flex items-center gap-2 whitespace-nowrap px-4 py-4 text-[12px] font-semibold tracking-[0.16em] transition hover:opacity-80"
                style={{ opacity: on ? 1 : 0.65 }}
              >
                {t.label.toUpperCase()}
                {t.badge ? (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px]" style={{ backgroundColor: "#9E9387", color: TINTA }}>
                    {t.badge}
                  </span>
                ) : null}
                {on ? <span className="absolute inset-x-4 bottom-0 h-[2px]" style={{ backgroundColor: CREMA }} /> : null}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
