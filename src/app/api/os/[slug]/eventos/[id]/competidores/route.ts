import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { guardOsApi } from "../../../_guard";

const createSchema = z.object({
  numero: z.number().int().min(1).max(999),
  nombre: z.string().trim().min(1).max(200),
  telefono: z.string().trim().max(50).optional().default(""),
  categoria: z.string().trim().min(1).max(50),
});

const intentoSchema = z.object({
  competidorId: z.string().min(1),
  intentos: z.array(
    z.object({
      ms: z.number().int().min(0).max(60 * 60 * 1000),
      penalSeg: z.number().int().min(0).max(600),
      dsq: z.boolean(),
    })
  ),
});

/** Alta manual de competidor (desde el panel). */
export async function POST(req: Request, ctx: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await ctx.params;
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

  const evento = await db.evento.findFirst({ where: { id, clientId: g.tenant.id } });
  if (!evento) return NextResponse.json({ error: "No existe el evento" }, { status: 404 });

  const ocupado = await db.competidor.findFirst({ where: { eventoId: evento.id, numero: d.numero } });
  if (ocupado) return NextResponse.json({ error: `El número ${d.numero} ya está tomado` }, { status: 409 });

  const comp = await db.competidor.create({
    data: {
      eventoId: evento.id,
      numero: d.numero,
      nombre: d.nombre,
      telefono: d.telefono || null,
      categoria: d.categoria,
      fuente: "admin",
    },
  });
  return NextResponse.json({ ok: true, id: comp.id }, { status: 201 });
}

/** Guarda los intentos de un competidor (el cronómetro pega acá). */
export async function PATCH(req: Request, ctx: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await ctx.params;
  const g = await guardOsApi(slug, "eventos");
  if (g.error) return g.error;

  const parsed = intentoSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

  const comp = await db.competidor.findFirst({
    where: { id: parsed.data.competidorId, evento: { id, clientId: g.tenant.id } },
  });
  if (!comp) return NextResponse.json({ error: "No existe el competidor" }, { status: 404 });

  await db.competidor.update({
    where: { id: comp.id },
    data: { intentos: parsed.data.intentos },
  });
  return NextResponse.json({ ok: true });
}
