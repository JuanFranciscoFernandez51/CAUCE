"use client";

import { useState } from "react";

type Shot = { titulo: string; url: string; href?: string };

/** Galería de capturas: click para ampliar (lightbox) + botón Visitar. */
export function Galeria({ shots }: { shots: Shot[] }) {
  const [abierta, setAbierta] = useState<Shot | null>(null);

  return (
    <>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {shots.map((s) => (
          <figure key={s.url} className="overflow-hidden rounded-lg border bg-card">
            <button
              type="button"
              onClick={() => setAbierta(s)}
              className="block w-full cursor-zoom-in"
              aria-label={`Ampliar: ${s.titulo}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.url} alt={s.titulo} className="w-full transition hover:opacity-90" loading="lazy" />
            </button>
            <figcaption className="flex items-center justify-between gap-2 border-t px-3 py-2">
              <span className="text-xs text-muted-foreground">{s.titulo}</span>
              {s.href ? (
                <a
                  href={s.href}
                  target="_blank"
                  rel="noreferrer"
                  className="shrink-0 rounded-md border px-2.5 py-1 text-xs font-medium text-primary hover:bg-muted"
                >
                  Visitar →
                </a>
              ) : null}
            </figcaption>
          </figure>
        ))}
      </div>

      {abierta ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setAbierta(null)}
        >
          <div className="max-h-full max-w-5xl overflow-auto" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={abierta.url} alt={abierta.titulo} className="w-full rounded-lg" />
            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="text-sm text-white/90">{abierta.titulo}</p>
              <div className="flex gap-2">
                {abierta.href ? (
                  <a
                    href={abierta.href}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-md bg-white px-3 py-1.5 text-sm font-medium text-black hover:opacity-90"
                  >
                    Visitar la página →
                  </a>
                ) : null}
                <button
                  type="button"
                  onClick={() => setAbierta(null)}
                  className="rounded-md border border-white/40 px-3 py-1.5 text-sm text-white hover:bg-white/10"
                >
                  Cerrar ✕
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
