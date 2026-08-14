"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export type CotRow = {
  id: string;
  numero: number;
  cliente: string;
  evento: string;
  tipo: string;
  fecha: string;
  estado: string;
  precioUsd: number;
  mobiliario: number;
};
export type SectorMob = { sector: string; items: { id: string; nombre: string; precio: number }[] };
type Contacto = { id: string; name: string; phone: string | null };

const ESTADOS: Record<string, { label: string; color: string }> = {
  BORRADOR: { label: "Borrador", color: "#9E9387" },
  ENVIADO: { label: "Enviada", color: "#B8935A" },
  ACEPTADO: { label: "Aceptada", color: "#5A8A57" },
  RECHAZADO: { label: "Rechazada", color: "#B85850" },
};

const plata = (n: number) => `$ ${Math.round(n).toLocaleString("es-AR")}`;

/** El armador de Jess: modal como el suyo, con la plantilla y el mobiliario real. */
export function CotizacionesPanel({
  slug, cotizaciones, contactos, tipos, mobiliario, plantilla,
}: {
  slug: string;
  cotizaciones: CotRow[];
  contactos: Contacto[];
  tipos: string[];
  mobiliario: SectorMob[];
  plantilla: { precio: number; moneda: string; nota: string };
}) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState("");
  const [f, setF] = useState({ evento: "", tipo: "", fechaEvento: "", cliente: "", telefono: "", lugar: "", precioUsd: 0, nota: "" });
  // Cantidad por ítem de mobiliario (0 = no va). Tildar pone 1; el stepper suma.
  const [cant, setCant] = useState<Record<string, number>>({});

  const etiqueta = "text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground";
  const input = "h-10 w-full border border-border bg-white px-3 text-sm outline-none focus:border-primary";

  const todosLosItems = useMemo(() => mobiliario.flatMap((s) => s.items), [mobiliario]);
  const totalMob = useMemo(
    () => todosLosItems.reduce((a, i) => a + (cant[i.id] ?? 0) * i.precio, 0),
    [cant, todosLosItems]
  );
  function ponerCant(id: string, n: number) {
    setCant((c) => {
      const nx = { ...c };
      if (n <= 0) delete nx[id]; else nx[id] = n;
      return nx;
    });
  }

  function usarPlantilla() {
    setF({ ...f, precioUsd: plantilla.precio, nota: plantilla.nota });
  }

  async function guardar() {
    if (!f.cliente.trim()) return setError("Elegí o cargá el cliente");
    if (!f.evento.trim()) return setError("Poné el nombre del evento");
    setOcupado(true); setError("");
    const items = todosLosItems.filter((i) => (cant[i.id] ?? 0) > 0).map((i) => ({ detalle: i.nombre, cant: cant[i.id], unitario: i.precio }));
    const r = await fetch(`/api/os/${slug}/presupuestos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre: f.cliente,
        telefono: f.telefono,
        datos: [
          { etiqueta: "Evento", valor: f.evento },
          { etiqueta: "Tipo", valor: f.tipo },
          { etiqueta: "FechaEvento", valor: f.fechaEvento },
          { etiqueta: "Lugar", valor: f.lugar },
          { etiqueta: "PrecioUSD", valor: String(f.precioUsd || 0) },
        ].filter((d) => d.valor),
        items: items.length ? items : [{ detalle: "Servicio integral de organización", cant: 1, unitario: 0 }],
        materiales: 0,
        condiciones: f.nota,
      }),
    });
    setOcupado(false);
    if (!r.ok) return setError("No se pudo guardar");
    const d = (await r.json()) as { id: string };
    setAbierto(false);
    setCant({});
    setF({ evento: "", tipo: "", fechaEvento: "", cliente: "", telefono: "", lugar: "", precioUsd: 0, nota: "" });
    window.open(`/os/${slug}/cotizaciones/${d.id}/imprimir`, "_blank");
    router.refresh();
  }

  async function cambiarEstado(id: string, estado: string) {
    await fetch(`/api/os/${slug}/presupuestos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado }),
    });
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => setAbierto(true)}
          className="px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] transition hover:opacity-90"
          style={{ backgroundColor: "#1A1816", color: "#EDE8DE" }}
        >
          + Cotización
        </button>
      </div>

      {cotizaciones.length === 0 ? (
        <div className="border border-dashed border-border px-4 py-14 text-center">
          <p className="text-[22px]" style={{ fontFamily: "var(--font-italiana)" }}>Sin cotizaciones</p>
          <p className="mt-1 text-sm text-muted-foreground">Generá tu primera cotización</p>
        </div>
      ) : (
        <div className="overflow-hidden border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              <tr>
                <th className="px-3 py-2.5">N°</th>
                <th className="px-3 py-2.5">Evento</th>
                <th className="px-3 py-2.5">Cliente</th>
                <th className="px-3 py-2.5 text-right">Servicio</th>
                <th className="px-3 py-2.5 text-right">Mobiliario</th>
                <th className="px-3 py-2.5">Estado</th>
                <th className="px-3 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {cotizaciones.map((c) => {
                const est = ESTADOS[c.estado] ?? ESTADOS.BORRADOR;
                return (
                  <tr key={c.id}>
                    <td className="px-3 py-3 font-semibold">#{String(c.numero).padStart(4, "0")}</td>
                    <td className="px-3 py-3">
                      <p className="font-medium">{c.evento || "—"}</p>
                      <p className="text-xs text-muted-foreground">{c.tipo}{c.tipo ? " · " : ""}{c.fecha}</p>
                    </td>
                    <td className="px-3 py-3">{c.cliente}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{c.precioUsd ? `USD ${c.precioUsd.toLocaleString("es-AR")}` : "—"}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{c.mobiliario ? plata(c.mobiliario) : "—"}</td>
                    <td className="px-3 py-3">
                      <span className="inline-flex items-center gap-1.5 border border-border px-2 py-0.5 text-xs">
                        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: est.color }} />
                        {est.label}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <div className="flex justify-end gap-1.5">
                        <a href={`/os/${slug}/cotizaciones/${c.id}/imprimir`} target="_blank" rel="noreferrer" className="border border-border px-2 py-1 text-xs transition hover:bg-muted">
                          PDF
                        </a>
                        {c.estado === "ENVIADO" ? (
                          <>
                            <button onClick={() => cambiarEstado(c.id, "ACEPTADO")} className="border border-border px-2 py-1 text-xs transition hover:bg-muted">✓ Aceptada</button>
                            <button onClick={() => cambiarEstado(c.id, "RECHAZADO")} className="border border-border px-2 py-1 text-xs text-muted-foreground transition hover:text-destructive">✕</button>
                          </>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Modal como el de ellos ── */}
      {abierto ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 py-8" onClick={() => setAbierto(false)}>
          <div className="w-full max-w-2xl border border-border" style={{ backgroundColor: "#EDE8DE" }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 className="text-[26px]" style={{ fontFamily: "var(--font-italiana)" }}>Nueva cotización</h2>
              <button onClick={() => setAbierto(false)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>

            <div className="space-y-5 px-6 py-5">
              <div className="flex justify-end">
                <button
                  onClick={usarPlantilla}
                  className="border border-border bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] transition hover:bg-muted"
                >
                  ✦ Usar plantilla de presupuesto
                </button>
              </div>

              <div>
                <p className={`${etiqueta} border-b border-border pb-1.5`}>Datos del evento</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <label className="sm:col-span-2">
                    <span className={etiqueta}>Nombre del evento</span>
                    <input placeholder="Ej: Boda García · Cumple Valentina" value={f.evento} onChange={(e) => setF({ ...f, evento: e.target.value })} className={`${input} mt-1`} />
                  </label>
                  <label>
                    <span className={etiqueta}>Tipo</span>
                    <select value={f.tipo} onChange={(e) => setF({ ...f, tipo: e.target.value })} className={`${input} mt-1`}>
                      <option value="">— Tipo —</option>
                      {tipos.map((t) => <option key={t}>{t}</option>)}
                    </select>
                  </label>
                  <label>
                    <span className={etiqueta}>Fecha del evento</span>
                    <input type="date" value={f.fechaEvento} onChange={(e) => setF({ ...f, fechaEvento: e.target.value })} className={`${input} mt-1`} />
                  </label>
                  <label>
                    <span className={etiqueta}>Cliente (elegí o cargá uno nuevo)</span>
                    <input
                      list="clientes-jess"
                      placeholder="Nombre y apellido"
                      value={f.cliente}
                      onChange={(e) => {
                        const c = contactos.find((x) => x.name === e.target.value);
                        setF({ ...f, cliente: e.target.value, telefono: c?.phone ?? f.telefono });
                      }}
                      className={`${input} mt-1`}
                    />
                    <datalist id="clientes-jess">
                      {contactos.map((c) => <option key={c.id} value={c.name} />)}
                    </datalist>
                  </label>
                  <label>
                    <span className={etiqueta}>Lugar / Venue</span>
                    <input placeholder="Ej: Estancia Los Álamos" value={f.lugar} onChange={(e) => setF({ ...f, lugar: e.target.value })} className={`${input} mt-1`} />
                  </label>
                  <label>
                    <span className={etiqueta}>Precio del servicio ({plantilla.moneda})</span>
                    <input type="number" min={0} value={f.precioUsd || ""} onChange={(e) => setF({ ...f, precioUsd: Number(e.target.value) })} className={`${input} mt-1`} />
                  </label>
                  <label>
                    <span className={etiqueta}>Teléfono</span>
                    <input value={f.telefono} onChange={(e) => setF({ ...f, telefono: e.target.value })} className={`${input} mt-1`} />
                  </label>
                </div>
              </div>

              {/* Mobiliario: los elementos reales con sus valores */}
              <div>
                <div className="flex items-baseline justify-between border-b border-border pb-1.5">
                  <p className={etiqueta}>Mobiliario · Seleccioná los ítems</p>
                  <span className="flex gap-3 text-[11px]">
                    <button onClick={() => setCant(Object.fromEntries(todosLosItems.filter((i) => i.precio > 0).map((i) => [i.id, 1])))} className="underline underline-offset-2 hover:opacity-70">Seleccionar todo</button>
                    <button onClick={() => setCant({})} className="underline underline-offset-2 hover:opacity-70">Limpiar</button>
                  </span>
                </div>
                <div className="mt-3 max-h-72 space-y-4 overflow-y-auto pr-1">
                  {mobiliario.map((s) => (
                    <div key={s.sector}>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: "#9E9387" }}>{s.sector}</p>
                      <div className="mt-1.5 grid gap-1 sm:grid-cols-2">
                        {s.items.map((i) => (
                          <label key={i.id} className="flex cursor-pointer items-center gap-2 bg-white px-2.5 py-1.5 text-[13px]">
                            <input
                              type="checkbox"
                              checked={(cant[i.id] ?? 0) > 0}
                              onChange={(e) => ponerCant(i.id, e.target.checked ? 1 : 0)}
                            />
                            <span className="flex-1 leading-tight">{i.nombre}</span>
                            {(cant[i.id] ?? 0) > 0 ? (
                              <span className="flex items-center gap-1" onClick={(e) => e.preventDefault()}>
                                <button
                                  type="button"
                                  onClick={() => ponerCant(i.id, (cant[i.id] ?? 1) - 1)}
                                  className="h-5 w-5 border border-border leading-none transition hover:bg-muted"
                                >
                                  −
                                </button>
                                <span className="w-6 text-center font-semibold tabular-nums">{cant[i.id]}</span>
                                <button
                                  type="button"
                                  onClick={() => ponerCant(i.id, (cant[i.id] ?? 1) + 1)}
                                  className="h-5 w-5 border border-border leading-none transition hover:bg-muted"
                                >
                                  +
                                </button>
                              </span>
                            ) : null}
                            <span className="tabular-nums text-muted-foreground">
                              {i.precio ? ((cant[i.id] ?? 0) > 1 ? plata(i.precio * cant[i.id]) : plata(i.precio)) : "consultar"}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <p className="mt-3 border-t border-border pt-2 text-right text-sm">
                  Total estimado mobiliario: <strong className="tabular-nums">{plata(totalMob)}</strong>
                </p>
              </div>

              <label>
                <span className={`${etiqueta} block border-b border-border pb-1.5`}>Notas (aparecen en el PDF)</span>
                <textarea rows={3} value={f.nota} onChange={(e) => setF({ ...f, nota: e.target.value })} placeholder="Descripción de servicios, condiciones, lo que incluye…" className={`${input} mt-2 h-auto py-2`} />
              </label>

              {error ? <p className="bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p> : null}
            </div>

            <div className="flex justify-end gap-2 border-t border-border px-6 py-4">
              <button onClick={() => setAbierto(false)} className="border border-border bg-white px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] transition hover:bg-muted">
                Cancelar
              </button>
              <button onClick={guardar} disabled={ocupado} className="px-6 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] transition hover:opacity-90 disabled:opacity-50" style={{ backgroundColor: "#1A1816", color: "#EDE8DE" }}>
                {ocupado ? "Guardando…" : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
