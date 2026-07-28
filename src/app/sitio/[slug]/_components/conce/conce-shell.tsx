"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import type { ConceShellInfo } from "../../_lib/conce-site";
import { Chatbot } from "./chatbot";
import {
  IconWhatsapp,
  IconInstagram,
  IconFacebook,
  IconPin,
  IconReloj,
  IconCheck,
  IconMail,
  IconAuto,
} from "./iconos";

/**
 * Shell del template CONCESIONARIA (Ri Cars Automotores): la marca del
 * cliente (negro + dorado sobre claro, Inter) con los acabados premium del
 * rediseño Menta — header píldora sticky, mega-tarjetas redondeadas, aire.
 * Header con nav 0KM/Usados, footer negro completo (2 sucursales, WhatsApps,
 * horarios, redes), WhatsApp flotante (izq) y chatbot "¿Qué auto es para
 * vos?" flotante (der).
 */

// Paleta del template: vive en lib/conce (módulo compartido) para que también
// los server components reciban los valores reales — los SERVER components
// deben importarla de "@/lib/conce" (importar desde este módulo client les
// daría una client reference y los estilos inline se pierden en silencio).
import { RC } from "@/lib/conce";
export { RC };

export function ConceShell({ info, children }: { info: ConceShellInfo; children: ReactNode }) {
  const wa = info.whatsapp ? `https://wa.me/${info.whatsapp}` : null;

  return (
    <div
      className="flex min-h-screen flex-col"
      style={{
        backgroundColor: RC.fondo,
        color: "#111111",
        fontFamily:
          "Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif",
      }}
    >
      <Header info={info} />
      <main className="flex-1">{children}</main>
      <Footer info={info} />
      {wa ? (
        <a
          href={wa}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Escribinos por WhatsApp"
          className="fixed bottom-5 left-5 z-40 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-[0_10px_30px_-6px_rgba(37,211,102,0.6)] transition-transform hover:scale-105"
          style={{ backgroundColor: "#25D366" }}
        >
          <IconWhatsapp className="h-7 w-7" />
        </a>
      ) : null}
      {info.instagram ? (
        <a
          href={info.instagram}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Seguinos en Instagram"
          className="fixed bottom-[86px] left-5 z-40 flex h-12 w-12 items-center justify-center rounded-full text-white shadow-[0_10px_30px_-8px_rgba(193,53,132,0.65)] transition-transform hover:scale-105"
          style={{ background: "linear-gradient(45deg,#F58529,#DD2A7B,#8134AF)" }}
        >
          <IconInstagram className="h-6 w-6" />
        </a>
      ) : null}
      <Chatbot slug={info.slug} />
    </div>
  );
}

// ── Header píldora sticky ─────────────────────────────────────────────────

function Header({ info }: { info: ConceShellInfo }) {
  const base = `/sitio/${info.slug}`;
  const pathname = usePathname();
  const [menuAbierto, setMenuAbierto] = useState(false);

  const links = [
    { href: base, label: "Inicio", exact: true },
    { href: `${base}/catalogo?condicion=0km`, label: "0KM" },
    { href: `${base}/catalogo?condicion=usado`, label: "Usados" },
    { href: `${base}/catalogo`, label: "Catálogo" },
    { href: `${base}/nosotros`, label: "Nosotros" },
    { href: `${base}/blog`, label: "Blog" },
    { href: `${base}/contacto`, label: "Contacto" },
  ];

  const activo = (href: string, exact?: boolean) => {
    const path = href.split("?")[0];
    if (exact) return pathname === path;
    return href.includes("?") ? false : pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-40 px-3 pt-3">
      <div
        className="mx-auto flex max-w-6xl items-center gap-2 rounded-full px-4 py-2.5 shadow-lg backdrop-blur"
        style={{ backgroundColor: "rgba(10,10,10,0.94)" }}
      >
        <Link href={base} className="flex shrink-0 items-center gap-2.5">
          {info.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={info.logo}
              alt={info.nombre}
              className="h-10 w-10 rounded-full bg-white object-contain"
            />
          ) : (
            <IconAuto className="h-8 w-8 text-white" />
          )}
          <span className="hidden flex-col leading-tight md:flex">
            <span className="text-sm font-bold tracking-wide text-white">{info.nombre}</span>
            {info.eslogan ? (
              <span className="text-[11px] font-medium" style={{ color: RC.dorado }}>
                {info.eslogan}
              </span>
            ) : null}
          </span>
        </Link>

        <nav className="mx-auto hidden items-center gap-0.5 lg:flex">
          {links.map((l) => (
            <Link
              key={l.label}
              href={l.href}
              className="rounded-full px-3 py-1.5 text-[13.5px] font-medium transition-colors"
              style={
                activo(l.href, l.exact)
                  ? { backgroundColor: RC.dorado, color: "#0A0A0A" }
                  : { color: "#E5E5E5" }
              }
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          <Link
            href={`${base}/favoritos`}
            aria-label="Favoritos"
            className="hidden rounded-full p-2 text-white/70 transition-colors hover:text-white sm:block"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" aria-hidden>
              <path d="M12 20s-7-4.6-7-9.3A3.9 3.9 0 0 1 12 8a3.9 3.9 0 0 1 7 2.7c0 4.7-7 9.3-7 9.3Z" strokeLinejoin="round" />
            </svg>
          </Link>
          {info.instagram ? (
            <a
              href={info.instagram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="hidden rounded-full p-2 text-white/70 transition-colors hover:text-white sm:block"
            >
              <IconInstagram />
            </a>
          ) : null}
          {info.whatsapp ? (
            <a
              href={`https://wa.me/${info.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden items-center gap-2 rounded-full px-4 py-2 text-[13px] font-bold transition-transform hover:scale-[1.03] sm:inline-flex"
              style={{ backgroundColor: RC.dorado, color: "#0A0A0A" }}
            >
              <IconWhatsapp className="h-4 w-4" />
              Escribinos
            </a>
          ) : null}
          <button
            type="button"
            aria-label="Menú"
            onClick={() => setMenuAbierto((v) => !v)}
            className="rounded-full px-2.5 py-1.5 text-xl text-white lg:hidden"
          >
            {menuAbierto ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {/* Menú mobile */}
      {menuAbierto ? (
        <div
          className="mx-auto mt-2 max-w-6xl rounded-3xl p-4 shadow-xl lg:hidden"
          style={{ backgroundColor: "rgba(10,10,10,0.97)" }}
        >
          <div className="flex flex-wrap gap-2">
            {links.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                onClick={() => setMenuAbierto(false)}
                className="rounded-full border px-4 py-2 text-sm font-medium text-white"
                style={{ borderColor: "rgba(255,255,255,0.2)" }}
              >
                {l.label}
              </Link>
            ))}
            {info.whatsapp ? (
              <a
                href={`https://wa.me/${info.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold"
                style={{ backgroundColor: RC.dorado, color: "#0A0A0A" }}
              >
                <IconWhatsapp className="h-4 w-4" />
                WhatsApp
              </a>
            ) : null}
          </div>
        </div>
      ) : null}
    </header>
  );
}

// ── Footer negro completo ─────────────────────────────────────────────────

function Footer({ info }: { info: ConceShellInfo }) {
  const base = `/sitio/${info.slug}`;
  return (
    <footer className="mt-16" style={{ backgroundColor: RC.negro }}>
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-3">
            {info.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={info.logo}
                alt={info.nombre}
                className="h-12 w-12 rounded-full bg-white object-contain"
              />
            ) : (
              <IconAuto className="h-10 w-10 text-white" />
            )}
            <div>
              <p className="font-bold text-white">{info.nombre}</p>
              {info.eslogan ? (
                <p className="text-xs" style={{ color: RC.dorado }}>
                  {info.eslogan}
                </p>
              ) : null}
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-1.5 text-sm text-gray-400">
            {info.instagram ? (
              <a
                href={`https://instagram.com/${info.instagram}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white"
              >
                📷 @{info.instagram}
              </a>
            ) : null}
            {info.facebook ? (
              <a
                href={info.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white"
              >
                👍 Facebook
              </a>
            ) : null}
            {info.mercadolibre ? (
              <a
                href={info.mercadolibre}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white"
              >
                🛒 Tienda en Mercado Libre
              </a>
            ) : null}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold uppercase tracking-wide" style={{ color: RC.dorado }}>
            Navegación
          </h3>
          <ul className="mt-3 space-y-2 text-sm text-gray-400">
            <li><Link href={`${base}/catalogo?condicion=0km`} className="hover:text-white">Vehículos 0KM</Link></li>
            <li><Link href={`${base}/catalogo?condicion=usado`} className="hover:text-white">Vehículos usados</Link></li>
            <li><Link href={`${base}/catalogo`} className="hover:text-white">Catálogo completo</Link></li>
            <li><Link href={`${base}/nosotros`} className="hover:text-white">Nosotros</Link></li>
            <li><Link href={`${base}/blog`} className="hover:text-white">Blog</Link></li>
            <li><Link href={`${base}/contacto`} className="hover:text-white">Contacto</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-bold uppercase tracking-wide" style={{ color: RC.dorado }}>
            Sucursales
          </h3>
          <ul className="mt-3 space-y-3 text-sm text-gray-400">
            {info.sucursales.map((s, i) => (
              <li key={i}>
                <p className="flex items-start gap-2 text-gray-300"><IconPin className="mt-0.5 h-4 w-4 shrink-0" style={{ color: RC.dorado }} />{s.direccion}</p>
                <div className="mt-0.5 flex gap-3 text-xs">
                  {s.maps ? (
                    <a href={s.maps} target="_blank" rel="noopener noreferrer" className="hover:text-white" style={{ color: RC.doradoTexto }}>
                      Cómo llegar →
                    </a>
                  ) : null}
                  {s.whatsapp ? (
                    <a
                      href={`https://wa.me/${s.whatsapp}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-white"
                      style={{ color: RC.doradoTexto }}
                    >
                      WhatsApp →
                    </a>
                  ) : null}
                </div>
              </li>
            ))}
            {info.horarios ? (
              <li className="flex items-start gap-2 whitespace-pre-line text-gray-300"><IconReloj className="mt-0.5 h-4 w-4 shrink-0" style={{ color: RC.dorado }} />{info.horarios}</li>
            ) : null}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-bold uppercase tracking-wide" style={{ color: RC.dorado }}>
            Servicios
          </h3>
          <ul className="mt-3 space-y-2 text-sm text-gray-400">
            {info.serviciosFooter.map((s) => (
              <li key={s} className="flex items-center gap-2"><IconCheck className="h-3.5 w-3.5 shrink-0" style={{ color: RC.dorado }} />{s}</li>
            ))}
            {info.email ? (
              <li className="pt-2">
                <a href={`mailto:${info.email}`} className="flex items-center gap-2 hover:text-white">
                  <IconMail className="h-4 w-4 shrink-0" style={{ color: RC.dorado }} />
                  {info.email}
                </a>
              </li>
            ) : null}
          </ul>
        </div>
      </div>
      <div className="border-t py-4" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
        <p className="text-center text-xs text-gray-500">
          © {new Date().getFullYear()} {info.nombre} · Powered by{" "}
          <a href="https://cauce.app" className="font-medium hover:text-gray-300">
            Cauce
          </a>
        </p>
      </div>
    </footer>
  );
}
