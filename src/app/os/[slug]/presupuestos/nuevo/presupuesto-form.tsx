"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Item = { detalle: string; cant: number; unitario: number };
type Dato = { etiqueta: string; valor: string };

/** El armador: cliente, datos del trabajo, renglones y materiales. */
export function PresupuestoForm({ slug, condicionesBase }: { slug: string; condicionesBase: string }) {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [domicilio, setDomicilio] = useState("");
  const [telefono, setTelefono] = useState("");
  const [datos, setDatos] = useState<Dato[]>([
    { etiqueta: "Medidas", valor: "" },
    { etiqueta: "Volumen", valor: "" },
    { etiqueta: "Revestimiento", valor: "" },
  ]);
  const [items, setItems] = useState<Item[]>([{ detalle: "", cant: 1, unitario: 0 }]);
  const [materiales, setMateriales] = useState(0);
  const [condiciones, setCondiciones] = useState(condicionesBase);
  const [error, setError] = useState("");
  const [ocupado, setOcupado] = useState(false);

  const subtotal = items.reduce((a, i) => a + i.cant * i.unitario, 0);
  const plata = (n: number) => `$ ${n.toLocaleString("es-AR")}`;
  const input = "h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary";

  async function guardar() {
    setError("");
    if (!nombre.trim()) return setError("Falta el nombre del cliente");
    const filas = items.filter((i) => i.detalle.trim());
    if (!filas.length) return setError("Cargá al menos un renglón de trabajo");
    setOcupado(true);
    const r = await fetch(`/api/os/${slug}/presupuestos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre, domicilio, telefono,
        datos: datos.filter((d) => d.valor.trim()),
        items: filas,
        materiales,
        condiciones,
      }),
    });
    setOcupado(false);
    if (!r.ok) return setError("No se pudo guardar");
    const p = (await r.json()) as { id: string };
    window.open(`/os/${slug}/presupuestos/${p.id}/imprimir`, "_blank");
    router.push(`/os/${slug}/presupuestos`);
    router.refresh();
  }

  return (
    <div className="max-w-3xl space-y-5">
      <section className="rounded-xl border border-border bg-card p-4">
        <h2 className="text-sm font-semibold">Cliente</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <input placeholder="Nombre *" value={nombre} onChange={(e) => setNombre(e.target.value)} className={input} />
          <input placeholder="Domicilio" value={domicilio} onChange={(e) => setDomicilio(e.target.value)} className={input} />
          <input placeholder="Teléfono" value={telefono} onChange={(e) => setTelefono(e.target.value)} className={input} />
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-4">
        <h2 className="text-sm font-semibold">Datos del trabajo</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">Medidas, volumen, revestimiento… lo que aplique. Lo vacío no sale.</p>
        <div className="mt-3 grid gap-2">
          {datos.map((d, i) => (
            <div key={i} className="grid grid-cols-[160px_1fr] gap-2">
              <input value={d.etiqueta} onChange={(e) => setDatos(datos.map((x, j) => (j === i ? { ...x, etiqueta: e.target.value } : x)))} className={input} />
              <input value={d.valor} placeholder="Valor" onChange={(e) => setDatos(datos.map((x, j) => (j === i ? { ...x, valor: e.target.value } : x)))} className={input} />
            </div>
          ))}
          <button onClick={() => setDatos([...datos, { etiqueta: "", valor: "" }])} className="justify-self-start text-xs font-medium text-primary hover:underline">
            + Agregar dato
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-4">
        <h2 className="text-sm font-semibold">Detalle del trabajo</h2>
        <div className="mt-3 grid gap-2">
          {items.map((it, i) => (
            <div key={i} className="grid grid-cols-[1fr_70px_130px_32px] items-center gap-2">
              <input placeholder="Descripción del renglón" value={it.detalle} onChange={(e) => setItems(items.map((x, j) => (j === i ? { ...x, detalle: e.target.value } : x)))} className={input} />
              <input type="number" min={0} value={it.cant} onChange={(e) => setItems(items.map((x, j) => (j === i ? { ...x, cant: Number(e.target.value) } : x)))} className={`${input} text-center`} />
              <input type="number" min={0} placeholder="Unitario" value={it.unitario || ""} onChange={(e) => setItems(items.map((x, j) => (j === i ? { ...x, unitario: Number(e.target.value) } : x)))} className={`${input} text-right`} />
              <button onClick={() => setItems(items.filter((_, j) => j !== i))} className="text-muted-foreground transition hover:text-destructive" aria-label="Quitar renglón">
                ✕
              </button>
            </div>
          ))}
          <button onClick={() => setItems([...items, { detalle: "", cant: 1, unitario: 0 }])} className="justify-self-start text-xs font-medium text-primary hover:underline">
            + Agregar renglón
          </button>
        </div>
        <div className="mt-4 grid gap-2 border-t border-border pt-3 text-sm sm:grid-cols-2">
          <label className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">Materiales</span>
            <input type="number" min={0} value={materiales || ""} onChange={(e) => setMateriales(Number(e.target.value))} className={`${input} max-w-[150px] text-right`} />
          </label>
          <p className="flex items-center justify-between gap-3 font-semibold">
            <span>Total</span>
            <span className="tabular-nums">{plata(subtotal + materiales)}</span>
          </p>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-4">
        <h2 className="text-sm font-semibold">Condiciones</h2>
        <textarea value={condiciones} onChange={(e) => setCondiciones(e.target.value)} rows={3} className={`${input} mt-3 h-auto py-2`} />
      </section>

      {error ? <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p> : null}
      <button onClick={guardar} disabled={ocupado} className="h-11 rounded-lg bg-foreground px-6 text-sm font-semibold text-background transition hover:opacity-90 disabled:opacity-50">
        {ocupado ? "Guardando…" : "Guardar y ver el PDF"}
      </button>
    </div>
  );
}
