import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { rateLimit, clientIp } from "@/lib/ratelimit";
import { getTenantBySlug, hasModule } from "@/lib/tenant";
import { esConcesionaria } from "@/lib/conce-server";
import { nombreVehiculo } from "@/lib/conce";

/**
 * API PÚBLICA concesionaria: consulta (general o por vehículo).
 * Crea la ConceConsulta para la bandeja del admin Y el lead en el CRM del
 * tenant (regla Cauce: todo cliente entra al CRM), con dedup por contacto.
 */
const schema = z.object({
  nombre: z.string().trim().min(1, "Decinos tu nombre").max(200),
  contacto: z.string().trim().min(6, "Dejanos un teléfono o email válido").max(120),
  mensaje: z.string().trim().min(1, "Contanos qué querés consultar").max(2000),
  vehiculoId: z.string().trim().max(60).optional(),
  origen: z.enum(["web", "chatbot"]).optional().default("web"),
});

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  if (!rateLimit(`rc-consulta:${slug}:${clientIp(req)}`, 8, 60_000)) {
    return NextResponse.json(
      { error: "Demasiados intentos. Esperá un minuto y probá de nuevo." },
      { status: 429 }
    );
  }

  const tenant = await getTenantBySlug(slug);
  if (!tenant || !hasModule(tenant, "sitio") || !esConcesionaria(tenant)) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }
  const d = parsed.data;

  // Vehículo (scopeado) para enriquecer la consulta y la nota del lead.
  let vehiculoNombre = "";
  let vehiculoIdOk: string | null = null;
  if (d.vehiculoId) {
    const v = await db.conceVehiculo.findFirst({
      where: { id: d.vehiculoId, clientId: tenant.id },
      select: { id: true, marca: true, modelo: true, version: true, anio: true },
    });
    if (v) {
      vehiculoNombre = `${nombreVehiculo(v)} ${v.anio}`;
      vehiculoIdOk = v.id;
    }
  }

  await db.conceConsulta.create({
    data: {
      clientId: tenant.id,
      nombre: d.nombre,
      contacto: d.contacto,
      mensaje: d.mensaje,
      vehiculoId: vehiculoIdOk,
      origen: d.origen,
    },
  });

  // Lead en el CRM (dedup por teléfono/email).
  const esEmail = d.contacto.includes("@");
  const now = new Date();
  const note = [
    vehiculoNombre
      ? `Consulta por: ${vehiculoNombre}`
      : d.origen === "chatbot"
        ? "Consulta del chatbot de la web"
        : "Consulta desde la web",
    `\n${d.mensaje}`,
  ].join("");
  const existente = await db.contact.findFirst({
    where: {
      clientId: tenant.id,
      ...(esEmail ? { email: d.contacto } : { phone: d.contacto }),
    },
  });
  if (existente) {
    const prev = existente.notes?.trim();
    await db.contact.update({
      where: { id: existente.id },
      data: {
        lastTouchAt: now,
        notes: prev ? `${prev}\n\n[${now.toLocaleDateString("es-AR")}] ${note}` : note,
      },
    });
  } else {
    await db.contact.create({
      data: {
        clientId: tenant.id,
        name: d.nombre,
        phone: esEmail ? null : d.contacto,
        email: esEmail ? d.contacto : null,
        source: d.origen === "chatbot" ? "chatbot web" : "web concesionaria",
        stage: "nuevo",
        temperatura: vehiculoNombre ? "caliente" : "tibio",
        notes: note,
        lastTouchAt: now,
      },
    });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
