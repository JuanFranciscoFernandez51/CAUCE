"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Espejo, Pieza } from "@/lib/piezas";
import type { Escala } from "@/lib/precios";

type Estado = {
  setupBaseUsd: number;
  mensualBaseUsd: number;
  precioComponenteUsd: number;
  ivaPct: number;
  baseQueIncluye: string;
  piezas: Pieza[];
  espejos: Espejo[];
  escala: Escala;
};

/**
 * Precios de la web: lo que se publica en la landing y en /precios.
 * Una sola fuente, todo editable.
 */
export function PreciosPanel({ inicial }: { inicial: Estado }) {
  const router = useRouter();
  const [d, setD] = useState<Estado>(inicial);
  const [estado, setEstado] = useState<"" | "guardando" | "listo" | "error">("");
  const [error, setError] = useState("");

  const set = <K extends keyof Estado>(k: K, v: Estado[K]) => setD((x) => ({ ...x, [k]: v }));
  const setPieza = (i: number, cambios: Partial<Pieza>) =>
    set("piezas", d.piezas.map((p, j) => (j === i ? { ...p, ...cambios } : p)));
  const setEspejo = (i: number, cambios: Partial<Espejo>) =>
    set("espejos", d.espejos.map((e, j) => (j === i ? { ...e, ...cambios } : e)));

  async function guardar() {
    setEstado("guardando");
    setError("");
    const res = await fetch("/api/admin/precios", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(d),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error ?? "No se pudo guardar");
      setEstado("error");
      return;
    }
    setEstado("listo");
    router.refresh();
    setTimeout(() => setEstado(""), 2500);
  }

  const input = "h-9 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary";
  const num = `${input} text-right tabular-nums`;
  const area = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary";
  const desde = d.espejos.length ? Math.min(...d.espejos.map((e) => Number(e.setupUsd) || 0)) : 0;

  return (
    <section id="precios" className="scroll-mt-6 space-y-5 rounded-xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Precios de la web</h2>
          <p className="text-sm text-muted-foreground">
            Lo que se publica en la landing y en{" "}
            <a href="/precios" target="_blank" className="underline underline-offset-2">/precios</a>. Todo en USD.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {estado === "listo" ? <span className="text-sm text-success">Guardado · ya se ve en la web</span> : null}
          {estado === "error" ? <span className="text-sm text-destructive">{error}</span> : null}
          <button
            type="button"
            onClick={guardar}
            disabled={estado === "guardando"}
            className="rounded-lg bg-foreground px-4 py-2 text-sm font-semibold text-background transition hover:opacity-90 disabled:opacity-50"
          >
            {estado === "guardando" ? "Guardando…" : "Guardar precios"}
          </button>
        </div>
      </div>

      {/* Las 4 tarjetas de la landing */}
      <div className="grid gap-3 lg:grid-cols-4">
        <div className="space-y-2 rounded-lg border border-border p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">1 · La base</p>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs text-muted-foreground">Por única vez
              <input type="number" className={num} value={d.setupBaseUsd} onChange={(e) => set("setupBaseUsd", Number(e.target.value))} />
            </label>
            <label className="text-xs text-muted-foreground">Por mes
              <input type="number" className={num} value={d.mensualBaseUsd} onChange={(e) => set("mensualBaseUsd", Number(e.target.value))} />
            </label>
          </div>
          <label className="block text-xs text-muted-foreground">Qué incluye
            <textarea rows={4} className={area} value={d.baseQueIncluye} onChange={(e) => set("baseQueIncluye", e.target.value)} />
          </label>
        </div>

        <div className="space-y-2 rounded-lg border border-border p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">2 · Por componente</p>
          <label className="block text-xs text-muted-foreground">Precio que se publica
            <input type="number" className={num} value={d.precioComponenteUsd} onChange={(e) => set("precioComponenteUsd", Number(e.target.value))} />
          </label>
          <p className="text-xs text-muted-foreground">El detalle de cada componente está abajo, en la tabla.</p>
          <label className="block text-xs text-muted-foreground">IVA (%)
            <input type="number" className={num} value={d.ivaPct} onChange={(e) => set("ivaPct", Number(e.target.value))} />
          </label>
        </div>

        <div className="space-y-2 rounded-lg border border-border p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">3 · Negocio completo</p>
          <p className="text-sm">Se publica <b>desde USD {desde}</b>: el más barato de los casos de abajo. La landing muestra el primero.</p>
        </div>

        <div className="space-y-2 rounded-lg border border-border p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">4 · Escala</p>
          <input className={input} value={d.escala.titulo} onChange={(e) => set("escala", { ...d.escala, titulo: e.target.value })} placeholder="Título" />
          <textarea rows={3} className={area} value={d.escala.texto} onChange={(e) => set("escala", { ...d.escala, texto: e.target.value })} />
          <div className="grid grid-cols-2 gap-2">
            <input className={input} value={d.escala.precio} onChange={(e) => set("escala", { ...d.escala, precio: e.target.value })} placeholder="A medida" />
            <input className={input} value={d.escala.detalle} onChange={(e) => set("escala", { ...d.escala, detalle: e.target.value })} placeholder="valores según el proyecto" />
          </div>
        </div>
      </div>

      {/* Componentes */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-semibold">Componentes ({d.piezas.length})</p>
          <button
            type="button"
            onClick={() =>
              set("piezas", [...d.piezas, { key: `pieza-${Date.now()}`, label: "Nuevo componente", queIncluye: "", setupUsd: d.precioComponenteUsd, monthlyUsd: 5 }])
            }
            className="rounded-md border border-border px-3 py-1.5 text-xs transition hover:bg-muted"
          >
            + Agregar componente
          </button>
        </div>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="bg-muted/50 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-2">Nombre</th>
                <th className="px-3 py-2">Qué incluye</th>
                <th className="w-24 px-3 py-2 text-right">Única vez</th>
                <th className="w-24 px-3 py-2 text-right">Por mes</th>
                <th className="w-20 px-3 py-2 text-center">Micro</th>
                <th className="w-10 px-3 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {d.piezas.map((p, i) => (
                <tr key={p.key}>
                  <td className="px-3 py-1.5"><input className={input} value={p.label} onChange={(e) => setPieza(i, { label: e.target.value })} /></td>
                  <td className="px-3 py-1.5"><input className={input} value={p.queIncluye} onChange={(e) => setPieza(i, { queIncluye: e.target.value })} /></td>
                  <td className="px-3 py-1.5"><input type="number" className={num} value={p.setupUsd} onChange={(e) => setPieza(i, { setupUsd: Number(e.target.value) })} /></td>
                  <td className="px-3 py-1.5"><input type="number" className={num} value={p.monthlyUsd} onChange={(e) => setPieza(i, { monthlyUsd: Number(e.target.value) })} /></td>
                  <td className="px-3 py-1.5 text-center">
                    <input type="checkbox" checked={!!p.micro} onChange={(e) => setPieza(i, { micro: e.target.checked })} title="Ajuste fino: se muestra aparte, con precio chico" />
                  </td>
                  <td className="px-3 py-1.5 text-center">
                    <button type="button" title="Quitar" onClick={() => set("piezas", d.piezas.filter((_, j) => j !== i))} className="text-muted-foreground transition hover:text-destructive">✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Casos completos */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-semibold">Negocios completos (casos) · el primero sale en la landing</p>
          <button
            type="button"
            onClick={() =>
              set("espejos", [...d.espejos, { key: `caso-${Date.now()}`, nombre: "Nuevo caso", rubro: "", historia: "", shotsSlug: "", setupUsd: 999, monthlyUsd: 60, piezas: [] }])
            }
            className="rounded-md border border-border px-3 py-1.5 text-xs transition hover:bg-muted"
          >
            + Agregar caso
          </button>
        </div>
        <div className="grid gap-3 lg:grid-cols-3">
          {d.espejos.map((e, i) => (
            <div key={e.key} className="space-y-2 rounded-lg border border-border p-3">
              <div className="flex items-center gap-2">
                <input className={input} value={e.nombre} onChange={(ev) => setEspejo(i, { nombre: ev.target.value })} />
                <button type="button" title="Quitar" onClick={() => set("espejos", d.espejos.filter((_, j) => j !== i))} className="px-1 text-muted-foreground transition hover:text-destructive">✕</button>
              </div>
              <input className={input} value={e.rubro} onChange={(ev) => setEspejo(i, { rubro: ev.target.value })} placeholder="Rubro" />
              <textarea rows={3} className={area} value={e.historia} onChange={(ev) => setEspejo(i, { historia: ev.target.value })} placeholder="Qué se le armó" />
              <div className="grid grid-cols-2 gap-2">
                <label className="text-xs text-muted-foreground">Desde (única vez)
                  <input type="number" className={num} value={e.setupUsd} onChange={(ev) => setEspejo(i, { setupUsd: Number(ev.target.value) })} />
                </label>
                <label className="text-xs text-muted-foreground">Por mes
                  <input type="number" className={num} value={e.monthlyUsd} onChange={(ev) => setEspejo(i, { monthlyUsd: Number(ev.target.value) })} />
                </label>
              </div>
              {i > 0 ? (
                <button
                  type="button"
                  onClick={() => set("espejos", [e, ...d.espejos.filter((_, j) => j !== i)])}
                  className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
                >
                  Mostrar este en la landing
                </button>
              ) : (
                <p className="text-xs text-primary">Este es el que sale en la landing</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
