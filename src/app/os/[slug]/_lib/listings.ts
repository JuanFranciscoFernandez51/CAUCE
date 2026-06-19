/**
 * Vocabulario y helpers compartidos del módulo "sitio" (propiedades inmobiliarias).
 * Lo usan tanto el back (/os/[slug]/propiedades) como la web pública (/sitio/[slug]).
 */

export const OPERATIONS = ["venta", "alquiler", "alquiler_temporal"] as const;
export type Operation = (typeof OPERATIONS)[number];

export const PROPERTY_TYPES = [
  "casa",
  "departamento",
  "ph",
  "local",
  "terreno",
  "oficina",
  "galpon",
] as const;
export type PropertyType = (typeof PROPERTY_TYPES)[number];

export const LISTING_STATUS = ["disponible", "reservada", "vendida", "alquilada"] as const;
export type ListingStatus = (typeof LISTING_STATUS)[number];

export const OPERATION_LABELS: Record<Operation, string> = {
  venta: "Venta",
  alquiler: "Alquiler",
  alquiler_temporal: "Alquiler temporal",
};

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  casa: "Casa",
  departamento: "Departamento",
  ph: "PH",
  local: "Local",
  terreno: "Terreno",
  oficina: "Oficina",
  galpon: "Galpón",
};

export const STATUS_LABELS: Record<ListingStatus, string> = {
  disponible: "Disponible",
  reservada: "Reservada",
  vendida: "Vendida",
  alquilada: "Alquilada",
};

export type StatusTone = "success" | "warning" | "destructive" | "default";
export const STATUS_TONE: Record<ListingStatus, StatusTone> = {
  disponible: "success",
  reservada: "warning",
  vendida: "destructive",
  alquilada: "destructive",
};

export function opLabel(op: string): string {
  return OPERATION_LABELS[op as Operation] ?? op;
}
export function typeLabel(t: string): string {
  return PROPERTY_TYPE_LABELS[t as PropertyType] ?? t;
}
export function statusLabel(s: string): string {
  return STATUS_LABELS[s as ListingStatus] ?? s;
}
export function statusTone(s: string): StatusTone {
  return STATUS_TONE[s as ListingStatus] ?? "default";
}

/** Slug URL-safe a partir del título (sin tildes, espacios → guiones). */
export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "propiedad";
}

/** Precio formateado es-AR. Prioriza USD (mercado inmobiliario AR). */
export function fmtListingPrice(opts: {
  priceUsd?: number | null;
  priceArs?: number | null;
}): string {
  const { priceUsd, priceArs } = opts;
  if (priceUsd != null) {
    return `USD ${priceUsd.toLocaleString("es-AR", { maximumFractionDigits: 0 })}`;
  }
  if (priceArs != null) {
    return `$ ${priceArs.toLocaleString("es-AR", { maximumFractionDigits: 0 })}`;
  }
  return "Consultar";
}

/** Expensas ARS formateadas. */
export function fmtExpenses(n: number): string {
  return `$ ${n.toLocaleString("es-AR", { maximumFractionDigits: 0 })}`;
}
