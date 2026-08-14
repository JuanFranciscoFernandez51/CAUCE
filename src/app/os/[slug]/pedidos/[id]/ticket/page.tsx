import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getTenantBySlug } from "@/lib/tenant";
import { itemsDe, fmtPrecio } from "@/lib/bazar";
import { BotonImprimir } from "./boton-imprimir";

export const dynamic = "force-dynamic";
export const metadata = { title: "Ticket del pedido" };

/**
 * Ticket de 80 mm de ancho (impresora térmica, alto libre) para acompañar
 * el pedido en el reparto: qué lleva, cuánto es y si ya está pagado.
 * Colores del branding del tenant con defaults neutros.
 */
export default async function TicketPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) notFound();

  const pedido = await db.bazarPedido.findFirst({ where: { id, clientId: tenant.id } });
  if (!pedido) notFound();

  const marca = (tenant.branding ?? {}) as {
    primary?: string;
    fondo?: string;
    tinta?: string;
    displayName?: string;
  };
  const PRIMARIO = marca.primary ?? "#111111";
  const FONDO = marca.fondo ?? "#ffffff";
  const TINTA = marca.tinta ?? "#111111";
  const nombre = marca.displayName ?? tenant.name;

  const items = itemsDe(pedido.items);
  const fecha = pedido.createdAt.toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Argentina/Buenos_Aires",
  });
  const pago = pedido.mpPaymentId ? "Pagado online" : "A cobrar al entregar";
  const separador = { borderTop: `1px dashed ${TINTA}66`, margin: "2.5mm 0" };

  return (
    <div className="p-4 sm:p-6">
      <div className="mx-auto max-w-[440px] print:max-w-none">
        <div className="mb-4 flex items-center justify-between gap-3 print:hidden">
          <div>
            <h1 className="text-lg font-semibold">Ticket del pedido #{pedido.numero}</h1>
            <p className="text-sm text-muted-foreground">
              80 mm de ancho, para impresora térmica. Acompaña el paquete en el reparto.
            </p>
          </div>
          <BotonImprimir />
        </div>

        <div
          className="ticket"
          style={{
            width: "80mm",
            backgroundColor: FONDO,
            color: TINTA,
            padding: "4mm",
            fontSize: "3.2mm",
            lineHeight: 1.45,
            border: `1px solid ${TINTA}22`,
          }}
        >
          {/* Cabecera: negocio + número */}
          <p
            style={{
              textAlign: "center",
              fontWeight: 800,
              fontSize: "4.6mm",
              color: PRIMARIO,
              lineHeight: 1.15,
            }}
          >
            {nombre}
          </p>
          <p style={{ textAlign: "center", fontSize: "2.9mm", color: `${TINTA}99` }}>
            Pedido #{pedido.numero} · {fecha}
          </p>

          <div style={separador} />

          {/* Cliente y entrega */}
          <p>
            <strong>{pedido.nombre}</strong>
          </p>
          <p>📞 {pedido.telefono}</p>
          {pedido.retiroEnLocal ? (
            <p>🏠 Retira en el local</p>
          ) : (
            <p>
              📍 {pedido.direccion}
              {pedido.ciudad ? `, ${pedido.ciudad}` : ""}
              {pedido.cp ? ` (CP ${pedido.cp})` : ""}
            </p>
          )}

          <div style={separador} />

          {/* Ítems: cantidad × nombre — importe */}
          <ul>
            {items.map((i, n) => (
              <li
                key={n}
                style={{ display: "flex", justifyContent: "space-between", gap: "3mm" }}
              >
                <span style={{ minWidth: 0 }}>
                  <strong style={{ color: PRIMARIO }}>{i.cant}×</strong> {i.nombre}
                </span>
                <span style={{ whiteSpace: "nowrap", fontWeight: 600 }}>
                  {fmtPrecio(i.precio * i.cant)}
                </span>
              </li>
            ))}
          </ul>

          <div style={separador} />

          {/* Totales */}
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Subtotal</span>
            <span>{fmtPrecio(pedido.subtotal)}</span>
          </div>
          {pedido.descuentoMonto > 0 ? (
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Descuento</span>
              <span>−{fmtPrecio(pedido.descuentoMonto)}</span>
            </div>
          ) : null}
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Envío</span>
            <span>{pedido.envio > 0 ? fmtPrecio(pedido.envio) : "—"}</span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              marginTop: "1.5mm",
              fontWeight: 800,
              fontSize: "5mm",
              color: PRIMARIO,
            }}
          >
            <span>TOTAL</span>
            <span>{fmtPrecio(pedido.total)}</span>
          </div>

          <div style={separador} />

          {/* Forma de pago + notas */}
          <p style={{ textAlign: "center", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            {pago}
          </p>
          {pedido.notas ? (
            <p style={{ marginTop: "1.5mm", fontStyle: "italic", fontSize: "2.9mm" }}>
              Nota: {pedido.notas}
            </p>
          ) : null}

          <p style={{ textAlign: "center", marginTop: "3mm", fontSize: "2.7mm", color: `${TINTA}99` }}>
            ¡Gracias por tu compra!
          </p>
        </div>
      </div>

      <style>{`
        @media print {
          @page { size: 80mm auto; margin: 0; }
          body { background: #fff; }
          body * { visibility: hidden; }
          .ticket, .ticket * { visibility: visible; }
          .ticket { position: absolute; top: 0; left: 0; border: none !important; }
        }
      `}</style>
    </div>
  );
}
