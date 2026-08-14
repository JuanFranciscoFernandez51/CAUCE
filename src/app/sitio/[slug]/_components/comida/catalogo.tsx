"use client";

import { useMemo, useRef, useState } from "react";
import { BotonSumar, ENVIO_GRATIS } from "./pedido-store";
import { Reveal } from "../conce/reveal";

/** Catálogo de Casa Milo: filtros por categoría, grupos y card con "Sumar". */
const BORDO = "#7B2434";
const CREMA = "#FBF3DE";
const CELESTE = "#A9C6F5";
const TINTA = "#3A1218";

export type Prod = {
  id: string;
  nombre: string;
  precio: number;
  descripcion: string;
  categoria: string;
  fotos: string[];
};

const plata = (n: number) => `$ ${n.toLocaleString("es-AR")}`;

/** Badge de envío gratis para packs que ya superan el umbral. Pulso en el puntito, no en el texto. */
function BadgeEnvio({ claro }: { claro?: boolean }) {
  return (
    <span
      className="absolute left-3 top-3 z-10 inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-bold uppercase"
      style={
        claro
          ? { backgroundColor: CREMA, color: BORDO, letterSpacing: "0.08em" }
          : { backgroundColor: BORDO, color: CREMA, letterSpacing: "0.08em" }
      }
    >
      <span
        className="h-1.5 w-1.5 animate-pulse rounded-full motion-reduce:animate-none"
        style={{ backgroundColor: claro ? BORDO : CELESTE }}
      />
      Envío gratis
    </span>
  );
}

/** Foto de card: zoom en hover y, si hay segunda foto, swap con crossfade. */
function FotoCard({ fotos, alt }: { fotos: string[]; alt: string }) {
  if (!fotos[0]) return null;
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={fotos[0]}
        alt={alt}
        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 motion-reduce:transform-none"
      />
      {fotos[1] ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={fotos[1]}
          alt=""
          aria-hidden
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover opacity-0 transition-all duration-300 group-hover:scale-105 group-hover:opacity-100 motion-reduce:transform-none motion-reduce:transition-none"
        />
      ) : null}
    </>
  );
}

export function Catalogo({ productos }: { productos: Prod[] }) {
  const categorias = useMemo(() => [...new Set(productos.map((p) => p.categoria))], [productos]);
  const [filtro, setFiltro] = useState("Todo");
  // El reveal escalonado corre solo en la carga inicial: apenas se filtra se
  // apaga para que el cambio de categoría sea instantáneo, sin re-fades.
  const [revelar, setRevelar] = useState(true);

  const grupos = categorias.filter((c) => filtro === "Todo" || c === filtro);
  const esCombo = (c: string) => /combo/i.test(c);

  return (
    <section id="catalogo" className="mx-auto max-w-[1180px] px-7 pb-10 pt-12">
      <Reveal>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-[13px] font-semibold uppercase" style={{ color: BORDO, letterSpacing: "0.22em" }}>
              Catálogo
            </p>
            <h2
              className="mt-3 text-[38px] font-black sm:text-[54px]"
              style={{ fontFamily: "var(--font-bodoni)", color: BORDO, lineHeight: 1, letterSpacing: "-0.02em" }}
            >
              Elegí tu corte
            </h2>
          </div>
          <p className="max-w-[360px] text-[15px]" style={{ color: "#6B4A4F" }}>
            Precios por pack, listos para freezer. Sumá al pedido y lo cerramos por WhatsApp.
          </p>
        </div>
      </Reveal>

      {/* Filtros */}
      <div className="mt-7 flex flex-wrap gap-2.5">
        {["Todo", ...categorias].map((c) => {
          const activo = filtro === c;
          return (
            <button
              key={c}
              onClick={() => {
                setRevelar(false);
                setFiltro(c);
              }}
              className="px-[22px] py-[11px] text-[14px] font-semibold transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] motion-reduce:transform-none"
              style={{
                letterSpacing: "0.04em",
                backgroundColor: activo ? BORDO : "transparent",
                color: activo ? CREMA : BORDO,
                border: `1.5px solid ${activo ? BORDO : "rgba(123,36,52,0.35)"}`,
              }}
            >
              {c}
            </button>
          );
        })}
      </div>

      {/* Grupos */}
      {grupos.map((cat, gi) => {
        const items = productos.filter((p) => p.categoria === cat);
        const combo = esCombo(cat);
        return (
          <div key={cat} style={{ marginTop: gi === 0 ? 40 : 52 }}>
            <p
              className="pb-3 text-[13px] font-semibold uppercase"
              style={{ color: "#6B4A4F", letterSpacing: "0.2em", borderBottom: "1px solid rgba(123,36,52,0.2)" }}
            >
              {cat}
            </p>

            <div
              className={`mt-[26px] grid gap-[26px] ${combo ? "md:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3"}`}
            >
              {items.map((p, i) => {
                const card = combo ? (
                  <article
                    className="group grid h-full transition-all duration-300 hover:-translate-y-1 hover:shadow-xl motion-reduce:transform-none md:grid-cols-[1fr_1.1fr]"
                    style={{ backgroundColor: BORDO, color: CREMA, minHeight: 230 }}
                  >
                    <div className="relative overflow-hidden" style={{ backgroundColor: "#5F1B28" }}>
                      <FotoCard fotos={p.fotos} alt={p.nombre} />
                      {p.precio >= ENVIO_GRATIS ? <BadgeEnvio claro /> : null}
                    </div>
                    <div className="flex flex-col gap-2 p-6">
                      <p className="text-[12px] font-semibold uppercase" style={{ color: CELESTE, letterSpacing: "0.2em" }}>
                        Combo
                      </p>
                      <p className="text-[28px] font-bold" style={{ fontFamily: "var(--font-bodoni)", lineHeight: 1.1 }}>
                        {p.nombre}
                      </p>
                      <p className="flex-1 text-[14px] leading-[1.45]" style={{ color: "rgba(251,243,222,0.85)" }}>
                        {p.descripcion}
                      </p>
                      <div className="mt-2 flex items-center justify-between gap-3">
                        <p className="text-[26px] font-bold">{plata(p.precio)}</p>
                        <BotonSumar producto={{ id: p.id, nombre: p.nombre, precio: p.precio, foto: p.fotos[0] ?? null }} invertido />
                      </div>
                    </div>
                  </article>
                ) : (
                  <article
                    className="group flex h-full flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-xl motion-reduce:transform-none"
                    style={{ backgroundColor: "#FFFDF6", border: "1px solid rgba(123,36,52,0.14)" }}
                  >
                    <div className="relative aspect-[4/3] w-full overflow-hidden" style={{ backgroundColor: "#EFE3C9" }}>
                      <FotoCard fotos={p.fotos} alt={p.nombre} />
                      {p.precio >= ENVIO_GRATIS ? <BadgeEnvio /> : null}
                    </div>
                    <div className="flex flex-1 flex-col gap-2.5 p-5">
                      <p className="text-[24px] font-bold" style={{ fontFamily: "var(--font-bodoni)", color: BORDO, lineHeight: 1.1 }}>
                        {p.nombre}
                      </p>
                      <p className="flex-1 text-[14px] leading-[1.45]" style={{ color: "#6B4A4F" }}>
                        {p.descripcion}
                      </p>
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-[22px] font-bold" style={{ color: TINTA }}>
                          {plata(p.precio)}
                        </p>
                        <BotonSumar producto={{ id: p.id, nombre: p.nombre, precio: p.precio, foto: p.fotos[0] ?? null }} />
                      </div>
                    </div>
                  </article>
                );
                // Reveal escalonado solo en la carga inicial; al filtrar, render directo.
                return revelar ? (
                  <Reveal key={p.id} delay={Math.min(i, 4) * 80} className="h-full">
                    {card}
                  </Reveal>
                ) : (
                  <div key={p.id} className="h-full">
                    {card}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </section>
  );
}

/** Destacados del home: 5 productos que se desplazan al costado (lineup estilo Vespa). */
export function Destacados({ productos, base }: { productos: Prod[]; base: string }) {
  const riel = useRef<HTMLDivElement>(null);
  const mover = (dir: number) => riel.current?.scrollBy({ left: dir * 320, behavior: "smooth" });

  return (
    <section id="catalogo" className="mx-auto max-w-[1180px] px-7 pb-14 pt-12">
      <Reveal>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-[13px] font-semibold uppercase" style={{ color: BORDO, letterSpacing: "0.22em" }}>
              Destacados
            </p>
            <h2
              className="mt-3 text-[38px] font-black sm:text-[54px]"
              style={{ fontFamily: "var(--font-bodoni)", color: BORDO, lineHeight: 1, letterSpacing: "-0.02em" }}
            >
              Los que más salen
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => mover(-1)} aria-label="Anterior" className="h-11 w-11 text-[18px] transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.95] motion-reduce:transform-none" style={{ border: `1.5px solid ${BORDO}`, color: BORDO }}>‹</button>
            <button onClick={() => mover(1)} aria-label="Siguiente" className="h-11 w-11 text-[18px] transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.95] motion-reduce:transform-none" style={{ border: `1.5px solid ${BORDO}`, color: BORDO }}>›</button>
            <a
              href={`${base}/catalogo`}
              className="px-[22px] py-[13px] text-[14px] font-semibold uppercase transition-all duration-200 hover:-translate-y-0.5 hover:opacity-90 active:scale-[0.98] motion-reduce:transform-none"
              style={{ backgroundColor: BORDO, color: CREMA, letterSpacing: "0.04em" }}
            >
              Ver catálogo completo
            </a>
          </div>
        </div>
      </Reveal>

      <div ref={riel} className="milo-carrusel mt-8 flex gap-[22px] overflow-x-auto pb-3" style={{ scrollbarWidth: "none" }}>
        {productos.map((p, i) => (
          <article
            key={p.id}
            className="group flex w-[280px] flex-none flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-xl motion-reduce:transform-none"
            style={{ backgroundColor: "#FFFDF6", border: "1px solid rgba(123,36,52,0.14)" }}
          >
            <div className="relative aspect-[4/3] w-full overflow-hidden" style={{ backgroundColor: "#EFE3C9" }}>
              <FotoCard fotos={p.fotos} alt={p.nombre} />
              {p.precio >= ENVIO_GRATIS ? <BadgeEnvio /> : null}
              <span className="absolute bottom-2 right-3 text-[26px] font-black" style={{ fontFamily: "var(--font-bodoni)", color: "rgba(251,243,222,0.95)", textShadow: "0 1px 8px rgba(58,18,24,.45)" }}>
                {String(i + 1).padStart(2, "0")}
              </span>
            </div>
            <div className="flex flex-1 flex-col gap-2 p-5">
              <p className="text-[21px] font-bold" style={{ fontFamily: "var(--font-bodoni)", color: BORDO, lineHeight: 1.1 }}>
                {p.nombre}
              </p>
              <div className="mt-auto flex items-center justify-between gap-3">
                <p className="text-[20px] font-bold" style={{ color: TINTA }}>{plata(p.precio)}</p>
                <BotonSumar producto={{ id: p.id, nombre: p.nombre, precio: p.precio, foto: p.fotos[0] ?? null }} />
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
