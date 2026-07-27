import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getTenantBySlug, hasModule } from "@/lib/tenant";
import { consultarPagoMp, esBazar, marcarPedidoPagado } from "@/lib/bazar-server";

/**
 * Webhook de MercadoPago del bazar. MP pega acá cuando cambia un pago.
 * Verificamos el pago CONTRA LA API de MP (nunca confiamos en el body) y si
 * está aprobado: pedido PAGADO + stock − + vendidos + cupón usado + ingreso
 * en Finanzas (todo en marcarPedidoPagado, idempotente).
 * SIEMPRE 200: si respondemos error, MP reintenta para siempre.
 */
export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant || !hasModule(tenant, "sitio") || !esBazar(tenant)) {
    return NextResponse.json({ ok: true });
  }

  const body = (await req.json().catch(() => null)) as {
    type?: string;
    action?: string;
    data?: { id?: string | number };
  } | null;
  const url = new URL(req.url);
  const paymentId =
    body?.data?.id != null
      ? String(body.data.id)
      : url.searchParams.get("data.id") ?? url.searchParams.get("id");
  const tipo = body?.type ?? url.searchParams.get("type") ?? url.searchParams.get("topic") ?? "";

  if (!paymentId || (tipo && tipo !== "payment")) {
    return NextResponse.json({ ok: true });
  }

  const pago = await consultarPagoMp(tenant, paymentId);
  if (!pago?.externalReference) return NextResponse.json({ ok: true });

  if (pago.status === "approved") {
    await marcarPedidoPagado({
      clientId: tenant.id,
      pedidoId: pago.externalReference,
      mpPaymentId: paymentId,
      medio: "mp",
    });
  } else if (pago.status === "rejected" || pago.status === "cancelled") {
    // Guardamos la referencia del intento fallido, sin tocar el estado.
    await db.bazarPedido.updateMany({
      where: { id: pago.externalReference, clientId: tenant.id, estado: "NUEVO" },
      data: { mpPaymentId: paymentId },
    });
  }

  return NextResponse.json({ ok: true });
}
