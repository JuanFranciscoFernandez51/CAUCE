import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { guardOsApi } from "../_guard";

const hitoSchema = z.object({ titulo: z.string().trim().min(1).max(200), fecha: z.string(), hecho: z.boolean().default(false) });
const schema = z.object({
  nombre: z.string().trim().min(1).max(200),
  tipo: z.string().trim().max(40).default("otros"),
  fecha: z.string().nullable().optional(),
  lugar: z.string().trim().max(200).optional().default(""),
  estado: z.enum(["cotizado", "confirmado", "produccion", "cerrado"]).default("cotizado"),
  presupuesto: z.number().min(0).default(0),
  cobrado: z.number().min(0).default(0),
  contacto: z.string().trim().max(200).optional().default(""),
  telefono: z.string().trim().max(50).optional().default(""),
  hitos: z.array(hitoSchema).default([]),
  notas: z.string().trim().max(4000).optional().default(""),
});

export async function POST(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const g = await guardOsApi(slug);
  if (g.error) return g.error;
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Revisá los datos" }, { status: 400 });
  const d = parsed.data;
  const e = await db.eventoOrg.create({
    data: {
      clientId: g.tenant!.id,
      nombre: d.nombre,
      tipo: d.tipo,
      fecha: d.fecha ? new Date(d.fecha) : null,
      lugar: d.lugar || null,
      estado: d.estado,
      presupuesto: d.presupuesto,
      cobrado: d.cobrado,
      contacto: d.contacto || null,
      telefono: d.telefono || null,
      hitos: d.hitos,
      notas: d.notas || null,
    },
    select: { id: true },
  });
  return NextResponse.json(e, { status: 201 });
}
