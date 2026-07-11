import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { guardOsApi } from "../_guard";

const createSchema = z.object({
  nombre: z.string().trim().min(1, "Poné un nombre al evento").max(200),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida"),
  lugar: z.string().trim().max(200).optional().default(""),
  categorias: z.array(z.string().trim().min(1).max(50)).max(10).optional().default([]),
  cupo: z.number().int().min(1).max(1000).optional().default(100),
});

/** Alta de evento. Al crearlo pasa a ser el activo (el que ve el público). */
export async function POST(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const g = await guardOsApi(slug, "eventos");
  if (g.error) return g.error;

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }
  const d = parsed.data;

  // Un solo evento activo por vez: el nuevo desactiva al resto.
  await db.evento.updateMany({ where: { clientId: g.tenant.id }, data: { activo: false } });
  const evento = await db.evento.create({
    data: {
      clientId: g.tenant.id,
      nombre: d.nombre,
      fecha: d.fecha,
      lugar: d.lugar || null,
      categorias: d.categorias.length ? d.categorias : ["General"],
      cupo: d.cupo,
      activo: true,
    },
  });
  return NextResponse.json({ ok: true, id: evento.id }, { status: 201 });
}
