import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { guardHook } from "../_guard";
import { DATE_RE, TIME_RE } from "@/app/os/[slug]/_lib/dates";
import { getFreeSlots } from "@/app/os/[slug]/_lib/slots";

const bookSchema = z.object({
  nombre: z.string().trim().min(1, "nombre es obligatorio").max(200),
  telefono: z.string().trim().min(1, "telefono es obligatorio").max(50),
  fecha: z.string().regex(DATE_RE, "fecha inválida (YYYY-MM-DD)"),
  hora: z.string().regex(TIME_RE, "hora inválida (HH:MM)"),
  servicio: z.string().trim().max(200).optional(),
  notas: z.string().max(5000).optional(),
});

/**
 * POST /api/hooks/[slug]/book — el bot agenda un turno.
 * Busca/crea el Contact por teléfono (source "bot" → aparece en el CRM del tenant)
 * y crea el Appointment PENDING. Si el slot no está libre: 409 + alternativas.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const guard = await guardHook(req, slug, "turnos");
  if (guard.error) return guard.error;
  const tenant = guard.tenant;

  const body = await req.json().catch(() => null);
  const parsed = bookSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }
  const d = parsed.data;

  // El slot tiene que estar entre los huecos LIBRES del día.
  const free = await getFreeSlots(tenant.id, d.fecha);
  const slot = free.find((s) => s.time === d.hora);
  if (!slot) {
    return NextResponse.json(
      {
        error: "Ese horario no está disponible",
        slots: free.map((s) => s.time),
      },
      { status: 409 }
    );
  }

  // Contact por teléfono dentro del tenant, o alta nueva (sinergia bot → CRM).
  const now = new Date();
  let contact = await db.contact.findFirst({
    where: { clientId: tenant.id, phone: d.telefono },
  });
  if (contact) {
    contact = await db.contact.update({
      where: { id: contact.id },
      data: { lastTouchAt: now },
    });
  } else {
    contact = await db.contact.create({
      data: {
        clientId: tenant.id,
        name: d.nombre,
        phone: d.telefono,
        source: "bot",
        stage: "nuevo",
        lastTouchAt: now,
      },
    });
  }

  // Hora ARGENTINA (UTC-3), siempre.
  const startsAt = new Date(`${d.fecha}T${d.hora}:00-03:00`);
  const endsAt = new Date(startsAt.getTime() + slot.minutes * 60_000);

  const appointment = await db.appointment.create({
    data: {
      clientId: tenant.id,
      contactId: contact.id,
      title: d.servicio || "Turno",
      startsAt,
      endsAt,
      status: "PENDING",
      source: "bot",
      notes: d.notas || null,
    },
  });

  return NextResponse.json({ ok: true, appointmentId: appointment.id }, { status: 201 });
}
