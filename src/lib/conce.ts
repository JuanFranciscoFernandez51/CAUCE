/**
 * Helpers CLIENT-SAFE del template CONCESIONARIA (Ri Cars Automotores).
 * Nada de Prisma ni server-only acá: esto lo importan client components.
 */

// ── Paleta del template (relevada de la web actual de Ri Cars) ────────────
// OJO: vive acá (módulo compartido, sin "use client") para que los SERVER
// components reciban los valores reales — importarla desde un módulo client
// les daría una client reference y los estilos inline se pierden en silencio.

export const RC = {
  negro: "#0A0A0A",
  dorado: "#D18E00",
  doradoTexto: "#B7891B",
  doradoSuave: "#F7EBD4",
  fondo: "#FAFAFA",
  card: "#FFFFFF",
  borde: "#E8E4DB",
  gris: "#4B5563",
  grisSuave: "#6B7280",
} as const;

// ── Tipos de vehículo (categorías) ────────────────────────────────────────

export const CONCE_TIPOS: { valor: string; label: string; emoji: string }[] = [
  { valor: "sedan", label: "Sedán", emoji: "🚗" },
  { valor: "suv", label: "SUV", emoji: "🚙" },
  { valor: "pickup", label: "Pick-Up", emoji: "🛻" },
  { valor: "hatchback", label: "Hatchback", emoji: "🚗" },
  { valor: "coupe", label: "Coupé", emoji: "🏎️" },
  { valor: "cabriolet", label: "Cabriolet", emoji: "🚘" },
  { valor: "premium", label: "Premium", emoji: "✨" },
  { valor: "utilitario", label: "Utilitario", emoji: "🚐" },
  { valor: "UTV-cuatris-casillas", label: "UTV · Cuatris · Casillas", emoji: "🏕️" },
  { valor: "clasico", label: "Clásicos", emoji: "🕰️" },
  { valor: "moto", label: "Motos", emoji: "🏍️" },
  { valor: "0km", label: "0KM", emoji: "🆕" },
];

export function tipoLabel(tipo: string): string {
  return CONCE_TIPOS.find((t) => t.valor === tipo)?.label ?? tipo;
}

// ── Precios ───────────────────────────────────────────────────────────────

/** "US$ 25.000" / "$ 32.000.000" / "Consultar precio" */
export function fmtPrecioVehiculo(precio: number | null | undefined, moneda: string): string {
  if (precio == null || precio <= 0) return "Consultar precio";
  const n = Math.round(precio).toLocaleString("es-AR");
  return moneda === "USD" ? `US$ ${n}` : `$ ${n}`;
}

export function fmtKm(km: number): string {
  if (km <= 0) return "0 km";
  return `${km.toLocaleString("es-AR")} km`;
}

// ── Estados / condición ───────────────────────────────────────────────────

export const VEHICULO_ESTADOS = ["disponible", "reservado", "vendido"] as const;
export type VehiculoEstado = (typeof VEHICULO_ESTADOS)[number];

export const VEHICULO_ESTADO_LABEL: Record<string, string> = {
  disponible: "Disponible",
  reservado: "Reservado",
  vendido: "Vendido",
};

export const OPERACION_TIPO_LABEL: Record<string, string> = {
  MANDATO: "Mandato de venta",
  BOLETO: "Boleto / Orden de compra",
};

export const OPERACION_ESTADO_LABEL: Record<string, string> = {
  VIGENTE: "Vigente",
  CONCRETADA: "Concretada",
  CANCELADA: "Cancelada",
};

/** Checklist default de documentación para mandatos/boletos de autos. */
export const DOCS_DEFAULT: { item: string; ok: boolean }[] = [
  { item: "Título del automotor", ok: false },
  { item: "Cédula verde", ok: false },
  { item: "Verificación policial", ok: false },
  { item: "Informe de dominio", ok: false },
  { item: "Libre deuda de patentes", ok: false },
  { item: "Libre deuda de infracciones", ok: false },
  { item: "Formulario 08 firmado", ok: false },
  { item: "VTV vigente", ok: false },
];

// ── Fotos / slug (mismo criterio que lib/bazar) ───────────────────────────

export function fotosDeVehiculo(fotos: unknown): string[] {
  if (!Array.isArray(fotos)) return [];
  return fotos.filter((f): f is string => typeof f === "string");
}

export function primeraFotoVehiculo(fotos: unknown): string | null {
  return fotosDeVehiculo(fotos)[0] ?? null;
}

export function nombreVehiculo(v: {
  marca: string;
  modelo: string;
  version?: string | null;
}): string {
  return [v.marca, v.modelo, v.version].filter(Boolean).join(" ");
}

/** Caption automática para publicar en Instagram / Mercado Libre. */
export function captionVehiculo(v: {
  marca: string;
  modelo: string;
  version?: string | null;
  anio: number;
  km: number;
  precio: number | null;
  moneda: string;
  condicion: string;
}): string {
  const lineas = [
    `${nombreVehiculo(v)} ${v.anio} ${v.condicion === "0km" ? "0KM 🆕" : ""}`.trim(),
    v.condicion === "0km" ? "Entrega inmediata" : fmtKm(v.km),
    fmtPrecioVehiculo(v.precio, v.moneda),
    "",
    "📍 Hipólito Yrigoyen 3754, Bahía Blanca",
    "📲 291 503-8204",
    "",
    "#ricars #bahiablanca #autos #usados #0km",
  ];
  return lineas.join("\n");
}

/** Categorías del blog (replican las de su web actual). */
export const BLOG_CATEGORIAS = ["Noticias", "Consejos", "Eventos", "Tecnología", "Promociones"];
