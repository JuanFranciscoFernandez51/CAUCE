import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { rateLimit, clientIp } from "@/lib/ratelimit";
import { getTenantBySlug, hasModule } from "@/lib/tenant";
import { esBazar } from "@/lib/bazar-server";

/** API PÚBLICA del bazar: suma una visita a un producto (para el top del dashboard). */
const schema = z.object({ productoId: z.string().trim().min(1).max(60) });

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  if (!rateLimit(`bz-vista:${slug}:${clientIp(req)}`, 60, 60_000)) {
    return NextResponse.json({ ok: true }); // silencioso: una visita no amerita error
  }

  const tenant = await getTenantBySlug(slug);
  if (!tenant || !hasModule(tenant, "sitio") || !esBazar(tenant)) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  await db.bazarProducto.updateMany({
    where: { id: parsed.data.productoId, clientId: tenant.id },
    data: { visitas: { increment: 1 } },
  });

  return NextResponse.json({ ok: true });
}
