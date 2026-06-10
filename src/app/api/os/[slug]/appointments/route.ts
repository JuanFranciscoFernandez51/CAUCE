import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { guardOsApi, cleanCustom } from "../_guard";
import { DATE_RE, TIME_RE } from "@/app/os/[slug]/_lib/dates";
import { getFreeSlots, hasOverlap } from "@/app/os/[slug]/_lib/slots";

const createSchema = z.object({
  title: z.string().trim().min(1, "El título es obligatorio").max(200),
  date: z.string().regex(DATE_RE, "Fecha inválida (YYYY-MM-DD)"),
  time: z.string().regex(TIME_RE, "Hora inválida (HH:MM)"),
  durationMinutes: z.number().int().min(5).max(480).optional(),
  contactId: z.string().min(1).optional(),
  newContact: z
    .object({
      name: z.string().trim().min(1, "El nombre del contacto es obligatorio").max(200),
      phone: z.string().trim().max(50).optional(),
    })
    .optional(),
  notes: z.string().max(5000).optional(),
  custom: z.record(z.string(), z.union([z.string(), z.number()])).optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const guard = await guardOsApi(slug, "turnos");
  if (guard.error) return guard.error;
  const tenant = guard.tenant;

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }
  const d = parsed.data;

  // Fechas SIEMPRE interpretadas como hora argentina (UTC-3).
  const startsAt = new Date(`${d.date}T${d.time}:00-03:00`);
  if (Number.isNaN(startsAt.getTime())) {
    return NextResponse.json({ error: "Fecha u hora inválida" }, { status: 400 });
  }

  // Duración: la pedida, o el slotMinutes del hueco elegido, o 60.
  let minutes = d.durationMinutes;
  if (!minutes) {
    const free = await getFreeSlots(tenant.id, d.date);
    minutes = free.find((s) => s.time === d.time)?.minutes ?? 60;
  }
  const endsAt = new Date(startsAt.getTime() + minutes * 60_000);

  if (await hasOverlap(tenant.id, startsAt, endsAt)) {
    return NextResponse.json(
      { error: "Ese horario ya está ocupado. Elegí otro hueco libre." },
      { status: 409 }
    );
  }

  // Contacto: existente (scopeado) o creación rápida — misma tabla que el CRM.
  let contactId: string | null = null;
  if (d.contactId) {
    const contact = await db.contact.findFirst({
      where: { id: d.contactId, clientId: tenant.id },
      select: { id: true },
    });
    if (!contact) {
      return NextResponse.json({ error: "Contacto no encontrado" }, { status: 404 });
    }
    contactId = contact.id;
    await db.contact.update({
      where: { id: contact.id },
      data: { lastTouchAt: new Date() },
    });
  } else if (d.newContact) {
    const created = await db.contact.create({
      data: {
        clientId: tenant.id,
        name: d.newContact.name,
        phone: d.newContact.phone || null,
        source: "manual",
        stage: "nuevo",
        lastTouchAt: new Date(),
      },
    });
    contactId = created.id;
  }

  const appointment = await db.appointment.create({
    data: {
      clientId: tenant.id,
      contactId,
      title: d.title,
      startsAt,
      endsAt,
      status: "PENDING",
      source: "manual",
      notes: d.notes || null,
      custom: cleanCustom(d.custom),
    },
  });

  return NextResponse.json({ ok: true, appointment }, { status: 201 });
}
