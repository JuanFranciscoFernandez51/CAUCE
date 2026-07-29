import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rateLimit, clientIp } from "@/lib/ratelimit";
import { getTenantBySlug, hasModule } from "@/lib/tenant";
import { esConcesionaria } from "@/lib/conce-server";
import { primeraFotoVehiculo } from "@/lib/conce";

/** API PÚBLICA concesionaria: vehículos por IDs (para la página de favoritos). */
export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  if (!rateLimit(`rc-favs:${slug}:${clientIp(req)}`, 30, 60_000)) {
    return NextResponse.json({ vehiculos: [] });
  }

  const tenant = await getTenantBySlug(slug);
  if (!tenant || !hasModule(tenant, "sitio") || !esConcesionaria(tenant)) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  const ids = (new URL(req.url).searchParams.get("ids") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 40);
  if (ids.length === 0) return NextResponse.json({ vehiculos: [] });

  const rows = await db.conceVehiculo.findMany({
    where: { clientId: tenant.id, id: { in: ids }, estado: { not: "vendido" }, publicado: true },
    select: {
      id: true,
      slug: true,
      marca: true,
      modelo: true,
      version: true,
      anio: true,
      km: true,
      precio: true,
      moneda: true,
      condicion: true,
      estado: true,
      fotos: true,
    },
  });

  return NextResponse.json({
    vehiculos: rows.map((v) => ({
      id: v.id,
      slug: v.slug,
      marca: v.marca,
      modelo: v.modelo,
      version: v.version,
      anio: v.anio,
      km: v.km,
      precio: v.precio,
      moneda: v.moneda,
      condicion: v.condicion,
      estado: v.estado,
      foto: primeraFotoVehiculo(v.fotos),
    })),
  });
}
