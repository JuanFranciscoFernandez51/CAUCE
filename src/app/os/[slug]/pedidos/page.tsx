import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getTenantBySlug } from "@/lib/tenant";
import { esBazar } from "@/lib/bazar-server";
import { ButtonLink } from "@/components/ui";
import { fmtPrecio, itemsDe, ESTADOS_PAGOS, type PedidoEstado } from "@/lib/bazar";
import { PedidosPanel, type PedidoFila } from "../_components/bazar/pedidos-panel";

export const dynamic = "force-dynamic";

/**
 * Pedidos: la venta y el despacho en un solo lugar.
 * Arriba la plata (qué falta cobrar, qué entró), abajo el tablero con el
 * estado de cada pedido y el botón del paso siguiente.
 */
export default async function PedidosPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant || !esBazar(tenant)) notFound();

  const desde = new Date();
  desde.setDate(1);
  desde.setHours(0, 0, 0, 0);

  const crudos = await db.bazarPedido.findMany({
    where: { clientId: tenant.id },
    orderBy: { createdAt: "desc" },
    take: 400,
  });

  const pedidos: PedidoFila[] = crudos.map((p) => ({
    id: p.id,
    numero: p.numero,
    fecha: p.createdAt.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "2-digit" }),
    nombre: p.nombre,
    telefono: p.telefono,
    email: p.email,
    items: itemsDe(p.items).map((i) => ({ nombre: i.nombre, precio: i.precio, cant: i.cant, sku: (i as { sku?: string }).sku })),
    subtotal: p.subtotal,
    descuento: p.descuentoMonto,
    envio: p.envio,
    total: p.total,
    estado: p.estado as PedidoEstado,
    retiroEnLocal: p.retiroEnLocal,
    direccion: p.direccion,
    ciudad: p.ciudad,
    cp: p.cp,
    seguimiento: p.seguimiento,
    notas: p.notas,
    pagoMp: !!p.mpPaymentId,
  }));

  const porCobrar = pedidos.filter((p) => p.estado === "NUEVO");
  const cobradoMes = crudos
    .filter((p) => ESTADOS_PAGOS.includes(p.estado as PedidoEstado) && p.createdAt >= desde)
    .reduce((a, p) => a + p.total, 0);
  const esperando = pedidos.filter((p) => p.estado === "ESPERANDO");
  const paraDespachar = pedidos.filter((p) => p.estado === "PAGADO" || p.estado === "PREPARANDO");

  const tarjetas = [
    { t: "Por cobrar", v: fmtPrecio(porCobrar.reduce((a, p) => a + p.total, 0)), d: `${porCobrar.length} pedido${porCobrar.length === 1 ? "" : "s"} sin pagar` },
    { t: "Cobrado este mes", v: fmtPrecio(cobradoMes), d: "pedidos pagados desde el 1°" },
    { t: "Esperando el producto", v: String(esperando.length), d: "hay que pedirlos al proveedor" },
    { t: "Para despachar", v: String(paraDespachar.length), d: "pagados y en preparación" },
  ];

  return (
    <div className="space-y-5 p-4 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pedidos</h1>
          <p className="text-sm text-muted-foreground">
            Todo lo que entró por la web: qué falta cobrar, qué falta conseguir y qué sale hoy.
          </p>
        </div>
        <ButtonLink href={`/os/${slug}/despacho`} variant="secondary">
          Ver como tablero
        </ButtonLink>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {tarjetas.map((c) => (
          <div key={c.t} className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{c.t}</p>
            <p className="mt-1 text-2xl font-bold tabular-nums">{c.v}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{c.d}</p>
          </div>
        ))}
      </div>

      <PedidosPanel slug={slug} pedidos={pedidos} />
    </div>
  );
}
