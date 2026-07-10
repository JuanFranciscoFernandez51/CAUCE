import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { guardOsApi } from "../../_guard";

const schema = z.object({ estado: z.enum(["ENVIADA", "DESCARTADA", "PROGRAMADA"]) });

/** Marca una tarea de outreach (enviada/descartada). Cualquier miembro del tenant. */
export async function PATCH(req: Request, ctx: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await ctx.params;
  const g = await guardOsApi(slug);
  if (g.error) return g.error;

  let body: z.infer<typeof schema>;
  try {
    body = schema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const tarea = await db.outreachTarea.findFirst({ where: { id, clientId: g.tenant.id } });
  if (!tarea) return NextResponse.json({ error: "No existe" }, { status: 404 });

  const updated = await db.outreachTarea.update({
    where: { id: tarea.id },
    data: {
      estado: body.estado,
      enviadaAt: body.estado === "ENVIADA" ? new Date() : null,
    },
  });

  // Mandar un mensaje cuenta como toque al contacto (para el seguimiento).
  if (body.estado === "ENVIADA" && tarea.contactId) {
    await db.contact
      .update({ where: { id: tarea.contactId }, data: { lastTouchAt: new Date() } })
      .catch(() => undefined);
  }

  return NextResponse.json({ ok: true, estado: updated.estado });
}
