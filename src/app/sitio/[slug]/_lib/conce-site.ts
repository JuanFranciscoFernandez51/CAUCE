import type { Client } from "@prisma/client";
import { db } from "@/lib/db";
import { getTenantBySlug, hasModule, tenantBranding } from "@/lib/tenant";
import { conceSettings, esConcesionaria, type ConceSucursal } from "@/lib/conce-server";
import { fotosDeVehiculo } from "@/lib/conce";

/**
 * Helpers server del TEMPLATE CONCESIONARIA del sitio público.
 * Toda página del template llama getConceSite(slug) y hace notFound() si es null.
 */

/** Info serializable del negocio que consume el shell (client component). */
export type ConceShellInfo = {
  slug: string;
  nombre: string;
  eslogan: string | null;
  logo: string | null;
  whatsapp: string | null; // principal, solo dígitos
  whatsapps: string[];
  instagram: string | null;
  facebook: string | null;
  mercadolibre: string | null;
  email: string | null;
  horarios: string | null;
  sucursales: ConceSucursal[];
  serviciosFooter: string[];
};

export type ConceSite = {
  tenant: Client;
  info: ConceShellInfo;
};

export async function getConceSite(slug: string): Promise<ConceSite | null> {
  const tenant = await getTenantBySlug(slug);
  if (!tenant || !hasModule(tenant, "sitio") || !esConcesionaria(tenant)) return null;

  const branding = tenantBranding(tenant);
  const s = conceSettings(tenant);
  const whatsapps = (s.whatsapps ?? []).map((w) => w.replace(/\D/g, "")).filter(Boolean);

  return {
    tenant,
    info: {
      slug: tenant.slug,
      nombre: branding.displayName,
      eslogan: s.eslogan ?? null,
      logo: branding.logo || null,
      whatsapp: whatsapps[0] ?? tenant.whatsapp?.replace(/\D/g, "") ?? null,
      whatsapps,
      instagram: s.instagram ?? null,
      facebook: s.facebook ?? null,
      mercadolibre: s.mercadolibre ?? null,
      email: tenant.email ?? null,
      horarios: s.horarios ?? null,
      sucursales: s.sucursales ?? [],
      serviciosFooter: s.serviciosFooter ?? [],
    },
  };
}

/** Select liviano para cards de vehículo en el sitio. */
export const CONCE_CARD_SELECT = {
  id: true,
  slug: true,
  marca: true,
  modelo: true,
  version: true,
  anio: true,
  km: true,
  precio: true,
  moneda: true,
  condicion: true,
  tipo: true,
  transmision: true,
  combustible: true,
  fotos: true,
  destacado: true,
  oferta: true,
  estado: true,
  createdAt: true,
} as const;

/** Card serializable para el client. */
export type ConceCardData = {
  id: string;
  slug: string;
  marca: string;
  modelo: string;
  version: string | null;
  anio: number;
  km: number;
  precio: number | null;
  moneda: string;
  condicion: string;
  tipo: string;
  transmision: string | null;
  combustible: string | null;
  foto: string | null;
  fotosCount: number;
  destacado: boolean;
  oferta: boolean;
  estado: string;
};

export function aCardVehiculo(v: {
  id: string;
  slug: string;
  marca: string;
  modelo: string;
  version: string | null;
  anio: number;
  km: number;
  precio: number | null;
  moneda: string;
  condicion: string;
  tipo: string;
  transmision: string | null;
  combustible: string | null;
  fotos: unknown;
  destacado: boolean;
  oferta: boolean;
  estado: string;
}): ConceCardData {
  const fotos = fotosDeVehiculo(v.fotos);
  return {
    id: v.id,
    slug: v.slug,
    marca: v.marca,
    modelo: v.modelo,
    version: v.version,
    anio: v.anio,
    km: v.km,
    precio: v.precio,
    moneda: v.moneda,
    condicion: v.condicion,
    tipo: v.tipo,
    transmision: v.transmision,
    combustible: v.combustible,
    foto: fotos[0] ?? null,
    fotosCount: fotos.length,
    destacado: v.destacado,
    oferta: v.oferta,
    estado: v.estado,
  };
}

/** Marcas reales del stock activo (para selects de filtros). */
export async function conceMarcas(clientId: string): Promise<string[]> {
  const rows = await db.conceVehiculo.groupBy({
    by: ["marca"],
    where: { clientId, estado: { not: "vendido" } },
    _count: { _all: true },
    orderBy: { _count: { marca: "desc" } },
  });
  return rows.map((r) => r.marca);
}
