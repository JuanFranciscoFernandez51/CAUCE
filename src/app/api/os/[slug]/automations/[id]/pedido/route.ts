import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { guardOsApi } from "../../../_guard";

const schema = z.object({ pedido: z.string().trim().min(5).max(2000) });

/**
 * El cliente pide un cambio en una automatización desde su software.
 * Cae como Lead MANUAL/NEW para que Fran lo vea en /admin/leads.
 */
export async function POST(req: Request, ctx: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await ctx.params;
  const g = await guardOsApi(slug);
  if (g.error) return g.error;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Contanos un poco más qué querés cambiar." }, { status: 400 });
  }

  const auto = await db.automation.findFirst({
    where: { id, clientId: g.tenant.id },
    include: { recipe: true },
  });
  if (!auto) return NextResponse.json({ error: "Automatización no encontrada" }, { status: 404 });

  await db.lead.create({
    data: {
      source: "MANUAL",
      status: "NEW",
      name: g.tenant.contactName || g.tenant.name,
      business: g.tenant.name,
      rubro: g.tenant.rubro,
      email: g.tenant.email,
      whatsapp: g.tenant.whatsapp,
      clientId: g.tenant.id,
      intake: {
        tipo: "cambio_automatizacion",
        automationId: auto.id,
        automacion: auto.name,
        receta: auto.recipe?.name ?? null,
        pedido: parsed.data.pedido,
      },
    },
  });

  return NextResponse.json({ ok: true });
}
