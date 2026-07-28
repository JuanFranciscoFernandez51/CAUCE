"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, ErrorState, Field, Input, Select, Textarea } from "@/components/ui";
import { DOCS_DEFAULT } from "@/lib/conce";

export type VehiculoOpcion = { id: string; etiqueta: string; dominio: string | null };

export type OperacionFormData = {
  id?: string;
  tipo: "MANDATO" | "BOLETO";
  fecha: string; // YYYY-MM-DD
  nombre: string;
  dni: string;
  domicilio: string;
  telefono: string;
  email: string;
  vehiculoId: string;
  vehiculoTexto: string;
  dominio: string;
  chasis: string;
  motorNro: string;
  documentacion: { item: string; ok: boolean }[];
  precio: number | null;
  moneda: string;
  comisionPct: number | null;
  sena: number;
  formaPago: string;
  condiciones: string;
  observaciones: string;
};

/**
 * Form de mandato de venta / boleto (orden de compra) — patrón MF adaptado a
 * autos: persona, vehículo (del stock o libre, con dominio/chasis/motor),
 * checklist de documentación y condiciones económicas.
 */
export function OperacionForm({
  slug,
  vehiculos,
  inicial,
}: {
  slug: string;
  vehiculos: VehiculoOpcion[];
  inicial: OperacionFormData;
}) {
  const router = useRouter();
  const esNuevo = !inicial.id;
  const esMandato = inicial.tipo === "MANDATO";
  const [form, setForm] = useState<OperacionFormData>({
    ...inicial,
    documentacion: inicial.documentacion.length > 0 ? inicial.documentacion : DOCS_DEFAULT,
  });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.nombre.trim()) return setError(esMandato ? "Poné el nombre del titular" : "Poné el nombre del comprador");
    setGuardando(true);
    try {
      const body = {
        ...(esNuevo ? { tipo: form.tipo } : {}),
        fecha: form.fecha,
        nombre: form.nombre.trim(),
        dni: form.dni.trim(),
        domicilio: form.domicilio.trim(),
        telefono: form.telefono.trim(),
        email: form.email.trim(),
        ...(esNuevo ? { vehiculoId: form.vehiculoId || undefined } : {}),
        vehiculoTexto: form.vehiculoTexto.trim(),
        dominio: form.dominio.trim(),
        chasis: form.chasis.trim(),
        motorNro: form.motorNro.trim(),
        documentacion: form.documentacion,
        precio: form.precio != null && form.precio > 0 ? form.precio : null,
        moneda: form.moneda,
        comisionPct: esMandato ? form.comisionPct : null,
        sena: form.sena || 0,
        formaPago: form.formaPago.trim(),
        condiciones: form.condiciones.trim(),
        observaciones: form.observaciones.trim(),
      };
      const res = await fetch(
        esNuevo ? `/api/os/${slug}/conce/operaciones` : `/api/os/${slug}/conce/operaciones/${inicial.id}`,
        {
          method: esNuevo ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "No se pudo guardar");
      if (esNuevo) {
        router.push(`/os/${slug}/mandatos/${data.operacion.id}`);
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de conexión");
    } finally {
      setGuardando(false);
    }
  }

  function toggleDoc(i: number) {
    setForm({
      ...form,
      documentacion: form.documentacion.map((d, idx) => (idx === i ? { ...d, ok: !d.ok } : d)),
    });
  }

  return (
    <form onSubmit={guardar} className="space-y-4">
      {error ? <ErrorState message={error} /> : null}

      <Card className="space-y-4 p-4">
        <h2 className="text-sm font-semibold">
          {esMandato ? "👤 Titular que consigna" : "👤 Comprador"}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Nombre y apellido *">
            <Input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
          </Field>
          <Field label="DNI / CUIT">
            <Input value={form.dni} onChange={(e) => setForm({ ...form, dni: e.target.value })} />
          </Field>
          <Field label="Teléfono">
            <Input value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
          </Field>
          <Field label="Email">
            <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </Field>
          <Field label="Domicilio">
            <Input value={form.domicilio} onChange={(e) => setForm({ ...form, domicilio: e.target.value })} />
          </Field>
          <Field label="Fecha">
            <Input type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} />
          </Field>
        </div>
      </Card>

      <Card className="space-y-4 p-4">
        <h2 className="text-sm font-semibold">🚗 Vehículo</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {esNuevo ? (
            <Field
              label="Del stock"
              help={esMandato ? "Si el auto entra en consignación al stock, elegilo acá." : "El boleto reserva el vehículo elegido."}
            >
              <Select
                value={form.vehiculoId}
                onChange={(e) => setForm({ ...form, vehiculoId: e.target.value })}
              >
                <option value="">— Fuera del stock (texto libre) —</option>
                {vehiculos.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.etiqueta}
                  </option>
                ))}
              </Select>
            </Field>
          ) : null}
          <Field label="Descripción libre" help="Si no está en el stock: marca, modelo, año.">
            <Input
              value={form.vehiculoTexto}
              onChange={(e) => setForm({ ...form, vehiculoTexto: e.target.value })}
              placeholder="Ej: Peugeot 208 Allure 2019"
            />
          </Field>
          <Field label="Dominio">
            <Input value={form.dominio} onChange={(e) => setForm({ ...form, dominio: e.target.value.toUpperCase() })} placeholder="AB123CD" />
          </Field>
          <Field label="Nº de chasis">
            <Input value={form.chasis} onChange={(e) => setForm({ ...form, chasis: e.target.value })} />
          </Field>
          <Field label="Nº de motor">
            <Input value={form.motorNro} onChange={(e) => setForm({ ...form, motorNro: e.target.value })} />
          </Field>
        </div>
      </Card>

      <Card className="space-y-3 p-4">
        <h2 className="text-sm font-semibold">📄 Documentación</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {form.documentacion.map((d, i) => (
            <label key={d.item} className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
              <input type="checkbox" checked={d.ok} onChange={() => toggleDoc(i)} />
              {d.item}
            </label>
          ))}
        </div>
      </Card>

      <Card className="space-y-4 p-4">
        <h2 className="text-sm font-semibold">💵 Condiciones económicas</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label={esMandato ? "Precio de venta pactado" : "Precio de la operación"}>
            <Input
              type="number"
              min={0}
              value={form.precio ?? ""}
              onChange={(e) => setForm({ ...form, precio: e.target.value === "" ? null : Number(e.target.value) })}
            />
          </Field>
          <Field label="Moneda">
            <Select value={form.moneda} onChange={(e) => setForm({ ...form, moneda: e.target.value })}>
              <option value="ARS">Pesos ($)</option>
              <option value="USD">Dólares (US$)</option>
            </Select>
          </Field>
          {esMandato ? (
            <Field label="Comisión (%)">
              <Input
                type="number"
                min={0}
                max={100}
                step="0.5"
                value={form.comisionPct ?? ""}
                onChange={(e) =>
                  setForm({ ...form, comisionPct: e.target.value === "" ? null : Number(e.target.value) })
                }
              />
            </Field>
          ) : (
            <Field label="Seña / anticipo">
              <Input
                type="number"
                min={0}
                value={form.sena || ""}
                onChange={(e) => setForm({ ...form, sena: Number(e.target.value) || 0 })}
              />
            </Field>
          )}
          <Field label="Forma de pago">
            <Select value={form.formaPago} onChange={(e) => setForm({ ...form, formaPago: e.target.value })}>
              <option value="">—</option>
              <option value="contado">Contado</option>
              <option value="transferencia">Transferencia</option>
              <option value="financiado">Financiado</option>
              <option value="permuta + efectivo">Permuta + efectivo</option>
            </Select>
          </Field>
        </div>
        <Field label="Condiciones pactadas">
          <Textarea
            value={form.condiciones}
            onChange={(e) => setForm({ ...form, condiciones: e.target.value })}
            rows={3}
            placeholder={
              esMandato
                ? "Ej: el mandante autoriza la exhibición y venta del vehículo…"
                : "Ej: entrega del vehículo con la transferencia iniciada…"
            }
          />
        </Field>
        <Field label="Observaciones">
          <Textarea
            value={form.observaciones}
            onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
            rows={2}
          />
        </Field>
      </Card>

      <div className="flex gap-2">
        <Button type="submit" disabled={guardando}>
          {guardando ? "Guardando…" : esNuevo ? (esMandato ? "Crear mandato" : "Crear boleto") : "Guardar cambios"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.push(`/os/${slug}/mandatos`)}>
          Volver
        </Button>
      </div>
    </form>
  );
}
