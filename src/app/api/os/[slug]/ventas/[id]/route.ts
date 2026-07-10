import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { guardOsApi } from "../../_guard";
import { Prisma } from "@prisma/client";

const pagoSchema = z.object({
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  montoArs: z.number().min(0).max(10_000_000_000),
  medio: z.string().trim().max(50),
});

const patchSchema = z.object({
  estado: z.enum(["SENADA", "ENTREGADA", "CANCELADA"]).optional(),
  pagos: z.array(pagoSchema).optional(),
  cuotas: z
    .object({
      cantidad: z.number().int().min(1).max(120),
      valorArs: z.number().min(0).max(10_000_000_000),
      diaVencimiento: z.number().int().min(1).max(28),
    })
    .nullable()
    .optional(),
  notas: z.string().max(5000).nullable().optional(),
});

/** Edita una venta: pagos, cuotas, entrega. */
export async function PATCH(req: Request, ctx: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await ctx.params;
  const g = await guardOsApi(slug, "ventas");
  if (g.error) return g.error;

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }
  const d = parsed.data;

  const venta = await db.venta.findFirst({ where: { id, clientId: g.tenant.id } });
  if (!venta) return NextResponse.json({ error: "No existe" }, { status: 404 });

  await db.venta.update({
    where: { id: venta.id },
    data: {
      ...(d.estado !== undefined ? { estado: d.estado } : {}),
      ...(d.estado === "ENTREGADA" ? { entregadaAt: new Date() } : {}),
      ...(d.pagos !== undefined ? { pagos: d.pagos } : {}),
      ...(d.cuotas !== undefined ? { cuotas: d.cuotas === null ? Prisma.DbNull : d.cuotas } : {}),
      ...(d.notas !== undefined ? { notas: d.notas || null } : {}),
    },
  });

  // La entrega concreta la venta: el contacto pasa a "cliente" en el CRM.
  if (d.estado === "ENTREGADA" && venta.contactId) {
    await db.contact
      .update({ where: { id: venta.contactId }, data: { stage: "cliente", lastTouchAt: new Date() } })
      .catch(() => undefined);
  }

  return NextResponse.json({ ok: true });
}
