"use client";

import { useMemo, useState } from "react";
import { ANIMACIONES } from "@/components/animaciones/registro";
import { PreviewViva } from "@/components/animaciones/preview-viva";

/** Ejemplos vivos para la web pública: solo la demo y una descripción corta (sin código). */
export function EjemplosAnimaciones() {
  const [cat, setCat] = useState<string>("Todas");
  const categorias = useMemo(() => ["Todas", ...Array.from(new Set(ANIMACIONES.map((a) => a.categoria)))], []);
  const lista = ANIMACIONES.filter((a) => cat === "Todas" || a.categoria === cat);
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-center gap-2">
        {categorias.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${cat === c ? "border-foreground bg-foreground text-background" : "border-border bg-card hover:bg-muted"}`}
          >
            {c}
          </button>
        ))}
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {lista.map((a) => (
          <div key={a.id} className="overflow-hidden rounded-2xl border border-border bg-card">
            <PreviewViva pesada={a.pesada}>
              <a.Preview />
            </PreviewViva>
            <div className="p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{a.categoria}</p>
              <h2 className="mt-1 text-lg font-bold">{a.nombre}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{a.argumento}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
