import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { rateLimit, clientIp } from "@/lib/ratelimit";
import { getPricing } from "@/lib/pricing";

const registroSchema = z.object({
  business: z.string().trim().min(2, "Falta el nombre del negocio").max(200),
  rubro: z.string().trim().min(2, "Falta el rubro").max(200),
  name: z.string().trim().min(2, "Falta tu nombre").max(200),
  whatsapp: z.string().trim().min(6, "WhatsApp inválido").max(50),
  email: z
    .union([z.literal(""), z.email("Email inválido")])
    .optional()
    .default(""),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "El usuario necesita al menos 3 caracteres")
    .max(40, "Usuario demasiado largo")
    .regex(/^[a-z0-9._-]+$/, "El usuario solo puede tener letras, números, puntos y guiones"),
  password: z.string().min(8, "La contraseña necesita al menos 8 caracteres").max(200),
});

function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50) || "negocio";
}

export async function POST(req: Request) {
  if (!rateLimit(`registro:${clientIp(req)}`, 5, 60_000)) {
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

  const parsed = registroSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json(
      { error: first?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }
  const data = parsed.data;

  // Username único — error claro antes de crear nada
  const existing = await db.user.findUnique({ where: { username: data.username } });
  if (existing) {
    return NextResponse.json(
      { error: "Ese usuario ya existe. Probá con otro." },
      { status: 409 }
    );
  }

  // Slug único: base + sufijo incremental si hace falta
  const base = slugify(data.business);
  let slug = base;
  for (let i = 2; await db.client.findUnique({ where: { slug } }); i++) {
    slug = `${base}-${i}`;
  }

  const pricing = await getPricing();
  const monthlyUsd = pricing.packs.starter?.monthlyUsd ?? 45;
  const passwordHash = await bcrypt.hash(data.password, 10);

  try {
    await db.$transaction(async (tx) => {
      const client = await tx.client.create({
        data: {
          name: data.business,
          slug,
          rubro: data.rubro,
          pack: "STARTER",
          status: "ONBOARDING",
          mrr: monthlyUsd,
          contactName: data.name,
          email: data.email || null,
          whatsapp: data.whatsapp,
        },
      });
      await tx.user.create({
        data: {
          username: data.username,
          name: data.name,
          role: "CLIENT",
          clientId: client.id,
          passwordHash,
        },
      });
      await tx.lead.create({
        data: {
          source: "INTAKE",
          status: "CONVERTED",
          clientId: client.id,
          name: data.name,
          business: data.business,
          rubro: data.rubro,
          email: data.email || null,
          whatsapp: data.whatsapp,
        },
      });
      await tx.subscription.create({
        data: {
          clientId: client.id,
          pack: "STARTER",
          monthlyUsd,
          status: "ACTIVE",
        },
      });
    });
  } catch (e) {
    // Carrera improbable de username/slug duplicado u otro error de DB
    console.error("registro: falló la creación", e);
    return NextResponse.json(
      { error: "No pudimos crear tu cuenta. Probá de nuevo en un momento." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
