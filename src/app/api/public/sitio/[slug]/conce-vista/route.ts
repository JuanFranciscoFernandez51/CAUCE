import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { rateLimit, clientIp } from "@/lib/ratelimit";
import { getTenantBySlug, hasModule } from "@/lib/tenant";
import { esConcesionaria } from "@/lib/conce-server";

/** API PÚBLICA concesionaria: suma una visita a un vehículo (TOP del dashboard). */
const schema = z.object({ vehiculoId: z.string().trim().min(1).max(60) });

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  if (!rateLimit(`rc-vista:${slug}:${clientIp(req)}`, 60, 60_000)) {
    return NextResponse.json({ ok: true }); // silencioso
  }

  const tenant = await getTenantBySlug(slug);
  if (!tenant || !hasModule(tenant, "sitio") || !esConcesionaria(tenant)) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  await db.conceVehiculo.updateMany({
    where: { id: parsed.data.vehiculoId, clientId: tenant.id },
    data: { visitas: { increment: 1 } },
  });

  return NextResponse.json({ ok: true });
}
