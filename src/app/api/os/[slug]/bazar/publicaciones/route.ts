import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { guardBazarApi } from "../_guard";
import { publicarBazarPublicacion } from "@/lib/bazar-ig";
import { fotosDe } from "@/lib/bazar";

export const maxDuration = 120; // publicar un carrusel en IG puede tardar

/**
 * Publicaciones de Instagram del bazar:
 * POST { productoId, caption, programadaPara? } →
 *   con fecha → queda PROGRAMADA (la publica el cron)
 *   sin fecha → publica AHORA (carrusel con las fotos del producto).
 */
const createSchema = z.object({
  productoId: z.string().trim().min(1).max(60),
  caption: z.string().trim().min(1, "Escribí el caption").max(2200),
  programadaPara: z.iso.datetime({ offset: true }).optional().nullable(),
});

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const g = await guardBazarApi(slug);
  if (g.error) return g.error;

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }
  const d = parsed.data;

  const producto = await db.bazarProducto.findFirst({
    where: { id: d.productoId, clientId: g.tenant.id },
    select: { id: true, fotos: true },
  });
  if (!producto) return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
  const fotos = fotosDe(producto.fotos);
  if (fotos.length === 0) {
    return NextResponse.json(
      { error: "El producto no tiene fotos — subile al menos una antes de publicar" },
      { status: 400 }
    );
  }

  const programada = d.programadaPara ? new Date(d.programadaPara) : null;
  const pub = await db.bazarPublicacion.create({
    data: {
      clientId: g.tenant.id,
      productoId: producto.id,
      caption: d.caption,
      fotos,
      programadaPara: programada,
      estado: programada ? "PROGRAMADA" : "BORRADOR",
    },
  });

  if (programada) {
    return NextResponse.json({ ok: true, publicacion: pub }, { status: 201 });
  }

  // Publicar ahora (si no hay conexión de IG, queda en ERROR con el motivo).
  const resultado = await publicarBazarPublicacion(pub.id);
  return NextResponse.json(
    { ok: resultado.estado === "PUBLICADA", publicacion: resultado },
    { status: resultado.estado === "PUBLICADA" ? 201 : 502 }
  );
}

/** Listado para el calendario: publicaciones del tenant (opcional ?mes=YYYY-MM). */
export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const g = await guardBazarApi(slug);
  if (g.error) return g.error;

  const mes = new URL(req.url).searchParams.get("mes");
  let rango: { gte: Date; lt: Date } | null = null;
  if (mes && /^\d{4}-\d{2}$/.test(mes)) {
    const [y, m] = mes.split("-").map(Number);
    const sig = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
    rango = {
      gte: new Date(`${mes}-01T00:00:00-03:00`),
      lt: new Date(`${sig}-01T00:00:00-03:00`),
    };
  }

  const publicaciones = await db.bazarPublicacion.findMany({
    where: {
      clientId: g.tenant.id,
      ...(rango ? { OR: [{ programadaPara: rango }, { publicadaEn: rango }] } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { producto: { select: { nombre: true, fotos: true } } },
  });

  return NextResponse.json({ publicaciones });
}
