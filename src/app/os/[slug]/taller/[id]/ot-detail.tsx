"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, ErrorState, Field, Input, Spinner, Textarea } from "@/components/ui";
import { fmtArs } from "../../_components/money";
import { OT_SIGUIENTE } from "../estados";

type Item = { descripcion: string; cantidad: number; precioArs: number; tipo: "repuesto" | "mano_obra" };

export type OtData = {
  id: string;
  numero: number;
  equipo: string;
  motivoIngreso: string;
  diagnostico: string | null;
  trabajos: string | null;
  items: Item[];
  totalArs: number;
  pagadoArs: number;
  estado: string;
  contacto: { id: string; name: string; phone: string | null } | null;
};

/** Detalle operativo de la OT: avanzar estado, cargar trabajo y cobrar. */
export function OtDetail({ slug, ot }: { slug: string; ot: OtData }) {
  const router = useRouter();
  const [diagnostico, setDiagnostico] = useState(ot.diagnostico ?? "");
  const [trabajos, setTrabajos] = useState(ot.trabajos ?? "");
  const [items, setItems] = useState<Item[]>(ot.items);
  const [pagado, setPagado] = useState(String(ot.pagadoArs || ""));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const total = items.reduce((s, i) => s + i.cantidad * i.precioArs, 0);
  const saldo = total - (Number(pagado) || 0);
  const siguiente = OT_SIGUIENTE[ot.estado];

  async function patch(body: unknown) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/os/${slug}/taller/${ot.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "No se pudo guardar");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error de conexión");
    } finally {
      setBusy(false);
    }
  }

  function guardarTodo() {
    void patch({
      diagnostico,
      trabajos,
      items,
      pagadoArs: Number(pagado) || 0,
    });
  }

  return (
    <div className="space-y-4">
      {error ? <ErrorState message={error} /> : null}

      {/* Acción principal: el paso siguiente, bien grande */}
      {siguiente ? (
        <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
          <p className="text-sm text-muted-foreground">
            {siguiente.estado === "LISTA"
              ? "Al marcarla lista, el aviso al cliente aparece en «Para hoy» con el WhatsApp armado."
              : "Siguiente paso del trabajo:"}
          </p>
          <div className="flex gap-2">
            <Button onClick={() => void patch({ estado: siguiente.estado })} disabled={busy}>
              {busy ? <Spinner /> : null} {siguiente.label}
            </Button>
            {ot.estado !== "CANCELADA" && ot.estado !== "ENTREGADA" ? (
              <Button variant="ghost" onClick={() => void patch({ estado: "CANCELADA" })} disabled={busy}>
                Cancelar OT
              </Button>
            ) : null}
          </div>
        </Card>
      ) : null}

      <Card className="space-y-4 p-4 sm:p-5">
        <Field label="Motivo de ingreso">
          <p className="rounded-md bg-muted/50 px-3 py-2 text-sm">{ot.motivoIngreso}</p>
        </Field>
        <Field label="Diagnóstico">
          <Textarea
            rows={2}
            value={diagnostico}
            onChange={(e) => setDiagnostico(e.target.value)}
            placeholder="Qué encontramos…"
          />
        </Field>
        <Field label="Trabajos realizados">
          <Textarea
            rows={2}
            value={trabajos}
            onChange={(e) => setTrabajos(e.target.value)}
            placeholder="Qué se le hizo…"
          />
        </Field>
      </Card>

      {/* Items: repuestos + mano de obra */}
      <Card className="p-4 sm:p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Repuestos y mano de obra</h2>
          <div className="flex gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setItems((xs) => [...xs, { descripcion: "", cantidad: 1, precioArs: 0, tipo: "repuesto" }])}
            >
              + Repuesto
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setItems((xs) => [...xs, { descripcion: "", cantidad: 1, precioArs: 0, tipo: "mano_obra" }])}
            >
              + Mano de obra
            </Button>
          </div>
        </div>

        {items.length === 0 ? (
          <p className="rounded-md border border-dashed px-4 py-4 text-center text-sm text-muted-foreground">
            Sin items todavía. Cargalos y el total se arma solo.
          </p>
        ) : (
          <div className="space-y-2">
            {items.map((it, i) => (
              <div key={i} className="flex flex-wrap items-center gap-2">
                <span className="w-24 shrink-0 text-xs text-muted-foreground">
                  {it.tipo === "repuesto" ? "🔩 Repuesto" : "🧑‍🔧 Mano obra"}
                </span>
                <Input
                  value={it.descripcion}
                  onChange={(e) =>
                    setItems((xs) => xs.map((x, j) => (j === i ? { ...x, descripcion: e.target.value } : x)))
                  }
                  placeholder="Descripción"
                  className="min-w-40 flex-1"
                  aria-label={`Descripción item ${i + 1}`}
                />
                <Input
                  type="number"
                  min={1}
                  value={String(it.cantidad)}
                  onChange={(e) =>
                    setItems((xs) =>
                      xs.map((x, j) => (j === i ? { ...x, cantidad: Number.parseInt(e.target.value || "1", 10) || 1 } : x))
                    )
                  }
                  className="w-16"
                  aria-label={`Cantidad item ${i + 1}`}
                />
                <Input
                  type="number"
                  min={0}
                  value={String(it.precioArs)}
                  onChange={(e) =>
                    setItems((xs) => xs.map((x, j) => (j === i ? { ...x, precioArs: Number(e.target.value) || 0 } : x)))
                  }
                  className="w-28"
                  aria-label={`Precio item ${i + 1}`}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setItems((xs) => xs.filter((_, j) => j !== i))}
                  aria-label={`Quitar item ${i + 1}`}
                >
                  ✕
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Total + cobro */}
        <div className="mt-4 flex flex-wrap items-end justify-between gap-3 border-t pt-4">
          <div className="flex items-end gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-lg font-bold tabular-nums">{fmtArs(total)}</p>
            </div>
            <Field label="Pagado (ARS)">
              <Input
                type="number"
                min={0}
                value={pagado}
                onChange={(e) => setPagado(e.target.value)}
                className="w-32"
              />
            </Field>
            <div>
              <p className="text-xs text-muted-foreground">Saldo</p>
              <p className={`text-lg font-bold tabular-nums ${saldo > 0 ? "text-warning" : "text-success"}`}>
                {fmtArs(Math.max(0, saldo))}
              </p>
            </div>
          </div>
          <Button onClick={guardarTodo} disabled={busy}>
            {busy ? <Spinner /> : null} Guardar cambios
          </Button>
        </div>
      </Card>
    </div>
  );
}
