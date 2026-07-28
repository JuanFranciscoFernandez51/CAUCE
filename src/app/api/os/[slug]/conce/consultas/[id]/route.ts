import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { guardConceApi } from "../../_guard";

/** Marcar consulta como respondida / nueva. */

const patchSchema = z.object({ estado: z.enum(["NUEVA", "RESPONDIDA"]) });

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  const { slug, id } = await params;
  const g = await guardConceApi(slug);
  if (g.error) return g.error;

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const existe = await db.conceConsulta.findFirst({
    where: { id, clientId: g.tenant.id },
    select: { id: true },
  });
  if (!existe) return NextResponse.json({ error: "No existe" }, { status: 404 });

  const consulta = await db.conceConsulta.update({
    where: { id },
    data: { estado: parsed.data.estado },
  });
  return NextResponse.json({ ok: true, consulta });
}
