/**
 * Contenido institucional del sitio público, generalizado para CUALQUIER rubro.
 *
 * FILOSOFÍA Cauce: una sola codebase, todo por config/datos. La info real del
 * negocio vive en `Client.settings` (Json). Si falta, caemos en defaults por
 * rubro (resueltos vía el playbook) para que ningún tenant vea una home vacía.
 *
 * Nada de hex acá: los colores los pone el branding del tenant en site-shell.
 */
import type { Client } from "@prisma/client";
import { playbookForClient, type Playbook } from "@/lib/playbooks";

/** Un servicio/ítem del "Qué hacemos". */
export type Servicio = {
  titulo: string;
  detalle?: string;
};

export type SiteContent = {
  /** Frase del rubro para el hero (del playbook). */
  heroSubtitle: string;
  /** Lista de servicios (de settings.servicios o defaults por rubro). */
  servicios: Servicio[];
  /** Texto "Sobre nosotros" (de settings.sobre, si existe). */
  sobre: string | null;
  /** Cómo titular la sección de servicios según el rubro. */
  serviciosTitle: string;
  /** Cómo titular el catálogo de productos según el rubro. */
  catalogoTitle: string;
};

/** Normaliza un valor de settings que puede venir en varias formas a Servicio[]. */
function parseServicios(raw: unknown): Servicio[] {
  if (!Array.isArray(raw)) return [];
  const out: Servicio[] = [];
  for (const item of raw) {
    if (typeof item === "string" && item.trim()) {
      out.push({ titulo: item.trim() });
    } else if (item && typeof item === "object") {
      const o = item as Record<string, unknown>;
      const titulo =
        (typeof o.titulo === "string" && o.titulo.trim()) ||
        (typeof o.title === "string" && o.title.trim()) ||
        (typeof o.nombre === "string" && o.nombre.trim()) ||
        "";
      if (!titulo) continue;
      const detalle =
        (typeof o.detalle === "string" && o.detalle.trim()) ||
        (typeof o.descripcion === "string" && o.descripcion.trim()) ||
        (typeof o.description === "string" && o.description.trim()) ||
        undefined;
      out.push({ titulo, detalle: detalle || undefined });
    }
  }
  return out;
}

/** Servicios de ejemplo por rubro (clave del playbook) — fallback honesto. */
const DEFAULT_SERVICIOS: Record<string, Servicio[]> = {
  inmobiliaria: [
    { titulo: "Compra y venta", detalle: "Te acompañamos en cada paso de la operación." },
    { titulo: "Alquileres", detalle: "Propiedades para vivir o invertir, con gestión integral." },
    { titulo: "Tasaciones", detalle: "Valuación profesional y sin cargo de tu propiedad." },
  ],
  clinica: [
    { titulo: "Consultas y diagnóstico", detalle: "Atención personalizada con turno previo." },
    { titulo: "Tratamientos", detalle: "Planes a medida según cada caso." },
    { titulo: "Controles y seguimiento", detalle: "Te acompañamos en toda la evolución." },
  ],
  peluqueria: [
    { titulo: "Cortes y peinados", detalle: "Para cada estilo y ocasión." },
    { titulo: "Color y tratamientos", detalle: "Cuidamos tu cabello con los mejores productos." },
    { titulo: "Reservá tu turno", detalle: "Elegí día, hora y profesional online." },
  ],
  gimnasio: [
    { titulo: "Clases grupales", detalle: "Funcional, ritmos y más, en grupos reducidos." },
    { titulo: "Entrenamiento personalizado", detalle: "Planes según tu objetivo." },
    { titulo: "Asesoramiento", detalle: "Te acompañamos para que llegues a tu meta." },
  ],
  taller: [
    { titulo: "Service y mantenimiento", detalle: "Mantené tu vehículo siempre a punto." },
    { titulo: "Diagnóstico y reparación", detalle: "Detectamos y resolvemos el problema." },
    { titulo: "Repuestos y accesorios", detalle: "Originales y de calidad." },
  ],
  gastronomia: [
    { titulo: "Salón", detalle: "Te esperamos para disfrutar nuestra cocina." },
    { titulo: "Delivery y take away", detalle: "Pedí y disfrutá donde quieras." },
    { titulo: "Eventos", detalle: "Organizamos tu celebración." },
  ],
  hotel: [
    { titulo: "Habitaciones", detalle: "Confort y descanso para tu estadía." },
    { titulo: "Reservas online", detalle: "Asegurá tu lugar en pocos pasos." },
    { titulo: "Servicios", detalle: "Todo lo que necesitás para una estadía perfecta." },
  ],
  tienda: [
    { titulo: "Catálogo online", detalle: "Mirá todos nuestros productos." },
    { titulo: "Envíos", detalle: "Te lo llevamos a donde estés." },
    { titulo: "Atención personalizada", detalle: "Escribinos y te asesoramos." },
  ],
  distribuidora: [
    { titulo: "Venta mayorista", detalle: "Mejores precios por volumen." },
    { titulo: "Logística propia", detalle: "Entregas en tiempo y forma." },
    { titulo: "Cuenta corriente", detalle: "Condiciones a medida para tu comercio." },
  ],
  contable: [
    { titulo: "Liquidación de impuestos", detalle: "Cumplí en fecha y sin dolores de cabeza." },
    { titulo: "Asesoramiento", detalle: "Te orientamos en cada decisión." },
    { titulo: "Gestión integral", detalle: "Nos ocupamos de toda tu administración." },
  ],
  escuela: [
    { titulo: "Clases para todos los niveles", detalle: "Desde principiantes a avanzados." },
    { titulo: "Instructores certificados", detalle: "Aprendé con los mejores." },
    { titulo: "Reservá tu clase", detalle: "Elegí día y horario online." },
  ],
  agencia: [
    { titulo: "Estrategia y branding", detalle: "Construimos tu marca desde cero." },
    { titulo: "Campañas de publicidad", detalle: "Llegá a más clientes." },
    { titulo: "Contenido y redes", detalle: "Gestionamos tu presencia digital." },
  ],
  generico: [
    { titulo: "Nuestros servicios", detalle: "Soluciones pensadas para vos." },
    { titulo: "Atención personalizada", detalle: "Escribinos y te ayudamos." },
    { titulo: "Calidad garantizada", detalle: "Trabajamos para que estés conforme." },
  ],
};

/** Títulos de sección de catálogo según rubro. */
function catalogoTitleFor(playbookKey: string): string {
  switch (playbookKey) {
    case "gastronomia":
      return "Nuestra carta";
    case "tienda":
      return "Catálogo";
    case "distribuidora":
      return "Productos";
    default:
      return "Catálogo";
  }
}

/** Títulos de sección de servicios según rubro. */
function serviciosTitleFor(playbookKey: string): string {
  switch (playbookKey) {
    case "agencia":
      return "Qué hacemos";
    case "gastronomia":
      return "Nuestra propuesta";
    default:
      return "Qué hacemos";
  }
}

/** Lee del setting `sobre`/`acerca` un texto plano, si existe. */
function readSobre(client: Client): string | null {
  const cfg = (client.settings as Record<string, unknown> | null) ?? {};
  for (const k of ["sobre", "acerca", "about", "descripcion", "nosotros"]) {
    const v = cfg[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return null;
}

/**
 * Resuelve el contenido institucional de un tenant: lee settings y completa
 * con defaults por rubro. Nunca devuelve listas vacías de servicios.
 */
export function siteContent(client: Client, playbook?: Playbook): SiteContent {
  const pb = playbook ?? playbookForClient(client);
  const cfg = (client.settings as Record<string, unknown> | null) ?? {};

  const fromSettings = parseServicios(cfg.servicios ?? cfg.services);
  const servicios =
    fromSettings.length > 0
      ? fromSettings
      : DEFAULT_SERVICIOS[pb.key] ?? DEFAULT_SERVICIOS.generico;

  return {
    heroSubtitle: pb.heroSubtitle,
    servicios,
    sobre: readSobre(client),
    serviciosTitle: serviciosTitleFor(pb.key),
    catalogoTitle: catalogoTitleFor(pb.key),
  };
}

/** Precio de producto formateado (USD si hay, si no ARS, si no "Consultar"). */
export function fmtProductPrice(opts: {
  priceUsd?: number | null;
  priceArs?: number | null;
}): string {
  if (opts.priceUsd != null) {
    return `USD ${opts.priceUsd.toLocaleString("es-AR", { maximumFractionDigits: 0 })}`;
  }
  if (opts.priceArs != null) {
    return `$ ${opts.priceArs.toLocaleString("es-AR", { maximumFractionDigits: 0 })}`;
  }
  return "Consultar";
}
