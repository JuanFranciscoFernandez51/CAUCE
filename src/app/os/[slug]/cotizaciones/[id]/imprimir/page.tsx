import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getTenantBySlug } from "@/lib/tenant";
import { BotonImprimirJess } from "./boton";

export const dynamic = "force-dynamic";
export const metadata = { title: "Cotización" };

/**
 * PDF de cotización con la estética de Jess: crema, Italiana en los títulos,
 * el logo del óvalo, la plantilla de servicios y el mobiliario elegido.
 */
const TINTA = "#1A1816";
const CREMA = "#EDE8DE";
const TOPO = "#9E9387";
const TERRA = "#B85850";

export default async function ImprimirCotizacionPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) notFound();
  const p = await db.presupuestoDoc.findFirst({ where: { id, clientId: tenant.id } });
  if (!p) notFound();

  const logo = ((tenant.branding as { logo?: string } | null)?.logo) ?? null;
  const st = (tenant.settings ?? {}) as {
    instagram?: string;
    plantillaCotizacion?: { servicios?: { nombre: string; items: string[] }[]; moneda?: string };
  };
  const servicios = st.plantillaCotizacion?.servicios ?? [];
  const moneda = st.plantillaCotizacion?.moneda ?? "USD";

  const datos = (p.datos as { etiqueta: string; valor: string }[]) ?? [];
  const dato = (k: string) => datos.find((x) => x.etiqueta === k)?.valor ?? "";
  const items = ((p.items as { detalle: string; cant: number; unitario: number }[]) ?? []).filter((i) => i.unitario > 0);
  const totalMob = items.reduce((a, i) => a + i.cant * i.unitario, 0);
  const precioUsd = Number(dato("PrecioUSD") || 0);
  const num = String(p.numero).padStart(4, "0");
  const plata = (n: number) => `$ ${Math.round(n).toLocaleString("es-AR")}`;

  return (
    <div style={{ backgroundColor: "#dfd9cd" }} className="min-h-screen py-6 print:bg-white print:py-0">
      <div className="mx-auto mb-4 flex max-w-[210mm] items-center justify-between px-2 print:hidden">
        <p className="text-sm font-medium" style={{ color: TINTA }}>Cotización N° {num} — se imprime o se guarda como PDF.</p>
        <BotonImprimirJess />
      </div>

      <div className="hoja mx-auto" style={{ width: "210mm", minHeight: "296mm", backgroundColor: CREMA, color: TINTA, fontFamily: "var(--font-montserrat)" }}>
        <div style={{ padding: "16mm 18mm" }}>
          {/* Cabecera con el logo del óvalo */}
          <div className="flex items-start justify-between">
            <div className="flex items-center" style={{ gap: "6mm" }}>
              {logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logo} alt="" style={{ height: "22mm", width: "auto" }} />
              ) : null}
              <div>
                <p style={{ fontFamily: "var(--font-italiana)", fontSize: "9mm", letterSpacing: "0.24em", lineHeight: 1 }}>JESS</p>
                <p style={{ fontSize: "2.6mm", letterSpacing: "0.5em", color: TOPO, marginTop: "1mm" }}>DESIGN · EVENT PLANNER</p>
              </div>
            </div>
            <div className="text-right">
              <p style={{ fontFamily: "var(--font-italiana)", fontSize: "8mm", lineHeight: 1 }}>Cotización</p>
              <p style={{ fontSize: "3mm", color: TERRA, fontWeight: 600, marginTop: "1mm" }}>N° {num}</p>
              <p style={{ fontSize: "2.6mm", color: TOPO, marginTop: "1mm" }}>{p.createdAt.toLocaleDateString("es-AR")} · Válida {p.validezDias} días</p>
            </div>
          </div>

          {/* Evento y cliente */}
          <div className="mt-10 grid grid-cols-2 gap-8" style={{ borderTop: `0.4mm solid ${TINTA}`, paddingTop: "5mm" }}>
            <div>
              <p style={{ fontSize: "2.4mm", letterSpacing: "0.24em", color: TOPO, fontWeight: 600 }}>EVENTO</p>
              <p style={{ fontFamily: "var(--font-italiana)", fontSize: "6mm", marginTop: "1.5mm", lineHeight: 1.1 }}>{dato("Evento") || "—"}</p>
              <p style={{ fontSize: "3mm", color: "#6d645b", marginTop: "1mm" }}>
                {[dato("Tipo"), dato("FechaEvento") && new Date(dato("FechaEvento") + "T12:00").toLocaleDateString("es-AR"), dato("Lugar")].filter(Boolean).join(" · ")}
              </p>
            </div>
            <div className="text-right">
              <p style={{ fontSize: "2.4mm", letterSpacing: "0.24em", color: TOPO, fontWeight: 600 }}>CLIENTE</p>
              <p style={{ fontSize: "4mm", fontWeight: 600, marginTop: "1.5mm" }}>{p.nombre}</p>
              {p.telefono ? <p style={{ fontSize: "3mm", color: "#6d645b" }}>{p.telefono}</p> : null}
            </div>
          </div>

          {/* Servicio integral */}
          {precioUsd > 0 ? (
            <div className="mt-8">
              <div className="flex items-baseline justify-between" style={{ borderBottom: `0.3mm solid ${TOPO}55`, paddingBottom: "2mm" }}>
                <p style={{ fontSize: "2.4mm", letterSpacing: "0.24em", color: TOPO, fontWeight: 600 }}>SERVICIO INTEGRAL DE ORGANIZACIÓN</p>
                <p style={{ fontFamily: "var(--font-italiana)", fontSize: "7mm" }}>
                  {moneda} {precioUsd.toLocaleString("es-AR")}
                </p>
              </div>
              <div className="mt-4 grid grid-cols-2" style={{ gap: "4mm 8mm" }}>
                {servicios.map((s) => (
                  <div key={s.nombre}>
                    <p style={{ fontSize: "3.1mm", fontWeight: 700 }}>{s.nombre}</p>
                    <ul style={{ marginTop: "1mm" }}>
                      {s.items.map((it) => (
                        <li key={it} style={{ fontSize: "2.7mm", lineHeight: 1.55, color: "#54493f", display: "flex", gap: "1.5mm" }}>
                          <span style={{ color: TERRA }}>·</span> {it}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* Mobiliario elegido */}
          {items.length ? (
            <div className="mt-8">
              <p style={{ fontSize: "2.4mm", letterSpacing: "0.24em", color: TOPO, fontWeight: 600, borderBottom: `0.3mm solid ${TOPO}55`, paddingBottom: "2mm" }}>
                MOBILIARIO Y AMBIENTACIÓN
              </p>
              <table className="mt-3 w-full" style={{ fontSize: "3mm", borderCollapse: "collapse" }}>
                <tbody>
                  {items.map((i, n) => (
                    <tr key={n} style={{ borderBottom: `0.2mm solid ${TOPO}33` }}>
                      <td style={{ padding: "1.8mm 0" }}>{i.detalle}</td>
                      <td className="text-right tabular-nums" style={{ padding: "1.8mm 0", width: "30mm" }}>{plata(i.cant * i.unitario)}</td>
                    </tr>
                  ))}
                  <tr>
                    <td className="text-right" style={{ padding: "2.5mm 4mm 0 0", fontWeight: 600 }}>Total mobiliario</td>
                    <td className="text-right tabular-nums" style={{ padding: "2.5mm 0 0", fontFamily: "var(--font-italiana)", fontSize: "4.5mm" }}>
                      {plata(totalMob)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : null}

          {/* Notas */}
          {p.condiciones ? (
            <div className="mt-8">
              <p style={{ fontSize: "2.4mm", letterSpacing: "0.24em", color: TOPO, fontWeight: 600 }}>NOTAS</p>
              <p style={{ fontSize: "2.9mm", lineHeight: 1.7, color: "#54493f", marginTop: "1.5mm" }}>{p.condiciones}</p>
            </div>
          ) : null}

          {/* Firma */}
          <div className="mt-14 flex items-end justify-between">
            <p style={{ fontFamily: "var(--font-pinyon)", fontSize: "9mm", color: TINTA }}>Jess</p>
            <div className="text-right" style={{ fontSize: "2.7mm", color: TOPO }}>
              <p style={{ fontFamily: "var(--font-pinyon)", fontSize: "4.5mm", color: TERRA }}>Sofisticación en cada detalle</p>
              <p style={{ marginTop: "1mm" }}>@{st.instagram ?? "jessdesign.bb"} · Bahía Blanca</p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          @page { size: A4; margin: 0; }
          body * { visibility: hidden; }
          .hoja, .hoja * { visibility: visible; }
          .hoja { box-shadow: none !important; }
        }
        .hoja { box-shadow: 0 10px 30px -18px rgba(26,24,22,.45); }
      `}</style>
    </div>
  );
}
