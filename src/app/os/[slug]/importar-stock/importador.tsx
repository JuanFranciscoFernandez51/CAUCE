"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Resultado = {
  filas: number;
  unidades: number;
  creados: number;
  actualizados: number;
  detalle: { cant: number; codigo: string; descripcion: string; marca: string; categoria: string }[];
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
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-10 text-center transition hover:bg-muted/40 ${ocupado ? "opacity-60" : ""}`}
      >
        <span className="text-3xl">📄</span>
        <span className="font-semibold">{ocupado ? "Leyendo el PDF…" : "Elegí el PDF del pedido"}</span>
        <span className="text-sm text-muted-foreground">
          El del proveedor (Malatesta): cantidad, código y descripción. La marca y la categoría se deducen solas.
        </span>
        <input
          type="file"
          accept="application/pdf"
          className="hidden"
          disabled={ocupado}
          onChange={(e) => void subir(e.target.files?.[0] ?? null)}
        />
      </label>

      {error ? <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p> : null}

      {res ? (
        <div className="rounded-xl border bg-card">
          <div className="flex flex-wrap gap-6 border-b px-4 py-3 text-sm">
            <span><strong>{res.filas}</strong> renglones</span>
            <span><strong>{res.unidades}</strong> unidades sumadas</span>
            <span className="text-success"><strong>{res.creados}</strong> productos nuevos</span>
            <span className="text-primary"><strong>{res.actualizados}</strong> actualizados</span>
          </div>
          <div className="max-h-[420px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-muted/80 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-3 py-2">Cant.</th>
                  <th className="px-3 py-2">Código</th>
                  <th className="px-3 py-2">Descripción</th>
                  <th className="px-3 py-2">Marca</th>
                  <th className="px-3 py-2">Categoría</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {res.detalle.map((f, i) => (
                  <tr key={i}>
                    <td className="px-3 py-1.5 tabular-nums">{f.cant}</td>
                    <td className="px-3 py-1.5 font-mono text-xs">{f.codigo}</td>
                    <td className="px-3 py-1.5">{f.descripcion}</td>
                    <td className="px-3 py-1.5 text-muted-foreground">{f.marca}</td>
                    <td className="px-3 py-1.5 text-muted-foreground">{f.categoria}</td>
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
