/**
 * Constantes del módulo Proyectos — estados de proyecto y de tareas, áreas.
 * Todo en castellano rioplatense; los valores son los que viven en la DB.
 */

// ── Estados del proyecto ──────────────────────────────────────────────────
export const PROYECTO_STATUSES = [
  "propuesta",
  "en_curso",
  "revision",
  "entregado",
  "pausado",
] as const;
export type ProyectoStatus = (typeof PROYECTO_STATUSES)[number];

export const PROYECTO_STATUS_LABELS: Record<ProyectoStatus, string> = {
  propuesta: "Propuesta",
  en_curso: "En curso",
  revision: "Revisión",
  entregado: "Entregado",
  pausado: "Pausado",
};

export const PROYECTO_STATUS_VARIANT: Record<
  ProyectoStatus,
  "default" | "primary" | "success" | "warning"
> = {
  propuesta: "default",
  en_curso: "primary",
  revision: "warning",
  entregado: "success",
  pausado: "default",
};

/** Columnas de la lista (el board de proyectos): pausado va aparte, no es columna. */
export const PROYECTO_BOARD_STATUSES: ProyectoStatus[] = [
  "propuesta",
  "en_curso",
  "revision",
  "entregado",
];

// ── Estados de las tareas (columnas del kanban) ───────────────────────────
export const TAREA_STATUSES = ["pendiente", "haciendo", "revision", "hecho"] as const;
export type TareaStatus = (typeof TAREA_STATUSES)[number];

export const TAREA_STATUS_LABELS: Record<TareaStatus, string> = {
  pendiente: "Pendiente",
  haciendo: "Haciendo",
  revision: "Revisión",
  hecho: "Hecho",
};

/** Punto de color por estado de tarea (tokens globales). */
export const TAREA_STATUS_DOT: Record<TareaStatus, string> = {
  pendiente: "bg-muted-foreground",
  haciendo: "bg-primary",
  revision: "bg-warning",
  hecho: "bg-success",
};

// ── Áreas de la agencia ───────────────────────────────────────────────────
export const PROYECTO_AREAS = [
  "branding",
  "ads",
  "redes",
  "web",
  "contenido",
  "SEO",
] as const;
export type ProyectoArea = (typeof PROYECTO_AREAS)[number];

export const PROYECTO_AREA_LABELS: Record<ProyectoArea, string> = {
  branding: "Branding",
  ads: "Ads",
  redes: "Redes",
  web: "Web",
  contenido: "Contenido",
  SEO: "SEO",
};

/** Iniciales para el avatar de un responsable (máx. 2 letras). */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
