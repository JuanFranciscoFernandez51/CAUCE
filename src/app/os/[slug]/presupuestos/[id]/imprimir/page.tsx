import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getTenantBySlug } from "@/lib/tenant";
import { BotonesImprimir } from "./botones";

export const dynamic = "force-dynamic";
export const metadata = { title: "Presupuesto" };

/**
 * Impresión del presupuesto según el modelo de la marca: A4 con la onda,
 * y una segunda hoja con el boleto de visita, dos por hoja con línea de corte.
 */
const PIZARRA = "#14201E";
const AGUA = "#17827A";
const CREMA = "#F5F1E8";
const ARENA = "#E3E0D6";

function Marca({ chico }: { chico?: boolean }) {
  return (
    <div className="relative inline-block" style={{ padding: "0 10px" }}>
      <p
        className="font-semibold uppercase"
        style={{ fontFamily: "var(--font-cormorant)", fontSize: chico ? 17 : 24, lineHeight: 0.95, letterSpacing: "0.04em", color: PIZARRA }}
      >
        Piletas
        <span className="block" style={{ fontFamily: "var(--font-jost)", fontSize: chico ? 8 : 11, letterSpacing: "0.3em" }}>
          Bahía Blanca
        </span>
      </p>
      <svg aria-hidden viewBox="0 0 120 12" preserveAspectRatio="none" className="absolute left-[-10px] right-[-10px]" style={{ top: chico ? 9 : 13, width: "calc(100% + 20px)", height: 8 }}>
        <path d="M0 6 Q 15 0, 30 6 T 60 6 T 90 6 T 120 6" fill="none" stroke={AGUA} strokeWidth="2.2" />
      </svg>
    </div>
  );
}

function Boleto({ numero }: { numero: string }) {
  const linea = { borderBottom: `1px solid ${ARENA}` };
  return (
    <div style={{ padding: "8mm 10mm", height: "128mm" }}>
      <div className="flex items-start justify-between">
        <Marca chico />
        <div className="text-right">
          <p style={{ fontFamily: "var(--font-jost)", fontSize: 9, letterSpacing: "0.2em", color: AGUA }}>VISITA DE SERVICIO</p>
          <p style={{ fontFamily: "var(--font-jost)", fontSize: 11, color: PIZARRA }}>N° {numero} ·&nbsp;&nbsp;&nbsp;/&nbsp;&nbsp;&nbsp;/2026</p>
        </div>
      </div>
      <div className="mt-4 grid gap-3" style={{ fontFamily: "var(--font-jost)", fontSize: 11, color: PIZARRA }}>
        <p style={linea}>Cliente</p>
        <p style={linea}>Domicilio</p>
        <div className="grid grid-cols-3 gap-4">
          <p style={linea}>PH ______</p>
          <p style={linea}>Cloro ______</p>
          <p style={linea}>Alcalinidad ______</p>
        </div>
        <p style={{ fontSize: 9, letterSpacing: "0.2em", color: "#8A8674", marginTop: 4 }}>TAREAS REALIZADAS</p>
        <p style={linea}>&nbsp;</p>
        <p style={linea}>&nbsp;</p>
        <div className="mt-2 flex items-end justify-between gap-6">
          <p style={{ fontSize: 11 }}>Próxima visita programada:&nbsp;&nbsp;&nbsp;&nbsp;/&nbsp;&nbsp;&nbsp;&nbsp;/2026</p>
          <p style={{ fontSize: 9, letterSpacing: "0.18em", color: "#8A8674", borderTop: `1px solid ${PIZARRA}`, paddingTop: 4 }}>
            CONFORME DEL CLIENTE
          </p>
        </div>
      </div>
    </div>
  );
}

export default async function ImprimirPresupuestoPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) notFound();
  const p = await db.presupuestoDoc.findFirst({ where: { id, clientId: tenant.id } });
  if (!p) notFound();

  const st = (tenant.settings ?? {}) as { instagram?: string; zona?: string };
  const items = (p.items as { detalle: string; cant: number; unitario: number }[]) ?? [];
  const datos = (p.datos as { etiqueta: string; valor: string }[]) ?? [];
  const subtotal = items.reduce((a, i) => a + i.cant * i.unitario, 0);
  const total = subtotal + p.materiales;
  const num = String(p.numero).padStart(4, "0");
  const plata = (n: number) => (n > 0 ? `$ ${n.toLocaleString("es-AR")}` : "—");
  const fecha = p.createdAt.toLocaleDateString("es-AR");

  return (
    <div style={{ backgroundColor: "#e9e6df" }} className="min-h-screen py-6 print:bg-white print:py-0">
      <div className="mx-auto mb-4 flex max-w-[210mm] items-center justify-between px-2 print:hidden">
        <p className="text-sm font-medium" style={{ color: PIZARRA }}>
          Presupuesto N° {num} — se imprime o guarda como PDF, y la segunda hoja trae dos boletos de visita.
        </p>
        <BotonesImprimir />
      </div>

      {/* ── Hoja 1: el presupuesto ── */}
      <div className="hoja mx-auto" style={{ width: "210mm", minHeight: "296mm", backgroundColor: CREMA, color: PIZARRA, fontFamily: "var(--font-jost)" }}>
        <div style={{ padding: "14mm 16mm" }}>
          <div className="flex items-start justify-between">
            <Marca />
            <div className="text-right">
              <p style={{ fontFamily: "var(--font-cormorant)", fontSize: 26, lineHeight: 1 }}>Presupuesto</p>
              <p style={{ fontSize: 12, color: AGUA, fontWeight: 600 }}>N° {num}</p>
              <p style={{ fontSize: 10, color: "#5A6764", marginTop: 2 }}>
                Emitido {fecha} · Válido por {p.validezDias} días
              </p>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-8">
            <div>
              <p style={{ fontSize: 9, letterSpacing: "0.24em", color: AGUA, fontWeight: 600 }}>CLIENTE</p>
              <p style={{ fontSize: 14, fontWeight: 600, marginTop: 4 }}>{p.nombre}</p>
              {p.domicilio ? <p style={{ fontSize: 12, color: "#4C5C58" }}>{p.domicilio}</p> : null}
              {p.telefono ? <p style={{ fontSize: 12, color: "#4C5C58" }}>{p.telefono}</p> : null}
            </div>
            {datos.length ? (
              <div>
                <p style={{ fontSize: 9, letterSpacing: "0.24em", color: AGUA, fontWeight: 600 }}>PILETA</p>
                <div className="mt-1 grid gap-1">
                  {datos.map((d) => (
                    <p key={d.etiqueta} style={{ fontSize: 12 }}>
                      <span style={{ color: "#8A8674" }}>{d.etiqueta}:</span>{" "}
                      <span style={{ fontWeight: 600 }}>{d.valor}</span>
                    </p>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <div className="mt-8">
            <p style={{ fontSize: 9, letterSpacing: "0.24em", color: AGUA, fontWeight: 600 }}>DETALLE DEL TRABAJO</p>
            <table className="mt-2 w-full" style={{ fontSize: 12, borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: `1.5px solid ${PIZARRA}` }}>
                  <th className="py-2 text-left" style={{ fontWeight: 600 }}>Descripción</th>
                  <th className="py-2 text-center" style={{ width: 60, fontWeight: 600 }}>Cant.</th>
                  <th className="py-2 text-right" style={{ width: 110, fontWeight: 600 }}>Unitario</th>
                  <th className="py-2 text-right" style={{ width: 110, fontWeight: 600 }}>Importe</th>
                </tr>
              </thead>
              <tbody>
                {items.map((i, n) => (
                  <tr key={n} style={{ borderBottom: `1px solid ${ARENA}` }}>
                    <td className="py-2.5 pr-4">{i.detalle}</td>
                    <td className="py-2.5 text-center">{i.cant}</td>
                    <td className="py-2.5 text-right tabular-nums">{plata(i.unitario)}</td>
                    <td className="py-2.5 text-right tabular-nums">{plata(i.cant * i.unitario)}</td>
                  </tr>
                ))}
                <tr>
                  <td colSpan={3} className="py-2 text-right" style={{ color: "#5A6764" }}>Subtotal</td>
                  <td className="py-2 text-right tabular-nums">{plata(subtotal)}</td>
                </tr>
                <tr>
                  <td colSpan={3} className="py-1 text-right" style={{ color: "#5A6764" }}>Materiales</td>
                  <td className="py-1 text-right tabular-nums">{plata(p.materiales)}</td>
                </tr>
                <tr style={{ borderTop: `1.5px solid ${PIZARRA}` }}>
                  <td colSpan={3} className="py-3 text-right" style={{ fontWeight: 700, fontSize: 14 }}>TOTAL</td>
                  <td className="py-3 text-right tabular-nums" style={{ fontWeight: 700, fontSize: 16, color: AGUA }}>
                    {plata(total)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {p.condiciones ? (
            <div className="mt-6">
              <p style={{ fontSize: 9, letterSpacing: "0.24em", color: AGUA, fontWeight: 600 }}>CONDICIONES</p>
              <p style={{ fontSize: 11, color: "#4C5C58", marginTop: 4, lineHeight: 1.6 }}>{p.condiciones}</p>
            </div>
          ) : null}

          <div className="mt-12 flex items-end justify-between">
            <p style={{ fontSize: 10, letterSpacing: "0.18em", color: "#8A8674", borderTop: `1px solid ${PIZARRA}`, paddingTop: 6, width: 220 }}>
              FIRMA Y ACLARACIÓN
            </p>
            <div className="text-right" style={{ fontSize: 11, color: "#4C5C58" }}>
              <p style={{ fontWeight: 600, color: PIZARRA }}>291 526 0511 · @{st.instagram ?? "piletasbahia.blanca"}</p>
              <p>{st.zona ?? "Bahía Blanca y zona"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Hoja 2: boletos de visita, dos por hoja ── */}
      <div className="hoja mx-auto mt-6 print:mt-0" style={{ width: "210mm", minHeight: "296mm", backgroundColor: "#fff", color: PIZARRA, pageBreakBefore: "always" }}>
        <p className="px-[10mm] pt-[6mm]" style={{ fontFamily: "var(--font-jost)", fontSize: 9, letterSpacing: "0.24em", color: "#8A8674" }}>
          BOLETO DE VISITA · DOS POR HOJA
        </p>
        <Boleto numero={num} />
        <div className="flex items-center gap-2 px-[10mm]" aria-hidden>
          <span style={{ flex: 1, borderTop: `1px dashed #B0AA9F` }} />
          <span style={{ fontFamily: "var(--font-jost)", fontSize: 8, letterSpacing: "0.3em", color: "#B0AA9F" }}>CORTE</span>
          <span style={{ flex: 1, borderTop: `1px dashed #B0AA9F` }} />
        </div>
        <Boleto numero={String(p.numero + 1).padStart(4, "0")} />
      </div>

      <style>{`
        @media print {
          @page { size: A4; margin: 0; }
          body * { visibility: hidden; }
          .hoja, .hoja * { visibility: visible; }
          .hoja { box-shadow: none !important; }
        }
        .hoja { box-shadow: 0 10px 30px -18px rgba(20,32,30,.4); }
      `}</style>
    </div>
  );
}
