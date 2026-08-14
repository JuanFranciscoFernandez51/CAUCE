import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { guardOsApi } from "../_guard";

const schema = z.object({
  titulo: z.string().trim().min(1).max(300),
  prioridad: z.enum(["alta", "media", "baja"]).default("media"),
  categoria: z.string().trim().max(60).optional().default(""),
  vence: z.string().nullable().optional(),
  estado: z.enum(["por_hacer", "en_progreso", "hecho"]).default("por_hacer"),
});

export async function POST(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const g = await guardOsApi(slug);
  if (g.error) return g.error;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Revisá los datos" }, { status: 400 });
  const d = parsed.data;
  const tope = await db.tarea.findFirst({ where: { clientId: g.tenant!.id, estado: d.estado }, orderBy: { orden: "desc" }, select: { orden: true } });
  const t = await db.tarea.create({
    data: {
      clientId: g.tenant!.id,
      titulo: d.titulo,
      prioridad: d.prioridad,
      categoria: d.categoria || null,
      vence: d.vence ? new Date(d.vence) : null,
      estado: d.estado,
      orden: (tope?.orden ?? 0) + 1,
    },
    select: { id: true },
  });
  return NextResponse.json(t, { status: 201 });
}
