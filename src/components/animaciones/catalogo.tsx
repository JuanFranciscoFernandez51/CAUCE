"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ANIMACIONES } from "./registro";
import { PreviewViva } from "./preview-viva";

/**
 * Catálogo de animaciones, estilo catálogo de motos: filtros angostos a la
 * izquierda y tarjetas grandes (3 por fila en pantalla ancha). Cada tarjeta
 * abre su ficha. `modo="admin"` enlaza a la ficha con código.
 */
export function CatalogoAnimaciones({ modo }: { modo: "admin" | "publico" }) {
  const [cat, setCat] = useState("Todas");
  const [q, setQ] = useState("");
  const base = modo === "admin" ? "/admin/animaciones" : "/animaciones";

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

  return (
    <div className="flex flex-col gap-5 md:flex-row md:items-start">
      {/* Filtros: columna angosta y fija en desktop, fila deslizable en el celu */}
      <aside className="md:sticky md:top-24 md:w-40 md:shrink-0">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar…"
          className="h-9 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none focus:border-foreground/40"
        />
        <nav className="-mx-1 mt-2 flex gap-1 overflow-x-auto pb-1 md:mx-0 md:flex-col md:gap-0 md:overflow-visible">
          {categorias.map(([c, n]) => (
            <button
              key={c}
              type="button"
              onClick={() => setCat(c)}
              className={`flex shrink-0 items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-left text-[13px] transition ${
                cat === c ? "bg-foreground font-semibold text-background" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <span className="whitespace-nowrap">{c}</span>
              <span className={`text-[11px] tabular-nums ${cat === c ? "opacity-70" : "opacity-50"}`}>{n}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Grilla */}
      <div className="min-w-0 flex-1">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {lista.map((a) => (
            <Link
              key={a.id}
              href={`${base}/${a.id}`}
              className="group block overflow-hidden rounded-xl border border-border bg-card transition hover:-translate-y-0.5 hover:border-foreground/30 hover:shadow-lg"
            >
              <PreviewViva pesada={a.pesada}>
                <a.Preview />
              </PreviewViva>
              <div className="flex items-center justify-between gap-3 px-3.5 py-2.5">
                <div className="min-w-0">
                  <h2 className="truncate text-[15px] font-semibold">{a.nombre}</h2>
                  <p className="truncate text-xs text-muted-foreground">{a.argumento}</p>
                </div>
                <span className="shrink-0 text-sm text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-foreground">→</span>
              </div>
            </Link>
          ))}
        </div>
        {!lista.length ? <p className="py-16 text-center text-sm text-muted-foreground">No hay efectos con ese filtro.</p> : null}
      </div>
    </div>
  );
}
