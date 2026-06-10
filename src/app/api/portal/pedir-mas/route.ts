import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireClient } from "@/lib/auth";

const pedidoSchema = z.object({
  pedido: z.string().trim().min(5, "Contanos un poco más qué necesitás").max(4000),
  interes: z.enum(["otro_bot", "integracion", "cauce_os", "upgrade_pro", "asesorame"]),
});

export async function POST(req: Request) {
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

  const parsed = pedidoSchema.safeParse(body);
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

  await db.lead.create({
    data: {
      source: "MANUAL",
      status: "NEW",
      clientId,
      name: client.contactName || client.name,
      business: client.name,
      rubro: client.rubro,
      email: client.email,
      whatsapp: client.whatsapp,
      intake: { pedido: data.pedido, interes: data.interes, origen: "portal" },
    },
  });

  return NextResponse.json({ ok: true });
}
