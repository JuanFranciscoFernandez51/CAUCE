"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Field, Input, Select, Textarea } from "@/components/ui";
import { fmtPlata, planDeCuotas, fmtFecha, aFechaInput } from "@/lib/conce-fin";

export type ClienteOpcion = { id: string; nombre: string; telefono: string | null };

/**
 * Alta manual de una financiación propia. Muestra la previsualización del
 * plan ANTES de guardar: cuánto queda de saldo, cuánto sale cada cuota y
 * cuándo vence la primera.
 */
export function FinanciacionNueva({
  slug,
  clientes,
}: {
  slug: string;
  clientes: ClienteOpcion[];
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    contactId: "",
    nombre: "",
    telefono: "",
    descripcion: "",
    montoTotal: "",
    entrega: "",
    cantidadCuotas: "12",
    valorCuota: "",
    moneda: "ARS",
    fechaInicio: aFechaInput(new Date()),
    diaVencimiento: "10",
    observaciones: "",
  });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const aFinanciar = Math.max(0, (Number(form.montoTotal) || 0) - (Number(form.entrega) || 0));

  const plan = useMemo(() => {
    const cant = Number(form.cantidadCuotas) || 0;
    if (aFinanciar <= 0 || cant <= 0) return [];
    return planDeCuotas({
      montoTotal: aFinanciar,
      cantidadCuotas: cant,
      valorCuota: Number(form.valorCuota) || null,
      fechaInicio: new Date(`${form.fechaInicio}T12:00:00-03:00`),
      diaVencimiento: Number(form.diaVencimiento) || 10,
    });
  }, [aFinanciar, form.cantidadCuotas, form.valorCuota, form.fechaInicio, form.diaVencimiento]);

  const nombreFinal =
    form.contactId ? (clientes.find((c) => c.id === form.contactId)?.nombre ?? "") : form.nombre.trim();

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    if (!nombreFinal || aFinanciar <= 0) return;
    setGuardando(true);
    setError("");
    try {
      const res = await fetch(`/api/os/${slug}/conce/financiaciones`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactId: form.contactId || undefined,
          nombre: nombreFinal,
          telefono: form.telefono.trim() || undefined,
          descripcion: form.descripcion.trim() || undefined,
          montoTotal: aFinanciar,
          entrega: Number(form.entrega) || 0,
          cantidadCuotas: Number(form.cantidadCuotas) || 1,
          valorCuota: Number(form.valorCuota) || null,
          moneda: form.moneda,
          fechaInicio: form.fechaInicio,
          diaVencimiento: Number(form.diaVencimiento) || 10,
          observaciones: form.observaciones.trim() || undefined,
        }),
      });
      const data = (await res.json().catch(() => null)) as
        | { financiacion?: { id: string }; error?: string }
        | null;
      if (!res.ok) throw new Error(data?.error ?? "No se pudo guardar");
      if (data?.financiacion?.id) {
        router.push(`/os/${slug}/financiaciones/${data.financiacion.id}`);
        return;
      }
      router.push(`/os/${slug}/financiaciones`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar");
      setGuardando(false);
    }
  }

  return (
    <form onSubmit={guardar} className="space-y-4">
      <Card className="space-y-3 p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Cliente
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Cliente del CRM" help="Si ya está cargado, elegilo de acá.">
            <Select
              value={form.contactId}
              onChange={(e) => {
                const c = clientes.find((x) => x.id === e.target.value);
                setForm({
                  ...form,
                  contactId: e.target.value,
                  telefono: c?.telefono ?? form.telefono,
                });
              }}
            >
              <option value="">— cliente nuevo —</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Nombre y apellido" help="Si es nuevo, entra solo al CRM.">
            <Input
              value={form.contactId ? nombreFinal : form.nombre}
              disabled={!!form.contactId}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              placeholder="Ej: Marcelo Gómez"
            />
          </Field>
          <Field label="Teléfono" help="Es el que se usa para avisar los vencimientos.">
            <Input
              value={form.telefono}
              onChange={(e) => setForm({ ...form, telefono: e.target.value })}
              placeholder="291 5..."
            />
          </Field>
        </div>
        <Field label="Vehículo / concepto">
          <Input
            value={form.descripcion}
            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
            placeholder="Ej: Volkswagen Amarok 2019"
          />
        </Field>
      </Card>

      <Card className="space-y-3 p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Plata y plan
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Monto total">
            <Input
              type="number"
              min={0}
              value={form.montoTotal}
              onChange={(e) => setForm({ ...form, montoTotal: e.target.value })}
            />
          </Field>
          <Field label="Entrega / anticipo">
            <Input
              type="number"
              min={0}
              value={form.entrega}
              onChange={(e) => setForm({ ...form, entrega: e.target.value })}
            />
          </Field>
          <Field label="Moneda">
            <Select value={form.moneda} onChange={(e) => setForm({ ...form, moneda: e.target.value })}>
              <option value="ARS">Pesos ($)</option>
              <option value="USD">Dólares (US$)</option>
            </Select>
          </Field>
          <Field label="Cantidad de cuotas">
            <Input
              type="number"
              min={1}
              max={120}
              value={form.cantidadCuotas}
              onChange={(e) => setForm({ ...form, cantidadCuotas: e.target.value })}
            />
          </Field>
          <Field label="Valor de cuota" help="Vacío = se reparte el saldo solo.">
            <Input
              type="number"
              min={0}
              value={form.valorCuota}
              onChange={(e) => setForm({ ...form, valorCuota: e.target.value })}
            />
          </Field>
          <Field label="Arranca el">
            <Input
              type="date"
              value={form.fechaInicio}
              onChange={(e) => setForm({ ...form, fechaInicio: e.target.value })}
            />
          </Field>
          <Field label="Día de vencimiento" help="Día del mes en que vence cada cuota.">
            <Input
              type="number"
              min={1}
              max={28}
              value={form.diaVencimiento}
              onChange={(e) => setForm({ ...form, diaVencimiento: e.target.value })}
            />
          </Field>
        </div>
        <Field label="Observaciones">
          <Textarea
            rows={2}
            value={form.observaciones}
            onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
          />
        </Field>
      </Card>

      {plan.length > 0 ? (
        <Card className="border-primary/30 bg-primary-soft/40 p-4 text-sm">
          <p className="font-medium">
            Se financian {fmtPlata(aFinanciar, form.moneda)} en {plan.length} cuota(s) de{" "}
            {fmtPlata(plan[0]!.monto, form.moneda)}.
          </p>
          <p className="text-muted-foreground">
            La primera vence el {fmtFecha(plan[0]!.fechaVencimiento)} y la última el{" "}
            {fmtFecha(plan[plan.length - 1]!.fechaVencimiento)}.
          </p>
        </Card>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={guardando || !nombreFinal || aFinanciar <= 0}>
          {guardando ? "Guardando…" : "Crear financiación y cuotas"}
        </Button>
        {error ? <span className="text-sm text-destructive">{error}</span> : null}
      </div>
    </form>
  );
}
