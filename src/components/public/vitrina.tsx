"use client";

import { useEffect, useState } from "react";

export type VitrinaItem = {
  /** Ruta pública de la captura (public/vitrina/…). */
  src: string;
  /** Qué es lo que se ve, en dos o tres palabras. */
  titulo: string;
  /** Una línea de contexto: para quién y qué resuelve. */
  detalle: string;
};

/**
 * Vitrina del producto: una captura GRANDE y legible por vez (marco tipo
 * ventana), pestañas para elegir cuál, avance solo cada unos segundos y
 * click para verla a pantalla completa. Reemplaza al carrusel 3D, que
 * mostraba las pantallas chiquitas y recortadas.
 */
export function Vitrina({ items }: { items: VitrinaItem[] }) {
  const [i, setI] = useState(0);
  const [abierta, setAbierta] = useState(false);
  const [pausa, setPausa] = useState(false);
  const actual = items[i];

  // Avanza sola, salvo que el visitante esté mirando (hover) o la haya abierto.
  useEffect(() => {
    if (pausa || abierta || items.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setI((n) => (n + 1) % items.length), 5200);
    return () => clearInterval(t);
  }, [pausa, abierta, items.length]);

  // Esc cierra la vista grande.
  useEffect(() => {
    if (!abierta) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setAbierta(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [abierta]);

  if (!actual) return null;

  return (
    <div onMouseEnter={() => setPausa(true)} onMouseLeave={() => setPausa(false)}>
      {/* Pestañas */}
      <div className="flex flex-wrap justify-center gap-2">
        {items.map((it, k) => (
          <button
            key={it.src}
            type="button"
            onClick={() => setI(k)}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${
              k === i
                ? "border-foreground bg-foreground text-background"
                : "border-border bg-card text-muted-foreground hover:border-foreground/40 hover:text-foreground"
            }`}
          >
            {it.titulo}
          </button>
        ))}
      </div>

      {/* Marco tipo ventana con la captura grande */}
      <button
        type="button"
        onClick={() => setAbierta(true)}
        title="Ver a pantalla completa"
        className="group mx-auto mt-6 block w-full max-w-5xl cursor-zoom-in overflow-hidden rounded-2xl border border-border bg-card text-left shadow-[0_30px_80px_-30px_rgba(17,17,17,0.35)] transition hover:-translate-y-1 hover:shadow-[0_40px_90px_-30px_rgba(17,17,17,0.45)]"
      >
        <div className="flex items-center gap-1.5 border-b border-border bg-muted/60 px-3 py-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
          <span className="ml-3 truncate text-[11px] text-muted-foreground">{actual.detalle}</span>
        </div>
        <div className="relative aspect-[16/10] bg-muted">
          {items.map((it, k) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={it.src}
              src={it.src}
              alt={`${it.titulo} — ${it.detalle}`}
              loading={k === 0 ? "eager" : "lazy"}
              className={`absolute inset-0 h-full w-full object-cover object-top transition-opacity duration-700 ${
                k === i ? "opacity-100" : "opacity-0"
              }`}
            />
          ))}
        </div>
      </button>
      <p className="mt-3 text-center text-xs text-muted-foreground">
        Pantallas reales de clientes de Cauce, con sus datos tapados. Tocá para agrandar.
      </p>

      {/* Vista grande */}
      {abierta ? (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setAbierta(false)}
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={actual.src}
            alt={actual.titulo}
            className="max-h-[92vh] max-w-[96vw] rounded-lg object-contain shadow-2xl"
          />
          <button
            type="button"
            onClick={() => setAbierta(false)}
            aria-label="Cerrar"
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-xl text-white transition hover:bg-white/30"
          >
            ✕
          </button>
        </div>
      ) : null}
    </div>
  );
}
