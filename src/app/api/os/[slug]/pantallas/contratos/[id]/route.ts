import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { guardOsApi } from "../../../_guard";

const patchSchema = z.object({
  slots: z.number().int().min(1).max(30).optional(),
  montoMensual: z.number().min(0).optional(),
  estado: z.enum(["activo", "pausado", "baja"]).optional(),
  notas: z.string().trim().max(500).nullable().optional(),
});

export async function PATCH(req: Request, ctx: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await ctx.params;
  const g = await guardOsApi(slug, "pantallas");
  if (g.error) return g.error;

  const contrato = await db.pantallaContrato.findFirst({
    where: { id, clientId: g.tenant.id },
    include: { pantalla: true },
  });
  if (!contrato) return NextResponse.json({ error: "Contrato no encontrado" }, { status: 404 });

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }
  const data = parsed.data;

  // Si suma slots o reactiva, validar capacidad de la pantalla.
  const nuevoSlots = data.slots ?? contrato.slots;
  const nuevoEstado = data.estado ?? contrato.estado;
  if (nuevoEstado === "activo") {
    const otros = await db.pantallaContrato.aggregate({
      where: { pantallaId: contrato.pantallaId, estado: "activo", id: { not: id } },
      _sum: { slots: true },
    });
    const libres = contrato.pantalla.slotsTotal - (otros._sum.slots ?? 0);
    if (nuevoSlots > libres) {
      return NextResponse.json(
        { error: `Solo quedan ${libres} spots libres en ${contrato.pantalla.nombre}` },
        { status: 409 }
      );
    }
  }

  const updated = await db.pantallaContrato.update({
    where: { id },
    data: {
      ...data,
      ...(data.estado === "baja" ? { fin: new Date() } : {}),
    },
    include: { contact: { select: { id: true, name: true, phone: true } } },
  });
  return NextResponse.json({ contrato: updated });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await ctx.params;
  const g = await guardOsApi(slug, "pantallas");
  if (g.error) return g.error;
  const contrato = await db.pantallaContrato.findFirst({ where: { id, clientId: g.tenant.id } });
  if (!contrato) return NextResponse.json({ error: "Contrato no encontrado" }, { status: 404 });
  await db.pantallaContrato.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
