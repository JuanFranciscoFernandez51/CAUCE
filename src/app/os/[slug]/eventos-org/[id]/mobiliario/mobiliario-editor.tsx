"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export type SectorCatalogo = { sector: string; items: { id: string; nombre: string; precio: number }[] };
export type ItemElegido = { id: string; nombre: string; cant: number; precio: number };

const plata = (n: number) => `$ ${Math.round(n).toLocaleString("es-AR")}`;

/**
 * El presupuesto de mobiliario, calcado de su pantalla: total en Italiana,
 * tabla por sector con cantidad y precio editables, y exportación por
 * impresión con la marca.
 */
export function MobiliarioEditor({
  slug, eventoId, eventoNombre, catalogo, inicial, logo, instagram,
}: {
  slug: string;
  eventoId: string;
  eventoNombre: string;
  catalogo: SectorCatalogo[];
  inicial: ItemElegido[];
  logo: string | null;
  instagram: string;
}) {
  const router = useRouter();
  const [sel, setSel] = useState<Map<string, ItemElegido>>(new Map(inicial.map((i) => [i.id, i])));
  const [guardado, setGuardado] = useState("");

  const total = useMemo(() => [...sel.values()].reduce((a, i) => a + i.cant * i.precio, 0), [sel]);

  const setItem = (id: string, item: ItemElegido | null) => {
    const n = new Map(sel);
    if (item) n.set(id, item); else n.delete(id);
    setSel(n);
  };

  async function guardar() {
    setGuardado("…");
    const r = await fetch(`/api/os/${slug}/eventos-org/${eventoId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mobiliario: [...sel.values()] }),
    });
    setGuardado(r.ok ? "Guardado ✓" : "Error");
    setTimeout(() => setGuardado(""), 2000);
    router.refresh();
  }

  const btn = "border border-border px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] transition hover:bg-muted";

  return (
    <div className="p-4 sm:p-6">
      {/* Controles (no salen en el PDF) */}
      <div className="flex flex-wrap items-end justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-[40px] leading-none" style={{ fontFamily: "var(--font-italiana)" }}>Mobiliario</h1>
          <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {eventoNombre} · Presupuesto de mobiliario
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setSel(new Map(catalogo.flatMap((s) => s.items.filter((i) => i.precio > 0)).map((i) => [i.id, { id: i.id, nombre: i.nombre, cant: 1, precio: i.precio }])))} className={btn}>
            Seleccionar todo
          </button>
          <button onClick={() => setSel(new Map())} className={btn}>Limpiar</button>
          <button onClick={guardar} className={btn}>{guardado || "Guardar"}</button>
          <button onClick={() => window.print()} className="px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-white transition hover:opacity-90" style={{ backgroundColor: "#1A1816" }}>
            ✦ Exportar PDF
          </button>
          <a href={`/os/${slug}/eventos-org`} className={btn}>← Volver</a>
        </div>
      </div>

      {/* Hoja: esto es lo que sale impreso */}
      <div className="hoja mt-5">
        <div className="hidden items-center justify-between print:flex" style={{ marginBottom: 24 }}>
          <div className="flex items-center gap-4">
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo} alt="" style={{ height: 64 }} />
            ) : null}
            <div>
              <p style={{ fontFamily: "var(--font-italiana)", fontSize: 30, letterSpacing: "0.24em", lineHeight: 1 }}>JESS</p>
              <p style={{ fontSize: 9, letterSpacing: "0.5em", color: "#9E9387" }}>DESIGN · EVENT PLANNER</p>
            </div>
          </div>
          <div className="text-right">
            <p style={{ fontFamily: "var(--font-italiana)", fontSize: 26 }}>Mobiliario</p>
            <p style={{ fontSize: 11, color: "#6d645b" }}>{eventoNombre}</p>
          </div>
        </div>

        <div className="flex items-baseline justify-between border-b border-border pb-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Total estimado</p>
          <p className="text-[38px]" style={{ fontFamily: "var(--font-italiana)" }}>{plata(total)}</p>
        </div>

        <table className="mt-4 w-full text-sm">
          <thead>
            <tr className="text-left text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              <th className="py-2">Ítem</th>
              <th className="w-28 py-2 text-center">Cant.</th>
              <th className="w-36 py-2 text-right">Precio unit.</th>
              <th className="w-32 py-2 text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {catalogo.map((s) => {
              const filas = s.items.filter((i) => sel.has(i.id) || true);
              const algunaElegida = s.items.some((i) => sel.has(i.id));
              return (
                <SectorFilas
                  key={s.sector}
                  sector={s}
                  sel={sel}
                  setItem={setItem}
                  imprimiendoSolo={algunaElegida}
                  _filas={filas}
                />
              );
            })}
          </tbody>
        </table>

        <p className="mt-6 hidden justify-between text-[10px] text-muted-foreground print:flex">
          <span style={{ fontFamily: "var(--font-pinyon)", fontSize: 20, color: "#B85850" }}>Sofisticación en cada detalle</span>
          <span>@{instagram} · Bahía Blanca</span>
        </p>
      </div>

      <style>{`
        @media print {
          @page { size: A4; margin: 14mm; }
          body * { visibility: hidden; }
          .hoja, .hoja * { visibility: visible; }
          .hoja { position: absolute; inset: 0; }
          .hoja .solo-pantalla { display: none !important; }
        }
      `}</style>
    </div>
  );
}

function SectorFilas({
  sector, sel, setItem, imprimiendoSolo,
}: {
  sector: SectorCatalogo;
  sel: Map<string, ItemElegido>;
  setItem: (id: string, item: ItemElegido | null) => void;
  imprimiendoSolo: boolean;
  _filas: unknown;
}) {
  return (
    <>
      <tr className={imprimiendoSolo ? "" : "print:hidden"}>
        <td colSpan={4} className="bg-muted/50 px-2 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          {sector.sector}
        </td>
      </tr>
      {sector.items.map((i) => {
        const el = sel.get(i.id);
        return (
          <tr key={i.id} className={`border-b border-border ${el ? "" : "print:hidden"}`}>
            <td className="py-2 pr-3">
              <label className="flex cursor-pointer items-center gap-2.5">
                <input
                  type="checkbox"
                  className="solo-pantalla"
                  checked={!!el}
                  onChange={(e) =>
                    setItem(i.id, e.target.checked ? { id: i.id, nombre: i.nombre, cant: 1, precio: i.precio } : null)
                  }
                />
                <span className={el ? "" : "text-muted-foreground"}>{i.nombre}</span>
              </label>
            </td>
            <td className="py-2 text-center">
              {el ? (
                <input
                  type="number"
                  min={1}
                  value={el.cant}
                  onChange={(e) => setItem(i.id, { ...el, cant: Math.max(1, Number(e.target.value)) })}
                  className="solo-pantalla w-16 border border-border bg-white px-2 py-1 text-center text-sm outline-none focus:border-primary print:hidden"
                />
              ) : null}
              {el ? <span className="hidden print:inline">{el.cant}</span> : null}
            </td>
            <td className="py-2 text-right tabular-nums">
              {el ? (
                <>
                  <input
                    type="number"
                    min={0}
                    value={el.precio}
                    onChange={(e) => setItem(i.id, { ...el, precio: Number(e.target.value) })}
                    className="solo-pantalla w-28 border border-border bg-white px-2 py-1 text-right text-sm outline-none focus:border-primary print:hidden"
                  />
                  <span className="hidden print:inline">{plata(el.precio)}</span>
                </>
              ) : (
                <span className="text-muted-foreground">{i.precio ? plata(i.precio) : "consultar"}</span>
              )}
            </td>
            <td className="py-2 text-right font-semibold tabular-nums">{el ? plata(el.cant * el.precio) : "—"}</td>
          </tr>
        );
      })}
    </>
  );
}

const plata2 = plata;
