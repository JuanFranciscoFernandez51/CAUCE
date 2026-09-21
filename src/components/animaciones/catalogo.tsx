"use client";

import { useMemo, useState } from "react";
import { ANIMACIONES } from "./registro";
import { PreviewViva } from "./preview-viva";

/**
 * Catálogo de animaciones, estilo catálogo de motos: filtros a la izquierda,
 * tarjetas chicas de a cuatro por fila. `modo="admin"` suma el botón de copiar
 * el uso y la ruta del código; `modo="publico"` muestra solo la demo.
 */
export function CatalogoAnimaciones({ modo }: { modo: "admin" | "publico" }) {
  const [cat, setCat] = useState("Todas");
  const [q, setQ] = useState("");
  const [copiado, setCopiado] = useState<string | null>(null);

  const categorias = useMemo(() => {
    const cuenta = new Map<string, number>();
    for (const a of ANIMACIONES) cuenta.set(a.categoria, (cuenta.get(a.categoria) ?? 0) + 1);
    return [["Todas", ANIMACIONES.length] as const, ...[...cuenta.entries()].sort((a, b) => b[1] - a[1])];
  }, []);

  const lista = ANIMACIONES.filter(
    (a) =>
      (cat === "Todas" || a.categoria === cat) &&
      (!q || `${a.nombre} ${a.descripcion} ${a.argumento}`.toLowerCase().includes(q.toLowerCase()))
  );

  async function copiar(id: string, texto: string) {
    await navigator.clipboard.writeText(texto);
    setCopiado(id);
    setTimeout(() => setCopiado(null), 1800);
  }

  return (
    <div className="flex flex-col gap-6 md:flex-row md:items-start">
      {/* Filtros: columna fija a la izquierda en desktop, fila con scroll en el celu */}
      <aside className="md:sticky md:top-24 md:w-52 md:shrink-0">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar efecto…"
          className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm outline-none focus:border-foreground/40"
        />
        <nav className="-mx-1 mt-3 flex gap-1.5 overflow-x-auto pb-1 md:mx-0 md:flex-col md:gap-0.5 md:overflow-visible">
          {categorias.map(([c, n]) => (
            <button
              key={c}
              type="button"
              onClick={() => setCat(c)}
              className={`flex shrink-0 items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm transition ${
                cat === c ? "bg-foreground font-semibold text-background" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <span className="whitespace-nowrap">{c}</span>
              <span className={`text-xs tabular-nums ${cat === c ? "opacity-70" : "opacity-50"}`}>{n}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Grilla */}
      <div className="min-w-0 flex-1">
        <p className="mb-3 text-xs text-muted-foreground">
          {lista.length} {lista.length === 1 ? "efecto" : "efectos"}
          {cat !== "Todas" ? ` en ${cat}` : ""}
          {q ? ` · “${q}”` : ""}
        </p>
        <div className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {lista.map((a) => (
            <article
              key={a.id}
              className="group overflow-hidden rounded-xl border border-border bg-card transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <PreviewViva pesada={a.pesada}>
                <a.Preview />
              </PreviewViva>
              <div className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h2 className="truncate text-sm font-semibold">{a.nombre}</h2>
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{a.categoria}</p>
                  </div>
                  {modo === "admin" ? (
                    <button
                      type="button"
                      onClick={() => copiar(a.id, a.uso)}
                      title={a.ruta}
                      className="shrink-0 rounded-md bg-foreground px-2.5 py-1 text-[11px] font-semibold text-background transition hover:opacity-90 active:scale-[0.97]"
                    >
                      {copiado === a.id ? "✓" : "Copiar"}
                    </button>
                  ) : null}
                </div>
                <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground" title={a.descripcion}>
                  {modo === "admin" ? a.descripcion : a.argumento}
                </p>
              </div>
            </article>
          ))}
        </div>
        {!lista.length ? <p className="py-16 text-center text-sm text-muted-foreground">No hay efectos con ese filtro.</p> : null}
      </div>
    </div>
  );
}
