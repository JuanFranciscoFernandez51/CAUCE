import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { guardOsApi } from "../../_guard";

const patch = z.object({
  estado: z.enum(["BORRADOR", "ENVIADO", "ACEPTADO", "RECHAZADO"]).optional(),
});

export async function PATCH(req: Request, ctx: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await ctx.params;
  const g = await guardOsApi(slug);
  if (g.error) return g.error;
  const parsed = patch.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Revisá los datos" }, { status: 400 });
  const existe = await db.presupuestoDoc.findFirst({ where: { id, clientId: g.tenant!.id }, select: { id: true } });
  if (!existe) return NextResponse.json({ error: "No existe" }, { status: 404 });
  await db.presupuestoDoc.update({ where: { id }, data: parsed.data });
  return NextResponse.json({ ok: true });
}
