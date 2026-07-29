"use client";

import { useEffect, useRef, useState } from "react";
import { RC } from "./conce-shell";
import { IconAuto } from "./iconos";

/**
 * Carrusel de la ficha del vehículo: foto grande con flechas + swipe táctil
 * y tira de miniaturas clickeables (los autos traen 10-30 fotos).
 */
export function CarruselVehiculo({ fotos, alt }: { fotos: string[]; alt: string }) {
  const [idx, setIdx] = useState(0);
  const [ampliada, setAmpliada] = useState(false);
  const touchX = useRef<number | null>(null);

  // Teclado en el visor: ← → para pasar, Esc para cerrar.
  useEffect(() => {
    if (!ampliada) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAmpliada(false);
      if (e.key === "ArrowLeft") setIdx((i) => (i - 1 + fotos.length) % fotos.length);
      if (e.key === "ArrowRight") setIdx((i) => (i + 1) % fotos.length);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [ampliada, fotos.length]);

  if (fotos.length === 0) {
    return (
      <div
        className="flex aspect-[4/3] w-full items-center justify-center rounded-3xl"
        style={{ backgroundColor: RC.doradoSuave }}
      >
        <IconAuto className="h-16 w-16" style={{ color: RC.dorado }} />
      </div>
    );
  }

  const ir = (n: number) => setIdx((n + fotos.length) % fotos.length);

  return (
    <div>
      <div
        className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl"
        style={{ backgroundColor: "#111" }}
        onTouchStart={(e) => {
          touchX.current = e.touches[0].clientX;
        }}
        onTouchEnd={(e) => {
          if (touchX.current == null) return;
          const dx = e.changedTouches[0].clientX - touchX.current;
          if (dx > 40) ir(idx - 1);
          if (dx < -40) ir(idx + 1);
          touchX.current = null;
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={fotos[idx]}
          alt={`${alt} — foto ${idx + 1}`}
          className="h-full w-full cursor-zoom-in object-cover"
          onClick={() => setAmpliada(true)}
        />
        <button
          type="button"
          aria-label="Ampliar foto"
          onClick={() => setAmpliada(true)}
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur transition-transform hover:scale-105"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden>
            <path d="M9 4H4v5M15 4h5v5M15 20h5v-5M9 20H4v-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        {fotos.length > 1 ? (
          <>
            <button
              type="button"
              aria-label="Foto anterior"
              onClick={() => ir(idx - 1)}
              className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow transition-transform hover:scale-105"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="h-5 w-5" aria-hidden>
                <path d="m14 6-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              type="button"
              aria-label="Foto siguiente"
              onClick={() => ir(idx + 1)}
              className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow transition-transform hover:scale-105"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="h-5 w-5" aria-hidden>
                <path d="m10 6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <span className="absolute bottom-3 right-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white">
              {idx + 1} / {fotos.length}
            </span>
          </>
        ) : null}
      </div>

      {fotos.length > 1 ? (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {fotos.map((f, i) => (
            <button
              key={`${f}-${i}`}
              type="button"
              aria-label={`Ir a la foto ${i + 1}`}
              onClick={() => setIdx(i)}
              className="shrink-0 overflow-hidden rounded-xl transition-opacity"
              style={{
                border: i === idx ? `2px solid ${RC.dorado}` : "2px solid transparent",
                opacity: i === idx ? 1 : 0.65,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={f} alt="" className="h-14 w-20 object-cover" loading="lazy" />
            </button>
          ))}
        </div>
      ) : null}

      {/* ── Visor a pantalla completa ── */}
      {ampliada ? (
        <div
          className="fixed inset-0 z-[100] flex flex-col bg-black/95 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={`${alt} — foto ${idx + 1} de ${fotos.length}`}
          onClick={() => setAmpliada(false)}
        >
          <div className="flex items-center justify-between px-5 py-4 text-white">
            <span className="text-sm font-medium">
              {idx + 1} / {fotos.length}
            </span>
            <button
              type="button"
              aria-label="Cerrar"
              onClick={() => setAmpliada(false)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="h-5 w-5" aria-hidden>
                <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <div
            className="relative flex flex-1 items-center justify-center px-3 pb-4"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => {
              touchX.current = e.touches[0].clientX;
            }}
            onTouchEnd={(e) => {
              if (touchX.current == null) return;
              const dx = e.changedTouches[0].clientX - touchX.current;
              if (dx > 45) ir(idx - 1);
              if (dx < -45) ir(idx + 1);
              touchX.current = null;
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={fotos[idx]}
              alt={`${alt} — foto ${idx + 1}`}
              className="max-h-full max-w-full rounded-2xl object-contain"
            />
            {fotos.length > 1 ? (
              <>
                <button
                  type="button"
                  aria-label="Foto anterior"
                  onClick={() => ir(idx - 1)}
                  className="absolute left-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/12 text-white backdrop-blur transition-colors hover:bg-white/25 sm:left-8"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="h-6 w-6" aria-hidden>
                    <path d="m14 6-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <button
                  type="button"
                  aria-label="Foto siguiente"
                  onClick={() => ir(idx + 1)}
                  className="absolute right-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/12 text-white backdrop-blur transition-colors hover:bg-white/25 sm:right-8"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="h-6 w-6" aria-hidden>
                    <path d="m10 6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </>
            ) : null}
          </div>

          {fotos.length > 1 ? (
            <div
              className="flex gap-2 overflow-x-auto px-5 pb-5"
              onClick={(e) => e.stopPropagation()}
            >
              {fotos.map((f, i) => (
                <button
                  key={`vis-${f}-${i}`}
                  type="button"
                  aria-label={`Ir a la foto ${i + 1}`}
                  onClick={() => setIdx(i)}
                  className="shrink-0 overflow-hidden rounded-lg transition-opacity"
                  style={{
                    border: i === idx ? `2px solid ${RC.dorado}` : "2px solid transparent",
                    opacity: i === idx ? 1 : 0.5,
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={f} alt="" className="h-12 w-16 object-cover" loading="lazy" />
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
