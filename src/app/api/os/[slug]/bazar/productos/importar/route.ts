import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { guardBazarApi } from "../../_guard";
import { slugify } from "@/lib/bazar";

/**
 * Importador CSV del catálogo (para migrar los 6.000 productos):
 * el cliente sube filas [nombre, categoria, precio, stock, sku] parseadas
 * en el navegador. Genera slugs únicos en memoria (rápido para lotes grandes)
 * y hace createMany por tandas.
 */
const schema = z.object({
  filas: z
    .array(
      z.object({
        nombre: z.string().trim().min(1).max(200),
        categoria: z.string().trim().min(1).max(80),
        precio: z.number().int().min(0),
        stock: z.number().int().min(0).default(0),
        sku: z.string().trim().max(60).optional().default(""),
      })
    )
    .min(1, "El CSV no tiene filas válidas")
    .max(7000, "Máximo 7.000 filas por importación"),
});

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const g = await guardBazarApi(slug);
  if (g.error) return g.error;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  // Slugs ya usados por el tenant (una sola query, después todo en memoria).
  const existentes = await db.bazarProducto.findMany({
    where: { clientId: g.tenant.id },
    select: { slug: true },
  });
  const usados = new Set(existentes.map((p) => p.slug));
  const unico = (nombre: string) => {
    const base = slugify(nombre) || "producto";
    let candidato = base;
    for (let n = 2; usados.has(candidato); n++) candidato = `${base}-${n}`;
    usados.add(candidato);
    return candidato;
  };

  const datos = parsed.data.filas.map((f) => ({
    clientId: g.tenant.id,
    nombre: f.nombre,
    slug: unico(f.nombre),
    categoria: f.categoria,
    precio: f.precio,
    stock: f.stock,
    sku: f.sku || null,
    fotos: [] as string[],
  }));

  let creados = 0;
  for (let i = 0; i < datos.length; i += 500) {
    const lote = await db.bazarProducto.createMany({ data: datos.slice(i, i + 500) });
    creados += lote.count;
  }

  return NextResponse.json({ ok: true, creados }, { status: 201 });
}
