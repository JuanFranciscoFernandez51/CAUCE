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
export const BZ = {
  aqua: "#3FA9A5",
  aquaClaro: "#A8DAD6",
  azul: "#2C6E8A",
  arena: "#F6F1E8",
  texto: "#2A3238",
};

export function BazarShell({ info, children }: { info: BazarShellInfo; children: ReactNode }) {
  return (
    <CarritoProvider slug={info.slug}>
      <ShellInterno info={info}>{children}</ShellInterno>
    </CarritoProvider>
  );
}

function ShellInterno({ info, children }: { info: BazarShellInfo; children: ReactNode }) {
  const base = `/sitio/${info.slug}`;
  const wa = info.whatsapp ? `https://wa.me/${info.whatsapp}` : null;

  return (
    <div
      className="flex min-h-screen flex-col"
      style={{
        backgroundColor: "#ffffff",
        color: BZ.texto,
        fontFamily: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif",
      }}
    >
      <Header info={info} />
      <main className="flex-1">{children}</main>
      <Footer info={info} />
      <DrawerCarrito base={base} />
      <Popup5 base={base} slug={info.slug} />
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
    </div>
  );
}

// ── Header ────────────────────────────────────────────────────────────────

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
    <header
      className="sticky top-0 z-40 border-b bg-white/95 backdrop-blur"
      style={{ borderColor: BZ.aquaClaro }}
    >
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
        <Link href={base} className="flex shrink-0 items-center gap-2">
          {info.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={info.logo}
              alt={info.nombre}
              className="h-11 w-11 rounded-full border object-cover"
              style={{ borderColor: BZ.aquaClaro }}
            />
          ) : (
            <span className="text-2xl">🐚</span>
          )}
          <span className="hidden text-lg font-bold tracking-tight sm:block" style={{ color: BZ.azul }}>
            {info.nombre}
          </span>
        </Link>

        <form onSubmit={buscar} className="mx-auto hidden max-w-md flex-1 md:block">
          <div className="relative">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscá vajilla, textiles, deco…"
              className="h-10 w-full rounded-full border bg-white pl-4 pr-10 text-sm outline-none transition-colors focus:border-[#3FA9A5]"
              style={{ borderColor: BZ.aquaClaro }}
            />
            <button
              type="submit"
              aria-label="Buscar"
              className="absolute right-1 top-1 flex h-8 w-8 items-center justify-center rounded-full text-white"
              style={{ backgroundColor: BZ.aqua }}
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
            style={{ backgroundColor: BZ.aqua }}
          >
            <span aria-hidden>🛒</span>
            <span className="hidden sm:inline">Carrito</span>
            {cantidadTotal > 0 ? (
              <span
                className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-bold text-white"
                style={{ backgroundColor: BZ.azul }}
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
      <div className="hidden border-t md:block" style={{ borderColor: "#EFF6F5" }}>
        <div className="mx-auto flex max-w-6xl items-center gap-1 overflow-x-auto px-4 py-1.5">
          {info.categorias.map((c) => (
            <Link
              key={c}
              href={`${base}/tienda?categoria=${encodeURIComponent(c)}`}
              className="whitespace-nowrap rounded-full px-3 py-1 text-[13px] font-medium text-[#2C6E8A] transition-colors hover:bg-[#F6F1E8]"
            >
              {c}
            </Link>
          ))}
        </div>
      </div>

      {/* Menú mobile */}
      {menuAbierto ? (
        <div className="border-t bg-white px-4 py-3 md:hidden" style={{ borderColor: BZ.aquaClaro }}>
          <form onSubmit={buscar} className="mb-3">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar productos…"
              className="h-10 w-full rounded-full border bg-white px-4 text-sm outline-none"
              style={{ borderColor: BZ.aquaClaro }}
            />
          </form>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`${base}/tienda`}
              onClick={() => setMenuAbierto(false)}
              className="rounded-full px-3 py-1.5 text-sm font-semibold text-white"
              style={{ backgroundColor: BZ.aqua }}
            >
              Tienda
            </Link>
            {info.categorias.map((c) => (
              <Link
                key={c}
                href={`${base}/tienda?categoria=${encodeURIComponent(c)}`}
                onClick={() => setMenuAbierto(false)}
                className="rounded-full border px-3 py-1.5 text-sm"
                style={{ borderColor: BZ.aquaClaro }}
              >
                {c}
              </Link>
            ))}
            <Link
              href={`${base}/quienes-somos`}
              onClick={() => setMenuAbierto(false)}
              className="rounded-full border px-3 py-1.5 text-sm"
              style={{ borderColor: BZ.aquaClaro }}
            >
              Quiénes somos
            </Link>
            <Link
              href={`${base}/consultas`}
              onClick={() => setMenuAbierto(false)}
              className="rounded-full border px-3 py-1.5 text-sm"
              style={{ borderColor: BZ.aquaClaro }}
            >
              Consultas
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}

// ── Drawer del carrito ────────────────────────────────────────────────────

function DrawerCarrito({ base }: { base: string }) {
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
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-sm flex-col bg-white shadow-2xl">
        <div
          className="flex items-center justify-between border-b px-4 py-3"
          style={{ borderColor: BZ.aquaClaro }}
        >
          <h2 className="text-lg font-bold" style={{ color: BZ.azul }}>
            Tu carrito 🐚
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
            <div className="py-12 text-center text-sm text-gray-500">
              <div className="mb-2 text-3xl">🛒</div>
              Todavía no agregaste nada.
              <div className="mt-4">
                <Link
                  href={`${base}/tienda`}
                  onClick={() => setDrawerAbierto(false)}
                  className="rounded-full px-4 py-2 text-sm font-semibold text-white"
                  style={{ backgroundColor: BZ.aqua }}
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
                      style={{ borderColor: BZ.aquaClaro }}
                    />
                  ) : (
                    <div
                      className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg text-xl"
                      style={{ backgroundColor: BZ.arena }}
                    >
                      🐚
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{i.nombre}</p>
                    <p className="text-sm font-semibold" style={{ color: BZ.aqua }}>
                      {fmtPrecio(i.precio)}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setCant(i.productoId, i.cant - 1)}
                        className="h-6 w-6 rounded-full border text-sm leading-none"
                        style={{ borderColor: BZ.aquaClaro }}
                        aria-label="Restar uno"
                      >
                        −
                      </button>
                      <span className="w-6 text-center text-sm">{i.cant}</span>
                      <button
                        type="button"
                        onClick={() => setCant(i.productoId, i.cant + 1)}
                        className="h-6 w-6 rounded-full border text-sm leading-none"
                        style={{ borderColor: BZ.aquaClaro }}
                        aria-label="Sumar uno"
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={() => quitar(i.productoId)}
                        className="ml-auto text-xs text-gray-400 hover:text-red-500"
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
          <div className="border-t px-4 py-4" style={{ borderColor: BZ.aquaClaro }}>
            <div className="mb-3 flex items-center justify-between text-sm">
              <span className="text-gray-500">Subtotal</span>
              <span className="text-lg font-bold" style={{ color: BZ.azul }}>
                {fmtPrecio(subtotal)}
              </span>
            </div>
            <Link
              href={`${base}/carrito`}
              onClick={() => setDrawerAbierto(false)}
              className="block w-full rounded-full py-3 text-center font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: BZ.aqua }}
            >
              Finalizar compra
            </Link>
            <p className="mt-2 text-center text-xs text-gray-400">
              ¿Tenés un cupón? Lo cargás en el paso siguiente.
            </p>
          </div>
        ) : null}
      </aside>
    </div>
  );
}

// ── Popup 5% (a los 10 segundos exactos de la primera visita) ─────────────

function Popup5({ base, slug }: { base: string; slug: string }) {
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
        className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-white text-center shadow-2xl"
        style={{ border: `2px solid ${BZ.aquaClaro}` }}
      >
        <div className="px-6 pb-6 pt-8" style={{ backgroundColor: BZ.arena }}>
          <div className="text-5xl">🐚</div>
          <h3 className="mt-3 text-2xl font-extrabold tracking-tight" style={{ color: BZ.azul }}>
            ¡5% OFF en tu primera compra!
          </h3>
          <p className="mt-2 text-sm text-gray-600">
            Usá el código{" "}
            <span
              className="rounded-md px-2 py-0.5 font-mono font-bold text-white"
              style={{ backgroundColor: BZ.aqua }}
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
            style={{ backgroundColor: BZ.aqua }}
          >
            Ir a la tienda
          </Link>
          <button
            type="button"
            onClick={() => setVisible(false)}
            className="text-sm text-gray-400 hover:text-gray-600"
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
    <footer className="mt-12" style={{ backgroundColor: BZ.arena }}>
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-3">
        <div>
          <div className="flex items-center gap-2">
            {info.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={info.logo} alt={info.nombre} className="h-10 w-10 rounded-full object-cover" />
            ) : (
              <span className="text-2xl">🐚</span>
            )}
            <span className="font-bold" style={{ color: BZ.azul }}>
              {info.nombre}
            </span>
          </div>
          <p className="mt-3 text-sm text-gray-600">
            Bazar de playa nacido en Monte Hermoso. De la costa a tu casa. 🌊
          </p>
          <div className="mt-3 flex gap-3 text-sm">
            {info.instagram ? (
              <a
                href={`https://instagram.com/${info.instagram}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium hover:underline"
                style={{ color: BZ.aqua }}
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
                style={{ color: BZ.aqua }}
              >
                💬 WhatsApp
              </a>
            ) : null}
          </div>
        </div>
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wide" style={{ color: BZ.azul }}>
            Navegación
          </h3>
          <ul className="mt-3 space-y-2 text-sm text-gray-600">
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
          <h3 className="text-sm font-bold uppercase tracking-wide" style={{ color: BZ.azul }}>
            El local
          </h3>
          <ul className="mt-3 space-y-2 text-sm text-gray-600">
            {info.direccion ? <li>📍 {info.direccion}</li> : null}
            {info.horarios ? <li className="whitespace-pre-line">🕒 {info.horarios}</li> : null}
            {info.email ? <li>✉️ {info.email}</li> : null}
            <li>🚚 Envíos a todo el país</li>
            <li>💳 3 y 6 cuotas</li>
          </ul>
        </div>
      </div>
      <div className="border-t py-4" style={{ borderColor: BZ.aquaClaro }}>
        <p className="text-center text-xs text-gray-500">
          ⚡ Powered by{" "}
          <a href="https://cauce.app" className="font-medium hover:underline">
            Cauce
          </a>
        </p>
      </div>
    </footer>
  );
}
