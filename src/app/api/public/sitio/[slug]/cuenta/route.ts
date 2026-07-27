import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getTenantBySlug, hasModule } from "@/lib/tenant";
import { cuentaDeSesion, esBazar } from "@/lib/bazar-server";

/** Sesión del comprador: datos de la cuenta + sus pedidos (estados y seguimiento). */
export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant || !hasModule(tenant, "sitio") || !esBazar(tenant)) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  const cuenta = await cuentaDeSesion(tenant);
  if (!cuenta) return NextResponse.json({ cuenta: null });

  const pedidos = await db.bazarPedido.findMany({
    where: { clientId: tenant.id, cuentaId: cuenta.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      numero: true,
      createdAt: true,
      total: true,
      estado: true,
      seguimiento: true,
      retiroEnLocal: true,
    },
  });

  return NextResponse.json({
    cuenta: {
      nombre: cuenta.nombre,
      email: cuenta.email,
      telefono: cuenta.telefono,
      usoDescuento: cuenta.usoDescuento,
    },
    pedidos: pedidos.map((p) => ({
      numero: p.numero,
      fecha: p.createdAt.toISOString(),
      total: p.total,
      estado: p.estado,
      seguimiento: p.seguimiento,
      retiroEnLocal: p.retiroEnLocal,
    })),
  });
}
