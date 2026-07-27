import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { guardBazarApi } from "../_guard";
import { slugUnicoProducto } from "@/lib/bazar-server";

/** Alta de producto + listado liviano (para la grilla de Instagram y buscadores). */

const createSchema = z.object({
  nombre: z.string().trim().min(1, "Poné el nombre").max(200),
  categoria: z.string().trim().min(1, "Elegí la categoría").max(80),
  precio: z.number().int().min(0),
  precioOferta: z.number().int().min(0).nullable().optional(),
  stock: z.number().int().min(0).default(0),
  descripcion: z.string().trim().max(4000).optional().default(""),
  sku: z.string().trim().max(60).optional().default(""),
  destacado: z.boolean().optional().default(false),
  activo: z.boolean().optional().default(true),
  fotos: z.array(z.string().url()).max(12).optional().default([]),
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

  const producto = await db.bazarProducto.create({
    data: {
      clientId: g.tenant.id,
      nombre: d.nombre,
      slug: await slugUnicoProducto(db, g.tenant.id, d.nombre),
      categoria: d.categoria,
      precio: d.precio,
      precioOferta: d.precioOferta ?? null,
      stock: d.stock,
      descripcion: d.descripcion || null,
      sku: d.sku || null,
      destacado: d.destacado,
      activo: d.activo,
      fotos: d.fotos,
    },
  });

  return NextResponse.json({ ok: true, producto }, { status: 201 });
}

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const g = await guardBazarApi(slug);
  if (g.error) return g.error;

  const sp = new URL(req.url).searchParams;
  const q = (sp.get("q") ?? "").trim();
  const categoria = (sp.get("categoria") ?? "").trim();
  const pagina = Math.max(1, Number.parseInt(sp.get("pagina") ?? "1", 10) || 1);
  const porPagina = Math.min(60, Math.max(1, Number.parseInt(sp.get("porPagina") ?? "24", 10) || 24));

  const where = {
    clientId: g.tenant.id,
    ...(categoria ? { categoria } : {}),
    ...(q
      ? {
          OR: [
            { nombre: { contains: q, mode: "insensitive" as const } },
            { sku: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [total, productos] = await Promise.all([
    db.bazarProducto.count({ where }),
    db.bazarProducto.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (pagina - 1) * porPagina,
      take: porPagina,
      select: {
        id: true,
        nombre: true,
        slug: true,
        categoria: true,
        precio: true,
        precioOferta: true,
        stock: true,
        fotos: true,
        destacado: true,
        activo: true,
        sku: true,
        vendidos: true,
        visitas: true,
      },
    }),
  ]);

  return NextResponse.json({ total, pagina, porPagina, productos });
}
