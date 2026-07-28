"use client";

import { useRef, useState } from "react";
import { RC } from "./conce-shell";

/**
 * Carrusel de la ficha del vehículo: foto grande con flechas + swipe táctil
 * y tira de miniaturas clickeables (los autos traen 10-30 fotos).
 */
export function CarruselVehiculo({ fotos, alt }: { fotos: string[]; alt: string }) {
  const [idx, setIdx] = useState(0);
  const touchX = useRef<number | null>(null);

  if (fotos.length === 0) {
    return (
      <div
        className="flex aspect-[4/3] w-full items-center justify-center rounded-3xl text-6xl"
        style={{ backgroundColor: RC.doradoSuave }}
      >
        🚗
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
          className="h-full w-full object-cover"
        />
        {fotos.length > 1 ? (
          <>
            <button
              type="button"
              aria-label="Foto anterior"
              onClick={() => ir(idx - 1)}
              className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-lg shadow transition-transform hover:scale-105"
            >
              ‹
            </button>
            <button
              type="button"
              aria-label="Foto siguiente"
              onClick={() => ir(idx + 1)}
              className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-lg shadow transition-transform hover:scale-105"
            >
              ›
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
    </div>
  );
}
