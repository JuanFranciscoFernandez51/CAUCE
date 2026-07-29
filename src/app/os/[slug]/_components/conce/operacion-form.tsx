"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, ErrorState, Field, Input, Select, Textarea } from "@/components/ui";
import { DOCS_DEFAULT, PERMUTA_VACIA, rutaOperacion, type Permuta } from "@/lib/conce";

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
  vehMarca: string;
  vehModelo: string;
  vehAnio: number | null;
  vehKm: number | null;
  permutas: Permuta[];
  dominio: string;
  chasis: string;
  motorNro: string;
  documentacion: { item: string; ok: boolean }[];
  precio: number | null;
  moneda: string;
  comisionPct: number | null;
  sena: number;
  formaPago: string;
  finCuotas: number | null;
  finValorCuota: number | null;
  finDiaVenc: number | null;
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
        ...(esNuevo ? { vehiculoId: form.vehiculoId || undefined } : { vehiculoId: form.vehiculoId || null }),
        vehiculoTexto:
          form.vehiculoTexto.trim() ||
          [form.vehMarca, form.vehModelo, form.vehAnio].filter(Boolean).join(" ").trim(),
        vehMarca: form.vehMarca.trim(),
        vehModelo: form.vehModelo.trim(),
        vehAnio: form.vehAnio || null,
        vehKm: form.vehKm || null,
        permutas: esMandato
          ? []
          : form.permutas
              .filter((p) => p.marca.trim())
              .map((p) => ({
                marca: p.marca.trim(),
                modelo: p.modelo.trim(),
                anio: Number(p.anio) || new Date().getFullYear(),
                km: Number(p.km) || 0,
                valorTomado: Number(p.valorTomado) || 0,
                dominio: (p.dominio ?? "").trim(),
                vehiculoId: p.vehiculoId ?? null,
              })),
        dominio: form.dominio.trim(),
        chasis: form.chasis.trim(),
        motorNro: form.motorNro.trim(),
        documentacion: form.documentacion,
        precio: form.precio != null && form.precio > 0 ? form.precio : null,
        moneda: form.moneda,
        comisionPct: esMandato ? form.comisionPct : null,
        sena: form.sena || 0,
        formaPago: form.formaPago.trim(),
        finCuotas: form.formaPago === "financiado" ? form.finCuotas : null,
        finValorCuota: form.formaPago === "financiado" ? form.finValorCuota : null,
        finDiaVenc: form.formaPago === "financiado" ? form.finDiaVenc : null,
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
        router.push(`/os/${slug}/${rutaOperacion(form.tipo)}/${data.operacion.id}`);
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de conexión");
    } finally {
      setGuardando(false);
    }
  }

  function cambiarPermuta(i: number, cambios: Partial<Permuta>) {
    setForm((f) => ({
      ...f,
      permutas: f.permutas.map((p, idx) => (idx === i ? { ...p, ...cambios } : p)),
    }));
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
        {esMandato ? (
          <p className="rounded-md bg-primary-soft/50 px-3 py-2 text-xs text-muted-foreground">
            Si el auto todavía NO está en el stock, cargá marca, modelo y año: cuando marques el
            mandato como <strong>firmado</strong>, el vehículo entra solo al stock sin publicar.
          </p>
        ) : null}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field
            label="Del stock"
            help={esMandato ? "Si el auto YA está cargado, elegilo acá." : "El boleto reserva el vehículo elegido."}
          >
            <Select
              value={form.vehiculoId}
              onChange={(e) => setForm({ ...form, vehiculoId: e.target.value })}
            >
              <option value="">— Fuera del stock (cargar los datos abajo) —</option>
              {vehiculos.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.etiqueta}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Marca">
            <Input
              value={form.vehMarca}
              onChange={(e) => setForm({ ...form, vehMarca: e.target.value })}
              placeholder="Ej: Peugeot"
            />
          </Field>
          <Field label="Modelo / versión">
            <Input
              value={form.vehModelo}
              onChange={(e) => setForm({ ...form, vehModelo: e.target.value })}
              placeholder="Ej: 208 Allure"
            />
          </Field>
          <Field label="Año">
            <Input
              type="number"
              min={1950}
              max={2030}
              value={form.vehAnio ?? ""}
              onChange={(e) =>
                setForm({ ...form, vehAnio: e.target.value === "" ? null : Number(e.target.value) })
              }
            />
          </Field>
          <Field label="Kilómetros">
            <Input
              type="number"
              min={0}
              value={form.vehKm ?? ""}
              onChange={(e) =>
                setForm({ ...form, vehKm: e.target.value === "" ? null : Number(e.target.value) })
              }
            />
          </Field>
          <Field label="Descripción libre" help="Lo que sale en el PDF si no elegiste uno del stock.">
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

      {!esMandato ? (
        <Card className="space-y-3 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold">↔ Permutas tomadas</h2>
              <p className="text-xs text-muted-foreground">
                Cada permuta entra SOLA al stock (sin publicar) cuando el boleto se firma o se
                entrega.
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => setForm({ ...form, permutas: [...form.permutas, { ...PERMUTA_VACIA }] })}
            >
              + Agregar permuta
            </Button>
          </div>

          {form.permutas.length === 0 ? (
            <p className="rounded-md border border-dashed px-3 py-4 text-center text-sm text-muted-foreground">
              Sin permutas en esta operación.
            </p>
          ) : (
            <div className="space-y-3">
              {form.permutas.map((p, i) => (
                <div key={i} className="grid gap-3 rounded-md border p-3 sm:grid-cols-3 lg:grid-cols-6">
                  <Field label="Marca">
                    <Input value={p.marca} onChange={(e) => cambiarPermuta(i, { marca: e.target.value })} />
                  </Field>
                  <Field label="Modelo">
                    <Input value={p.modelo} onChange={(e) => cambiarPermuta(i, { modelo: e.target.value })} />
                  </Field>
                  <Field label="Año">
                    <Input
                      type="number"
                      min={1950}
                      max={2030}
                      value={p.anio || ""}
                      onChange={(e) => cambiarPermuta(i, { anio: Number(e.target.value) || 0 })}
                    />
                  </Field>
                  <Field label="Km">
                    <Input
                      type="number"
                      min={0}
                      value={p.km || ""}
                      onChange={(e) => cambiarPermuta(i, { km: Number(e.target.value) || 0 })}
                    />
                  </Field>
                  <Field label="Valor tomado">
                    <Input
                      type="number"
                      min={0}
                      value={p.valorTomado || ""}
                      onChange={(e) => cambiarPermuta(i, { valorTomado: Number(e.target.value) || 0 })}
                    />
                  </Field>
                  <Field label="Dominio">
                    <div className="flex items-center gap-1.5">
                      <Input
                        value={p.dominio ?? ""}
                        onChange={(e) => cambiarPermuta(i, { dominio: e.target.value.toUpperCase() })}
                      />
                      <button
                        type="button"
                        title={p.vehiculoId ? "Ya entró al stock" : "Quitar permuta"}
                        disabled={Boolean(p.vehiculoId)}
                        onClick={() =>
                          setForm({ ...form, permutas: form.permutas.filter((_, idx) => idx !== i) })
                        }
                        className="shrink-0 text-muted-foreground/60 hover:text-destructive disabled:opacity-30"
                      >
                        🗑
                      </button>
                    </div>
                  </Field>
                  {p.vehiculoId ? (
                    <p className="text-xs text-success sm:col-span-3 lg:col-span-6">
                      ✔ Ya está en el stock (sin publicar).
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </Card>
      ) : null}

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
        {!esMandato && form.formaPago === "financiado" ? (
          <div className="grid gap-3 rounded-lg border border-primary/30 bg-primary-soft/30 p-3 sm:grid-cols-3">
            <p className="text-xs text-muted-foreground sm:col-span-3">
              Financiación propia de la casa: al marcar el boleto como <strong>entregado</strong>, la
              financiación y todas sus cuotas se crean solas en el módulo Financiaciones.
            </p>
            <Field label="Cantidad de cuotas">
              <Input
                type="number"
                min={1}
                max={120}
                value={form.finCuotas ?? ""}
                placeholder="12"
                onChange={(e) =>
                  setForm({ ...form, finCuotas: e.target.value === "" ? null : Number(e.target.value) })
                }
              />
            </Field>
            <Field label="Valor de cuota" help="Vacío = se reparte el saldo solo.">
              <Input
                type="number"
                min={0}
                value={form.finValorCuota ?? ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    finValorCuota: e.target.value === "" ? null : Number(e.target.value),
                  })
                }
              />
            </Field>
            <Field label="Día de vencimiento">
              <Input
                type="number"
                min={1}
                max={28}
                value={form.finDiaVenc ?? ""}
                placeholder="10"
                onChange={(e) =>
                  setForm({ ...form, finDiaVenc: e.target.value === "" ? null : Number(e.target.value) })
                }
              />
            </Field>
          </div>
        ) : null}
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
        <Button type="button" variant="ghost" onClick={() => router.push(`/os/${slug}/${rutaOperacion(form.tipo)}`)}>
          Volver
        </Button>
      </div>
    </form>
  );
}
