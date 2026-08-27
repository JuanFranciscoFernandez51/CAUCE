import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { guardBazarApi } from "../../_guard";
import { slugUnicoProducto } from "@/lib/bazar-server";

/**
 * PATCH inline de un producto del bazar (precio, stock, activo, destacado,
 * categoría, etc. — la regla de oro: editable desde la lista) y DELETE.
 */
const patchSchema = z
  .object({
    nombre: z.string().trim().min(1).max(200),
    categoria: z.string().trim().min(1).max(80),
    precio: z.number().int().min(0),
    precioOferta: z.number().int().min(0).nullable(),
    // Vidrios: las tres listas del rubro.
    precioSeguro: z.number().int().min(0).nullable(),
    precioSinMO: z.number().int().min(0).nullable(),
    marca: z.string().trim().max(80).nullable(),
    stock: z.number().int().min(0),
    descripcion: z.string().trim().max(4000).nullable(),
    sku: z.string().trim().max(60).nullable(),
    destacado: z.boolean(),
    activo: z.boolean(),
    fotos: z.array(z.string().url()).max(12),
  })
  .partial();

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  const { slug, id } = await params;
  const g = await guardBazarApi(slug);
  if (g.error) return g.error;

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }
  const d = parsed.data;

  const existe = await db.bazarProducto.findFirst({
    where: { id, clientId: g.tenant.id },
    select: { id: true, nombre: true },
  });
  if (!existe) return NextResponse.json({ error: "No existe" }, { status: 404 });

  const producto = await db.bazarProducto.update({
    where: { id: existe.id },
    data: {
      ...d,
      ...(d.descripcion !== undefined ? { descripcion: d.descripcion || null } : {}),
      ...(d.sku !== undefined ? { sku: d.sku || null } : {}),
      // Si cambia el nombre, regeneramos el slug (único por tenant).
      ...(d.nombre && d.nombre !== existe.nombre
        ? { slug: await slugUnicoProducto(db, g.tenant.id, d.nombre, existe.id) }
        : {}),
    },
  });

  return NextResponse.json({ ok: true, producto });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  const { slug, id } = await params;
  const g = await guardBazarApi(slug);
  if (g.error) return g.error;

  const borrado = await db.bazarProducto.deleteMany({
    where: { id, clientId: g.tenant.id },
  });
  if (borrado.count === 0) return NextResponse.json({ error: "No existe" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
