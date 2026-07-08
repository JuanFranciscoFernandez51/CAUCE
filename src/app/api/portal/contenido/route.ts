import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireClient } from "@/lib/auth";

const contenidoSchema = z.object({
  faqs: z
    .array(
      z.object({
        q: z.string().trim().min(1).max(500),
        a: z.string().trim().min(1).max(2000),
      })
    )
    .min(1, "Cargá al menos una pregunta con su respuesta")
    .max(100),
  horarios: z.string().trim().max(500).default(""),
  datosNegocio: z.string().trim().max(4000).default(""),
  tono: z.enum(["amable e informal", "profesional", "divertido"]),
});

export async function PUT(req: Request) {
  let clientId: string;
  try {
    ({ clientId } = await requireClient());
  } catch {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
  }

  const parsed = contenidoSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json(
      { error: first?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }
  const data = parsed.data;

  const client = await db.client.findUnique({ where: { id: clientId } });
  if (!client) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // Merge sobre settings existentes — no pisamos otras claves
  const prev = (client.settings ?? {}) as Record<string, unknown>;
  const settings = {
    ...prev,
    faqs: data.faqs,
    horarios: data.horarios,
    datosNegocio: data.datosNegocio,
    tono: data.tono,
  };

  await db.client.update({ where: { id: clientId }, data: { settings } });

  return NextResponse.json({ ok: true });
}
