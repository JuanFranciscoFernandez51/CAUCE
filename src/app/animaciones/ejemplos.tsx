"use client";

import { ANIMACIONES } from "@/components/animaciones/registro";

/** Ejemplos vivos para la web pública: solo la demo y una descripción corta. */
export function EjemplosAnimaciones() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {ANIMACIONES.map((a) => (
        <div key={a.id} className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="flex min-h-[260px] items-center justify-center p-6" style={{ backgroundColor: "#0b0b0f" }}>
            <a.Preview />
          </div>
          <div className="p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{a.categoria}</p>
            <h2 className="mt-1 text-lg font-bold">{a.nombre}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{a.argumento}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
