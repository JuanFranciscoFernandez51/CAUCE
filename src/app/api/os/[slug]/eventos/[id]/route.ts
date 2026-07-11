import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { guardOsApi } from "../../_guard";

const patchSchema = z.object({
  inscripcionesAbiertas: z.boolean().optional(),
  activo: z.boolean().optional(),
  nombre: z.string().trim().min(1).max(200).optional(),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  lugar: z.string().trim().max(200).nullable().optional(),
  cupo: z.number().int().min(1).max(1000).optional(),
});

/** Edita el evento (abrir/cerrar inscripciones, activarlo para el público). */
export async function PATCH(req: Request, ctx: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await ctx.params;
  const g = await guardOsApi(slug, "eventos");
  if (g.error) return g.error;

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  const d = parsed.data;

  const evento = await db.evento.findFirst({ where: { id, clientId: g.tenant.id } });
  if (!evento) return NextResponse.json({ error: "No existe" }, { status: 404 });

  if (d.activo === true) {
    await db.evento.updateMany({ where: { clientId: g.tenant.id }, data: { activo: false } });
  }
  await db.evento.update({
    where: { id: evento.id },
    data: {
      ...(d.inscripcionesAbiertas !== undefined ? { inscripcionesAbiertas: d.inscripcionesAbiertas } : {}),
      ...(d.activo !== undefined ? { activo: d.activo } : {}),
      ...(d.nombre !== undefined ? { nombre: d.nombre } : {}),
      ...(d.fecha !== undefined ? { fecha: d.fecha } : {}),
      ...(d.lugar !== undefined ? { lugar: d.lugar || null } : {}),
      ...(d.cupo !== undefined ? { cupo: d.cupo } : {}),
    },
  });
  return NextResponse.json({ ok: true });
}
