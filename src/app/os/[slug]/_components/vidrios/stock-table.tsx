"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type StockRow = {
  id: string;
  sku: string | null;
  nombre: string;
  marca: string | null;
  categoria: string;
  stock: number;
  precio: number;
  precioSeguro: number | null;
  precioSinMO: number | null;
  ubicacion: string | null;
};

/**
 * Stock de Código Auto: código, descripción, marca, ubicación, cantidad y las
 * TRES listas de precio del rubro (seguros, público y sin mano de obra).
 * Todo se edita en la misma fila; no hay catálogo público, así que no hay
 * foto, ni activo, ni destacado.
 */
export function StockTable({ slug, filas, categorias }: { slug: string; filas: StockRow[]; categorias: string[] }) {
  const router = useRouter();
  const [guardando, setGuardando] = useState<string | null>(null);
  const [tocado, setTocado] = useState<Record<string, Partial<StockRow>>>({});

  const valor = (f: StockRow, campo: keyof StockRow) =>
    (tocado[f.id]?.[campo] as string | number | null | undefined) ?? f[campo];

  function editar(id: string, campo: keyof StockRow, v: string | number | null) {
    setTocado((t) => ({ ...t, [id]: { ...t[id], [campo]: v } }));
  }

  async function guardar(f: StockRow) {
    const cambios = tocado[f.id];
    if (!cambios) return;
    setGuardando(f.id);
    await fetch(`/api/os/${slug}/bazar/productos/${f.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cambios),
    });
    setTocado((t) => {
      const n = { ...t };
      delete n[f.id];
      return n;
    });
    setGuardando(null);
    router.refresh();
  }

  async function borrar(f: StockRow) {
    if (!confirm(`¿Borrar ${f.nombre}?`)) return;
    setGuardando(f.id);
    await fetch(`/api/os/${slug}/bazar/productos/${f.id}`, { method: "DELETE" });
    setGuardando(null);
    router.refresh();
  }

  const num = "w-24 rounded-md border bg-card px-2 py-1 text-right text-sm tabular-nums";
  const txt = "w-full rounded-md border bg-card px-2 py-1 text-sm";

  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full min-w-[1080px] text-sm">
        <thead className="bg-muted/50 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-3 py-2.5">Código</th>
            <th className="px-3 py-2.5">Descripción</th>
            <th className="px-3 py-2.5">Marca</th>
            <th className="px-3 py-2.5">Categoría</th>
            <th className="px-3 py-2.5 text-right">Cant.</th>
            <th className="px-3 py-2.5 text-right">P. seguros</th>
            <th className="px-3 py-2.5 text-right">P. público</th>
            <th className="px-3 py-2.5 text-right">P. s/ M.O.</th>
            <th className="px-3 py-2.5" />
          </tr>
        </thead>
        <tbody className="divide-y">
          {filas.map((f) => {
            const sucio = !!tocado[f.id];
            return (
              <tr key={f.id} className={sucio ? "bg-primary/5" : "transition-colors hover:bg-muted/30"}>
                <td className="px-3 py-2 font-mono text-xs font-semibold">{f.sku ?? "—"}</td>
                <td className="px-3 py-2 min-w-[280px]">
                  <input
                    value={String(valor(f, "nombre") ?? "")}
                    onChange={(e) => editar(f.id, "nombre", e.target.value)}
                    className={txt}
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    value={String(valor(f, "marca") ?? "")}
                    onChange={(e) => editar(f.id, "marca", e.target.value)}
                    className="w-28 rounded-md border bg-card px-2 py-1 text-sm"
                  />
                </td>
                <td className="px-3 py-2">
                  <select
                    value={String(valor(f, "categoria") ?? "")}
                    onChange={(e) => editar(f.id, "categoria", e.target.value)}
                    className="w-32 rounded-md border bg-card px-2 py-1 text-sm"
                  >
                    {[...new Set([f.categoria, ...categorias])].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-2 text-right">
                  <input
                    type="number"
                    min={0}
                    value={Number(valor(f, "stock") ?? 0)}
                    onChange={(e) => editar(f.id, "stock", Number(e.target.value))}
                    className={`${num} w-16 ${Number(valor(f, "stock")) <= 2 ? "text-destructive" : ""}`}
                  />
                </td>
                {(["precioSeguro", "precio", "precioSinMO"] as const).map((campo) => (
                  <td key={campo} className="px-3 py-2 text-right">
                    <input
                      type="number"
                      min={0}
                      placeholder="—"
                      value={(valor(f, campo) as number | null) ?? ""}
                      onChange={(e) => editar(f.id, campo, e.target.value === "" ? null : Number(e.target.value))}
                      className={num}
                    />
                  </td>
                ))}
                <td className="px-3 py-2 text-right">
                  {sucio ? (
                    <button
                      onClick={() => guardar(f)}
                      disabled={guardando === f.id}
                      className="rounded-md bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
                    >
                      Guardar
                    </button>
                  ) : (
                    <button
                      onClick={() => borrar(f)}
                      disabled={guardando === f.id}
                      title="Borrar"
                      className="rounded-md border px-2 py-1 text-xs text-muted-foreground transition hover:border-destructive hover:text-destructive"
                    >
                      🗑
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
          {!filas.length ? (
            <tr>
              <td colSpan={9} className="px-3 py-10 text-center text-muted-foreground">
                Sin productos para este filtro.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
