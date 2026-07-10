"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, ErrorState, Field, Input, Spinner, Stat } from "@/components/ui";
import { fmtArs } from "../money";

export type CostoData = { id: string; concepto: string; montoArs: number };

/**
 * Costos fijos + punto de equilibrio: cuánto tiene que entrar por mes para
 * no perder plata, y cómo viene el mes actual contra ese número.
 */
export function CostosSection({
  slug,
  costos: initial,
  ingresosMes,
  mesLabel,
}: {
  slug: string;
  costos: CostoData[];
  ingresosMes: number;
  mesLabel: string;
}) {
  const router = useRouter();
  const [costos, setCostos] = useState(initial);
  const [concepto, setConcepto] = useState("");
  const [monto, setMonto] = useState("");
  const [editando, setEditando] = useState<string | null>(null);
  const [editMonto, setEditMonto] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const totalFijos = costos.reduce((s, c) => s + c.montoArs, 0);
  const cubierto = totalFijos > 0 ? Math.min(100, Math.round((ingresosMes / totalFijos) * 100)) : null;

  async function agregar(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/os/${slug}/costos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ concepto, montoArs: Number(monto) || 0 }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "No se pudo agregar");
      setCostos((cs) => [...cs, { id: data.costo.id, concepto, montoArs: Number(monto) || 0 }]);
      setConcepto("");
      setMonto("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de conexión");
    } finally {
      setBusy(false);
    }
  }

  async function guardarMonto(c: CostoData) {
    const nuevo = Number(editMonto);
    setEditando(null);
    if (Number.isNaN(nuevo) || nuevo === c.montoArs) return;
    const prev = costos;
    setCostos((cs) => cs.map((x) => (x.id === c.id ? { ...x, montoArs: nuevo } : x)));
    const res = await fetch(`/api/os/${slug}/costos`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: c.id, montoArs: nuevo }),
    });
    if (!res.ok) setCostos(prev);
    else router.refresh();
  }

  async function borrar(c: CostoData) {
    if (!confirm(`¿Borrar "${c.concepto}"?`)) return;
    const prev = costos;
    setCostos((cs) => cs.filter((x) => x.id !== c.id));
    const res = await fetch(`/api/os/${slug}/costos?id=${c.id}`, { method: "DELETE" });
    if (!res.ok) setCostos(prev);
    else router.refresh();
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Stat label="Costos fijos por mes" value={fmtArs(totalFijos)} hint="Lo que sale sí o sí" />
        <Stat label={`Ingresos de ${mesLabel}`} value={fmtArs(ingresosMes)} />
        <Stat
          label="Punto de equilibrio"
          value={cubierto === null ? "—" : `${cubierto}%`}
          hint={
            cubierto === null
              ? "Cargá tus costos fijos"
              : cubierto >= 100
                ? "Cubierto — de acá en más es ganancia"
                : `Faltan ${fmtArs(Math.max(0, totalFijos - ingresosMes))} para cubrir el mes`
          }
          tone={cubierto === null ? "default" : cubierto >= 100 ? "success" : "warning"}
        />
      </div>

      <Card className="p-5">
        <h2 className="mb-1 font-semibold">Tus costos fijos</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Alquiler, sueldos, servicios: lo que pagás todos los meses aunque no vendas nada.
          Clic en el monto para corregirlo.
        </p>

        {costos.length === 0 ? (
          <p className="mb-4 rounded-md border border-dashed px-4 py-5 text-center text-sm text-muted-foreground">
            Sin costos cargados todavía.
          </p>
        ) : (
          <ul className="mb-4 divide-y">
            {costos.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3 py-2">
                <span className="font-medium">{c.concepto}</span>
                <span className="flex items-center gap-1.5">
                  {editando === c.id ? (
                    <Input
                      autoFocus
                      type="number"
                      className="h-8 w-32 text-right"
                      value={editMonto}
                      onChange={(e) => setEditMonto(e.target.value)}
                      onBlur={() => void guardarMonto(c)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") void guardarMonto(c);
                        if (e.key === "Escape") setEditando(null);
                      }}
                    />
                  ) : (
                    <button
                      type="button"
                      className="rounded px-2 py-1 font-mono text-sm tabular-nums hover:bg-muted"
                      title="Clic para editar"
                      onClick={() => {
                        setEditando(c.id);
                        setEditMonto(String(c.montoArs));
                      }}
                    >
                      {fmtArs(c.montoArs)}
                    </button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => void borrar(c)} aria-label={`Borrar ${c.concepto}`}>
                    ✕
                  </Button>
                </span>
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={agregar} className="flex flex-wrap items-end gap-3 border-t pt-4">
          <Field label="Concepto">
            <Input value={concepto} onChange={(e) => setConcepto(e.target.value)} placeholder="Ej: Alquiler" required className="w-48" />
          </Field>
          <Field label="Monto mensual (ARS)">
            <Input type="number" min="0" value={monto} onChange={(e) => setMonto(e.target.value)} required className="w-40" />
          </Field>
          <Button type="submit" size="sm" disabled={busy}>
            {busy ? <Spinner /> : null} Agregar
          </Button>
        </form>
        {error ? <div className="mt-3"><ErrorState message={error} /></div> : null}
      </Card>
    </div>
  );
}
