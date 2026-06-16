import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { guardOsApi } from "../../_guard";
import { DATE_RE, TIME_RE } from "@/app/os/[slug]/_lib/dates";

const patchSchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "CANCELLED", "DONE"]).optional(),
  title: z.string().trim().min(1).max(200).optional(),
  notes: z.string().max(5000).nullable().optional(),
  // Reprogramación: cualquiera de estos puede venir solo (ej. drag&drop manda
  // sólo `date` y se mantiene la hora; el popover puede mandar sólo `time`).
  date: z.string().regex(DATE_RE, "Fecha inválida (YYYY-MM-DD)").optional(),
  time: z.string().regex(TIME_RE, "Hora inválida (HH:MM)").optional(),
  // null = sacar recurso; string = asignar (se valida que sea del tenant).
  employeeId: z.string().min(1).nullable().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  const { slug, id } = await params;
  const guard = await guardOsApi(slug, "turnos");
  if (guard.error) return guard.error;
  const tenantId = guard.tenant.id;

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }
  const d = parsed.data;

  // El turno tiene que existir y ser del tenant (lo necesitamos para
  // recalcular fecha/hora preservando duración y validar solapamiento).
  const current = await db.appointment.findFirst({
    where: { id, clientId: tenantId },
    select: { startsAt: true, endsAt: true, employeeId: true, status: true },
  });
  if (!current) {
    return NextResponse.json({ error: "Turno no encontrado" }, { status: 404 });
  }

  // ── Recurso (opcional): null lo saca, string lo asigna validando tenant ──
  let nextEmployeeId = current.employeeId;
  if (d.employeeId !== undefined) {
    if (d.employeeId === null) {
      nextEmployeeId = null;
    } else {
      const employee = await db.employee.findFirst({
        where: { id: d.employeeId, clientId: tenantId },
        select: { id: true },
      });
      if (!employee) {
        return NextResponse.json({ error: "Recurso no encontrado" }, { status: 404 });
      }
      nextEmployeeId = employee.id;
    }
  }

  // ── Reprogramación (fecha y/o hora) preservando la duración ──────────────
  let nextStartsAt = current.startsAt;
  let nextEndsAt = current.endsAt;
  const reschedule = d.date !== undefined || d.time !== undefined;
  if (reschedule) {
    // Día y hora actuales del turno, en calendario argentino, como base.
    const curDate = current.startsAt.toLocaleDateString("en-CA", {
      timeZone: "America/Argentina/Buenos_Aires",
    });
    const curTime = current.startsAt.toLocaleTimeString("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "America/Argentina/Buenos_Aires",
    });
    const date = d.date ?? curDate;
    const time = d.time ?? curTime;
    const durationMs = current.endsAt.getTime() - current.startsAt.getTime();
    nextStartsAt = new Date(`${date}T${time}:00-03:00`);
    if (Number.isNaN(nextStartsAt.getTime())) {
      return NextResponse.json({ error: "Fecha u hora inválida" }, { status: 400 });
    }
    nextEndsAt = new Date(nextStartsAt.getTime() + durationMs);
  }

  // Si cambia el horario o el recurso, validar choque (turnos no cancelados).
  // Un turno cancelado puede moverse libremente: no bloquea ni le importa el choque.
  const movingTime = nextStartsAt.getTime() !== current.startsAt.getTime();
  const movingResource = nextEmployeeId !== current.employeeId;
  const nextStatus = d.status ?? current.status;
  if ((movingTime || movingResource) && nextStatus !== "CANCELLED") {
    const clash = await hasOverlapExcluding(
      tenantId,
      id,
      nextStartsAt,
      nextEndsAt,
      nextEmployeeId
    );
    if (clash) {
      return NextResponse.json(
        { error: "Ese horario ya está ocupado para ese recurso." },
        { status: 409 }
      );
    }
  }

  const result = await db.appointment.updateMany({
    where: { id, clientId: tenantId },
    data: {
      ...(d.status !== undefined ? { status: d.status } : {}),
      ...(d.title !== undefined ? { title: d.title } : {}),
      ...(d.notes !== undefined ? { notes: d.notes || null } : {}),
      ...(d.employeeId !== undefined ? { employeeId: nextEmployeeId } : {}),
      ...(reschedule ? { startsAt: nextStartsAt, endsAt: nextEndsAt } : {}),
    },
  });
  if (result.count === 0) {
    return NextResponse.json({ error: "Turno no encontrado" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

/** Como hasOverlap, pero ignorando el propio turno que se está moviendo. */
async function hasOverlapExcluding(
  clientId: string,
  excludeId: string,
  startsAt: Date,
  endsAt: Date,
  employeeId: string | null
): Promise<boolean> {
  const clash = await db.appointment.findFirst({
    where: {
      clientId,
      id: { not: excludeId },
      status: { not: "CANCELLED" },
      startsAt: { lt: endsAt },
      endsAt: { gt: startsAt },
      ...(employeeId ? { OR: [{ employeeId }, { employeeId: null }] } : {}),
    },
    select: { id: true },
  });
  return clash !== null;
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  const { slug, id } = await params;
  const guard = await guardOsApi(slug, "turnos");
  if (guard.error) return guard.error;

  const result = await db.appointment.deleteMany({
    where: { id, clientId: guard.tenant.id },
  });
  if (result.count === 0) {
    return NextResponse.json({ error: "Turno no encontrado" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
