"use client";

import { useMemo, useState } from "react";
import { BotonSumar } from "./pedido-store";
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
  foto: string | null;
};

const plata = (n: number) => `$ ${n.toLocaleString("es-AR")}`;

export function Catalogo({ productos }: { productos: Prod[] }) {
  const categorias = useMemo(() => [...new Set(productos.map((p) => p.categoria))], [productos]);
  const [filtro, setFiltro] = useState("Todo");

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
              onClick={() => setFiltro(c)}
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
              {items.map((p) =>
                combo ? (
                  <article
                    key={p.id}
                    className="group grid transition-all duration-300 hover:-translate-y-1 hover:shadow-xl motion-reduce:transform-none md:grid-cols-[1fr_1.1fr]"
                    style={{ backgroundColor: BORDO, color: CREMA, minHeight: 230 }}
                  >
                    <div className="overflow-hidden" style={{ backgroundColor: "#5F1B28" }}>
                      {p.foto ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.foto}
                          alt={p.nombre}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 motion-reduce:transform-none"
                        />
                      ) : null}
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
                        <BotonSumar producto={{ id: p.id, nombre: p.nombre, precio: p.precio, foto: p.foto }} invertido />
                      </div>
                    </div>
                  </article>
                ) : (
                  <article
                    key={p.id}
                    className="group flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-xl motion-reduce:transform-none"
                    style={{ backgroundColor: "#FFFDF6", border: "1px solid rgba(123,36,52,0.14)" }}
                  >
                    <div className="aspect-[4/3] w-full overflow-hidden" style={{ backgroundColor: "#EFE3C9" }}>
                      {p.foto ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.foto}
                          alt={p.nombre}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 motion-reduce:transform-none"
                        />
                      ) : null}
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
                        <BotonSumar producto={{ id: p.id, nombre: p.nombre, precio: p.precio, foto: p.foto }} />
                      </div>
                    </div>
                  </article>
                )
              )}
            </div>
          </div>
        );
      })}
    </section>
  );
}
