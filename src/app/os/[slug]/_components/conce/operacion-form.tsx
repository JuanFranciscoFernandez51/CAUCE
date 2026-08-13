"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, ErrorState, Field, Input, Select, Textarea } from "@/components/ui";
import {
  DOCS_DEFAULT,
  PAGO_METODOS,
  PAGO_VACIO,
  PERMUTA_VACIA,
  pagadoOtrasMonedas,
  rutaOperacion,
  totalPagado,
  type Pago,
  type Permuta,
} from "@/lib/conce";
import { Buscador, type OpcionBuscador } from "./buscador";

export type VehiculoOpcion = { id: string; etiqueta: string; dominio: string | null };

/** Lo que devuelve /conce/clientes. */
type ClienteApi = {
  id: string;
  nombre: string;
  telefono: string;
  email: string;
  dni: string;
  domicilio: string;
};

/** Lo que devuelve /conce/buscar-vehiculos. */
type VehiculoApi = {
  id: string;
  etiqueta: string;
  marca: string;
  modelo: string;
  anio: number;
  km: number;
  dominio: string;
  motor: string;
  precio: number | null;
  moneda: string;
  estado: string;
};

const fmtMonto = (n: number, moneda: string) =>
  `${moneda === "USD" ? "US$" : "$"} ${Math.round(n).toLocaleString("es-AR")}`;

export type OperacionFormData = {
  id?: string;
  tipo: "MANDATO" | "BOLETO";
  fecha: string; // YYYY-MM-DD
  nombre: string;
  dni: string;
  domicilio: string;
  telefono: string;
  email: string;
  /** Cliente del CRM elegido del buscador ("" = cliente nuevo, se crea al guardar). */
  contactId: string;
  vehiculoId: string;
  vehiculoTexto: string;
  vehMarca: string;
  vehModelo: string;
  vehAnio: number | null;
  vehKm: number | null;
  permutas: Permuta[];
  /** Pagos combinables del boleto (efectivo, transferencia, dólares, cheque…). */
  pagos: Pago[];
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

  // Chip del cliente elegido del CRM (si vino uno ya vinculado, lo mostramos).
  const [cliente, setCliente] = useState<OpcionBuscador | null>(
    inicial.contactId ? { id: inicial.contactId, etiqueta: inicial.nombre } : null
  );
  // Chip del vehículo elegido del stock.
  const [vehiculo, setVehiculo] = useState<OpcionBuscador | null>(() => {
    const v = vehiculos.find((x) => x.id === inicial.vehiculoId);
    return v ? { id: v.id, etiqueta: v.etiqueta } : null;
  });
  // Chips de las permutas que salieron del stock, por índice.
  const [permutaChips, setPermutaChips] = useState<Record<number, OpcionBuscador>>({});

  // Guardamos la fila completa que devolvió la API para poder autocompletar.
  const cacheClientes = useRef(new Map<string, ClienteApi>());
  const cacheVehiculos = useRef(new Map<string, VehiculoApi>());

  const buscarClientes = useCallback(
    async (q: string): Promise<OpcionBuscador[]> => {
      const res = await fetch(`/api/os/${slug}/conce/clientes?q=${encodeURIComponent(q)}`);
      const data = (await res.json()) as { contactos?: ClienteApi[] };
      const filas = data.contactos ?? [];
      filas.forEach((c) => cacheClientes.current.set(c.id, c));
      return filas.map((c) => ({
        id: c.id,
        etiqueta: c.nombre,
        detalle: [c.telefono, c.dni ? `DNI ${c.dni}` : "", c.email].filter(Boolean).join(" · "),
      }));
    },
    [slug]
  );

  /** En boletos ofrecemos el stock disponible; en mandatos y permutas, todo. */
  const buscarVehiculos = useCallback(
    async (q: string, soloStock: boolean): Promise<OpcionBuscador[]> => {
      const res = await fetch(
        `/api/os/${slug}/conce/buscar-vehiculos?q=${encodeURIComponent(q)}${soloStock ? "&stock=1" : ""}`
      );
      const data = (await res.json()) as { vehiculos?: VehiculoApi[] };
      const filas = data.vehiculos ?? [];
      filas.forEach((v) => cacheVehiculos.current.set(v.id, v));
      return filas.map((v) => ({
        id: v.id,
        etiqueta: v.etiqueta,
        detalle: [
          v.km ? `${v.km.toLocaleString("es-AR")} km` : "",
          v.precio ? fmtMonto(v.precio, v.moneda) : "",
          v.estado,
        ]
          .filter(Boolean)
          .join(" · "),
      }));
    },
    [slug]
  );

  /** Elegir un cliente del CRM completa los datos que estén vacíos. */
  function elegirCliente(op: OpcionBuscador) {
    const c = cacheClientes.current.get(op.id);
    setCliente(op);
    setForm((f) => ({
      ...f,
      contactId: op.id,
      nombre: c?.nombre || f.nombre,
      telefono: c?.telefono || f.telefono,
      email: c?.email || f.email,
      dni: c?.dni || f.dni,
      domicilio: c?.domicilio || f.domicilio,
    }));
  }

  /** Elegir un vehículo del stock completa marca, modelo, año, km, dominio… */
  function elegirVehiculo(op: OpcionBuscador) {
    const v = cacheVehiculos.current.get(op.id);
    setVehiculo(op);
    setForm((f) => ({
      ...f,
      vehiculoId: op.id,
      vehiculoTexto: op.etiqueta,
      vehMarca: v?.marca ?? f.vehMarca,
      vehModelo: v?.modelo ?? f.vehModelo,
      vehAnio: v?.anio ?? f.vehAnio,
      vehKm: v?.km ?? f.vehKm,
      dominio: v?.dominio || f.dominio,
      motorNro: v?.motor || f.motorNro,
      precio: v?.precio ?? f.precio,
      moneda: v?.moneda ?? f.moneda,
    }));
  }

  /** Una permuta también puede salir del stock: completa sus datos. */
  function elegirPermuta(i: number, op: OpcionBuscador) {
    const v = cacheVehiculos.current.get(op.id);
    setPermutaChips((c) => ({ ...c, [i]: op }));
    cambiarPermuta(i, {
      marca: v?.marca ?? op.etiqueta,
      modelo: v?.modelo ?? "",
      anio: v?.anio ?? new Date().getFullYear(),
      km: v?.km ?? 0,
      dominio: v?.dominio ?? "",
      valorTomado: v?.precio ?? 0,
      // Ya existe en el stock: se vincula y el alta automática no lo duplica.
      vehiculoId: op.id,
    });
  }

  const pagado = totalPagado(form.pagos, form.moneda);
  const otrasMonedas = pagadoOtrasMonedas(form.pagos, form.moneda);
  const permutado = form.permutas.reduce((a, p) => a + (Number(p.valorTomado) || 0), 0);
  const entregado = pagado + (Number(form.sena) || 0) + permutado;
  const saldo = (form.precio ?? 0) - entregado;

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
        contactId: form.contactId || null,
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
        pagos: esMandato
          ? []
          : form.pagos
              .filter((p) => Number(p.monto) > 0)
              .map((p) => ({
                metodo: p.metodo,
                monto: Number(p.monto) || 0,
                moneda: p.moneda || "ARS",
                fecha: (p.fecha ?? "").trim(),
                detalle: (p.detalle ?? "").trim(),
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

  function cambiarPago(i: number, cambios: Partial<Pago>) {
    setForm((f) => ({
      ...f,
      pagos: f.pagos.map((p, idx) => (idx === i ? { ...p, ...cambios } : p)),
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
        <Field
          label="Buscar en los clientes del sistema"
          help={
            cliente
              ? "Sus datos se completaron solos. Lo que corrijas acá se guarda también en su ficha."
              : "Escribí nombre, teléfono o DNI. Si es cliente nuevo, dejalo vacío y cargá los datos a mano."
          }
        >
          <Buscador
            placeholder="Ej: Pérez, 291..., 30123456"
            elegido={cliente}
            buscar={buscarClientes}
            onElegir={elegirCliente}
            onSoltar={() => {
              setCliente(null);
              setForm((f) => ({ ...f, contactId: "" }));
            }}
            vacio="Ningún cliente con eso — cargalo a mano abajo y se crea solo."
          />
        </Field>
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
        <Field
          label="Buscar en el stock"
          help={
            vehiculo
              ? "Los datos de la unidad se completaron solos. Podés corregirlos abajo."
              : esMandato
                ? "Si el auto YA está cargado, buscalo acá. Si no, dejalo vacío y cargalo abajo."
                : "El boleto reserva el vehículo elegido. Buscá por marca, modelo o dominio."
          }
        >
          <Buscador
            placeholder="Ej: Peugeot, 208, AB123CD"
            elegido={vehiculo}
            buscar={(q) => buscarVehiculos(q, !esMandato)}
            onElegir={elegirVehiculo}
            onSoltar={() => {
              setVehiculo(null);
              setForm((f) => ({ ...f, vehiculoId: "" }));
            }}
            vacio="Sin resultados — cargá la unidad a mano abajo."
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                <div key={i} className="space-y-3 rounded-md border p-3">
                  <Field
                    label={`Permuta ${i + 1} — buscar un vehículo ya cargado`}
                    help="Si la unidad ya está en el sistema, elegila y se completa sola. Si es nueva, cargala a mano."
                  >
                    <Buscador
                      placeholder="Ej: Fiat, Cronos, AB123CD"
                      elegido={permutaChips[i] ?? null}
                      buscar={(q) => buscarVehiculos(q, false)}
                      onElegir={(op) => elegirPermuta(i, op)}
                      onSoltar={() => {
                        setPermutaChips((c) => {
                          const next = { ...c };
                          delete next[i];
                          return next;
                        });
                        cambiarPermuta(i, { vehiculoId: null });
                      }}
                      vacio="Sin resultados — cargala a mano."
                    />
                  </Field>
                  <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
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
                        title={
                          p.vehiculoId && !permutaChips[i] ? "Ya entró al stock" : "Quitar permuta"
                        }
                        disabled={Boolean(p.vehiculoId) && !permutaChips[i]}
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
                      {permutaChips[i]
                        ? "✔ Es una unidad que ya está en el stock: no se vuelve a crear."
                        : "✔ Ya está en el stock (sin publicar)."}
                    </p>
                  ) : null}
                  </div>
                </div>
              ))}
              <p className="text-right text-sm text-muted-foreground">
                Total tomado en permutas:{" "}
                <strong className="text-foreground">{fmtMonto(permutado, form.moneda)}</strong>
              </p>
            </div>
          )}
        </Card>
      ) : null}

      {!esMandato ? (
        <Card className="space-y-3 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold">💳 Pagos recibidos</h2>
              <p className="text-xs text-muted-foreground">
                Cargá todos los pagos que entraron, cada uno con su forma, su moneda y su fecha.
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() =>
                setForm({
                  ...form,
                  pagos: [...form.pagos, { ...PAGO_VACIO, moneda: form.moneda, fecha: form.fecha }],
                })
              }
            >
              + Agregar pago
            </Button>
          </div>

          {form.pagos.length === 0 ? (
            <p className="rounded-md border border-dashed px-3 py-4 text-center text-sm text-muted-foreground">
              Todavía no cargaste ningún pago.
            </p>
          ) : (
            <div className="space-y-3">
              {form.pagos.map((p, i) => (
                <div key={i} className="grid gap-3 rounded-md border p-3 sm:grid-cols-2 lg:grid-cols-5">
                  <Field label="Forma de pago">
                    <Select value={p.metodo} onChange={(e) => cambiarPago(i, { metodo: e.target.value })}>
                      {PAGO_METODOS.map((m) => (
                        <option key={m.valor} value={m.valor}>
                          {m.label}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Monto">
                    <Input
                      type="number"
                      min={0}
                      value={p.monto || ""}
                      onChange={(e) => cambiarPago(i, { monto: Number(e.target.value) || 0 })}
                    />
                  </Field>
                  <Field label="Moneda">
                    <Select
                      value={p.moneda || "ARS"}
                      onChange={(e) => cambiarPago(i, { moneda: e.target.value })}
                    >
                      <option value="ARS">Pesos ($)</option>
                      <option value="USD">Dólares (US$)</option>
                    </Select>
                  </Field>
                  <Field label="Fecha">
                    <Input
                      type="date"
                      value={p.fecha ?? ""}
                      onChange={(e) => cambiarPago(i, { fecha: e.target.value })}
                    />
                  </Field>
                  <Field label="Detalle">
                    <div className="flex items-center gap-1.5">
                      <Input
                        value={p.detalle ?? ""}
                        placeholder="Ej: Visa 3 cuotas"
                        onChange={(e) => cambiarPago(i, { detalle: e.target.value })}
                      />
                      <button
                        type="button"
                        title="Quitar pago"
                        onClick={() =>
                          setForm({ ...form, pagos: form.pagos.filter((_, idx) => idx !== i) })
                        }
                        className="shrink-0 text-muted-foreground/60 hover:text-destructive"
                      >
                        🗑
                      </button>
                    </div>
                  </Field>
                </div>
              ))}
            </div>
          )}

          <div className="grid gap-2 rounded-md bg-muted/50 p-3 text-sm sm:grid-cols-3">
            <p>
              Pagos: <strong>{fmtMonto(pagado, form.moneda)}</strong>
              {Object.entries(otrasMonedas).map(([m, v]) => (
                <span key={m} className="block text-xs text-muted-foreground">
                  + {fmtMonto(v, m)} en {m}
                </span>
              ))}
            </p>
            <p>
              Entregado (pagos + seña + permutas):{" "}
              <strong>{fmtMonto(entregado, form.moneda)}</strong>
            </p>
            <p>
              Saldo:{" "}
              <strong className={saldo > 0 ? "text-destructive" : "text-success"}>
                {fmtMonto(saldo, form.moneda)}
              </strong>
              {saldo > 0 ? (
                <span className="block text-xs text-muted-foreground">
                  Marcá la forma de pago “Financiado” para que se arme la financiación sola.
                </span>
              ) : null}
            </p>
          </div>
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
