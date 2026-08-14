"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

/**
 * Configuración al estilo del panel de Jess: secciones desplegables donde se
 * edita TODO desde adentro — datos del negocio, tipos, categorías y la
 * plantilla de presupuesto completa.
 */
type Plantilla = { precio: number; moneda: string; servicios: { nombre: string; items: string[] }[]; nota: string };
export type ConfigJessInicial = {
  displayName: string;
  eslogan: string;
  email: string;
  telefono: string;
  cuit: string;
  instagram: string;
  direccion: string;
  tiposEvento: string[];
  categoriasProveedores: string[];
  categoriasGastos: string[];
  plantilla: Plantilla;
};

const etiqueta = "text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground";
const input = "h-10 w-full border border-border bg-white px-3 text-sm outline-none focus:border-primary";

function Seccion({ titulo, hijos, abierta }: { titulo: string; hijos: ReactNode; abierta?: boolean }) {
  const [open, setOpen] = useState(!!abierta);
  return (
    <section className="border border-border bg-card">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between px-5 py-4 text-left">
        <span className="text-[22px]" style={{ fontFamily: "var(--font-italiana)" }}>{titulo}</span>
        <span className="text-muted-foreground">{open ? "⌄" : "›"}</span>
      </button>
      {open ? <div className="border-t border-border px-5 py-5">{hijos}</div> : null}
    </section>
  );
}

/** Editor de listas simples (tipos, categorías): agregar y quitar. */
function ListaEditable({ valores, onCambio }: { valores: string[]; onCambio: (v: string[]) => void }) {
  const [nuevo, setNuevo] = useState("");
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {valores.map((v, i) => (
          <span key={i} className="flex items-center gap-2 border border-border bg-white px-3 py-1.5 text-sm">
            {v}
            <button onClick={() => onCambio(valores.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-destructive">✕</button>
          </span>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <input value={nuevo} onChange={(e) => setNuevo(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && nuevo.trim()) { onCambio([...valores, nuevo.trim()]); setNuevo(""); } }} placeholder="Agregar…" className={`${input} max-w-xs`} />
        <button onClick={() => { if (nuevo.trim()) { onCambio([...valores, nuevo.trim()]); setNuevo(""); } }} className="border border-border px-4 text-sm transition hover:bg-muted">+ Agregar</button>
      </div>
    </div>
  );
}

export function ConfigJess({ slug, inicial }: { slug: string; inicial: ConfigJessInicial }) {
  const router = useRouter();
  const [d, setD] = useState(inicial);
  const [estado, setEstado] = useState("");

  async function guardar() {
    setEstado("Guardando…");
    const r = await fetch(`/api/os/${slug}/config/negocio`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        displayName: d.displayName,
        eslogan: d.eslogan,
        email: d.email,
        telefono: d.telefono,
        cuit: d.cuit,
        instagram: d.instagram,
        direccion: d.direccion,
        tiposEvento: d.tiposEvento,
        categoriasProveedores: d.categoriasProveedores,
        categoriasGastos: d.categoriasGastos,
        plantillaCotizacion: d.plantilla,
      }),
    });
    setEstado(r.ok ? "Guardado ✓" : "No se pudo guardar");
    if (r.ok) router.refresh();
    setTimeout(() => setEstado(""), 2500);
  }

  const p = d.plantilla;
  const setP = (np: Plantilla) => setD({ ...d, plantilla: np });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-[40px] leading-none" style={{ fontFamily: "var(--font-italiana)" }}>Configuración</h1>
        <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Datos del negocio, categorías, paquetes y plantilla
        </p>
      </div>

      <Seccion titulo="Datos del negocio" abierta hijos={
        <div>
          <p className="text-sm text-muted-foreground">Aparecen en cotizaciones y documentos.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {([
              ["Nombre comercial", "displayName"],
              ["Tagline", "eslogan"],
              ["Email", "email"],
              ["Teléfono", "telefono"],
              ["CUIT / Identificación", "cuit"],
              ["Instagram", "instagram"],
            ] as const).map(([lbl, k]) => (
              <label key={k}>
                <span className={etiqueta}>{lbl}</span>
                <input value={d[k]} onChange={(e) => setD({ ...d, [k]: e.target.value })} className={`${input} mt-1`} />
              </label>
            ))}
            <label className="sm:col-span-2">
              <span className={etiqueta}>Dirección</span>
              <input value={d.direccion} onChange={(e) => setD({ ...d, direccion: e.target.value })} className={`${input} mt-1`} />
            </label>
          </div>
        </div>
      } />

      <Seccion titulo="Tipos de evento" hijos={<ListaEditable valores={d.tiposEvento} onCambio={(v) => setD({ ...d, tiposEvento: v })} />} />
      <Seccion titulo="Categorías de proveedores" hijos={<ListaEditable valores={d.categoriasProveedores} onCambio={(v) => setD({ ...d, categoriasProveedores: v })} />} />
      <Seccion titulo="Categorías de gastos" hijos={<ListaEditable valores={d.categoriasGastos} onCambio={(v) => setD({ ...d, categoriasGastos: v })} />} />

      <Seccion titulo="Plantilla de presupuesto" hijos={
        <div>
          <p className="text-sm text-muted-foreground">
            Esta plantilla se aplica al crear una nueva cotización. Editá los servicios y el precio base según tu oferta.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label>
              <span className={etiqueta}>Precio base</span>
              <input type="number" min={0} value={p.precio || ""} onChange={(e) => setP({ ...p, precio: Number(e.target.value) })} className={`${input} mt-1`} />
            </label>
            <label>
              <span className={etiqueta}>Moneda</span>
              <select value={p.moneda} onChange={(e) => setP({ ...p, moneda: e.target.value })} className={`${input} mt-1`}>
                <option value="USD">USD — Dólares</option>
                <option value="ARS">ARS — Pesos</option>
              </select>
            </label>
          </div>

          <p className={`${etiqueta} mt-6 border-b border-border pb-1.5`}>Servicios incluidos</p>
          <div className="mt-3 space-y-4">
            {p.servicios.map((s, si) => (
              <div key={si} className="border border-border bg-background p-4">
                <div className="flex items-center justify-between gap-3 border-b border-border pb-2">
                  <input
                    value={s.nombre}
                    onChange={(e) => setP({ ...p, servicios: p.servicios.map((x, j) => (j === si ? { ...x, nombre: e.target.value } : x)) })}
                    className="w-full border-0 bg-transparent text-[13px] font-bold uppercase tracking-[0.08em] outline-none"
                  />
                  <button onClick={() => setP({ ...p, servicios: p.servicios.filter((_, j) => j !== si) })} className="border border-border px-2 py-0.5 text-xs transition hover:text-destructive">✕</button>
                </div>
                <div className="mt-2 space-y-1">
                  {s.items.map((it, ii) => (
                    <div key={ii} className="flex items-center gap-2 border-b border-border/60 py-1">
                      <span style={{ color: "#9E9387" }}>✦</span>
                      <input
                        value={it}
                        onChange={(e) => setP({ ...p, servicios: p.servicios.map((x, j) => (j === si ? { ...x, items: x.items.map((y, k) => (k === ii ? e.target.value : y)) } : x)) })}
                        className="w-full border-0 bg-transparent text-sm outline-none"
                      />
                      <button onClick={() => setP({ ...p, servicios: p.servicios.map((x, j) => (j === si ? { ...x, items: x.items.filter((_, k) => k !== ii) } : x)) })} className="text-muted-foreground hover:text-destructive">✕</button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setP({ ...p, servicios: p.servicios.map((x, j) => (j === si ? { ...x, items: [...x.items, "Nuevo ítem"] } : x)) })}
                  className="mt-2 border border-border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] transition hover:bg-muted"
                >
                  + Ítem
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={() => setP({ ...p, servicios: [...p.servicios, { nombre: "Nueva sección", items: [] }] })}
            className="mt-3 border border-border px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] transition hover:bg-muted"
          >
            + Agregar sección
          </button>

          <label className="mt-5 block">
            <span className={etiqueta}>Nota al pie (aparece en el PDF)</span>
            <textarea value={p.nota} onChange={(e) => setP({ ...p, nota: e.target.value })} rows={2} className={`${input} mt-1 h-auto py-2`} />
          </label>
        </div>
      } />

      <div className="flex items-center gap-3">
        <button onClick={guardar} className="px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] transition hover:opacity-90" style={{ backgroundColor: "#1A1816", color: "#EDE8DE" }}>
          Guardar configuración
        </button>
        {estado ? <span className="text-sm text-muted-foreground">{estado}</span> : null}
      </div>
    </div>
  );
}
