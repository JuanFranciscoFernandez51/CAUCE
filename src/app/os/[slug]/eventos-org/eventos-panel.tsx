"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type Hito = { titulo: string; fecha: string; hecho: boolean };
export type EventoRow = {
  id: string;
  nombre: string;
  tipo: string;
  fecha: string | null;
  lugar: string | null;
  estado: string;
  presupuesto: number;
  cobrado: number;
  contacto: string | null;
  telefono: string | null;
  hitos: Hito[];
  notas: string | null;
};

const ESTADOS = [
  { key: "cotizado", label: "Cotizado", color: "#9E9387" },
  { key: "confirmado", label: "Confirmado", color: "#B8935A" },
  { key: "produccion", label: "En producción", color: "#B85850" },
  { key: "cerrado", label: "Cerrado", color: "#5A8A57" },
];

const plata = (n: number) => `$ ${Math.round(n).toLocaleString("es-AR")}`;
const VACIO: EventoRow = { id: "", nombre: "", tipo: "Boda", fecha: null, lugar: "", estado: "cotizado", presupuesto: 0, cobrado: 0, contacto: "", telefono: "", hitos: [], notas: "" };

export function EventosPanel({
  slug, eventos, tipos, abrirInicial, nuevoInicial,
}: {
  slug: string; eventos: EventoRow[]; tipos: string[]; abrirInicial: string | null; nuevoInicial: boolean;
}) {
  const router = useRouter();
  const [sel, setSel] = useState<EventoRow | null>(
    nuevoInicial ? VACIO : eventos.find((e) => e.id === abrirInicial) ?? null
  );
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState("");
  const [hitoNuevo, setHitoNuevo] = useState({ titulo: "", fecha: "" });

  const input = "h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary";

  async function guardar() {
    if (!sel) return;
    if (!sel.nombre.trim()) return setError("Poné un nombre");
    setOcupado(true); setError("");
    const cuerpo = { ...sel, lugar: sel.lugar ?? "", contacto: sel.contacto ?? "", telefono: sel.telefono ?? "", notas: sel.notas ?? "" };
    const r = sel.id
      ? await fetch(`/api/os/${slug}/eventos-org/${sel.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(cuerpo) })
      : await fetch(`/api/os/${slug}/eventos-org`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(cuerpo) });
    setOcupado(false);
    if (!r.ok) return setError("No se pudo guardar");
    setSel(null);
    router.replace(`/os/${slug}/eventos-org`);
    router.refresh();
  }

  async function borrar() {
    if (!sel?.id || !confirm(`¿Borrar "${sel.nombre}"?`)) return;
    await fetch(`/api/os/${slug}/eventos-org/${sel.id}`, { method: "DELETE" });
    setSel(null);
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button
          onClick={() => setSel(VACIO)}
          className="rounded-lg px-4 py-2.5 text-[12px] font-semibold uppercase tracking-[0.12em] transition hover:opacity-90"
          style={{ backgroundColor: "#1A1816", color: "#EDE8DE" }}
        >
          + Nuevo evento
        </button>
      </div>

      {eventos.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
          Sin eventos todavía.
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              <tr>
                <th className="px-3 py-2.5">Evento</th>
                <th className="px-3 py-2.5">Fecha</th>
                <th className="px-3 py-2.5">Estado</th>
                <th className="px-3 py-2.5 text-right">Presupuesto</th>
                <th className="px-3 py-2.5 text-right">Saldo</th>
                <th className="px-3 py-2.5">Hitos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {eventos.map((e) => {
                const saldo = e.presupuesto - e.cobrado;
                const est = ESTADOS.find((x) => x.key === e.estado);
                const pend = e.hitos.filter((h) => !h.hecho).length;
                return (
                  <tr key={e.id} onClick={() => setSel(e)} className="cursor-pointer transition hover:bg-muted/40">
                    <td className="px-3 py-3">
                      <p className="font-semibold">{e.nombre}</p>
                      <p className="text-xs text-muted-foreground">{e.tipo}{e.lugar ? ` · ${e.lugar}` : ""}</p>
                    </td>
                    <td className="px-3 py-3 text-xs">{e.fecha ? new Date(e.fecha + "T12:00").toLocaleDateString("es-AR") : "—"}</td>
                    <td className="px-3 py-3">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-0.5 text-xs">
                        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: est?.color }} />
                        {est?.label}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right font-medium tabular-nums">{plata(e.presupuesto)}</td>
                    <td className="px-3 py-3 text-right tabular-nums" style={saldo > 0 ? { color: "#B85850", fontWeight: 600 } : undefined}>
                      {saldo > 0 ? plata(saldo) : "✓"}
                    </td>
                    <td className="px-3 py-3 text-xs text-muted-foreground">{pend ? `${pend} pendiente${pend > 1 ? "s" : ""}` : "al día"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Editor */}
      {sel ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setSel(null)}>
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-border bg-card p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-[26px]" style={{ fontFamily: "var(--font-italiana)" }}>
                {sel.id ? "Editar evento" : "Nuevo evento"}
              </h2>
              <button onClick={() => setSel(null)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <input placeholder="Nombre del evento *" value={sel.nombre} onChange={(e) => setSel({ ...sel, nombre: e.target.value })} className={`${input} sm:col-span-2`} />
              <select value={sel.tipo} onChange={(e) => setSel({ ...sel, tipo: e.target.value })} className={input}>
                {tipos.map((t) => <option key={t}>{t}</option>)}
              </select>
              <input type="date" value={sel.fecha ?? ""} onChange={(e) => setSel({ ...sel, fecha: e.target.value || null })} className={input} />
              <input placeholder="Lugar" value={sel.lugar ?? ""} onChange={(e) => setSel({ ...sel, lugar: e.target.value })} className={input} />
              <select value={sel.estado} onChange={(e) => setSel({ ...sel, estado: e.target.value })} className={input}>
                {ESTADOS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
              <input placeholder="Contacto" value={sel.contacto ?? ""} onChange={(e) => setSel({ ...sel, contacto: e.target.value })} className={input} />
              <input placeholder="Teléfono" value={sel.telefono ?? ""} onChange={(e) => setSel({ ...sel, telefono: e.target.value })} className={input} />
              <label className="text-xs text-muted-foreground">
                Presupuesto
                <input type="number" min={0} value={sel.presupuesto || ""} onChange={(e) => setSel({ ...sel, presupuesto: Number(e.target.value) })} className={`${input} mt-1`} />
              </label>
              <label className="text-xs text-muted-foreground">
                Cobrado
                <input type="number" min={0} value={sel.cobrado || ""} onChange={(e) => setSel({ ...sel, cobrado: Number(e.target.value) })} className={`${input} mt-1`} />
              </label>
              <textarea placeholder="Notas" value={sel.notas ?? ""} onChange={(e) => setSel({ ...sel, notas: e.target.value })} rows={2} className={`${input} h-auto py-2 sm:col-span-2`} />
            </div>

            {/* Hitos */}
            <div className="mt-5 rounded-lg border border-border p-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Hitos</p>
              <div className="mt-2 space-y-1.5">
                {sel.hitos.map((h, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={h.hecho}
                      onChange={(e) => setSel({ ...sel, hitos: sel.hitos.map((x, j) => (j === i ? { ...x, hecho: e.target.checked } : x)) })}
                    />
                    <span className={`flex-1 ${h.hecho ? "line-through opacity-50" : ""}`}>{h.titulo}</span>
                    <span className="text-xs text-muted-foreground">{h.fecha ? new Date(h.fecha).toLocaleDateString("es-AR", { day: "numeric", month: "short" }) : ""}</span>
                    <button onClick={() => setSel({ ...sel, hitos: sel.hitos.filter((_, j) => j !== i) })} className="text-muted-foreground hover:text-destructive">✕</button>
                  </div>
                ))}
              </div>
              <div className="mt-2 flex gap-2">
                <input placeholder="Nuevo hito…" value={hitoNuevo.titulo} onChange={(e) => setHitoNuevo({ ...hitoNuevo, titulo: e.target.value })} className={`${input} flex-1`} />
                <input type="date" value={hitoNuevo.fecha} onChange={(e) => setHitoNuevo({ ...hitoNuevo, fecha: e.target.value })} className={`${input} w-40`} />
                <button
                  onClick={() => {
                    if (!hitoNuevo.titulo.trim()) return;
                    setSel({ ...sel, hitos: [...sel.hitos, { titulo: hitoNuevo.titulo.trim(), fecha: hitoNuevo.fecha ? new Date(hitoNuevo.fecha + "T12:00").toISOString() : new Date().toISOString(), hecho: false }] });
                    setHitoNuevo({ titulo: "", fecha: "" });
                  }}
                  className="rounded-lg border border-border px-3 text-sm transition hover:bg-muted"
                >
                  Agregar
                </button>
              </div>
            </div>

            {error ? <p className="mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p> : null}
            <div className="mt-4 flex items-center justify-between gap-3">
              {sel.id ? (
                <button onClick={borrar} className="text-sm text-muted-foreground transition hover:text-destructive">Borrar</button>
              ) : <span />}
              <button
                onClick={guardar}
                disabled={ocupado}
                className="rounded-lg px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.12em] transition hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: "#1A1816", color: "#EDE8DE" }}
              >
                {ocupado ? "Guardando…" : "Guardar evento"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
