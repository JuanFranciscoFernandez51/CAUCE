"use client";

import { useRef, useState } from "react";
import { BZ } from "./bazar-shell";

/** Carrusel de fotos del producto: flechas + dots + swipe táctil. */
export function Carrusel({ fotos, alt }: { fotos: string[]; alt: string }) {
  const [idx, setIdx] = useState(0);
  const touchX = useRef<number | null>(null);

  if (fotos.length === 0) {
    return (
      <div
        className="flex aspect-square w-full items-center justify-center rounded-3xl text-6xl"
        style={{ backgroundColor: "var(--t-suave)" }}
      >
        
      </div>
    );
  }

  const ir = (n: number) => setIdx((n + fotos.length) % fotos.length);

  return (
    <div className="relative">
      <div
        className="relative aspect-square w-full overflow-hidden rounded-3xl"
        style={{ backgroundColor: "var(--t-suave)" }}
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
        <img src={fotos[idx]} alt={`${alt} — foto ${idx + 1}`} className="h-full w-full object-cover" />
      </div>

      {fotos.length > 1 ? (
        <>
          <button
            type="button"
            aria-label="Foto anterior"
            onClick={() => ir(idx - 1)}
            className="absolute left-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-lg shadow transition-transform hover:scale-105"
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="Foto siguiente"
            onClick={() => ir(idx + 1)}
            className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-lg shadow transition-transform hover:scale-105"
          >
            ›
          </button>
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
            {fotos.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Ir a la foto ${i + 1}`}
                onClick={() => setIdx(i)}
                className="h-2 w-2 rounded-full transition-colors"
                style={{ backgroundColor: i === idx ? "var(--tpl, #3FA9A5)" : "rgba(255,255,255,0.8)" }}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
