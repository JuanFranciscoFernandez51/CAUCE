import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { rateLimit, clientIp } from "@/lib/ratelimit";
import { runDiagnostico } from "@/lib/diagnostico";

const intakeSchema = z.object({
  business: z.string().trim().min(1, "Falta el nombre del negocio").max(200),
  rubro: z.string().trim().min(1, "Falta el rubro").max(200),
  size: z.enum(["solo", "2-5", "6-20", "20+"]),
  dolores: z
    .array(
      z.enum([
        "ATENCION",
        "VENTAS_CRM",
        "MARKETING",
        "OPERACIONES",
        "TURNOS",
        "RRHH",
        "FINANZAS",
        "otro",
      ])
    )
    .min(1, "Elegí al menos un dolor"),
  dolorOtro: z.string().trim().max(2000).optional().default(""),
  frecuencia: z.enum(["pocas", "varias", "todo_el_dia"]),
  apps: z
    .array(
      z.enum([
        "WhatsApp",
        "Instagram",
        "Sheets/Excel",
        "Mercado Pago",
        "Google Calendar",
        "Sistema propio",
        "Ninguna",
      ])
    )
    .default([]),
  urgencia: z.enum(["ya_mismo", "este_mes", "explorando"]),
  presupuesto: z.enum(["hasta_50", "50_300", "300_1000", "mas_1000", "no_se"]),
  name: z.string().trim().min(1, "Falta tu nombre").max(200),
  email: z
    .union([z.literal(""), z.email("Email inválido")])
    .optional()
    .default(""),
  whatsapp: z.string().trim().min(6, "WhatsApp inválido").max(50),
});

export async function POST(req: Request) {
  if (!rateLimit(`intake:${clientIp(req)}`, 5, 60_000)) {
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

  const parsed = intakeSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json(
      { error: first?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }
  const data = parsed.data;

  const lead = await db.lead.create({
    data: {
      source: "INTAKE",
      name: data.name,
      business: data.business,
      rubro: data.rubro,
      email: data.email || null,
      whatsapp: data.whatsapp,
      intake: {
        size: data.size,
        dolores: data.dolores,
        dolorOtro: data.dolorOtro || null,
        frecuencia: data.frecuencia,
        apps: data.apps,
        urgencia: data.urgencia,
        presupuesto: data.presupuesto,
      },
    },
  });

  // El diagnóstico con IA puede tardar o fallar — el lead ya está creado, nunca rompemos acá.
  try {
    await runDiagnostico(lead.id);
  } catch (e) {
    console.error(`intake: runDiagnostico falló para lead ${lead.id}`, e);
  }

  return NextResponse.json({ ok: true });
}
