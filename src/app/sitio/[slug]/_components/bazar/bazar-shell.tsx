"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { fmtPrecio, CUPON_POPUP } from "@/lib/bazar";
import type { BazarShellInfo } from "../../_lib/bazar-site";
import { CarritoProvider, useCarrito } from "./carrito-store";

/**
 * Shell del template BAZAR (La Estación Deco & Home): look aireado, luminoso,
 * elegante-playero — aqua + arena, la conchilla como motivo. Header sticky con
 * buscador, categorías, carrito y Mi cuenta; drawer de carrito; popup 5% a los
 * 10 segundos; WhatsApp flotante; footer completo.
 */

// Paleta del template (de la conchilla del logo — nada oscuro).
import { BZ } from "../../_lib/bazar-paleta";
import { ThemeButton } from "@/components/public/site-controls";
export { BZ };

export function BazarShell({ info, children }: { info: BazarShellInfo; children: ReactNode }) {
  return (
    <CarritoProvider slug={info.slug}>
      {/* La identidad viaja como variables CSS: el shell es el mismo, la cara no. */}
      <div
        style={
          {
            "--tpl": info.color,
            "--tpl-suave": info.colorSuave,
            "--tpl-sobre": info.sobreColor,
            "--tpl-emoji": `"${info.emoji}"`,
          } as React.CSSProperties
        }
      >
        <ShellInterno info={info}>{children}</ShellInterno>
      </div>
    </CarritoProvider>
  );
}

function ShellInterno({ info, children }: { info: BazarShellInfo; children: ReactNode }) {
  const base = `/sitio/${info.slug}`;
  const wa = info.whatsapp ? `https://wa.me/${info.whatsapp}` : null;

  return (
    <div
      className="tienda flex min-h-screen flex-col"
      style={{
        backgroundColor: info.paletaFija ? "#FFFDF6" : "#ffffff",
        color: "var(--t-texto)",
        fontFamily: info.paletaFija
          ? "var(--font-archivo), ui-sans-serif, system-ui, sans-serif"
          : "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif",
        // Cuando la marca tiene su paleta, manda de día y de noche.
        ...(info.paletaFija
          ? ({
              "--t-fondo": "#FFFDF6",
              "--t-card": "#FFFFFF",
              "--t-suave": info.fondoSuave,
              "--t-texto": info.colorTexto,
              "--t-tenue": "#6B4A4F",
              "--t-borde": "rgba(123,36,52,0.16)",
              "--t-panel": "rgba(251,243,222,0.94)",
            } as Record<string, string>)
          : {}),
      }}
    >
      <Header info={info} />
      <main className="flex-1">{children}</main>
      <Footer info={info} />
      <DrawerCarrito base={base} info={info} />
      {info.popupDescuento ? <Popup5 base={base} slug={info.slug} info={info} /> : null}
      {wa ? (
        <a
          href={wa}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Escribinos por WhatsApp"
          className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full text-2xl text-white shadow-lg transition-transform hover:scale-105"
          style={{ backgroundColor: "#25D366" }}
        >
          💬
        </a>
      ) : null}

      {/* Instagram: para el que quiere ver el producto antes de pedir. */}
      {info.instagram ? (
        <a
          href={`https://www.instagram.com/${info.instagram}/`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Seguinos en Instagram: @${info.instagram}`}
          title={`@${info.instagram}`}
          className={`fixed left-5 z-40 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg transition-transform hover:scale-105 ${
            wa ? "bottom-5" : "bottom-5"
          }`}
          style={{ background: "linear-gradient(45deg,#F58529,#DD2A7B 55%,#8134AF)" }}
        >
          <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden>
            <rect x="3" y="3" width="18" height="18" rx="5" />
            <circle cx="12" cy="12" r="4" />
            <circle cx="17.2" cy="6.8" r="1.2" fill="currentColor" stroke="none" />
          </svg>
        </a>
      ) : null}
    </div>
  );
}

// ── Header ────────────────────────────────────────────────────────────────

/** Cinta superior: lo que el negocio promete, girando sin parar. */
function CintaPromesas({ info }: { info: BazarShellInfo }) {
  if (!info.promesas?.length) return null;
  const tanda = [...info.promesas, ...info.promesas];
  return (
    <div className="cinta bg-[#F5B301] text-black" style={{ backgroundColor: "var(--tpl, #F5B301)", color: "var(--tpl-sobre, #111)" }}>
      <div className="cinta-marquesina py-1.5">
        {tanda.concat(tanda).map((t, i) => (
          <span key={i} className="px-6 text-[12px] font-bold uppercase tracking-wide">
            {t} <span className="opacity-50">•</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function Header({ info }: { info: BazarShellInfo }) {
  const base = `/sitio/${info.slug}`;
  const router = useRouter();
  const [q, setQ] = useState("");
  const { cantidadTotal, setDrawerAbierto } = useCarrito();
  const [menuAbierto, setMenuAbierto] = useState(false);

  function buscar(e: React.FormEvent) {
    e.preventDefault();
    router.push(q.trim() ? `${base}/tienda?q=${encodeURIComponent(q.trim())}` : `${base}/tienda`);
  }

  return (
    <>
      <CintaPromesas info={info} />
      <header className="barra sticky top-0 z-40 border-b">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
        <Link href={base} className="flex shrink-0 items-center gap-2">
          {info.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <>
              <img src={info.logo} alt={info.nombre} className={`h-11 w-auto max-w-[190px] object-contain ${info.logoOscuro ? "dark:hidden" : ""}`} />
              {info.logoOscuro ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={info.logoOscuro} alt={info.nombre} className="hidden h-11 w-auto max-w-[190px] object-contain dark:block" />
              ) : null}
            </>
          ) : info.paletaFija ? (
            <span
              className="text-[26px] font-black"
              style={{ fontFamily: "var(--font-bodoni)", color: info.colorTexto, letterSpacing: "-0.02em" }}
            >
              {info.nombre}
            </span>
          ) : (
            <span className="text-2xl">{info.emoji}</span>
          )}
          {/* Con logo propio el nombre al lado sobra: ya lo dice la marca. */}
          {info.logo || info.paletaFija ? null : (
            <span className="hidden text-lg font-bold tracking-tight sm:block" style={{ color: "var(--t-texto)" }}>
              {info.nombre}
            </span>
          )}
        </Link>

        <form onSubmit={buscar} className="mx-auto hidden max-w-md flex-1 md:block">
          <div className="relative">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={info.buscarPlaceholder}
              className="t-card t-borde h-10 w-full rounded-full border pl-4 pr-10 text-sm outline-none transition-colors"
              
            />
            <button
              type="submit"
              aria-label="Buscar"
              className="absolute right-1 top-1 flex h-8 w-8 items-center justify-center rounded-full text-white"
              style={{ backgroundColor: info.color, color: info.sobreColor }}
            >
              🔍
            </button>
          </div>
        </form>

        <nav className="ml-auto flex items-center gap-1 sm:gap-2">
          <Link
            href={`${base}/tienda`}
            className="hidden rounded-full px-3 py-2 text-sm font-medium hover:bg-[#F6F1E8] sm:block"
          >
            Tienda
          </Link>
          <Link
            href={`${base}/quienes-somos`}
            className="hidden rounded-full px-3 py-2 text-sm font-medium hover:bg-[#F6F1E8] lg:block"
          >
            Quiénes somos
          </Link>
          <ThemeButton />
          <Link
            href={`${base}/cuenta`}
            className="flex items-center gap-1 rounded-full px-3 py-2 text-sm font-medium hover:bg-[#F6F1E8]"
          >
            <span aria-hidden>👤</span>
            <span className="hidden sm:inline">Mi cuenta</span>
          </Link>
          <button
            type="button"
            onClick={() => setDrawerAbierto(true)}
            className="relative flex items-center gap-1 rounded-full px-3 py-2 text-sm font-semibold text-white"
            style={{ backgroundColor: info.color, color: info.sobreColor }}
          >
            <span aria-hidden>🛒</span>
            <span className="hidden sm:inline">Carrito</span>
            {cantidadTotal > 0 ? (
              <span
                className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-bold text-white"
                style={{ backgroundColor: "var(--t-texto)", color: "var(--t-fondo)" }}
              >
                {cantidadTotal}
              </span>
            ) : null}
          </button>
          <button
            type="button"
            aria-label="Menú"
            onClick={() => setMenuAbierto((v) => !v)}
            className="rounded-full px-2 py-2 text-lg sm:hidden"
          >
            ☰
          </button>
        </nav>
      </div>

      {/* Categorías (desktop) */}
      <div className="t-borde hidden border-t t-card md:block dark:bg-black">
        <div className="mx-auto flex max-w-6xl items-center gap-1 overflow-x-auto px-4 py-1.5">
          {info.categorias.map((c) => (
            <Link
              key={c}
              href={`${base}/tienda?categoria=${encodeURIComponent(c)}`}
              className="whitespace-nowrap rounded-full px-3 py-1 text-[13px] font-medium transition-colors hover:bg-black/[0.06]"
              style={{ color: "var(--t-texto)" }}
            >
              {c}
            </Link>
          ))}
        </div>
      </div>

      {/* Menú mobile */}
      {menuAbierto ? (
        <div className="t-card t-borde border-t px-4 py-3 md:hidden" >
          <form onSubmit={buscar} className="mb-3">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar productos…"
              className="t-card t-borde h-10 w-full rounded-full border px-4 text-sm outline-none"
              
            />
          </form>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`${base}/tienda`}
              onClick={() => setMenuAbierto(false)}
              className="rounded-full px-3 py-1.5 text-sm font-semibold text-white"
              style={{ backgroundColor: info.color, color: info.sobreColor }}
            >
              Tienda
            </Link>
            {info.categorias.map((c) => (
              <Link
                key={c}
                href={`${base}/tienda?categoria=${encodeURIComponent(c)}`}
                onClick={() => setMenuAbierto(false)}
                className="rounded-full border px-3 py-1.5 text-sm"
                
              >
                {c}
              </Link>
            ))}
            <Link
              href={`${base}/quienes-somos`}
              onClick={() => setMenuAbierto(false)}
              className="rounded-full border px-3 py-1.5 text-sm"
              
            >
              Quiénes somos
            </Link>
            <Link
              href={`${base}/consultas`}
              onClick={() => setMenuAbierto(false)}
              className="rounded-full border px-3 py-1.5 text-sm"
              
            >
              Consultas
            </Link>
          </div>
        </div>
      ) : null}
    </header>
    </>
  );
}

// ── Drawer del carrito ────────────────────────────────────────────────────

function DrawerCarrito({ base, info }: { base: string; info: BazarShellInfo }) {
  const { items, subtotal, setCant, quitar, drawerAbierto, setDrawerAbierto } = useCarrito();

  if (!drawerAbierto) return null;
  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Cerrar carrito"
        onClick={() => setDrawerAbierto(false)}
        className="absolute inset-0 bg-black/30"
      />
      <aside className="t-card absolute right-0 top-0 flex h-full w-full max-w-sm flex-col shadow-2xl">
        <div
          className="flex items-center justify-between border-b px-4 py-3"
          
        >
          <h2 className="text-lg font-bold" style={{ color: "var(--t-texto)" }}>
            Tu carrito {info.emoji}
          </h2>
          <button
            type="button"
            onClick={() => setDrawerAbierto(false)}
            className="rounded-full px-2 py-1 text-xl hover:bg-[#F6F1E8]"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3">
          {items.length === 0 ? (
            <div className="py-12 text-center text-sm t-tenue">
              <div className="mb-2 text-3xl">🛒</div>
              Todavía no agregaste nada.
              <div className="mt-4">
                <Link
                  href={`${base}/tienda`}
                  onClick={() => setDrawerAbierto(false)}
                  className="rounded-full px-4 py-2 text-sm font-semibold text-white"
                  style={{ backgroundColor: info.color, color: info.sobreColor }}
                >
                  Ir a la tienda
                </Link>
              </div>
            </div>
          ) : (
            <ul className="space-y-3">
              {items.map((i) => (
                <li key={i.productoId} className="flex gap-3">
                  {i.foto ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={i.foto}
                      alt={i.nombre}
                      className="h-16 w-16 shrink-0 rounded-lg border object-cover"
                      
                    />
                  ) : (
                    <div
                      className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg text-xl t-suave"
                      
                    >
                      
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{i.nombre}</p>
                    <p className="text-sm font-semibold" style={{ color: info.color }}>
                      {fmtPrecio(i.precio)}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setCant(i.productoId, i.cant - 1)}
                        className="h-6 w-6 rounded-full border text-sm leading-none"
                        
                        aria-label="Restar uno"
                      >
                        −
                      </button>
                      <span className="w-6 text-center text-sm">{i.cant}</span>
                      <button
                        type="button"
                        onClick={() => setCant(i.productoId, i.cant + 1)}
                        className="h-6 w-6 rounded-full border text-sm leading-none"
                        
                        aria-label="Sumar uno"
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={() => quitar(i.productoId)}
                        className="ml-auto text-xs t-tenue hover:text-red-500"
                      >
                        Quitar
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 ? (
          <div className="border-t px-4 py-4" >
            <div className="mb-3 flex items-center justify-between text-sm">
              <span className="t-tenue">Subtotal</span>
              <span className="text-lg font-bold" style={{ color: "var(--t-texto)" }}>
                {fmtPrecio(subtotal)}
              </span>
            </div>
            <Link
              href={`${base}/carrito`}
              onClick={() => setDrawerAbierto(false)}
              className="block w-full rounded-full py-3 text-center font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: info.color, color: info.sobreColor }}
            >
              Finalizar compra
            </Link>
            <p className="mt-2 text-center text-xs t-tenue">
              ¿Tenés un cupón? Lo cargás en el paso siguiente.
            </p>
          </div>
        ) : null}
      </aside>
    </div>
  );
}

// ── Popup 5% (a los 10 segundos exactos de la primera visita) ─────────────

function Popup5({ base, slug, info }: { base: string; slug: string; info: BazarShellInfo }) {
  const [visible, setVisible] = useState(false);
  const KEY = `le-popup-visto-${slug}`;

  useEffect(() => {
    try {
      if (localStorage.getItem(KEY)) return;
    } catch {
      return;
    }
    const timer = setTimeout(() => {
      setVisible(true);
      try {
        localStorage.setItem(KEY, "1");
      } catch {
        // sin localStorage igual lo mostramos esta vez
      }
    }, 10_000);
    return () => clearTimeout(timer);
  }, [KEY]);

  if (!visible) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Cerrar"
        onClick={() => setVisible(false)}
        className="absolute inset-0 bg-black/40"
      />
      <div
        className="t-card relative w-full max-w-sm overflow-hidden rounded-3xl text-center shadow-2xl"
        style={{ border: `2px solid ${"var(--t-borde)"}` }}
      >
        <div className="px-6 pb-6 pt-8 t-suave" >
          <div className="text-5xl"></div>
          <h3 className="mt-3 text-2xl font-extrabold tracking-tight" style={{ color: "var(--t-texto)" }}>
            ¡5% OFF en tu primera compra!
          </h3>
          <p className="mt-2 text-sm t-tenue">
            Usá el código{" "}
            <span
              className="rounded-md px-2 py-0.5 font-mono font-bold text-white"
              style={{ backgroundColor: info.color, color: info.sobreColor }}
            >
              {CUPON_POPUP}
            </span>{" "}
            en el carrito y llevate tu casa con onda de mar.
          </p>
        </div>
        <div className="flex flex-col gap-2 p-5">
          <Link
            href={`${base}/tienda`}
            onClick={() => setVisible(false)}
            className="rounded-full py-3 font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: info.color, color: info.sobreColor }}
          >
            Ir a la tienda
          </Link>
          <button
            type="button"
            onClick={() => setVisible(false)}
            className="text-sm t-tenue hover:t-tenue"
          >
            Ahora no
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Footer ────────────────────────────────────────────────────────────────

function Footer({ info }: { info: BazarShellInfo }) {
  const base = `/sitio/${info.slug}`;
  return (
    <footer className="mt-12 t-suave" >
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-3">
        <div>
          <div className="flex items-center gap-2">
            {info.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={info.logoOscuro ?? info.logo} alt={info.nombre} className="h-10 w-auto max-w-[170px] object-contain" />
            ) : (
              <span className="text-2xl">{info.emoji}</span>
            )}
            <span className="font-bold" style={{ color: "var(--t-texto)" }}>
              {info.nombre}
            </span>
          </div>
          <p className="mt-3 text-sm t-tenue">
            {info.descripcion}
          </p>
          <div className="mt-3 flex gap-3 text-sm">
            {info.instagram ? (
              <a
                href={`https://instagram.com/${info.instagram}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium hover:underline"
                style={{ color: info.color }}
              >
                📷 @{info.instagram}
              </a>
            ) : null}
            {info.whatsapp ? (
              <a
                href={`https://wa.me/${info.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium hover:underline"
                style={{ color: info.color }}
              >
                💬 WhatsApp
              </a>
            ) : null}
          </div>
        </div>
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wide" style={{ color: "var(--t-texto)" }}>
            Navegación
          </h3>
          <ul className="mt-3 space-y-2 text-sm t-tenue">
            <li>
              <Link href={`${base}/tienda`} className="hover:underline">
                Tienda
              </Link>
            </li>
            <li>
              <Link href={`${base}/quienes-somos`} className="hover:underline">
                Quiénes somos
              </Link>
            </li>
            <li>
              <Link href={`${base}/consultas`} className="hover:underline">
                Consultas
              </Link>
            </li>
            <li>
              <Link href={`${base}/cuenta`} className="hover:underline">
                Mi cuenta
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wide" style={{ color: "var(--t-texto)" }}>
            El local
          </h3>
          <ul className="mt-3 space-y-2 text-sm t-tenue">
            {info.direccion ? <li>📍 {info.direccion}</li> : null}
            {info.horarios ? <li className="whitespace-pre-line">🕒 {info.horarios}</li> : null}
            {info.email ? <li>✉️ {info.email}</li> : null}
            <li>🚚 Envíos a todo el país</li>
            <li>💳 3 y 6 cuotas</li>
          </ul>
        </div>
      </div>
      <div className="border-t py-4" >
        <p className="text-center text-xs t-tenue">
          ⚡ Powered by{" "}
          <a href="https://cauceapp.com.ar" className="font-medium hover:underline">
            Cauce
          </a>
        </p>
      </div>
    </footer>
  );
}
