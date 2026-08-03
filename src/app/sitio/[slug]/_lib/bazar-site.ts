import type { Client } from "@prisma/client";
import { db } from "@/lib/db";
import { getTenantBySlug, hasModule, tenantBranding } from "@/lib/tenant";
import { bazarSettings, esBazar } from "@/lib/bazar-server";
import { BZ } from "./bazar-paleta";

/**
 * Helpers server del TEMPLATE BAZAR del sitio público.
 * Toda página del template llama getBazarSite(slug) y hace notFound() si es null.
 */

/** Info serializable del negocio que consume el shell (client component). */
export type BazarShellInfo = {
  slug: string;
  nombre: string;
  logo: string | null;
  logoOscuro: string | null; // versión con el trazo en blanco, para modo noche
  whatsapp: string | null;
  instagram: string | null;
  email: string | null;
  direccion: string | null;
  horarios: string | null;
  categorias: string[];
  /** Identidad del tenant: el shell es compartido, la cara no. */
  emoji: string; // motivo (🐚 el bazar, 🏍 repuestos)
  color: string; // color principal de botones y acentos
  colorSuave: string; // bordes y fondos suaves
  sobreColor: string; // texto que va encima del color principal
  colorTexto: string; // títulos y precios
  fondoSuave: string; // franjas y tarjetas
  buscarPlaceholder: string;
  descripcion: string; // la frase del pie
  promesas: string[]; // cinta superior
  popupDescuento: boolean; // el cartelito de bienvenida con descuento
};

export type BazarSite = {
  tenant: Client;
  info: BazarShellInfo;
};

/** Cada template pone su cara sobre la misma tienda. */
function caraDelTemplate(tenant: Client, primario?: string) {
  const tpl = (tenant.settings as { template?: string } | null)?.template;
  if (tpl === "repuestos")
    return {
      emoji: "🏍",
      color: primario || "#F5B301",
      colorSuave: "#E5E5E5",
      sobreColor: "#111111",
      buscarPlaceholder: "Buscá por repuesto o código: cadena, pastillas, batería…",
      colorTexto: "#111111",
      fondoSuave: "#F4F4F2",
      descripcion: "Repuestos y accesorios para motos en Bahía Blanca. Originales y alternativos, para todas las marcas. Despachamos a todo el país.",
      promesas: ["Envíos a todo el país", "Despacho en 24 hs", "Repuestos originales y alternativos", "Atendido por su dueño"],
      popupDescuento: false,
    };
  return {
    emoji: "🐚",
    color: BZ.aqua,
    colorSuave: BZ.aquaClaro,
    sobreColor: "#ffffff",
    buscarPlaceholder: "Buscá vajilla, textiles, deco…",
    colorTexto: BZ.azul,
    fondoSuave: BZ.arena,
    descripcion: "Bazar de playa nacido en Monte Hermoso. De la costa a tu casa. 🌊",
    promesas: [],
    popupDescuento: true,
  };
}

export async function getBazarSite(slug: string): Promise<BazarSite | null> {
  const tenant = await getTenantBySlug(slug);
  if (!tenant || !hasModule(tenant, "sitio") || !esBazar(tenant)) return null;

  const branding = tenantBranding(tenant);
  const settings = bazarSettings(tenant);
  const cara = caraDelTemplate(tenant, branding.primary);

  const categoriasRaw = await db.bazarProducto.groupBy({
    by: ["categoria"],
    where: { clientId: tenant.id, activo: true },
    _count: { _all: true },
    orderBy: { _count: { categoria: "desc" } },
  });

  return {
    tenant,
    info: {
      slug: tenant.slug,
      nombre: branding.displayName,
      logo: branding.logo || null,
      logoOscuro: ((tenant.branding as { logoOscuro?: string } | null)?.logoOscuro) || null,
      whatsapp: tenant.whatsapp?.replace(/\D/g, "") || null,
      instagram: settings.instagram ?? null,
      email: tenant.email ?? null,
      direccion: settings.datosNegocio?.direccion ?? null,
      horarios: settings.horarios ?? null,
      categorias: categoriasRaw.map((c) => c.categoria),
      emoji: cara.emoji,
      color: cara.color,
      colorSuave: cara.colorSuave,
      sobreColor: cara.sobreColor,
      buscarPlaceholder: cara.buscarPlaceholder,
      colorTexto: cara.colorTexto,
      fondoSuave: cara.fondoSuave,
      descripcion: cara.descripcion,
      promesas: cara.promesas,
      popupDescuento: cara.popupDescuento,
    },
  };
}

/** Select liviano para cards de producto en el sitio. */
export const BAZAR_CARD_SELECT = {
  id: true,
  nombre: true,
  slug: true,
  categoria: true,
  precio: true,
  precioOferta: true,
  stock: true,
  fotos: true,
  createdAt: true,
} as const;

/** Card serializable para el client. */
export type BazarCardData = {
  id: string;
  nombre: string;
  slug: string;
  categoria: string;
  precio: number;
  precioOferta: number | null;
  stock: number;
  foto: string | null;
  esNuevo: boolean;
};

export function aCard(p: {
  id: string;
  nombre: string;
  slug: string;
  categoria: string;
  precio: number;
  precioOferta: number | null;
  stock: number;
  fotos: unknown;
  createdAt: Date;
}): BazarCardData {
  const fotos = Array.isArray(p.fotos) ? p.fotos : [];
  return {
    id: p.id,
    nombre: p.nombre,
    slug: p.slug,
    categoria: p.categoria,
    precio: p.precio,
    precioOferta: p.precioOferta,
    stock: p.stock,
    foto: typeof fotos[0] === "string" ? fotos[0] : null,
    esNuevo: Date.now() - p.createdAt.getTime() < 14 * 86_400_000,
  };
}
