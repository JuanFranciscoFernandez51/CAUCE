import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { guardBazarApi } from "../../_guard";

/** Marca una consulta como respondida (o la reabre). */
const schema = z.object({ estado: z.enum(["NUEVA", "RESPONDIDA"]) });

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  const { slug, id } = await params;
  const g = await guardBazarApi(slug);
  if (g.error) return g.error;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const actualizada = await db.bazarConsulta.updateMany({
    where: { id, clientId: g.tenant.id },
    data: { estado: parsed.data.estado },
  });
  if (actualizada.count === 0) return NextResponse.json({ error: "No existe" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
