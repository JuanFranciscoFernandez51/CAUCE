"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Field, Input, Select, Textarea } from "@/components/ui";
import { CopiarBtn } from "./copiar-btn";
import {
  CONTACTO_VACIO,
  CUENTA_VACIA,
  PRECIO_VACIO,
  ROLES_CONTACTO,
  TIPOS_CUENTA,
  fmtPlata,
  waLink,
  type ContactoProveedor,
  type CuentaBancaria,
  type FilaPrecio,
} from "@/lib/conce-fin";

export type ProveedorFichaData = {
  id: string;
  nombre: string;
  rubro: string;
  cuit: string;
  telefono: string;
  email: string;
  direccion: string;
  ciudad: string;
  sitio: string;
  notas: string;
  activo: boolean;
  contactos: ContactoProveedor[];
  cuentasBancarias: CuentaBancaria[];
  listaPrecios: FilaPrecio[];
};

const celda =
  "h-9 w-full rounded-md border bg-card px-2 text-sm outline-none focus:border-primary";

/**
 * Ficha completa del proveedor: datos generales + las tres tablas (contactos,
 * cuentas bancarias y lista de precios) que se editan acá mismo, agregando y
 * quitando filas sin salir. Los datos que se pegan en el homebanking (CBU,
 * alias, nº de cuenta, CUIT) tienen su botón de copiar.
 */
export function ProveedorFicha({ slug, inicial }: { slug: string; inicial: ProveedorFichaData }) {
  const router = useRouter();
  const [form, setForm] = useState(inicial);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const endpoint = `/api/os/${slug}/conce/proveedores/${inicial.id}`;

  async function guardar(e?: React.FormEvent) {
    e?.preventDefault();
    setGuardando(true);
    setError("");
    setMensaje("");
    try {
      const res = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: form.nombre.trim(),
          rubro: form.rubro.trim() || null,
          cuit: form.cuit.trim() || null,
          telefono: form.telefono.trim() || null,
          email: form.email.trim() || null,
          direccion: form.direccion.trim() || null,
          ciudad: form.ciudad.trim() || null,
          sitio: form.sitio.trim() || null,
          notas: form.notas.trim() || null,
          activo: form.activo,
          contactos: form.contactos,
          cuentasBancarias: form.cuentasBancarias,
          listaPrecios: form.listaPrecios.map((p) => ({
            ...p,
            precio: p.precio == null ? null : Number(p.precio),
          })),
        }),
      });
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) throw new Error(data?.error ?? "No se pudo guardar");
      setMensaje("Guardado ✓");
      setTimeout(() => setMensaje(""), 2000);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar");
    } finally {
      setGuardando(false);
    }
  }

  // ── Helpers de filas ────────────────────────────────────────────────────
  const setContacto = (i: number, cambios: Partial<ContactoProveedor>) =>
    setForm((f) => ({
      ...f,
      contactos: f.contactos.map((c, n) => (n === i ? { ...c, ...cambios } : c)),
    }));
  const setCuenta = (i: number, cambios: Partial<CuentaBancaria>) =>
    setForm((f) => ({
      ...f,
      cuentasBancarias: f.cuentasBancarias.map((c, n) => (n === i ? { ...c, ...cambios } : c)),
    }));
  const setPrecio = (i: number, cambios: Partial<FilaPrecio>) =>
    setForm((f) => ({
      ...f,
      listaPrecios: f.listaPrecios.map((p, n) => (n === i ? { ...p, ...cambios } : p)),
    }));

  return (
    <form onSubmit={guardar} className="space-y-4">
      {/* ── Datos generales ── */}
      <Card className="space-y-3 p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Datos del proveedor
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Nombre / razón social">
            <Input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
          </Field>
          <Field label="Rubro">
            <Input
              value={form.rubro}
              onChange={(e) => setForm({ ...form, rubro: e.target.value })}
              placeholder="Repuestos, seguros, gestoría…"
            />
          </Field>
          <Field label="CUIT">
            <div className="flex items-center gap-1.5">
              <Input value={form.cuit} onChange={(e) => setForm({ ...form, cuit: e.target.value })} />
              <CopiarBtn valor={form.cuit} etiqueta="CUIT" />
            </div>
          </Field>
          <Field label="Estado">
            <Select
              value={form.activo ? "si" : "no"}
              onChange={(e) => setForm({ ...form, activo: e.target.value === "si" })}
            >
              <option value="si">Activo</option>
              <option value="no">Inactivo</option>
            </Select>
          </Field>
          <Field label="Teléfono">
            <div className="flex items-center gap-1.5">
              <Input
                value={form.telefono}
                onChange={(e) => setForm({ ...form, telefono: e.target.value })}
              />
              {form.telefono.trim() ? (
                <a
                  href={waLink(form.telefono, `Hola ${form.nombre}, ¿cómo va?`)}
                  target="_blank"
                  rel="noreferrer"
                  title="WhatsApp"
                  className="shrink-0 rounded-md border px-2 py-1 text-sm hover:bg-muted"
                >
                  💬
                </a>
              ) : null}
            </div>
          </Field>
          <Field label="Email">
            <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </Field>
          <Field label="Dirección">
            <Input
              value={form.direccion}
              onChange={(e) => setForm({ ...form, direccion: e.target.value })}
            />
          </Field>
          <Field label="Ciudad">
            <Input value={form.ciudad} onChange={(e) => setForm({ ...form, ciudad: e.target.value })} />
          </Field>
        </div>
        <Field label="Sitio / catálogo">
          <Input
            value={form.sitio}
            onChange={(e) => setForm({ ...form, sitio: e.target.value })}
            placeholder="https://…"
          />
        </Field>
        <Field label="Notas internas">
          <Textarea
            rows={2}
            value={form.notas}
            onChange={(e) => setForm({ ...form, notas: e.target.value })}
            placeholder="Ej: entrega los martes, pide 50% adelantado…"
          />
        </Field>
      </Card>

      {/* ── Contactos ── */}
      <Card className="space-y-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Contactos ({form.contactos.length})
          </h2>
          <button
            type="button"
            onClick={() => setForm({ ...form, contactos: [...form.contactos, CONTACTO_VACIO()] })}
            className="rounded-md border px-2.5 py-1 text-sm font-medium hover:bg-muted"
          >
            + Agregar contacto
          </button>
        </div>
        {form.contactos.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Sin contactos cargados — administración, vendedores, posventa.
          </p>
        ) : (
          <div className="space-y-2">
            {form.contactos.map((c, i) => (
              <div key={c.id} className="grid gap-2 sm:grid-cols-[1.4fr_1fr_1fr_1.2fr_auto]">
                <input
                  className={celda}
                  placeholder="Nombre"
                  value={c.nombre}
                  onChange={(e) => setContacto(i, { nombre: e.target.value })}
                />
                <select
                  className={celda}
                  value={c.rol}
                  onChange={(e) => setContacto(i, { rol: e.target.value })}
                >
                  {ROLES_CONTACTO.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
                <div className="flex items-center gap-1">
                  <input
                    className={celda}
                    placeholder="Teléfono"
                    value={c.telefono}
                    onChange={(e) => setContacto(i, { telefono: e.target.value })}
                  />
                  {c.telefono.trim() ? (
                    <a
                      href={waLink(
                        c.telefono,
                        `Hola ${c.nombre || ""}, ¿cómo va? Te escribo de la concesionaria.`
                      )}
                      target="_blank"
                      rel="noreferrer"
                      title="WhatsApp a este contacto"
                      className="shrink-0 rounded-md border px-2 py-1.5 text-sm hover:bg-muted"
                    >
                      💬
                    </a>
                  ) : null}
                </div>
                <input
                  className={celda}
                  placeholder="Email"
                  value={c.email}
                  onChange={(e) => setContacto(i, { email: e.target.value })}
                />
                <button
                  type="button"
                  title="Quitar contacto"
                  onClick={() =>
                    setForm({ ...form, contactos: form.contactos.filter((_, n) => n !== i) })
                  }
                  className="rounded-md border px-2 text-muted-foreground hover:border-destructive hover:text-destructive"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* ── Cuentas bancarias ── */}
      <Card className="space-y-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Cuentas bancarias ({form.cuentasBancarias.length})
          </h2>
          <button
            type="button"
            onClick={() =>
              setForm({ ...form, cuentasBancarias: [...form.cuentasBancarias, CUENTA_VACIA()] })
            }
            className="rounded-md border px-2.5 py-1 text-sm font-medium hover:bg-muted"
          >
            + Agregar cuenta
          </button>
        </div>
        {form.cuentasBancarias.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Sin cuentas cargadas — cargá CBU y alias y después los copiás de un toque.
          </p>
        ) : (
          <div className="space-y-3">
            {form.cuentasBancarias.map((c, i) => (
              <div key={c.id} className="space-y-2 rounded-lg border p-3">
                <div className="grid gap-2 sm:grid-cols-[1.3fr_1fr_1fr_auto]">
                  <input
                    className={celda}
                    placeholder="Banco"
                    value={c.banco}
                    onChange={(e) => setCuenta(i, { banco: e.target.value })}
                  />
                  <select
                    className={celda}
                    value={c.tipo}
                    onChange={(e) => setCuenta(i, { tipo: e.target.value })}
                  >
                    {TIPOS_CUENTA.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  <select
                    className={celda}
                    value={c.moneda}
                    onChange={(e) => setCuenta(i, { moneda: e.target.value })}
                  >
                    <option value="ARS">Pesos</option>
                    <option value="USD">Dólares</option>
                  </select>
                  <button
                    type="button"
                    title="Quitar cuenta"
                    onClick={() =>
                      setForm({
                        ...form,
                        cuentasBancarias: form.cuentasBancarias.filter((_, n) => n !== i),
                      })
                    }
                    className="rounded-md border px-2 text-muted-foreground hover:border-destructive hover:text-destructive"
                  >
                    ✕
                  </button>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="flex items-center gap-1.5">
                    <input
                      className={`${celda} font-mono`}
                      placeholder="CBU / CVU"
                      value={c.cbu}
                      onChange={(e) => setCuenta(i, { cbu: e.target.value })}
                    />
                    <CopiarBtn valor={c.cbu} etiqueta="CBU" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      className={celda}
                      placeholder="Alias"
                      value={c.alias}
                      onChange={(e) => setCuenta(i, { alias: e.target.value })}
                    />
                    <CopiarBtn valor={c.alias} etiqueta="alias" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      className={`${celda} font-mono`}
                      placeholder="Nº de cuenta"
                      value={c.numero}
                      onChange={(e) => setCuenta(i, { numero: e.target.value })}
                    />
                    <CopiarBtn valor={c.numero} etiqueta="número de cuenta" />
                  </div>
                  <input
                    className={celda}
                    placeholder="Titular"
                    value={c.titular}
                    onChange={(e) => setCuenta(i, { titular: e.target.value })}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* ── Lista de precios ── */}
      <Card className="space-y-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Lista de precios ({form.listaPrecios.length})
          </h2>
          <button
            type="button"
            onClick={() => setForm({ ...form, listaPrecios: [...form.listaPrecios, PRECIO_VACIO()] })}
            className="rounded-md border px-2.5 py-1 text-sm font-medium hover:bg-muted"
          >
            + Agregar fila
          </button>
        </div>
        {form.listaPrecios.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Sin precios cargados — lo que te cobra este proveedor por cada cosa.
          </p>
        ) : (
          <div className="space-y-2">
            {form.listaPrecios.map((p, i) => (
              <div key={p.id} className="grid gap-2 sm:grid-cols-[1.8fr_0.9fr_0.7fr_1.3fr_auto]">
                <input
                  className={celda}
                  placeholder="Concepto (ej: service 10.000 km)"
                  value={p.concepto}
                  onChange={(e) => setPrecio(i, { concepto: e.target.value })}
                />
                <input
                  className={`${celda} text-right`}
                  type="number"
                  min={0}
                  placeholder="Precio"
                  value={p.precio ?? ""}
                  onChange={(e) =>
                    setPrecio(i, { precio: e.target.value === "" ? null : Number(e.target.value) })
                  }
                />
                <select
                  className={celda}
                  value={p.moneda}
                  onChange={(e) => setPrecio(i, { moneda: e.target.value })}
                >
                  <option value="ARS">$</option>
                  <option value="USD">US$</option>
                </select>
                <input
                  className={celda}
                  placeholder="Notas"
                  value={p.notas}
                  onChange={(e) => setPrecio(i, { notas: e.target.value })}
                />
                <button
                  type="button"
                  title="Quitar fila"
                  onClick={() =>
                    setForm({ ...form, listaPrecios: form.listaPrecios.filter((_, n) => n !== i) })
                  }
                  className="rounded-md border px-2 text-muted-foreground hover:border-destructive hover:text-destructive"
                >
                  ✕
                </button>
              </div>
            ))}
            <p className="text-right text-xs text-muted-foreground">
              Total de la lista:{" "}
              {fmtPlata(
                form.listaPrecios.reduce((a, p) => a + (Number(p.precio) || 0), 0),
                "ARS"
              )}
            </p>
          </div>
        )}
      </Card>

      <div className="sticky bottom-3 flex flex-wrap items-center gap-3 rounded-lg border bg-card/95 p-3 backdrop-blur">
        <Button type="submit" disabled={guardando}>
          {guardando ? "Guardando…" : "Guardar cambios"}
        </Button>
        {mensaje ? <span className="text-sm text-success">{mensaje}</span> : null}
        {error ? <span className="text-sm text-destructive">{error}</span> : null}
        <span className="ml-auto text-xs text-muted-foreground">
          Todo se edita acá: agregás y sacás filas y guardás una sola vez.
        </span>
      </div>
    </form>
  );
}
