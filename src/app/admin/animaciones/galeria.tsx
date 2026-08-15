"use client";

import { useState } from "react";
import { ANIMACIONES } from "@/components/animaciones/registro";

/** Galería interna: vista previa viva + copiar el uso para meterla en un proyecto. */
export function GaleriaAnimaciones() {
  const [copiado, setCopiado] = useState<string | null>(null);

  async function copiar(id: string, texto: string) {
    await navigator.clipboard.writeText(texto);
    setCopiado(id);
    setTimeout(() => setCopiado(null), 1800);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {ANIMACIONES.map((a) => (
        <div key={a.id} className="overflow-hidden rounded-2xl border border-border bg-card">
          {/* Vista previa viva sobre fondo oscuro, para vender */}
          <div className="flex min-h-[260px] items-center justify-center p-6" style={{ backgroundColor: "#0b0b0f" }}>
            <a.Preview />
          </div>
          <div className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-bold">{a.nombre}</h2>
                <p className="text-xs text-muted-foreground">
                  {a.categoria} · {a.origen} · <code className="text-[11px]">{a.ruta}</code>
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => copiar(a.id, a.uso)}
                  className="rounded-lg bg-foreground px-4 py-2 text-xs font-semibold text-background transition hover:opacity-90 active:scale-[0.97]"
                >
                  {copiado === a.id ? "✓ Copiado" : "Copiar uso"}
                </button>
              </div>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">{a.descripcion}</p>
            <p className="mt-2 rounded-lg bg-muted/60 px-3 py-2 text-sm">
              <span className="font-semibold">Para vender: </span>
              {a.argumento}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
