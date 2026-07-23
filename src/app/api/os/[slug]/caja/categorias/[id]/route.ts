import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { guardOsOwnerApi } from "../../../_guard";

/** Kind de CashMovement que corresponde al tipo de la categoría. */
function kindDe(tipo: string): string {
  return tipo === "INGRESO" ? "venta" : "gasto";
}

const patchSchema = z
  .object({
    nombre: z.string().trim().min(1, "El nombre no puede quedar vacío").max(80).optional(),
    activa: z.boolean().optional(),
    orden: z.number().int().optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: "Nada para actualizar" });

/** PATCH → renombrar (arrastra el historial de movimientos) / activar / reordenar. */
export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ slug: string; id: string }> }
) {
  const { slug, id } = await ctx.params;
  const g = await guardOsOwnerApi(slug, "caja");
  if (g.error) return g.error;
  const clientId = g.tenant.id;

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }
  const d = parsed.data;

  const actual = await db.categoriaFinanciera.findFirst({ where: { id, clientId } });
  if (!actual) return NextResponse.json({ error: "Categoría no encontrada" }, { status: 404 });

  try {
    const categoria = await db.$transaction(async (tx) => {
      const cat = await tx.categoriaFinanciera.update({
        where: { id },
        data: { nombre: d.nombre, activa: d.activa, orden: d.orden },
      });
      // Renombrar arrastra el historial: los movimientos con el nombre viejo pasan al nuevo.
      if (d.nombre && d.nombre !== actual.nombre) {
        await tx.cashMovement.updateMany({
          where: { clientId, categoria: actual.nombre, kind: kindDe(actual.tipo) },
          data: { categoria: d.nombre },
        });
      }
      return cat;
    });
    return NextResponse.json({ ok: true, categoria });
  } catch (err) {
    if (err && typeof err === "object" && "code" in err && err.code === "P2002") {
      return NextResponse.json(
        { error: "Ya existe una categoría con ese nombre" },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "No se pudo actualizar" }, { status: 500 });
  }
}

/** DELETE → si tiene movimientos se desactiva (historial intacto); si está limpia, se borra. */
export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ slug: string; id: string }> }
) {
  const { slug, id } = await ctx.params;
  const g = await guardOsOwnerApi(slug, "caja");
  if (g.error) return g.error;
  const clientId = g.tenant.id;

  const cat = await db.categoriaFinanciera.findFirst({ where: { id, clientId } });
  if (!cat) return NextResponse.json({ error: "Categoría no encontrada" }, { status: 404 });

  const enUso = await db.cashMovement.count({
    where: { clientId, categoria: cat.nombre, kind: kindDe(cat.tipo) },
  });
  if (enUso > 0) {
    await db.categoriaFinanciera.update({ where: { id }, data: { activa: false } });
    return NextResponse.json({ ok: true, desactivada: true, enUso });
  }
  await db.categoriaFinanciera.delete({ where: { id } });
  return NextResponse.json({ ok: true, eliminada: true });
}
