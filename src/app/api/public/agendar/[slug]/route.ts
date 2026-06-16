import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { rateLimit, clientIp } from "@/lib/ratelimit";
import { getTenantBySlug, hasModule } from "@/lib/tenant";
import { DATE_RE, TIME_RE } from "@/app/os/[slug]/_lib/dates";
import { getFreeSlots, hasOverlap } from "@/app/os/[slug]/_lib/slots";

/**
 * API PÚBLICA del calendario de auto-agendado.
 * NO expone datos sensibles: sólo nombre del negocio, recursos por nombre y huecos libres.
 * Toda operación va scopeada por clientId del tenant resuelto por slug.
 */

// Resuelve el tenant y valida que tenga el módulo turnos activo.
async function resolveTenant(slug: string) {
  const tenant = await getTenantBySlug(slug);
  if (!tenant || !hasModule(tenant, "turnos")) return null;
  return tenant;
}

/**
 * GET ?date=YYYY-MM-DD&employeeId=...  → { slots: ["09:00", …] }
 * Sin date → { slots: [] } (el front pide por día).
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const tenant = await resolveTenant(slug);
  if (!tenant) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  const url = new URL(req.url);
  const date = url.searchParams.get("date") ?? "";
  if (!DATE_RE.test(date)) {
    return NextResponse.json({ error: "Parámetro date inválido (YYYY-MM-DD)" }, { status: 400 });
  }

  let employeeId = url.searchParams.get("employeeId") || undefined;
  // El recurso pedido tiene que ser un empleado activo del tenant.
  if (employeeId) {
    const ok = await db.employee.findFirst({
      where: { id: employeeId, clientId: tenant.id, active: true },
      select: { id: true },
    });
    if (!ok) employeeId = undefined;
  }

  const free = await getFreeSlots(tenant.id, date, employeeId);
  return NextResponse.json({ slots: free.map((s) => s.time) });
}

const bookSchema = z.object({
  nombre: z.string().trim().min(1, "Decinos tu nombre").max(200),
  telefono: z.string().trim().min(6, "El teléfono no parece válido").max(50),
  email: z.union([z.literal(""), z.email("Email inválido")]).optional().default(""),
  nota: z.string().trim().max(2000).optional().default(""),
  employeeId: z.string().min(1).optional(),
  fecha: z.string().regex(DATE_RE, "Fecha inválida (YYYY-MM-DD)"),
  hora: z.string().regex(TIME_RE, "Hora inválida (HH:MM)"),
});

/**
 * POST — el cliente final crea su turno.
 * Crea Appointment PENDING (source "auto-agendado") y upsert del Contact por
 * teléfono (dedup): si existe lo vincula y actualiza lastTouchAt; si no, lo crea
 * con source "auto-agendado", stage "nuevo". Respeta disponibilidad real
 * (no permite doble-booking del mismo recurso/horario).
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  if (!rateLimit(`agendar:${slug}:${clientIp(req)}`, 8, 60_000)) {
    return NextResponse.json(
      { error: "Demasiados intentos. Esperá un minuto y probá de nuevo." },
      { status: 429 }
    );
  }

  const tenant = await resolveTenant(slug);
  if (!tenant) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const parsed = bookSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }
  const d = parsed.data;

  // Recurso opcional: debe ser un empleado activo del tenant.
  let employeeId: string | null = null;
  if (d.employeeId) {
    const employee = await db.employee.findFirst({
      where: { id: d.employeeId, clientId: tenant.id, active: true },
      select: { id: true },
    });
    if (!employee) {
      return NextResponse.json({ error: "Ese recurso no está disponible" }, { status: 404 });
    }
    employeeId = employee.id;
  }

  // El horario tiene que estar entre los huecos LIBRES reales (anti doble-booking).
  const free = await getFreeSlots(tenant.id, d.fecha, employeeId);
  const slot = free.find((s) => s.time === d.hora);
  if (!slot) {
    return NextResponse.json(
      { error: "Ese horario ya no está disponible. Elegí otro.", slots: free.map((s) => s.time) },
      { status: 409 }
    );
  }

  const startsAt = new Date(`${d.fecha}T${d.hora}:00-03:00`);
  const endsAt = new Date(startsAt.getTime() + slot.minutes * 60_000);

  // Doble chequeo de solapamiento por las dudas (carrera entre fetch y submit).
  if (await hasOverlap(tenant.id, startsAt, endsAt, employeeId)) {
    return NextResponse.json(
      { error: "Justo se ocupó ese horario. Elegí otro.", slots: free.map((s) => s.time) },
      { status: 409 }
    );
  }

  // Dedup de Contact por teléfono dentro del tenant.
  const now = new Date();
  let contact = await db.contact.findFirst({
    where: { clientId: tenant.id, phone: d.telefono },
  });
  if (contact) {
    contact = await db.contact.update({
      where: { id: contact.id },
      data: {
        lastTouchAt: now,
        // No pisamos datos cargados; sólo completamos lo que falte.
        email: contact.email || d.email || null,
      },
    });
  } else {
    contact = await db.contact.create({
      data: {
        clientId: tenant.id,
        name: d.nombre,
        phone: d.telefono,
        email: d.email || null,
        source: "auto-agendado",
        stage: "nuevo",
        lastTouchAt: now,
      },
    });
  }

  const appointment = await db.appointment.create({
    data: {
      clientId: tenant.id,
      contactId: contact.id,
      employeeId,
      title: d.nombre,
      startsAt,
      endsAt,
      status: "PENDING",
      source: "auto-agendado",
      notes: d.nota || null,
    },
    select: { id: true, startsAt: true },
  });

  return NextResponse.json({ ok: true, appointmentId: appointment.id }, { status: 201 });
}
