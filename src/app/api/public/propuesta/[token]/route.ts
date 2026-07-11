import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { rateLimit, clientIp } from "@/lib/ratelimit";

const schema = z.object({ accion: z.enum(["aceptar", "rechazar"]) });

/** El cliente responde la propuesta desde el link público. */
export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!rateLimit(`propuesta:${token}:${clientIp(req)}`, 5, 60_000)) {
    return NextResponse.json({ error: "Demasiados intentos" }, { status: 429 });
  }
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

  const p = await db.propuesta.findUnique({ where: { token } });
  if (!p) return NextResponse.json({ error: "No existe" }, { status: 404 });
  if (p.estado === "ACEPTADA") return NextResponse.json({ ok: true, estado: "ACEPTADA" });

  const estado = parsed.data.accion === "aceptar" ? "ACEPTADA" : "RECHAZADA";
  await db.propuesta.update({
    where: { id: p.id },
    data: { estado, respondidaAt: new Date() },
  });

  // Aceptó → entra al pipeline de Cauce como lead caliente.
  if (estado === "ACEPTADA") {
    await db.lead
      .create({
        data: {
          source: "MANUAL",
          status: "QUALIFIED",
          name: p.contactoNombre || p.negocio,
          business: p.negocio,
          rubro: p.rubro,
          whatsapp: p.whatsapp,
          score: 95,
          intake: { origen: "propuesta-aceptada", propuestaId: p.id, pack: p.pack, setupUsd: p.setupUsd, monthlyUsd: p.monthlyUsd },
        },
      })
      .catch(() => undefined);
  }

  return NextResponse.json({ ok: true, estado });
}
