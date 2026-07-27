import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getTenantBySlug } from "@/lib/tenant";
import { esBazar } from "@/lib/bazar-server";
import { ButtonLink } from "@/components/ui";
import { itemsDe } from "@/lib/bazar";
import { DespachoBoard, type PedidoBoard } from "../_components/bazar/despacho-board";

export const dynamic = "force-dynamic";

export default async function DespachoPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ estado?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const tenant = await getTenantBySlug(slug);
  if (!tenant || !esBazar(tenant)) notFound();

  const pedidosDb = await db.bazarPedido.findMany({
    where: { clientId: tenant.id },
    orderBy: { createdAt: "desc" },
    take: 300,
  });

  const pedidos: PedidoBoard[] = pedidosDb.map((p) => ({
    id: p.id,
    numero: p.numero,
    estado: p.estado,
    items: itemsDe(p.items),
    subtotal: p.subtotal,
    descuentoTipo: p.descuentoTipo,
    descuentoMonto: p.descuentoMonto,
    envio: p.envio,
    total: p.total,
    nombre: p.nombre,
    telefono: p.telefono,
    email: p.email,
    direccion: p.direccion,
    ciudad: p.ciudad,
    cp: p.cp,
    notas: p.notas,
    retiroEnLocal: p.retiroEnLocal,
    seguimiento: p.seguimiento,
    fecha: p.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Despacho</h1>
          <p className="text-sm text-muted-foreground">
            Del pago a la puerta del cliente: movés cada pedido con un click.
          </p>
        </div>
        <ButtonLink href={`/os/${tenant.slug}/despacho/picking`} variant="secondary">
          🖨️ Lista de picking
        </ButtonLink>
      </div>
      <DespachoBoard slug={tenant.slug} pedidos={pedidos} filtroInicial={sp.estado ?? null} />
    </div>
  );
}
