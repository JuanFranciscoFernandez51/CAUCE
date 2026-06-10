import type { ApptStatus } from "@prisma/client";

/** Stages del pipeline CRM (simple y fijo en v1; configurable a futuro vía settings). */
export const CRM_STAGES = ["nuevo", "contactado", "interesado", "cliente", "perdido"] as const;

export const STAGE_LABELS: Record<string, string> = {
  nuevo: "Nuevo",
  contactado: "Contactado",
  interesado: "Interesado",
  cliente: "Cliente",
  perdido: "Perdido",
};

export const APPT_STATUS: Record<
  ApptStatus,
  { label: string; variant: "warning" | "success" | "default" | "primary" }
> = {
  PENDING: { label: "Pendiente", variant: "warning" },
  CONFIRMED: { label: "Confirmado", variant: "success" },
  CANCELLED: { label: "Cancelado", variant: "default" },
  DONE: { label: "Hecho", variant: "primary" },
};

export const WEEKDAY_LABELS = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
] as const;
