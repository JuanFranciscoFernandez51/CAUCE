import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getTenantBySlug, tenantBranding } from "@/lib/tenant";
import { LogoCodigoAuto } from "@/app/sitio/[slug]/_components/vidrios/logo-codigoauto";
import { esVidrios, ordenDatos, ordenItems, totalOrden, vehiculoLinea } from "@/lib/vidrios";
import { BotonesImprimir } from "./botones";

export const dynamic = "force-dynamic";
export const metadata = { title: "Boleto" };

/**
 * Boleto imprimible de la orden: A4 con membrete verde, el wordmark de la marca,
 * datos del negocio, detalle, seña/saldo y firma (patrón piletas/imprimir).
 */
const VERDE = "#008000";
const TINTA = "#0c1f0c";

/* El logo es tipográfico: no se usa imagen. */
const _sinFondo = (url: string) =>
  url.includes("res.cloudinary.com") ? url.replace("/upload/", "/upload/e_make_transparent:12/") : url;
const FONDO = "#f4faf4";
const LINEA = "#cfe3cf";

export default async function ImprimirOrdenPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant || !esVidrios(tenant)) notFound();
  const p = await db.presupuestoDoc.findFirst({ where: { id, clientId: tenant.id } });
  if (!p) notFound();

  const branding = tenantBranding(tenant);
  const st = (tenant.settings ?? {}) as { direccion?: string; rubro?: string };
  const d = ordenDatos(p);
  const items = ordenItems(p);
  const total = totalOrden(p);
  const saldo = Math.max(0, total - d.senia);
  const num = String(p.numero).padStart(4, "0");
  const plata = (n: number) => (n > 0 ? `$ ${n.toLocaleString("es-AR")}` : "—");
  const fecha = p.createdAt.toLocaleDateString("es-AR");
  const vehiculo = vehiculoLinea(d);

  return (
    <div style={{ backgroundColor: "#e8efe8" }} className="min-h-screen py-6 print:bg-white print:py-0">
      <div className="mx-auto mb-4 flex max-w-[210mm] items-center justify-between px-2 print:hidden">
        <p className="text-sm font-medium" style={{ color: TINTA }}>
          Orden N° {num} — imprimila o guardala como PDF para el cliente.
        </p>
        <BotonesImprimir />
      </div>

      <div className="hoja mx-auto" style={{ width: "210mm", minHeight: "296mm", backgroundColor: "#ffffff", color: TINTA }}>
        {/* Membrete verde con el logo */}
        <div className="flex items-center justify-between gap-6" style={{ backgroundColor: VERDE, color: "#ffffff", padding: "10mm 16mm" }}>
          <div className="flex items-center gap-4">
            <div>
              <LogoCodigoAuto alto={40} bajada={false} />
              <p style={{ fontSize: 11, opacity: 0.9, marginTop: 4, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                {st.rubro ?? "Venta y colocación de parabrisas"}
              </p>
            </div>
          </div>
          <div className="text-right" style={{ fontSize: 11, lineHeight: 1.6 }}>
            <p style={{ fontSize: 15, fontWeight: 700 }}>ORDEN DE PEDIDO</p>
            <p style={{ fontSize: 13, fontWeight: 700 }}>N° {num}</p>
            <p style={{ opacity: 0.9 }}>Fecha: {fecha}</p>
          </div>
        </div>

        <div style={{ padding: "10mm 16mm" }}>
          {/* Cliente + vehículo */}
          <div className="grid grid-cols-2 gap-8">
            <div style={{ backgroundColor: FONDO, borderRadius: 8, padding: "5mm 6mm" }}>
              <p style={{ fontSize: 9, letterSpacing: "0.22em", color: VERDE, fontWeight: 700 }}>CLIENTE</p>
              <p style={{ fontSize: 15, fontWeight: 700, marginTop: 4 }}>{p.nombre}</p>
              {p.telefono ? <p style={{ fontSize: 12, marginTop: 2, color: "#3c553c" }}>Tel: {p.telefono}</p> : null}
            </div>
            <div style={{ backgroundColor: FONDO, borderRadius: 8, padding: "5mm 6mm" }}>
              <p style={{ fontSize: 9, letterSpacing: "0.22em", color: VERDE, fontWeight: 700 }}>VEHÍCULO</p>
              <p style={{ fontSize: 15, fontWeight: 700, marginTop: 4 }}>{vehiculo || "—"}</p>
              <p style={{ fontSize: 12, marginTop: 2, color: "#3c553c" }}>
                Estado del trabajo: {p.estado === "COLOCADO" ? "Colocado" : "Pendiente de colocación"}
              </p>
            </div>
          </div>

          {d.seguro ? (
            <div style={{ backgroundColor: "#eef4ee", border: `1px solid ${VERDE}`, borderRadius: 8, padding: "4mm 6mm", marginTop: "5mm" }}>
              <p style={{ fontSize: 9, letterSpacing: "0.22em", color: VERDE, fontWeight: 700 }}>TRABAJO POR SEGURO</p>
              <p style={{ fontSize: 13, fontWeight: 700, marginTop: 3 }}>
                {d.seguro.compania || "Compañía a confirmar"}
                {d.seguro.siniestro ? ` · Siniestro/Autorización N° ${d.seguro.siniestro}` : ""}
              </p>
              <p style={{ fontSize: 11, marginTop: 2, color: "#3c553c" }}>La facturación de este trabajo corresponde a la compañía aseguradora.</p>
            </div>
          ) : null}

          {/* Detalle */}
          <div className="mt-8">
            <p style={{ fontSize: 9, letterSpacing: "0.22em", color: VERDE, fontWeight: 700 }}>DETALLE</p>
            <table className="mt-2 w-full" style={{ fontSize: 12, borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${TINTA}` }}>
                  <th className="py-2 text-left" style={{ width: 90, fontWeight: 700 }}>Código</th>
                  <th className="py-2 text-left" style={{ fontWeight: 700 }}>Descripción</th>
                  <th className="py-2 text-center" style={{ width: 55, fontWeight: 700 }}>Cant.</th>
                  <th className="py-2 text-right" style={{ width: 105, fontWeight: 700 }}>Unitario</th>
                  <th className="py-2 text-right" style={{ width: 105, fontWeight: 700 }}>Importe</th>
                </tr>
              </thead>
              <tbody>
                {items.map((i, n) => (
                  <tr key={n} style={{ borderBottom: `1px solid ${LINEA}` }}>
                    <td className="py-2.5" style={{ fontFamily: "monospace", fontSize: 11 }}>{i.codigo || "—"}</td>
                    <td className="py-2.5 pr-4">{i.detalle}</td>
                    <td className="py-2.5 text-center">{i.cant}</td>
                    <td className="py-2.5 text-right tabular-nums">{plata(i.unitario)}</td>
                    <td className="py-2.5 text-right tabular-nums">{plata(i.cant * i.unitario)}</td>
                  </tr>
                ))}
                <tr>
                  <td colSpan={4} className="py-2.5 text-right" style={{ color: "#3c553c" }}>Seña</td>
                  <td className="py-2.5 text-right tabular-nums">{plata(d.senia)}</td>
                </tr>
                <tr>
                  <td colSpan={4} className="py-1 text-right" style={{ color: "#3c553c" }}>Saldo</td>
                  <td className="py-1 text-right tabular-nums">{plata(saldo)}</td>
                </tr>
                <tr style={{ borderTop: `2px solid ${TINTA}` }}>
                  <td colSpan={4} className="py-3 text-right" style={{ fontWeight: 800, fontSize: 14 }}>TOTAL</td>
                  <td className="py-3 text-right tabular-nums" style={{ fontWeight: 800, fontSize: 16, color: VERDE }}>
                    {plata(total)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="mt-6" style={{ fontSize: 10.5, color: "#3c553c", lineHeight: 1.6 }}>
            La seña reserva el vidrio y el turno de colocación. El saldo se abona al retirar o al
            finalizar la colocación.
          </p>

          {/* Firmas + pie */}
          <div className="mt-14 grid grid-cols-2 gap-16">
            <p style={{ fontSize: 10, letterSpacing: "0.16em", color: "#5c735c", borderTop: `1px solid ${TINTA}`, paddingTop: 6, textAlign: "center" }}>
              FIRMA DEL CLIENTE
            </p>
            <p style={{ fontSize: 10, letterSpacing: "0.16em", color: "#5c735c", borderTop: `1px solid ${TINTA}`, paddingTop: 6, textAlign: "center" }}>
              POR {branding.displayName.toUpperCase()}
            </p>
          </div>

          <div className="mt-10 flex items-center justify-between" style={{ borderTop: `1px solid ${LINEA}`, paddingTop: "4mm", fontSize: 11, color: "#3c553c" }}>
            <p style={{ fontWeight: 700, color: TINTA }}>{branding.displayName}</p>
            <p>{st.direccion ?? "9 de Julio 578, Bahía Blanca"}</p>
            {tenant.whatsapp ? <p>WhatsApp {tenant.whatsapp}</p> : null}
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
        .hoja { box-shadow: 0 10px 30px -18px rgba(12,31,12,.4); }
      `}</style>
    </div>
  );
}
