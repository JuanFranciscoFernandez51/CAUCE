"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Contacto = { nombre: string; telefono: string };
type StockItem = { codigo: string; nombre: string; precio: number; categoria: string; stock: number };
type Item = { codigo: string; detalle: string; cant: number; unitario: number };

/**
 * El armador de órdenes (patrón PresupuestoForm de piletas, adaptado al rubro):
 * cliente con datalist del CRM, vehículo, ítems que se pueden traer del stock
 * con un buscador o tipearse libres, y la seña. Al guardar abre el boleto.
 */
export function OrdenForm({
  slug,
  contactos,
  stock,
}: {
  slug: string;
  contactos: Contacto[];
  stock: StockItem[];
}) {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [vehiculo, setVehiculo] = useState({ marca: "", modelo: "", patente: "" });
  const [items, setItems] = useState<Item[]>([{ codigo: "", detalle: "", cant: 1, unitario: 0 }]);
  const [senia, setSenia] = useState(0);
  const [porSeguro, setPorSeguro] = useState(false);
  const [seguro, setSeguro] = useState({ compania: "", siniestro: "" });
  const [busca, setBusca] = useState("");
  const [error, setError] = useState("");
  const [ocupado, setOcupado] = useState(false);

  const total = items.reduce((a, i) => a + i.cant * i.unitario, 0);
  const plata = (n: number) => `$ ${n.toLocaleString("es-AR")}`;
  const input = "h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none transition focus:border-primary";

  // Buscador del stock: por código, nombre o categoría (Parabrisas / Repuestos).
  const resultados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (q.length < 2) return [];
    return stock
      .filter((p) => `${p.codigo} ${p.nombre} ${p.categoria}`.toLowerCase().includes(q))
      .slice(0, 6);
  }, [busca, stock]);

  function elegirContacto(valor: string) {
    setNombre(valor);
    const c = contactos.find((x) => x.nombre === valor);
    if (c?.telefono && !telefono) setTelefono(c.telefono);
  }

  function agregarDelStock(p: StockItem) {
    setItems((prev) => {
      const vacia = prev.findIndex((i) => !i.detalle.trim());
      const fila: Item = { codigo: p.codigo, detalle: p.nombre, cant: 1, unitario: p.precio };
      if (vacia >= 0) return prev.map((x, j) => (j === vacia ? fila : x));
      return [...prev, fila];
    });
    setBusca("");
  }

  async function guardar() {
    setError("");
    if (!nombre.trim()) return setError("Falta el nombre del cliente");
    const filas = items.filter((i) => i.detalle.trim());
    if (!filas.length) return setError("Cargá al menos un vidrio o repuesto");
    setOcupado(true);
    const r = await fetch(`/api/os/${slug}/ordenes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre, telefono, vehiculo, items: filas, senia, ...(porSeguro ? { seguro } : {}) }),
    });
    setOcupado(false);
    if (!r.ok) {
      const data = await r.json().catch(() => null);
      return setError(data?.error ?? "No se pudo guardar");
    }
    const o = (await r.json()) as { id: string };
    window.open(`/os/${slug}/ordenes/${o.id}/imprimir`, "_blank");
    router.push(`/os/${slug}/ordenes`);
    router.refresh();
  }

  return (
    <div className="max-w-3xl space-y-5">
      <section className="rounded-xl border bg-card p-4">
        <h2 className="text-sm font-semibold">Cliente</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <input
            list="crm-contactos"
            placeholder="Nombre * (busca en Clientes)"
            value={nombre}
            onChange={(e) => elegirContacto(e.target.value)}
            className={input}
          />
          <datalist id="crm-contactos">
            {contactos.map((c) => (
              <option key={c.nombre} value={c.nombre}>
                {c.telefono}
              </option>
            ))}
          </datalist>
          <input placeholder="Teléfono" value={telefono} onChange={(e) => setTelefono(e.target.value)} className={input} />
        </div>
      </section>

      <section className="rounded-xl border bg-card p-4">
        <h2 className="text-sm font-semibold">Vehículo</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <input placeholder="Marca (VW, Ford…)" value={vehiculo.marca} onChange={(e) => setVehiculo({ ...vehiculo, marca: e.target.value })} className={input} />
          <input placeholder="Modelo (Gol Trend…)" value={vehiculo.modelo} onChange={(e) => setVehiculo({ ...vehiculo, modelo: e.target.value })} className={input} />
          <input placeholder="Patente" value={vehiculo.patente} onChange={(e) => setVehiculo({ ...vehiculo, patente: e.target.value.toUpperCase() })} className={input} />
        </div>
      </section>

      <section className="rounded-xl border bg-card p-4">
        <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold">
          <input type="checkbox" checked={porSeguro} onChange={(e) => setPorSeguro(e.target.checked)} />
          Trabajo por seguro
          <span className="font-normal text-muted-foreground">— la factura va a la compañía</span>
        </label>
        {porSeguro ? (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <input
              placeholder="Compañía (La Segunda, Sancor…)"
              value={seguro.compania}
              onChange={(e) => setSeguro({ ...seguro, compania: e.target.value })}
              className={input}
            />
            <input
              placeholder="N° de siniestro / autorización"
              value={seguro.siniestro}
              onChange={(e) => setSeguro({ ...seguro, siniestro: e.target.value })}
              className={input}
            />
          </div>
        ) : null}
      </section>

      <section className="rounded-xl border bg-card p-4">
        <h2 className="text-sm font-semibold">Vidrios y repuestos</h2>
        <div className="relative mt-3">
          <input
            placeholder="🔎 Buscar en el stock por código, nombre o grupo…"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className={input}
          />
          {resultados.length > 0 ? (
            <div className="absolute inset-x-0 top-11 z-20 overflow-hidden rounded-lg border bg-card shadow-lg">
              {resultados.map((p, i) => (
                <button
                  key={`${p.codigo}-${i}`}
                  type="button"
                  onClick={() => agregarDelStock(p)}
                  className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition hover:bg-muted"
                >
                  <span className="min-w-0 truncate">
                    {p.codigo ? <span className="mr-1.5 font-mono text-xs text-muted-foreground">{p.codigo}</span> : null}
                    {p.nombre}
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {p.categoria} · stock {p.stock} · {plata(p.precio)}
                  </span>
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="mt-3 grid gap-2">
          {items.map((it, i) => (
            <div key={i} className="grid grid-cols-[90px_1fr_60px_110px_28px] items-center gap-2">
              <input placeholder="Código" value={it.codigo} onChange={(e) => setItems(items.map((x, j) => (j === i ? { ...x, codigo: e.target.value } : x)))} className={`${input} font-mono text-xs`} />
              <input placeholder="Detalle (Parabrisas VW Gol…)" value={it.detalle} onChange={(e) => setItems(items.map((x, j) => (j === i ? { ...x, detalle: e.target.value } : x)))} className={input} />
              <input type="number" min={0} value={it.cant} onChange={(e) => setItems(items.map((x, j) => (j === i ? { ...x, cant: Number(e.target.value) } : x)))} className={`${input} text-center`} />
              <input type="number" min={0} placeholder="Precio" value={it.unitario || ""} onChange={(e) => setItems(items.map((x, j) => (j === i ? { ...x, unitario: Number(e.target.value) } : x)))} className={`${input} text-right`} />
              <button onClick={() => setItems(items.filter((_, j) => j !== i))} className="text-muted-foreground transition hover:text-destructive" aria-label="Quitar ítem">
                ✕
              </button>
            </div>
          ))}
          <button onClick={() => setItems([...items, { codigo: "", detalle: "", cant: 1, unitario: 0 }])} className="justify-self-start text-xs font-medium text-primary hover:underline">
            + Agregar ítem
          </button>
        </div>

        <div className="mt-4 grid gap-2 border-t pt-3 text-sm sm:grid-cols-3">
          <label className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">Seña</span>
            <input type="number" min={0} value={senia || ""} onChange={(e) => setSenia(Number(e.target.value))} className={`${input} max-w-[130px] text-right`} />
          </label>
          <p className="flex items-center justify-between gap-3 text-muted-foreground">
            <span>Saldo</span>
            <span className="tabular-nums">{plata(Math.max(0, total - senia))}</span>
          </p>
          <p className="flex items-center justify-between gap-3 font-semibold">
            <span>Total</span>
            <span className="tabular-nums">{plata(total)}</span>
          </p>
        </div>
      </section>

      {error ? <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p> : null}
      <button
        onClick={guardar}
        disabled={ocupado}
        className="h-11 rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground transition hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
      >
        {ocupado ? "Guardando…" : "Guardar y ver el boleto"}
      </button>
    </div>
  );
}
