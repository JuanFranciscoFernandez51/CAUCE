"use client";

import { useMemo, useState } from "react";
import { ANIMACIONES } from "@/components/animaciones/registro";
import { PreviewViva } from "@/components/animaciones/preview-viva";

/** Galería interna: vista previa viva + copiar el uso para meterla en un proyecto. */
export function GaleriaAnimaciones() {
  const [copiado, setCopiado] = useState<string | null>(null);
  const [cat, setCat] = useState<string>("Todas");
  const [q, setQ] = useState("");
  const categorias = useMemo(() => ["Todas", ...Array.from(new Set(ANIMACIONES.map((a) => a.categoria)))], []);
  const lista = ANIMACIONES.filter(
    (a) => (cat === "Todas" || a.categoria === cat) && (!q || `${a.nombre} ${a.descripcion}`.toLowerCase().includes(q.toLowerCase()))
  );

  async function copiar(id: string, texto: string) {
    await navigator.clipboard.writeText(texto);
    setCopiado(id);
    setTimeout(() => setCopiado(null), 1800);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        {categorias.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${cat === c ? "border-foreground bg-foreground text-background" : "border-border hover:bg-muted"}`}
          >
            {c} <span className="opacity-60">{c === "Todas" ? ANIMACIONES.length : ANIMACIONES.filter((a) => a.categoria === c).length}</span>
          </button>
        ))}
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar…"
          className="ml-auto h-9 w-48 rounded-full border bg-card px-3 text-sm"
        />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {lista.map((a) => (
          <div key={a.id} className="overflow-hidden rounded-2xl border border-border bg-card">
            <PreviewViva pesada={a.pesada}>
              <a.Preview />
            </PreviewViva>
            <div className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-lg font-bold">{a.nombre}</h2>
                  <p className="text-xs text-muted-foreground">
                    {a.categoria} · {a.origen} · <code className="text-[11px]">{a.ruta}</code>
                  </p>
                </div>
                <button
                  onClick={() => copiar(a.id, a.uso)}
                  className="rounded-lg bg-foreground px-4 py-2 text-xs font-semibold text-background transition hover:opacity-90 active:scale-[0.97]"
                >
                  {copiado === a.id ? "✓ Copiado" : "Copiar uso"}
                </button>
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
    </div>
  );
}
