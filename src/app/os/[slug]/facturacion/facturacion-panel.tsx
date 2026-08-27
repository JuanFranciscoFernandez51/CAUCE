"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { OrdenFacturacion } from "@/lib/vidrios";

export type FacturaRow = {
  id: string;
  numero: number;
  nombre: string;
  vehiculo: string;
  total: number;
  facturacion: OrdenFacturacion;
  fecha: string;
};

const TABS: { key: OrdenFacturacion; label: string }[] = [
  { key: "sin_facturar", label: "Sin facturar" },
  { key: "a_facturar", label: "A facturar" },
  { key: "facturada", label: "Facturadas" },
];

/**
 * Selección con checkboxes: en "Sin facturar" se marcan las que van a factura,
 * en "A facturar" se confirman como facturadas (cuando esté ARCA, acá se emite el CAE).
 */
export function FacturacionPanel({ slug, ordenes }: { slug: string; ordenes: FacturaRow[] }) {
  const router = useRouter();
  const [tab, setTab] = useState<OrdenFacturacion>("sin_facturar");
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [ocupado, setOcupado] = useState(false);
  const plata = (n: number) => `$ ${n.toLocaleString("es-AR")}`;

  const porTab = useMemo(() => ordenes.filter((o) => o.facturacion === tab), [ordenes, tab]);
  const totales = useMemo(() => {
    const t: Record<OrdenFacturacion, number> = { sin_facturar: 0, a_facturar: 0, facturada: 0 };
    for (const o of ordenes) t[o.facturacion] += o.total;
    return t;
  }, [ordenes]);
  const totalSel = porTab.filter((o) => sel.has(o.id)).reduce((a, o) => a + o.total, 0);

  function toggle(id: string) {
    const s = new Set(sel);
    if (s.has(id)) s.delete(id);
    else s.add(id);
    setSel(s);
  }

  async function mover(destino: OrdenFacturacion) {
    const ids = porTab.filter((o) => sel.has(o.id)).map((o) => o.id);
    if (!ids.length) return;
    setOcupado(true);
    await Promise.all(
      ids.map((id) =>
        fetch(`/api/os/${slug}/ordenes/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ facturacion: destino }),
        })
      )
    );
    setOcupado(false);
    setSel(new Set());
    router.refresh();
  }

  const seleccionables = tab !== "facturada";
  const todasMarcadas = porTab.length > 0 && porTab.every((o) => sel.has(o.id));

  return (
    <div className="space-y-4">
      {/* Totales por estado */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => {
              setTab(t.key);
              setSel(new Set());
            }}
            className={`rounded-xl border p-4 text-left transition hover:shadow-sm ${
              tab === t.key ? "border-primary bg-primary-soft" : "bg-card"
            }`}
          >
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t.label}</p>
            <p className="mt-1 text-xl font-bold tabular-nums">{plata(totales[t.key])}</p>
            <p className="text-xs text-muted-foreground">
              {ordenes.filter((o) => o.facturacion === t.key).length} orden
              {ordenes.filter((o) => o.facturacion === t.key).length === 1 ? "" : "es"}
            </p>
          </button>
        ))}
      </div>

      {/* Barra de acción sobre lo seleccionado */}
      {seleccionables && sel.size > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/40 bg-primary-soft px-4 py-3">
          <p className="text-sm font-medium">
            {sel.size} seleccionada{sel.size === 1 ? "" : "s"} · {plata(totalSel)}
          </p>
          <div className="flex gap-2">
            {tab === "sin_facturar" ? (
              <button
                onClick={() => mover("a_facturar")}
                disabled={ocupado}
                className="h-9 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
              >
                Pasar a facturar →
              </button>
            ) : (
              <>
                <button
                  onClick={() => mover("sin_facturar")}
                  disabled={ocupado}
                  className="h-9 rounded-lg border px-4 text-sm font-medium transition hover:bg-muted disabled:opacity-50"
                >
                  ← Volver
                </button>
                <button
                  onClick={() => mover("facturada")}
                  disabled={ocupado}
                  className="h-9 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
                >
                  ✓ Marcar facturadas
                </button>
              </>
            )}
          </div>
        </div>
      ) : null}

      {porTab.length === 0 ? (
        <p className="rounded-xl border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
          No hay órdenes en “{TABS.find((t) => t.key === tab)?.label}”.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                {seleccionables ? (
                  <th className="w-10 px-3 py-2.5">
                    <input
                      type="checkbox"
                      checked={todasMarcadas}
                      onChange={() => setSel(todasMarcadas ? new Set() : new Set(porTab.map((o) => o.id)))}
                      aria-label="Seleccionar todas"
                    />
                  </th>
                ) : null}
                <th className="px-3 py-2.5">N°</th>
                <th className="px-3 py-2.5">Cliente</th>
                <th className="px-3 py-2.5">Vehículo</th>
                <th className="px-3 py-2.5">Fecha</th>
                <th className="px-3 py-2.5 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {porTab.map((o) => (
                <tr
                  key={o.id}
                  onClick={seleccionables ? () => toggle(o.id) : undefined}
                  className={`transition-colors ${seleccionables ? "cursor-pointer hover:bg-muted/30" : ""} ${
                    sel.has(o.id) ? "bg-primary-soft" : ""
                  }`}
                >
                  {seleccionables ? (
                    <td className="px-3 py-2.5">
                      <input type="checkbox" checked={sel.has(o.id)} onChange={() => toggle(o.id)} onClick={(e) => e.stopPropagation()} aria-label={`Seleccionar orden ${o.numero}`} />
                    </td>
                  ) : null}
                  <td className="px-3 py-2.5 font-semibold">#{String(o.numero).padStart(4, "0")}</td>
                  <td className="px-3 py-2.5 font-medium">{o.nombre}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">{o.vehiculo || "—"}</td>
                  <td className="px-3 py-2.5 text-xs text-muted-foreground">{o.fecha}</td>
                  <td className="px-3 py-2.5 text-right font-semibold tabular-nums">{plata(o.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
