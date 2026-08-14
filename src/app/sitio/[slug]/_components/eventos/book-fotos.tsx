"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Book de fotos con visor: click en una foto y se agranda a pantalla
 * completa, con flechas para verlas una por una. Estética Jess (tinta/crema).
 */
export function BookFotos({ fotos, alt }: { fotos: string[]; alt: string }) {
  const [abierta, setAbierta] = useState<number | null>(null);

  const mover = useCallback(
    (d: number) => setAbierta((a) => (a === null ? a : (a + d + fotos.length) % fotos.length)),
    [fotos.length]
  );

  useEffect(() => {
    if (abierta === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAbierta(null);
      if (e.key === "ArrowRight") mover(1);
      if (e.key === "ArrowLeft") mover(-1);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [abierta, mover]);

  return (
    <>
      <div className="columns-1 gap-5 sm:columns-2 lg:columns-3 [&>button]:mb-5">
        {fotos.map((url, i) => (
          <button
            key={url}
            onClick={() => setAbierta(i)}
            className="block w-full break-inside-avoid cursor-zoom-in overflow-hidden bg-white p-3 text-left"
            aria-label={`Ver foto ${i + 1} en grande`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={alt} className="w-full object-cover transition-transform duration-500 hover:scale-[1.03]" />
          </button>
        ))}
      </div>

      {abierta !== null ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-10"
          style={{ backgroundColor: "rgba(26,24,22,0.94)" }}
          onClick={() => setAbierta(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={fotos[abierta]}
            alt={alt}
            className="max-h-full max-w-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={(e) => { e.stopPropagation(); setAbierta(null); }}
            aria-label="Cerrar"
            className="absolute right-5 top-5 flex h-11 w-11 items-center justify-center border text-[18px] transition hover:opacity-70"
            style={{ borderColor: "rgba(237,232,222,.4)", color: "#EDE8DE" }}
          >
            ✕
          </button>
          {fotos.length > 1 ? (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); mover(-1); }}
                aria-label="Anterior"
                className="absolute left-4 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center border text-[22px] transition hover:opacity-70 sm:left-8"
                style={{ borderColor: "rgba(237,232,222,.4)", color: "#EDE8DE" }}
              >
                ‹
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); mover(1); }}
                aria-label="Siguiente"
                className="absolute right-4 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center border text-[22px] transition hover:opacity-70 sm:right-8"
                style={{ borderColor: "rgba(237,232,222,.4)", color: "#EDE8DE" }}
              >
                ›
              </button>
            </>
          ) : null}
          <p
            className="absolute bottom-5 left-1/2 -translate-x-1/2 text-[11px] font-semibold tracking-[0.3em]"
            style={{ color: "rgba(237,232,222,.7)" }}
          >
            {abierta + 1} / {fotos.length}
          </p>
        </div>
      ) : null}
    </>
  );
}
