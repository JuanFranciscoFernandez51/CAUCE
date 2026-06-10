import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { rateLimit, clientIp } from "@/lib/ratelimit";

const consultoriaSchema = z.object({
  name: z.string().trim().min(1, "Falta tu nombre").max(200),
  business: z.string().trim().max(200).optional().default(""),
  rubro: z.string().trim().max(200).optional().default(""),
  email: z
    .union([z.literal(""), z.email("Email inválido")])
    .optional()
    .default(""),
  whatsapp: z.string().trim().min(6, "WhatsApp inválido").max(50),
  mensaje: z.string().trim().max(3000).optional().default(""),
  preferencia: z.enum(["manana", "tarde", "indistinto"]),
});

const PREFERENCIA_LABEL: Record<string, string> = {
  manana: "mañana",
  tarde: "tarde",
  indistinto: "indistinto",
};

export async function POST(req: Request) {
  if (!rateLimit(`consultoria:${clientIp(req)}`, 5, 60_000)) {
    return NextResponse.json(
      { error: "Demasiados intentos. Esperá un minuto y probá de nuevo." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
  }

  const parsed = consultoriaSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json(
      { error: first?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }
  const data = parsed.data;

  const callNotes = [
    "Pedido desde la web:",
    data.mensaje ? `"${data.mensaje}"` : "(sin mensaje)",
    `Preferencia horaria: ${PREFERENCIA_LABEL[data.preferencia]}.`,
  ].join(" ");

  await db.lead.create({
    data: {
      source: "CONSULTORIA",
      name: data.name,
      business: data.business || null,
      rubro: data.rubro || null,
      email: data.email || null,
      whatsapp: data.whatsapp,
      consultNotes: {
        create: {
          status: "SCHEDULED",
          callNotes,
        },
      },
    },
  });

  return NextResponse.json({ ok: true });
}
