import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { guardOsOwnerApi } from "../../_guard";

const putSchema = z.object({
  unidadesEstimadasMes: z.number().finite().min(0).max(1_000_000),
  margenPorUnidad: z.number().finite().min(0).max(1_000_000_000),
});

/** PUT → guarda los parámetros del punto de equilibrio (Costos fijos). */
export async function PUT(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const g = await guardOsOwnerApi(slug, "caja");
  if (g.error) return g.error;

  const parsed = putSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  const settings = (g.tenant.settings as Record<string, unknown> | null) ?? {};
  await db.client.update({
    where: { id: g.tenant.id },
    data: { settings: { ...settings, finanzas: parsed.data } },
  });
  return NextResponse.json({ ok: true, finanzas: parsed.data });
}
