import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { rateLimit, clientIp } from "@/lib/ratelimit";
import { getTenantBySlug, hasModule, tenantBranding } from "@/lib/tenant";
import { mejorTiempo, type Intento } from "@/app/os/[slug]/eventos/tiempos";

/**
 * API PÚBLICA del evento activo: ranking en vivo (GET, para polling) e
 * inscripción (POST). No expone teléfonos ni datos sensibles.
 */

async function eventoActivo(slug: string) {
  const tenant = await getTenantBySlug(slug);
  if (!tenant || !hasModule(tenant, "eventos")) return null;
  const evento = await db.evento.findFirst({
    where: { clientId: tenant.id, activo: true },
    include: { competidores: true },
  });
  return evento ? { tenant, evento } : null;
}

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await eventoActivo(slug);
  if (!data) return NextResponse.json({ error: "No hay evento" }, { status: 404 });
  const { tenant, evento } = data;

  const ranking = evento.competidores
    .map((c) => ({
      numero: c.numero,
      nombre: c.nombre,
      categoria: c.categoria,
      mejorMs: mejorTiempo((c.intentos as Intento[]) ?? []),
      intentos: ((c.intentos as Intento[]) ?? []).length,
    }))
    .sort((a, b) => {
      if (a.mejorMs === null && b.mejorMs === null) return a.numero - b.numero;
      if (a.mejorMs === null) return 1;
      if (b.mejorMs === null) return -1;
      return a.mejorMs - b.mejorMs;
    });

  return NextResponse.json({
    negocio: tenantBranding(tenant).displayName,
    nombre: evento.nombre,
    fecha: evento.fecha,
    lugar: evento.lugar,
    categorias: evento.categorias,
    cupo: evento.cupo,
    inscriptos: evento.competidores.length,
    inscripcionesAbiertas: evento.inscripcionesAbiertas && evento.competidores.length < evento.cupo,
    numerosTomados: evento.competidores.map((c) => c.numero),
    ranking,
  });
}

const inscripcionSchema = z.object({
  numero: z.number().int().min(1).max(999),
  nombre: z.string().trim().min(1, "Decinos tu nombre").max(200),
  telefono: z.string().trim().min(6, "El teléfono no parece válido").max(50),
  categoria: z.string().trim().min(1).max(50),
});

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!rateLimit(`evento:${slug}:${clientIp(req)}`, 5, 60_000)) {
    return NextResponse.json({ error: "Demasiados intentos. Probá en un minuto." }, { status: 429 });
  }
  const data = await eventoActivo(slug);
  if (!data) return NextResponse.json({ error: "No hay evento" }, { status: 404 });
  const { tenant, evento } = data;

  if (!evento.inscripcionesAbiertas) {
    return NextResponse.json({ error: "Las inscripciones están cerradas" }, { status: 409 });
  }
  if (evento.competidores.length >= evento.cupo) {
    return NextResponse.json({ error: "Se llenó el cupo" }, { status: 409 });
  }

  const parsed = inscripcionSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }
  const d = parsed.data;

  if (!evento.categorias.includes(d.categoria)) {
    return NextResponse.json({ error: "Categoría inválida" }, { status: 400 });
  }
  if (evento.competidores.some((c) => c.numero === d.numero)) {
    return NextResponse.json({ error: `El número ${d.numero} ya está tomado. Elegí otro.` }, { status: 409 });
  }
  if (evento.competidores.some((c) => c.telefono === d.telefono)) {
    return NextResponse.json({ ok: true, yaEstabas: true });
  }

  await db.competidor.create({
    data: {
      eventoId: evento.id,
      numero: d.numero,
      nombre: d.nombre,
      telefono: d.telefono,
      categoria: d.categoria,
      fuente: "publica",
    },
  });

  // Regla de la casa: todo dato que entra queda en el CRM del negocio.
  const ya = await db.contact.findFirst({ where: { clientId: tenant.id, phone: d.telefono } });
  if (!ya) {
    await db.contact.create({
      data: {
        clientId: tenant.id,
        name: d.nombre,
        phone: d.telefono,
        source: "evento",
        stage: "nuevo",
        lastTouchAt: new Date(),
      },
    });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
