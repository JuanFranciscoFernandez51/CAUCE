/**
 * Utilidades de fecha para Cauce OS — TODO en hora argentina (UTC-3).
 * Las fechas se guardan como instantes UTC en la DB, pero se agrupan,
 * muestran y construyen SIEMPRE interpretando America/Argentina/Buenos_Aires.
 */

export const ART_TZ = "America/Argentina/Buenos_Aires";

/** "YYYY-MM-DD" del instante dado, en calendario argentino. */
export function argDateStr(d: Date = new Date()): string {
  return d.toLocaleDateString("en-CA", { timeZone: ART_TZ });
}

/** Rango [inicio, fin) del día calendario argentino "YYYY-MM-DD". */
export function dayRange(dateStr: string): { start: Date; end: Date } {
  const start = new Date(`${dateStr}T00:00:00-03:00`);
  return { start, end: new Date(start.getTime() + 86_400_000) };
}

/** Suma n días a un "YYYY-MM-DD" (calendario argentino). */
export function addDays(dateStr: string, n: number): string {
  const noon = new Date(`${dateStr}T12:00:00-03:00`);
  return argDateStr(new Date(noon.getTime() + n * 86_400_000));
}

/** Día de semana (0=domingo .. 6=sábado) de un "YYYY-MM-DD" argentino. */
export function weekdayOf(dateStr: string): number {
  // Al mediodía ART (15:00 UTC) el día UTC coincide con el día argentino.
  return new Date(`${dateStr}T12:00:00-03:00`).getUTCDay();
}

/** "HH:MM" del instante, en hora argentina. */
export function fmtTime(d: Date): string {
  return d.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: ART_TZ,
  });
}

/** "lunes 15 de junio" para un "YYYY-MM-DD". */
export function fmtDayLabel(dateStr: string): string {
  return new Date(`${dateStr}T12:00:00-03:00`).toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: ART_TZ,
  });
}

/** "15/06/2026" corto, en hora argentina. */
export function fmtDateShort(d: Date): string {
  return d.toLocaleDateString("es-AR", { timeZone: ART_TZ });
}

/** Primer instante del mes calendario argentino actual. */
export function monthStart(now: Date = new Date()): Date {
  return new Date(`${argDateStr(now).slice(0, 7)}-01T00:00:00-03:00`);
}

/** Tiempo relativo en castellano ("hace 2 días", "recién"). */
export function relativeTime(iso: string | null | undefined): string {
  if (!iso) return "sin contacto";
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "recién";
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h`;
  const days = Math.floor(h / 24);
  if (days === 1) return "ayer";
  if (days < 30) return `hace ${days} días`;
  const months = Math.floor(days / 30);
  return months === 1 ? "hace 1 mes" : `hace ${months} meses`;
}

export const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
export const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
