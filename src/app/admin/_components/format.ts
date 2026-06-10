/**
 * Helpers de formato y diccionarios de labels/badges del admin.
 * Client-safe: NO importa nada con Prisma/db (a diferencia de @/lib/pricing).
 */

export function fmtUsd(n: number): string {
  return `USD ${n.toLocaleString("es-AR")}`;
}

export function fmtArs(n: number): string {
  return `$ ${n.toLocaleString("es-AR")}`;
}

export function usdToArs(usd: number, dolarArs: number): number {
  return Math.round(usd * dolarArs);
}

export function fmtDate(d: string | Date | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "America/Argentina/Buenos_Aires",
  });
}

export function fmtDateTime(d: string | Date | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Argentina/Buenos_Aires",
  });
}

type BadgeVariant = "default" | "primary" | "success" | "warning" | "destructive" | "outline";

// ── Pipeline ──
export const STAGES = [
  "LEAD",
  "DIAGNOSTICO",
  "APROBACION",
  "BUILD",
  "QA",
  "ONBOARDING",
  "ACTIVO",
] as const;
export type StageKey = (typeof STAGES)[number];

export const STAGE_LABELS: Record<StageKey, string> = {
  LEAD: "Lead",
  DIAGNOSTICO: "Diagnóstico",
  APROBACION: "Aprobación",
  BUILD: "Build",
  QA: "QA",
  ONBOARDING: "Onboarding",
  ACTIVO: "Activo",
};

export const LEVELS = ["N1", "N2", "N3", "N4"] as const;

// ── Leads ──
export const LEAD_SOURCE_LABELS: Record<string, string> = {
  INTAKE: "Intake web",
  CONSULTORIA: "Consultoría",
  MANUAL: "Manual",
  BOT: "Bot",
};
export const LEAD_SOURCE_BADGE: Record<string, BadgeVariant> = {
  INTAKE: "primary",
  CONSULTORIA: "warning",
  MANUAL: "default",
  BOT: "success",
};
export const LEAD_STATUS_LABELS: Record<string, string> = {
  NEW: "Nuevo",
  QUALIFIED: "Calificado",
  CONVERTED: "Convertido",
  LOST: "Perdido",
};
export const LEAD_STATUS_BADGE: Record<string, BadgeVariant> = {
  NEW: "primary",
  QUALIFIED: "warning",
  CONVERTED: "success",
  LOST: "destructive",
};

// ── Clientes ──
export const PACK_LABELS: Record<string, string> = {
  NONE: "Sin pack",
  STARTER: "Starter",
  PRO: "Pro",
  SCALE: "Scale",
  CUSTOM: "Custom",
};
export const PACK_BADGE: Record<string, BadgeVariant> = {
  NONE: "outline",
  STARTER: "default",
  PRO: "primary",
  SCALE: "success",
  CUSTOM: "warning",
};
export const CLIENT_STATUS_LABELS: Record<string, string> = {
  PROSPECT: "Prospecto",
  ONBOARDING: "Onboarding",
  ACTIVE: "Activo",
  PAUSED: "Pausado",
  CHURNED: "Baja",
};
export const CLIENT_STATUS_BADGE: Record<string, BadgeVariant> = {
  PROSPECT: "outline",
  ONBOARDING: "warning",
  ACTIVE: "success",
  PAUSED: "default",
  CHURNED: "destructive",
};

// ── Automatizaciones ──
export const AUTOMATION_STATUS_LABELS: Record<string, string> = {
  TEST: "Test",
  ACTIVE: "Activa",
  PAUSED: "Pausada",
  ERROR: "Error",
};
export const AUTOMATION_STATUS_BADGE: Record<string, BadgeVariant> = {
  TEST: "warning",
  ACTIVE: "success",
  PAUSED: "default",
  ERROR: "destructive",
};
export const HEALTH_LABELS: Record<string, string> = {
  UNKNOWN: "Sin datos",
  OK: "OK",
  WARN: "Atención",
  DOWN: "Caída",
};
export const HEALTH_BADGE: Record<string, BadgeVariant> = {
  UNKNOWN: "outline",
  OK: "success",
  WARN: "warning",
  DOWN: "destructive",
};

// ── Recetas ──
export const AREAS = [
  "ATENCION",
  "VENTAS_CRM",
  "MARKETING",
  "OPERACIONES",
  "TURNOS",
  "RRHH",
  "FINANZAS",
] as const;
export const AREA_LABELS: Record<string, string> = {
  ATENCION: "Atención",
  VENTAS_CRM: "Ventas & CRM",
  MARKETING: "Marketing",
  OPERACIONES: "Operaciones",
  TURNOS: "Turnos",
  RRHH: "RRHH",
  FINANZAS: "Finanzas",
};

// ── Consultorías ──
export const CONSULT_STATUS_LABELS: Record<string, string> = {
  SCHEDULED: "Agendada",
  DONE: "Realizada",
  ROADMAP_SENT: "Roadmap enviado",
  CANCELLED: "Cancelada",
};
export const CONSULT_STATUS_BADGE: Record<string, BadgeVariant> = {
  SCHEDULED: "primary",
  DONE: "warning",
  ROADMAP_SENT: "success",
  CANCELLED: "destructive",
};

// ── Blueprints ──
export const BLUEPRINT_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Borrador",
  APPROVED: "Aprobado",
  REJECTED: "Rechazado",
};
export const BLUEPRINT_STATUS_BADGE: Record<string, BadgeVariant> = {
  DRAFT: "warning",
  APPROVED: "success",
  REJECTED: "destructive",
};

// ── Cauce OS ──
export const OS_MODULES = [
  { key: "crm", label: "CRM" },
  { key: "turnos", label: "Turnos & Agenda" },
  { key: "catalogo", label: "Catálogo & Stock" },
  { key: "rrhh", label: "RRHH" },
  { key: "caja", label: "Caja & Reportes" },
] as const;

// Labels legibles para claves del intake JSON
export const INTAKE_KEY_LABELS: Record<string, string> = {
  size: "Tamaño del equipo",
  dolores: "Dolores",
  dolorOtro: "Otro dolor",
  frecuencia: "Frecuencia del problema",
  apps: "Apps que usa",
  urgencia: "Urgencia",
  presupuesto: "Presupuesto",
};
export const INTAKE_VALUE_LABELS: Record<string, string> = {
  solo: "Solo/a",
  "2-5": "2 a 5 personas",
  "6-20": "6 a 20 personas",
  "20+": "Más de 20",
  pocas: "Pocas veces por semana",
  varias: "Varias veces por día",
  todo_el_dia: "Todo el día",
  ya_mismo: "Ya mismo",
  este_mes: "Este mes",
  explorando: "Explorando",
  hasta_50: "Hasta USD 50/mes",
  "50_300": "USD 50 a 300/mes",
  "300_1000": "USD 300 a 1.000/mes",
  mas_1000: "Más de USD 1.000/mes",
  no_se: "No sabe",
};

export function humanizeIntakeKey(key: string): string {
  return INTAKE_KEY_LABELS[key] ?? key.replace(/[_-]/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

export function humanizeIntakeValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (Array.isArray(value)) {
    return value.map((v) => INTAKE_VALUE_LABELS[String(v)] ?? AREA_LABELS[String(v)] ?? String(v)).join(", ");
  }
  if (typeof value === "boolean") return value ? "Sí" : "No";
  if (typeof value === "object") return JSON.stringify(value);
  return INTAKE_VALUE_LABELS[String(value)] ?? AREA_LABELS[String(value)] ?? String(value);
}
