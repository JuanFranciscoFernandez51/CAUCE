"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Resultado = {
  tipo: "pedido" | "precios";
  filas: number;
  unidades?: number;
  creados?: number;
  actualizados: number;
  faltantes?: string[];
  faltantesTotal?: number;
  detalle: Record<string, string | number | null | undefined>[];
};

/** Subís el PDF del pedido (Malatesta) y el stock se suma solo. */
export function ImportadorStock({ slug }: { slug: string }) {
  const router = useRouter();
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState("");
  const [res, setRes] = useState<Resultado | null>(null);

  async function subir(file: File | null) {
    if (!file) return;
    setOcupado(true);
    setError("");
    setRes(null);
    const fd = new FormData();
    fd.set("file", file);
    const r = await fetch(`/api/os/${slug}/stock-pdf`, { method: "POST", body: fd });
    const d = await r.json().catch(() => null);
    setOcupado(false);
    if (!r.ok || !d?.ok) {
      setError(d?.error ?? "No se pudo importar");
      return;
    }
    setRes(d);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <label
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 text-center transition hover:bg-muted/40 ${ocupado ? "opacity-60" : ""}`}
      >
        <span className="text-3xl">📥</span>
        <span className="font-semibold">{ocupado ? "Leyendo el archivo…" : "Soltá el archivo acá"}</span>
        <span className="max-w-lg text-sm text-muted-foreground">
          <strong>Pedido del proveedor</strong> (cantidad + código): suma al stock y crea los códigos nuevos.{" "}
          <strong>Lista de precios</strong> (código + precios): actualiza precios en masa. PDF, Excel o CSV — el
          sistema se da cuenta solo de qué archivo es.
        </span>
        <input
          type="file"
          accept=".pdf,.csv,.txt,.xlsx,.xls"
          className="hidden"
          disabled={ocupado}
          onChange={(e) => void subir(e.target.files?.[0] ?? null)}
        />
      </label>

      {error ? <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p> : null}

      {res ? (
        <div className="rounded-xl border bg-card">
          <div className="flex flex-wrap items-center gap-4 border-b px-4 py-3 text-sm">
            <span className="rounded-full bg-primary/15 px-2.5 py-1 text-xs font-semibold text-primary">
              {res.tipo === "pedido" ? "📦 Pedido del proveedor" : "🏷 Lista de precios"}
            </span>
            <span><strong>{res.filas}</strong> renglones leídos</span>
            {res.tipo === "pedido" ? (
              <>
                <span><strong>{res.unidades}</strong> unidades sumadas</span>
                <span className="text-success"><strong>{res.creados}</strong> productos nuevos</span>
              </>
            ) : null}
            <span className="text-primary"><strong>{res.actualizados}</strong> actualizados</span>
            {res.faltantesTotal ? (
              <span className="text-warning" title={res.faltantes?.join(", ")}>
                <strong>{res.faltantesTotal}</strong> códigos sin producto
              </span>
            ) : null}
          </div>
          <div className="max-h-[420px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-muted/80 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  {res.tipo === "pedido" ? <th className="px-3 py-2">Cant.</th> : null}
                  <th className="px-3 py-2">Código</th>
                  <th className="px-3 py-2">Descripción</th>
                  {res.tipo === "pedido" ? (
                    <>
                      <th className="px-3 py-2">Marca</th>
                      <th className="px-3 py-2">Categoría</th>
                    </>
                  ) : (
                    <>
                      <th className="px-3 py-2 text-right">P. seguros</th>
                      <th className="px-3 py-2 text-right">P. público</th>
                      <th className="px-3 py-2 text-right">P. s/ M.O.</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y">
                {res.detalle.map((f, i) => (
                  <tr key={i}>
                    {res.tipo === "pedido" ? <td className="px-3 py-1.5 tabular-nums">{f.cant}</td> : null}
                    <td className="px-3 py-1.5 font-mono text-xs">{f.codigo}</td>
                    <td className="px-3 py-1.5">{f.descripcion}</td>
                    {res.tipo === "pedido" ? (
                      <>
                        <td className="px-3 py-1.5 text-muted-foreground">{f.marca}</td>
                        <td className="px-3 py-1.5 text-muted-foreground">{f.categoria}</td>
                      </>
                    ) : (
                      <>
                        <td className="px-3 py-1.5 text-right tabular-nums">{f.precioSeguro ?? "—"}</td>
                        <td className="px-3 py-1.5 text-right tabular-nums">{f.precio ?? "—"}</td>
                        <td className="px-3 py-1.5 text-right tabular-nums">{f.precioSinMO ?? "—"}</td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}
