import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { guardOsApi } from "../../_guard";

const patch = z.object({
  titulo: z.string().trim().min(1).max(300).optional(),
  detalle: z.string().trim().max(4000).nullable().optional(),
  prioridad: z.enum(["alta", "media", "baja"]).optional(),
  categoria: z.string().trim().max(60).nullable().optional(),
  vence: z.string().nullable().optional(),
  estado: z.enum(["por_hacer", "en_progreso", "hecho"]).optional(),
});

export async function PATCH(req: Request, ctx: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await ctx.params;
  const g = await guardOsApi(slug);
  if (g.error) return g.error;
  const parsed = patch.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Revisá los datos" }, { status: 400 });
  const d = parsed.data;
  const existe = await db.tarea.findFirst({ where: { id, clientId: g.tenant!.id }, select: { id: true, estado: true } });
  if (!existe) return NextResponse.json({ error: "No existe" }, { status: 404 });
  await db.tarea.update({
    where: { id },
    data: {
      ...(d.titulo !== undefined ? { titulo: d.titulo } : {}),
      ...(d.detalle !== undefined ? { detalle: d.detalle } : {}),
      ...(d.prioridad !== undefined ? { prioridad: d.prioridad } : {}),
      ...(d.categoria !== undefined ? { categoria: d.categoria } : {}),
      ...(d.vence !== undefined ? { vence: d.vence ? new Date(d.vence) : null } : {}),
      ...(d.estado !== undefined
        ? { estado: d.estado, hechaAt: d.estado === "hecho" ? new Date() : null }
        : {}),
    },
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await ctx.params;
  const g = await guardOsApi(slug);
  if (g.error) return g.error;
  await db.tarea.deleteMany({ where: { id, clientId: g.tenant!.id } });
  return NextResponse.json({ ok: true });
}
