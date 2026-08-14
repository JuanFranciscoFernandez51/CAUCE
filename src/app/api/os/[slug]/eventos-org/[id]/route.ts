import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { guardOsApi } from "../../_guard";

const hito = z.object({ titulo: z.string().trim().min(1).max(200), fecha: z.string(), hecho: z.boolean() });
const patchSchema = z.object({
  nombre: z.string().trim().min(1).max(200).optional(),
  tipo: z.string().trim().max(40).optional(),
  fecha: z.string().nullable().optional(),
  lugar: z.string().trim().max(200).nullable().optional(),
  estado: z.enum(["cotizado", "confirmado", "produccion", "cerrado"]).optional(),
  presupuesto: z.number().min(0).optional(),
  cobrado: z.number().min(0).optional(),
  contacto: z.string().trim().max(200).nullable().optional(),
  telefono: z.string().trim().max(50).nullable().optional(),
  hitos: z.array(hito).optional(),
  mobiliario: z.array(z.object({ id: z.string(), nombre: z.string().max(300), cant: z.number().min(1), precio: z.number().min(0) })).optional(),
  notas: z.string().trim().max(4000).nullable().optional(),
});

export async function PATCH(req: Request, ctx: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await ctx.params;
  const g = await guardOsApi(slug);
  if (g.error) return g.error;
  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Revisá los datos" }, { status: 400 });
  const d = parsed.data;
  const existe = await db.eventoOrg.findFirst({ where: { id, clientId: g.tenant!.id }, select: { id: true } });
  if (!existe) return NextResponse.json({ error: "No existe" }, { status: 404 });
  await db.eventoOrg.update({
    where: { id },
    data: {
      ...(d.nombre !== undefined ? { nombre: d.nombre } : {}),
      ...(d.tipo !== undefined ? { tipo: d.tipo } : {}),
      ...(d.fecha !== undefined ? { fecha: d.fecha ? new Date(d.fecha) : null } : {}),
      ...(d.lugar !== undefined ? { lugar: d.lugar } : {}),
      ...(d.estado !== undefined ? { estado: d.estado } : {}),
      ...(d.presupuesto !== undefined ? { presupuesto: d.presupuesto } : {}),
      ...(d.cobrado !== undefined ? { cobrado: d.cobrado } : {}),
      ...(d.contacto !== undefined ? { contacto: d.contacto } : {}),
      ...(d.telefono !== undefined ? { telefono: d.telefono } : {}),
      ...(d.hitos !== undefined ? { hitos: d.hitos } : {}),
      ...(d.mobiliario !== undefined ? { mobiliario: d.mobiliario } : {}),
      ...(d.notas !== undefined ? { notas: d.notas } : {}),
    },
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await ctx.params;
  const g = await guardOsApi(slug);
  if (g.error) return g.error;
  await db.eventoOrg.deleteMany({ where: { id, clientId: g.tenant!.id } });
  return NextResponse.json({ ok: true });
}
