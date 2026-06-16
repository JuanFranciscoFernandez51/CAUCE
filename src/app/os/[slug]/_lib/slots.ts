import { db } from "@/lib/db";
import { dayRange, fmtTime, weekdayOf } from "./dates";

export type FreeSlot = { time: string; minutes: number };

/**
 * Huecos LIBRES de un día para un tenant:
 * Availability del weekday − Appointments existentes no cancelados.
 * Única fuente de verdad: la usan el form de turnos, /api/os/[slug]/slots,
 * el calendario público de auto-agendado y los hooks del bot.
 *
 * `employeeId` (opcional) acota la ocupación a ese recurso: dos profes/doctores
 * pueden tener el mismo horario libre. Sin recurso, la ocupación es del negocio
 * entero (turnos sin recurso bloquean para todos).
 */
export async function getFreeSlots(
  clientId: string,
  dateStr: string,
  employeeId?: string | null
): Promise<FreeSlot[]> {
  const weekday = weekdayOf(dateStr);
  const blocks = await db.availability.findMany({
    where: { clientId, weekday },
    orderBy: { startTime: "asc" },
  });
  if (blocks.length === 0) return [];

  const { start, end } = dayRange(dateStr);
  const appts = await db.appointment.findMany({
    where: {
      clientId,
      status: { not: "CANCELLED" },
      startsAt: { lt: end },
      endsAt: { gt: start },
      // Si se filtra por recurso, sólo los turnos de ESE recurso (o sin recurso)
      // bloquean; si no, el negocio entero.
      ...(employeeId ? { OR: [{ employeeId }, { employeeId: null }] } : {}),
    },
    select: { startsAt: true, endsAt: true },
  });

  const now = Date.now();
  const seen = new Set<string>();
  const out: FreeSlot[] = [];

  for (const b of blocks) {
    const minutes = b.slotMinutes > 0 ? b.slotMinutes : 30;
    const step = minutes * 60_000;
    let t = new Date(`${dateStr}T${b.startTime}:00-03:00`).getTime();
    const blockEnd = new Date(`${dateStr}T${b.endTime}:00-03:00`).getTime();
    while (t + step <= blockEnd) {
      const slotStart = new Date(t);
      const slotEnd = new Date(t + step);
      const busy = appts.some((a) => a.startsAt < slotEnd && a.endsAt > slotStart);
      const past = t <= now;
      const label = fmtTime(slotStart);
      if (!busy && !past && !seen.has(label)) {
        seen.add(label);
        out.push({ time: label, minutes });
      }
      t += step;
    }
  }

  out.sort((a, b) => a.time.localeCompare(b.time));
  return out;
}

/**
 * ¿Hay solapamiento con otro turno no cancelado? (para validar al crear)
 * `employeeId` acota igual que getFreeSlots: si se pasa, sólo chocan los turnos
 * de ese recurso o los turnos sin recurso.
 */
export async function hasOverlap(
  clientId: string,
  startsAt: Date,
  endsAt: Date,
  employeeId?: string | null
): Promise<boolean> {
  const clash = await db.appointment.findFirst({
    where: {
      clientId,
      status: { not: "CANCELLED" },
      startsAt: { lt: endsAt },
      endsAt: { gt: startsAt },
      ...(employeeId ? { OR: [{ employeeId }, { employeeId: null }] } : {}),
    },
    select: { id: true },
  });
  return clash !== null;
}
