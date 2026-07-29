import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { guardConceApi } from "../_guard";
import { slugUnicoVehiculo } from "@/lib/conce-server";
import { nombreVehiculo } from "@/lib/conce";

/** Alta de vehículo + listado liviano (para Publicar y buscadores). */

const createSchema = z.object({
  marca: z.string().trim().min(1, "Poné la marca").max(80),
  modelo: z.string().trim().min(1, "Poné el modelo").max(120),
  version: z.string().trim().max(120).optional().default(""),
  anio: z.number().int().min(1950).max(2030),
  km: z.number().int().min(0).default(0),
  precio: z.number().min(0).nullable().optional(),
  moneda: z.enum(["ARS", "USD"]).default("ARS"),
  condicion: z.enum(["0km", "usado"]).default("usado"),
  tipo: z.string().trim().min(1).max(60).default("sedan"),
  transmision: z.string().trim().max(60).optional().default(""),
  combustible: z.string().trim().max(60).optional().default(""),
  color: z.string().trim().max(60).optional().default(""),
  motor: z.string().trim().max(80).optional().default(""),
  dominio: z.string().trim().max(20).optional().default(""),
  descripcion: z.string().trim().max(6000).optional().default(""),
  destacado: z.boolean().optional().default(false),
  oferta: z.boolean().optional().default(false),
  estado: z.enum(["disponible", "reservado", "vendido"]).optional().default("disponible"),
  publicado: z.boolean().optional().default(true),
  fotos: z.array(z.string().url()).max(40).optional().default([]),
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

  const vehiculo = await db.conceVehiculo.create({
    data: {
      clientId: g.tenant.id,
      slug: await slugUnicoVehiculo(
        db,
        g.tenant.id,
        `${nombreVehiculo(d)} ${d.anio} en bahia blanca`
      ),
      marca: d.marca,
      modelo: d.modelo,
      version: d.version || null,
      anio: d.anio,
      km: d.km,
      precio: d.precio && d.precio > 0 ? d.precio : null,
      moneda: d.moneda,
      condicion: d.condicion,
      tipo: d.tipo,
      transmision: d.transmision || null,
      combustible: d.combustible || null,
      color: d.color || null,
      motor: d.motor || null,
      dominio: d.dominio || null,
      descripcion: d.descripcion || null,
      destacado: d.destacado,
      oferta: d.oferta,
      estado: d.estado,
      publicado: d.publicado,
      fotos: d.fotos,
    },
  });

  return NextResponse.json({ ok: true, vehiculo }, { status: 201 });
}

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const g = await guardConceApi(slug);
  if (g.error) return g.error;

  const sp = new URL(req.url).searchParams;
  const q = (sp.get("q") ?? "").trim();
  const estado = (sp.get("estado") ?? "").trim();

  const vehiculos = await db.conceVehiculo.findMany({
    where: {
      clientId: g.tenant.id,
      ...(estado ? { estado } : {}),
      ...(q
        ? {
            OR: [
              { marca: { contains: q, mode: "insensitive" as const } },
              { modelo: { contains: q, mode: "insensitive" as const } },
              { version: { contains: q, mode: "insensitive" as const } },
              { dominio: { contains: q, mode: "insensitive" as const } },
            ],
          }
        : {}),
    },
    orderBy: { ingresadoEl: "desc" },
    take: 120,
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
      tipo: true,
      estado: true,
      publicado: true,
      destacado: true,
      oferta: true,
      visitas: true,
      fotos: true,
    },
  });

  return NextResponse.json({ vehiculos });
}
