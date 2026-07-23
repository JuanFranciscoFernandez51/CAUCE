"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Input, Label, Stat } from "@/components/ui";
import { InlineEdit } from "../inline-edit";
import { fmtArs } from "../money";
import { calcularMetricasCostosFijos, type FinanzasConfig } from "../../_lib/finanzas";
import type { CostoView } from "./types";

/**
 * Costos fijos con edición inline + punto de equilibrio configurable:
 * cuántas ventas por mes hacen falta solo para cubrir los fijos.
 */
export function CostosFijosCliente({
  slug,
  costos,
  config,
}: {
  slug: string;
  costos: CostoView[];
  config: FinanzasConfig;
}) {
  const router = useRouter();
  const [unidades, setUnidades] = useState(String(config.unidadesEstimadasMes));
  const [margen, setMargen] = useState(String(config.margenPorUnidad));
  const [savingCfg, setSavingCfg] = useState(false);

  const metricas = useMemo(
    () =>
      calcularMetricasCostosFijos(costos, {
        unidadesEstimadasMes: Number(unidades) || 0,
        margenPorUnidad: Number(margen) || 0,
      }),
    [costos, unidades, margen]
  );

  const porCategoria = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of costos) if (c.activo) m.set(c.categoria, (m.get(c.categoria) ?? 0) + c.montoArs);
    return Array.from(m.entries())
      .map(([categoria, monto]) => ({ categoria, monto }))
      .sort((a, b) => b.monto - a.monto);
  }, [costos]);

  async function guardarParams() {
    setSavingCfg(true);
    const res = await fetch(`/api/os/${slug}/caja/config`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        unidadesEstimadasMes: Number(unidades) || 0,
        margenPorUnidad: Number(margen) || 0,
      }),
    });
    setSavingCfg(false);
    if (res.ok) router.refresh();
  }

  async function agregar() {
    const res = await fetch(`/api/os/${slug}/costos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ concepto: "Nuevo costo", categoria: "Otros", montoArs: 0 }),
    });
    if (res.ok) router.refresh();
  }

  async function borrar(id: string) {
    if (!confirm("¿Borrar este costo fijo?")) return;
    const res = await fetch(`/api/os/${slug}/costos?id=${id}`, { method: "DELETE" });
    if (res.ok) router.refresh();
  }

  async function toggleActivo(c: CostoView) {
    await fetch(`/api/os/${slug}/costos`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: c.id, activo: !c.activo }),
    });
    router.refresh();
  }

  const conBreakeven = Number(margen) > 0;

  return (
    <div className="space-y-6">
      {/* Métricas */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Costo fijo mensual" value={fmtArs(metricas.totalMensual)} />
        <Stat
          label="Por día"
          value={fmtArs(Math.round(metricas.costoPorDia))}
          hint="Lo que cuesta abrir la persiana cada día"
        />
        <Stat
          label="Ventas p/ cubrir (breakeven)"
          value={conBreakeven ? metricas.unidadesMinimas.toFixed(1) : "—"}
          tone="warning"
          hint={conBreakeven ? "Ventas por mes solo para empatar" : "Cargá el margen por venta"}
        />
        <Stat label="Costo fijo anual" value={fmtArs(metricas.costoAnual)} />
      </div>

      {/* Parámetros del breakeven */}
      <Card className="flex flex-wrap items-end gap-4 p-5">
        <div>
          <Label className="text-xs">Ventas estimadas / mes</Label>
          <Input
            type="number"
            className="w-44"
            value={unidades}
            onChange={(e) => setUnidades(e.target.value)}
          />
        </div>
        <div>
          <Label className="text-xs">Margen promedio por venta (ARS)</Label>
          <Input
            type="number"
            className="w-52"
            value={margen}
            onChange={(e) => setMargen(e.target.value)}
          />
        </div>
        <Button variant="secondary" size="sm" onClick={guardarParams} disabled={savingCfg}>
          {savingCfg ? "Guardando…" : "Guardar parámetros"}
        </Button>
        <p className="min-w-[220px] flex-1 text-xs text-muted-foreground">
          {conBreakeven ? (
            <>
              Necesitás{" "}
              <strong className="text-warning">
                {metricas.unidadesMinimas.toFixed(1)} ventas por mes
              </strong>{" "}
              (de {fmtArs(Number(margen) || 0)} de margen cada una) solo para cubrir los costos
              fijos. Lo que venga después de eso, es ganancia.
            </>
          ) : (
            <>Cargá cuánto te deja una venta promedio y te digo cuántas necesitás para empatar el mes.</>
          )}
        </p>
      </Card>

      {/* Subtotales por categoría */}
      {porCategoria.length > 1 ? (
        <Card className="p-5">
          <h2 className="mb-3 text-sm font-semibold">Costo fijo por categoría</h2>
          <div className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2 lg:grid-cols-3">
            {porCategoria.map((c) => (
              <div
                key={c.categoria}
                className="flex items-center justify-between border-b py-1 text-sm last:border-0"
              >
                <span className="text-muted-foreground">{c.categoria}</span>
                <span className="flex items-center gap-2">
                  <span className="text-[11px] tabular-nums text-muted-foreground">
                    {metricas.totalMensual > 0
                      ? `${((c.monto / metricas.totalMensual) * 100).toFixed(0)}%`
                      : ""}
                  </span>
                  <span className="font-medium tabular-nums">{fmtArs(c.monto)}</span>
                </span>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      {/* Tabla editable */}
      <div className="overflow-hidden rounded-lg border">
        <div className="flex items-center justify-between bg-muted px-4 py-2.5">
          <span className="text-sm font-semibold">Conceptos de costo fijo</span>
          <Button size="sm" variant="secondary" onClick={agregar}>
            + Agregar
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-xs text-muted-foreground">
                <th className="px-4 py-2 text-left font-medium">Concepto</th>
                <th className="px-4 py-2 text-left font-medium">Categoría</th>
                <th className="w-40 px-4 py-2 text-right font-medium">Monto mensual</th>
                <th className="w-20 px-4 py-2 text-right font-medium">% del total</th>
                <th className="px-4 py-2 text-left font-medium">Notas</th>
                <th className="w-24 px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {costos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    Sin costos fijos cargados. Arrancá con &quot;+ Agregar&quot;.
                  </td>
                </tr>
              ) : null}
              {costos.map((c) => (
                <tr
                  key={c.id}
                  className={`border-b last:border-0 hover:bg-muted/50 ${!c.activo ? "opacity-50" : ""}`}
                >
                  <td className="px-4 py-2">
                    <InlineEdit
                      endpoint={`/api/os/${slug}/costos`}
                      extraBody={{ id: c.id }}
                      field="concepto"
                      value={c.concepto}
                    />
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">
                    <InlineEdit
                      endpoint={`/api/os/${slug}/costos`}
                      extraBody={{ id: c.id }}
                      field="categoria"
                      value={c.categoria}
                    />
                  </td>
                  <td className="px-4 py-2 text-right">
                    <InlineEdit
                      endpoint={`/api/os/${slug}/costos`}
                      extraBody={{ id: c.id }}
                      field="montoArs"
                      type="number"
                      alignRight
                      value={c.montoArs}
                      display={(v) => fmtArs(Number(v) || 0)}
                    />
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums text-muted-foreground">
                    {c.activo && metricas.totalMensual > 0
                      ? `${((c.montoArs / metricas.totalMensual) * 100).toFixed(1)}%`
                      : "—"}
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">
                    <InlineEdit
                      endpoint={`/api/os/${slug}/costos`}
                      extraBody={{ id: c.id }}
                      field="notas"
                      value={c.notas}
                      placeholder="—"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => toggleActivo(c)}
                        className="rounded p-1.5 text-muted-foreground hover:bg-muted"
                        title={c.activo ? "Pausar (no suma al total)" : "Reactivar"}
                      >
                        {c.activo ? "⏸" : "▶"}
                      </button>
                      <button
                        onClick={() => borrar(c.id)}
                        className="rounded p-1.5 text-destructive hover:bg-destructive/10"
                        title="Borrar"
                      >
                        🗑
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              <tr className="border-t-2 bg-muted font-bold">
                <td className="px-4 py-2.5" colSpan={2}>
                  TOTAL COSTO FIJO MENSUAL
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums text-primary">
                  {fmtArs(metricas.totalMensual)}
                </td>
                <td className="px-4 py-2.5 text-right">100%</td>
                <td colSpan={2}></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Hacé click en cualquier celda para editarla: el total y las métricas se recalculan solos.
        Los costos pausados quedan en gris y no suman.
      </p>
    </div>
  );
}
