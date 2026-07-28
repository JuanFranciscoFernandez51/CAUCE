import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { guardConceApi } from "../_guard";
import { fotosDeVehiculo } from "@/lib/conce";

/**
 * Publicaciones de vehículos en Instagram / Mercado Libre con un botón:
 * crea la publicación con caption + fotos listas. IG puede programarse
 * (el cron la publica cuando el tenant conecte su cuenta); ML queda armada
 * para copiar y pegar (conexión pendiente de tokens del cliente).
 */

const createSchema = z.object({
  vehiculoId: z.string().trim().min(1).max(60),
  canal: z.enum(["instagram", "mercadolibre"]),
  caption: z.string().trim().min(1, "Escribí el texto").max(4000),
  programadaPara: z.string().trim().optional(), // ISO datetime local
  fotos: z.array(z.string().url()).max(20).optional(),
});

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const g = await guardConceApi(slug);
  if (g.error) return g.error;

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }
  const d = parsed.data;

  const vehiculo = await db.conceVehiculo.findFirst({
    where: { id: d.vehiculoId, clientId: g.tenant.id },
    select: { id: true, fotos: true },
  });
  if (!vehiculo) return NextResponse.json({ error: "Vehículo no encontrado" }, { status: 404 });

  const fotos = d.fotos?.length ? d.fotos : fotosDeVehiculo(vehiculo.fotos).slice(0, 10);
  const programadaPara = d.programadaPara ? new Date(d.programadaPara) : null;

  const publicacion = await db.concePublicacion.create({
    data: {
      clientId: g.tenant.id,
      vehiculoId: vehiculo.id,
      canal: d.canal,
      caption: d.caption,
      fotos,
      programadaPara: programadaPara && !Number.isNaN(programadaPara.getTime()) ? programadaPara : null,
      estado: d.canal === "instagram" && programadaPara ? "PROGRAMADA" : "BORRADOR",
    },
  });

  return NextResponse.json({ ok: true, publicacion }, { status: 201 });
}

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const g = await guardConceApi(slug);
  if (g.error) return g.error;

  const publicaciones = await db.concePublicacion.findMany({
    where: { clientId: g.tenant.id },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      vehiculo: { select: { marca: true, modelo: true, version: true, anio: true } },
    },
  });

  return NextResponse.json({ publicaciones });
}
