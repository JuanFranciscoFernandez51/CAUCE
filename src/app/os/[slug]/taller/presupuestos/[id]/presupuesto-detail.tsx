"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, ErrorState, Field, Input, Spinner, Textarea } from "@/components/ui";
import { fmtArs } from "../../../_components/money";

type Item = { descripcion: string; cantidad: number; precioArs: number; tipo: "repuesto" | "mano_obra" };

export type PresupuestoData = {
  id: string;
  numero: number;
  equipo: string;
  detalle: string;
  items: Item[];
  totalArs: number;
  validezDias: number;
  estado: string;
  otId: string | null;
  contacto: { id: string; name: string; phone: string | null } | null;
};

/** Teléfono argentino → wa.me. */
function waNumber(tel: string): string {
  let d = tel.replace(/\D/g, "");
  if (d.startsWith("0")) d = d.slice(1);
  if (!d.startsWith("54")) d = `54${d}`;
  if (!d.startsWith("549")) d = `549${d.slice(2)}`;
  return d;
}

/** Cargar items, mandarlo por WhatsApp y convertirlo en OT si aceptan. */
export function PresupuestoDetail({
  slug,
  presupuesto: p,
}: {
  slug: string;
  presupuesto: PresupuestoData;
}) {
  const router = useRouter();
  const [detalle, setDetalle] = useState(p.detalle);
  const [items, setItems] = useState<Item[]>(p.items);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const total = items.reduce((s, i) => s + i.cantidad * i.precioArs, 0);
  const abierto = p.estado === "BORRADOR" || p.estado === "ENVIADO";

  async function patch(body: unknown) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/os/${slug}/presupuestos/${p.id}`, {
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

  async function convertir() {
    if (!confirm("¿El cliente aceptó? Se crea la orden de trabajo con estos items.")) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/os/${slug}/presupuestos/${p.id}`, { method: "POST" });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "No se pudo convertir");
      router.push(`/os/${slug}/taller/${data.otId}`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error de conexión");
      setBusy(false);
    }
  }

  const mensajeWa = p.contacto
    ? `Hola ${p.contacto.name.split(" ")[0]}! Te paso el presupuesto de tu ${p.equipo}: ${detalle}. Total: ${fmtArs(total)}. Vale ${p.validezDias} días. ¿Lo confirmamos? 🙌`
    : "";

  function enviarWa() {
    // Mandarlo cuenta como ENVIADO.
    if (p.estado === "BORRADOR") void patch({ estado: "ENVIADO", items, detalle });
  }

  return (
    <div className="space-y-4">
      {error ? <ErrorState message={error} /> : null}

      <Card className="space-y-4 p-4 sm:p-5">
        <Field label="Qué se cotiza">
          <Textarea rows={2} value={detalle} onChange={(e) => setDetalle(e.target.value)} disabled={!abierto} />
        </Field>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-semibold">Items</h2>
            {abierto ? (
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
            ) : null}
          </div>
          {items.length === 0 ? (
            <p className="rounded-md border border-dashed px-4 py-4 text-center text-sm text-muted-foreground">
              Cargá los items y el total se arma solo.
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
                    onChange={(e) => setItems((xs) => xs.map((x, j) => (j === i ? { ...x, descripcion: e.target.value } : x)))}
                    placeholder="Descripción"
                    className="min-w-40 flex-1"
                    disabled={!abierto}
                    aria-label={`Descripción item ${i + 1}`}
                  />
                  <Input
                    type="number"
                    min={1}
                    value={String(it.cantidad)}
                    onChange={(e) =>
                      setItems((xs) => xs.map((x, j) => (j === i ? { ...x, cantidad: Number.parseInt(e.target.value || "1", 10) || 1 } : x)))
                    }
                    className="w-16"
                    disabled={!abierto}
                    aria-label={`Cantidad item ${i + 1}`}
                  />
                  <Input
                    type="number"
                    min={0}
                    value={String(it.precioArs)}
                    onChange={(e) => setItems((xs) => xs.map((x, j) => (j === i ? { ...x, precioArs: Number(e.target.value) || 0 } : x)))}
                    className="w-28"
                    disabled={!abierto}
                    aria-label={`Precio item ${i + 1}`}
                  />
                  {abierto ? (
                    <Button variant="ghost" size="sm" onClick={() => setItems((xs) => xs.filter((_, j) => j !== i))} aria-label={`Quitar item ${i + 1}`}>
                      ✕
                    </Button>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
          <p className="text-lg font-bold tabular-nums">Total: {fmtArs(total)}</p>
          {abierto ? (
            <Button onClick={() => void patch({ items, detalle })} disabled={busy}>
              {busy ? <Spinner /> : null} Guardar
            </Button>
          ) : null}
        </div>
      </Card>

      {/* Acciones: mandar, aceptar → OT, rechazar */}
      {abierto ? (
        <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
          <p className="text-sm text-muted-foreground">
            Guardá los items y mandalo. Si acepta, se convierte en OT con todo cargado.
          </p>
          <div className="flex flex-wrap gap-2">
            {p.contacto?.phone ? (
              <a
                href={`https://wa.me/${waNumber(p.contacto.phone)}?text=${encodeURIComponent(mensajeWa)}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={enviarWa}
                className="inline-flex items-center gap-1.5 rounded-md bg-success px-3 py-2 text-sm font-medium text-white hover:opacity-90"
              >
                💬 Mandar por WhatsApp
              </a>
            ) : null}
            <Button onClick={() => void convertir()} disabled={busy}>
              ✓ Aceptó — crear OT
            </Button>
            <Button variant="ghost" onClick={() => void patch({ estado: "RECHAZADO" })} disabled={busy}>
              Rechazado
            </Button>
          </div>
        </Card>
      ) : p.otId ? (
        <Card className="p-4 text-sm">
          Este presupuesto ya es una orden de trabajo:{" "}
          <a href={`/os/${slug}/taller/${p.otId}`} className="font-medium text-primary hover:underline">
            ver la OT →
          </a>
        </Card>
      ) : null}
    </div>
  );
}
