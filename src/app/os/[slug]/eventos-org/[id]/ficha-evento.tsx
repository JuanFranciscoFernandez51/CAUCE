"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

/**
 * Ficha del evento estilo boleto de la concesionaria: una página donde se
 * edita todo, se registran los pagos y se bajan los presupuestos.
 */
type Hito = { titulo: string; fecha: string; hecho: boolean };
type Pago = { fecha: string; concepto: string; monto: number };
type MobItem = { id: string; nombre: string; cant: number; precio: number };
export type PresupuestoLigado = { id: string; numero: number; estado: string; fecha: string };

type Evento = {
  id: string;
  nombre: string;
  tipo: string;
  fecha: string;
  lugar: string;
  estado: string;
  presupuesto: number;
  cobrado: number;
  contacto: string;
  telefono: string;
  notas: string;
  hitos: Hito[];
  pagos: Pago[];
  mobiliario: MobItem[];
};

const ESTADOS: { k: string; label: string; color: string }[] = [
  { k: "cotizado", label: "Cotizado", color: "#9E9387" },
  { k: "confirmado", label: "Confirmado", color: "#B8935A" },
  { k: "produccion", label: "En producción", color: "#B85850" },
  { k: "cerrado", label: "Cerrado", color: "#5A8A57" },
];

const plata = (n: number) => `$ ${Math.round(n).toLocaleString("es-AR")}`;
const etiqueta = "text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground";
const input = "h-10 w-full rounded-lg border border-border bg-white px-3 text-sm outline-none focus:border-primary";
const hoy = () => new Date().toISOString().slice(0, 10);

export function FichaEvento({
  slug, evento, tipos, presupuestos,
}: {
  slug: string; evento: Evento; tipos: string[]; presupuestos: PresupuestoLigado[];
}) {
  const router = useRouter();
  const base = `/os/${slug}`;
  const [e, setE] = useState(evento);
  const [estadoUi, setEstadoUi] = useState("");
  const [nuevoPago, setNuevoPago] = useState({ fecha: hoy(), concepto: "Seña", monto: 0 });
  const [nuevoHito, setNuevoHito] = useState({ titulo: "", fecha: "" });

  async function patch(data: Record<string, unknown>, refrescar = false) {
    setEstadoUi("Guardando…");
    const r = await fetch(`/api/os/${slug}/eventos-org/${evento.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setEstadoUi(r.ok ? "Guardado ✓" : "No se pudo guardar");
    setTimeout(() => setEstadoUi(""), 2000);
    if (r.ok && refrescar) router.refresh();
    return r.ok;
  }

  function guardarDatos() {
    void patch({
      nombre: e.nombre,
      tipo: e.tipo,
      fecha: e.fecha || null,
      lugar: e.lugar || null,
      contacto: e.contacto || null,
      telefono: e.telefono || null,
      presupuesto: e.presupuesto,
      notas: e.notas || null,
    });
  }

  async function cambiarEstado(k: string) {
    setE({ ...e, estado: k });
    void patch({ estado: k });
  }

  async function agregarPago() {
    if (!nuevoPago.monto) return;
    const pagos = [...e.pagos, { ...nuevoPago, concepto: nuevoPago.concepto || "Pago" }];
    setE({ ...e, pagos, cobrado: pagos.reduce((a, p) => a + p.monto, 0) });
    setNuevoPago({ fecha: hoy(), concepto: "Pago", monto: 0 });
    void patch({ pagos });
  }

  async function borrarPago(i: number) {
    const pagos = e.pagos.filter((_, j) => j !== i);
    setE({ ...e, pagos, cobrado: pagos.reduce((a, p) => a + p.monto, 0) });
    void patch({ pagos });
  }

  function ponerHitos(hitos: Hito[]) {
    setE({ ...e, hitos });
    void patch({ hitos });
  }

  const saldo = e.presupuesto - e.cobrado;
  const totalMob = e.mobiliario.reduce((a, m) => a + m.cant * m.precio, 0);
  const estadoActual = ESTADOS.find((x) => x.k === e.estado);

  return (
    <div className="p-4 sm:p-6">
      {/* Cabecera */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <Link href={`${base}/eventos-org`} className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground transition hover:text-foreground">
            ← Eventos
          </Link>
          <input
            value={e.nombre}
            onChange={(ev) => setE({ ...e, nombre: ev.target.value })}
            onBlur={guardarDatos}
            className="mt-1 w-full border-0 bg-transparent text-[38px] leading-tight outline-none sm:text-[48px]"
            style={{ fontFamily: "var(--font-italiana)" }}
          />
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: estadoActual?.color }}>
            {estadoActual?.label} {estadoUi ? <span className="ml-3 normal-case tracking-normal text-muted-foreground">{estadoUi}</span> : null}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {ESTADOS.map((x) => (
            <button
              key={x.k}
              onClick={() => cambiarEstado(x.k)}
              className="rounded-lg border px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] transition"
              style={e.estado === x.k
                ? { backgroundColor: x.color, borderColor: x.color, color: "#fff" }
                : { borderColor: "var(--border)", color: x.color }}
            >
              {x.label}
            </button>
          ))}
        </div>
      </div>

      {/* Banda de plata */}
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {[
          { t: "PRESUPUESTO", v: plata(e.presupuesto), c: undefined as string | undefined },
          { t: "COBRADO", v: plata(e.cobrado), c: "#5A8A57" },
          { t: "SALDO", v: plata(saldo), c: saldo > 0 ? "#B85850" : "#5A8A57" },
        ].map((k) => (
          <div key={k.t} className="rounded-xl border border-border bg-card p-4">
            <p className={etiqueta}>{k.t}</p>
            <p className="mt-1 text-[30px] leading-none tabular-nums" style={{ fontFamily: "var(--font-italiana)", color: k.c }}>{k.v}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        {/* Datos del evento */}
        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className={`${etiqueta} border-b border-border pb-2`}>Datos del evento</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label>
              <span className={etiqueta}>Tipo</span>
              <select value={e.tipo} onChange={(ev) => setE({ ...e, tipo: ev.target.value })} className={`${input} mt-1`}>
                {[...new Set([e.tipo, ...tipos, "otros"])].filter(Boolean).map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
            <label>
              <span className={etiqueta}>Fecha</span>
              <input type="date" value={e.fecha} onChange={(ev) => setE({ ...e, fecha: ev.target.value })} className={`${input} mt-1`} />
            </label>
            <label className="sm:col-span-2">
              <span className={etiqueta}>Lugar / venue</span>
              <input value={e.lugar} onChange={(ev) => setE({ ...e, lugar: ev.target.value })} className={`${input} mt-1`} />
            </label>
            <label>
              <span className={etiqueta}>Cliente</span>
              <input value={e.contacto} onChange={(ev) => setE({ ...e, contacto: ev.target.value })} className={`${input} mt-1`} />
            </label>
            <label>
              <span className={etiqueta}>Teléfono</span>
              <input value={e.telefono} onChange={(ev) => setE({ ...e, telefono: ev.target.value })} className={`${input} mt-1`} />
            </label>
            <label>
              <span className={etiqueta}>Presupuesto total</span>
              <input type="number" min={0} value={e.presupuesto || ""} onChange={(ev) => setE({ ...e, presupuesto: Number(ev.target.value) })} className={`${input} mt-1`} />
            </label>
            <label className="sm:col-span-2">
              <span className={etiqueta}>Notas</span>
              <textarea rows={2} value={e.notas} onChange={(ev) => setE({ ...e, notas: ev.target.value })} className={`${input} mt-1 h-auto py-2`} />
            </label>
          </div>
          <button
            onClick={guardarDatos}
            className="mt-4 rounded-lg px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] transition hover:opacity-90"
            style={{ backgroundColor: "#1A1816", color: "#EDE8DE" }}
          >
            Guardar datos
          </button>
        </section>

        {/* Pagos */}
        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className={`${etiqueta} border-b border-border pb-2`}>Pagos recibidos</h2>
          <div className="mt-3 divide-y divide-border">
            {e.pagos.map((p, i) => (
              <div key={`${p.fecha}-${i}`} className="flex items-center gap-3 py-2 text-sm">
                <span className="text-muted-foreground tabular-nums">{p.fecha.split("-").reverse().join("/")}</span>
                <span className="flex-1">{p.concepto}</span>
                <span className="font-semibold tabular-nums" style={{ color: "#5A8A57" }}>{plata(p.monto)}</span>
                <button onClick={() => borrarPago(i)} className="text-muted-foreground transition hover:text-destructive">✕</button>
              </div>
            ))}
            {!e.pagos.length ? <p className="py-4 text-center text-sm text-muted-foreground">Todavía sin pagos — cargá la seña acá abajo</p> : null}
          </div>
          <div className="mt-3 grid grid-cols-[auto_1fr_auto_auto] items-end gap-2 border-t border-border pt-3">
            <label>
              <span className={etiqueta}>Fecha</span>
              <input type="date" value={nuevoPago.fecha} onChange={(ev) => setNuevoPago({ ...nuevoPago, fecha: ev.target.value })} className={`${input} mt-1 w-auto`} />
            </label>
            <label>
              <span className={etiqueta}>Concepto</span>
              <input value={nuevoPago.concepto} onChange={(ev) => setNuevoPago({ ...nuevoPago, concepto: ev.target.value })} placeholder="Seña, 2da cuota…" className={`${input} mt-1`} />
            </label>
            <label>
              <span className={etiqueta}>Monto</span>
              <input type="number" min={0} value={nuevoPago.monto || ""} onChange={(ev) => setNuevoPago({ ...nuevoPago, monto: Number(ev.target.value) })} className={`${input} mt-1 w-32`} />
            </label>
            <button
              onClick={agregarPago}
              className="h-10 rounded-lg px-4 text-[11px] font-semibold uppercase tracking-[0.14em] transition hover:opacity-90"
              style={{ backgroundColor: "#1A1816", color: "#EDE8DE" }}
            >
              + Pago
            </button>
          </div>
          {saldo > 0 ? (
            <p className="mt-3 text-right text-sm">Queda por cobrar <strong style={{ color: "#B85850" }}>{plata(saldo)}</strong></p>
          ) : (
            <p className="mt-3 text-right text-sm font-semibold" style={{ color: "#5A8A57" }}>Evento al día ✓</p>
          )}
        </section>

        {/* Hitos */}
        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className={`${etiqueta} border-b border-border pb-2`}>Hitos / checklist</h2>
          <div className="mt-3 space-y-1.5">
            {e.hitos.map((h, i) => (
              <div key={`${h.titulo}-${i}`} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={h.hecho}
                  onChange={(ev) => ponerHitos(e.hitos.map((x, j) => (j === i ? { ...x, hecho: ev.target.checked } : x)))}
                />
                <span className={`flex-1 ${h.hecho ? "line-through opacity-50" : ""}`}>{h.titulo}</span>
                <span className="text-muted-foreground tabular-nums">{h.fecha ? h.fecha.split("-").reverse().join("/") : ""}</span>
                <button onClick={() => ponerHitos(e.hitos.filter((_, j) => j !== i))} className="text-muted-foreground transition hover:text-destructive">✕</button>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-end gap-2 border-t border-border pt-3">
            <label className="flex-1">
              <span className={etiqueta}>Nuevo hito</span>
              <input value={nuevoHito.titulo} onChange={(ev) => setNuevoHito({ ...nuevoHito, titulo: ev.target.value })} placeholder="Confirmar menú con catering…" className={`${input} mt-1`} />
            </label>
            <input type="date" value={nuevoHito.fecha} onChange={(ev) => setNuevoHito({ ...nuevoHito, fecha: ev.target.value })} className={`${input} w-auto`} />
            <button
              onClick={() => {
                if (!nuevoHito.titulo.trim()) return;
                ponerHitos([...e.hitos, { titulo: nuevoHito.titulo.trim(), fecha: nuevoHito.fecha, hecho: false }]);
                setNuevoHito({ titulo: "", fecha: "" });
              }}
              className="h-10 rounded-lg border border-border px-4 text-[11px] font-semibold uppercase tracking-[0.14em] transition hover:bg-muted"
            >
              + Agregar
            </button>
          </div>
        </section>

        {/* Mobiliario + presupuestos */}
        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className={`${etiqueta} border-b border-border pb-2`}>Mobiliario y presupuestos</h2>
          <div className="mt-3 flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <p className="text-sm font-semibold">Presupuesto de mobiliario</p>
              <p className="text-sm text-muted-foreground">
                {e.mobiliario.length ? `${e.mobiliario.length} ítem(s) · ${plata(totalMob)}` : "Sin armar todavía"}
              </p>
            </div>
            <Link
              href={`${base}/eventos-org/${e.id}/mobiliario`}
              className="rounded-lg px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] transition hover:opacity-90"
              style={{ backgroundColor: "#1A1816", color: "#EDE8DE" }}
            >
              {e.mobiliario.length ? "Editar / PDF" : "✦ Armar"}
            </Link>
          </div>
          <div className="mt-3">
            <p className={etiqueta}>Cotizaciones del evento</p>
            <div className="mt-2 divide-y divide-border">
              {presupuestos.map((p) => (
                <div key={p.id} className="flex items-center gap-3 py-2 text-sm">
                  <span className="font-semibold">#{String(p.numero).padStart(4, "0")}</span>
                  <span className="flex-1 text-muted-foreground">{new Date(p.fecha).toLocaleDateString("es-AR")}</span>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{p.estado}</span>
                  <a href={`${base}/cotizaciones/${p.id}/imprimir`} target="_blank" className="underline underline-offset-4 transition hover:opacity-60">
                    Descargar
                  </a>
                </div>
              ))}
              {!presupuestos.length ? <p className="py-3 text-sm text-muted-foreground">Ninguna todavía.</p> : null}
            </div>
            <Link
              href={`${base}/cotizaciones?nueva=1&evento=${encodeURIComponent(e.nombre)}&cliente=${encodeURIComponent(e.contacto)}&telefono=${encodeURIComponent(e.telefono)}&tipo=${encodeURIComponent(e.tipo)}&fechaEvento=${encodeURIComponent(e.fecha)}&lugar=${encodeURIComponent(e.lugar)}`}
              className="mt-3 inline-block rounded-lg border border-border px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] transition hover:bg-muted"
            >
              ✦ Nueva cotización de este evento
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
