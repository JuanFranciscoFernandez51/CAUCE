import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export type BotSettings = {
  horarios?: string;
  faqs?: { q: string; a: string }[];
  datosNegocio?: string;
  tono?: string;
};

/**
 * Cliente de la sesión del portal, o null si no hay clientId
 * (ej: un ADMIN sin tenant — el layout muestra el aviso).
 */
export async function getPortalClient() {
  const session = await auth();
  const clientId = session?.user.clientId;
  if (!clientId) return null;
  return db.client.findUnique({ where: { id: clientId } });
}

/** "hace 5 min", "hace 3 h", "hace 2 días" */
export function timeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "recién";
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  if (d < 30) return d === 1 ? "hace 1 día" : `hace ${d} días`;
  const m = Math.floor(d / 30);
  return m === 1 ? "hace 1 mes" : `hace ${m} meses`;
}

const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

/** "2026-06" → "junio 2026" */
export function fmtPeriod(period: string): string {
  const [y, m] = period.split("-");
  const idx = Number(m) - 1;
  return MESES[idx] ? `${MESES[idx]} ${y}` : period;
}

/** Fecha corta en hora argentina: "10/06/2026" */
export function fmtDate(date: Date): string {
  return date.toLocaleDateString("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/** Fecha y hora en hora argentina: "10/06 14:30" */
export function fmtDateTime(date: Date): string {
  return date.toLocaleString("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
