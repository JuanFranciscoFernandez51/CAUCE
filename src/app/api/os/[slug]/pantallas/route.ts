import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { guardOsApi } from "../_guard";

const createSchema = z.object({
  nombre: z.string().trim().min(1).max(120),
  zona: z.string().trim().max(80).optional(),
  medidas: z.string().trim().max(40).optional(),
  resolucion: z.string().trim().max(40).optional(),
  slotsTotal: z.number().int().min(1).max(200).default(30),
});

export async function POST(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const g = await guardOsApi(slug, "pantallas");
  if (g.error) return g.error;

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }
  const max = await db.pantalla.aggregate({
    where: { clientId: g.tenant.id },
    _max: { orden: true },
  });
  const pantalla = await db.pantalla.create({
    data: {
      clientId: g.tenant.id,
      nombre: parsed.data.nombre,
      zona: parsed.data.zona || null,
      medidas: parsed.data.medidas || null,
      resolucion: parsed.data.resolucion || null,
      slotsTotal: parsed.data.slotsTotal,
      orden: (max._max.orden ?? 0) + 1,
    },
  });
  return NextResponse.json({ pantalla }, { status: 201 });
}
