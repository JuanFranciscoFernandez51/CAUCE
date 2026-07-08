/**
 * Helpers del onboarding 1-click. Reglas por RUBRO (keyword-insensible a acentos):
 * - módulos default sugeridos,
 * - settings de ejemplo (servicios + "sobre") para que el sitio no nazca vacío.
 *
 * Todo es DATO/CONFIG; cero forks. El form puede sobreescribir los módulos.
 */

import type { OsModule } from "@/lib/tenant";
import { OS_MODULES } from "@/lib/tenant";

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

type RubroKey =
  | "salud"
  | "peluqueria"
  | "gastronomia"
  | "inmobiliaria"
  | "agencia"
  | "tienda"
  | "taller"
  | "gimnasio"
  | "generico";

interface RubroProfile {
  key: RubroKey;
  match: string[];
  modules: OsModule[];
  /** Servicios de ejemplo para el sitio público. */
  servicios: { nombre: string; detalle: string }[];
  /** Texto "sobre el negocio" de ejemplo. */
  sobre: string;
}

/** "sitio" SIEMPRE está; el resto sale del perfil del rubro. */
const PROFILES: RubroProfile[] = [
  {
    key: "salud",
    match: ["salud", "clinica", "consultorio", "odonto", "dental", "medic", "kinesio", "psico", "nutri"],
    modules: ["crm", "turnos", "rrhh", "caja", "sitio"],
    servicios: [
      { nombre: "Primera consulta", detalle: "Evaluación inicial y plan de tratamiento personalizado." },
      { nombre: "Control y seguimiento", detalle: "Turnos de seguimiento para acompañar tu evolución." },
      { nombre: "Urgencias", detalle: "Atención prioritaria coordinada por WhatsApp." },
    ],
    sobre:
      "Somos un equipo de salud cercano y profesional. Reservá tu turno online y recibí recordatorios automáticos para no perderte ninguna cita.",
  },
  {
    key: "peluqueria",
    match: ["peluqu", "barber", "estetic", "spa", "uñas", "manicur", "belleza", "cosmet"],
    modules: ["crm", "turnos", "caja", "catalogo", "sitio"],
    servicios: [
      { nombre: "Corte y peinado", detalle: "Asesoramiento de estilo según tu cara y tu look." },
      { nombre: "Color y tratamientos", detalle: "Coloración, nutrición y brillo con productos premium." },
      { nombre: "Estética", detalle: "Manicura, pedicura y servicios de belleza integral." },
    ],
    sobre:
      "Tu estilo en las mejores manos. Reservá tu turno por WhatsApp en los horarios reales del salón y recibí recordatorios para no perderlo.",
  },
  {
    key: "gastronomia",
    match: ["gastro", "restaur", "resto", "bar", "pizzer", "cafe", "cafetería", "comida", "delivery", "helader", "panader"],
    modules: ["crm", "catalogo", "caja", "sitio"],
    servicios: [
      { nombre: "Salón", detalle: "Atención en el local con la mejor experiencia." },
      { nombre: "Delivery", detalle: "Te lo llevamos a casa, rápido y caliente." },
      { nombre: "Take away", detalle: "Pedí y retirá sin esperas." },
    ],
    sobre:
      "Cocina de verdad, ingredientes de verdad. Mirá nuestra carta, hacé tu pedido y seguilo en tiempo real.",
  },
  {
    key: "inmobiliaria",
    match: ["inmobil", "propiedad", "bienes raices", "real estate", "alquiler", "venta de propiedades"],
    modules: ["crm", "turnos", "caja", "sitio"],
    servicios: [
      { nombre: "Venta", detalle: "Tasamos y comercializamos tu propiedad con respaldo profesional." },
      { nombre: "Alquiler", detalle: "Gestión integral de alquileres, garantías y contratos." },
      { nombre: "Tasaciones", detalle: "Valuación de mercado clara y sin compromiso." },
    ],
    sobre:
      "Te acompañamos en la operación más importante. Mirá nuestras propiedades, coordiná una visita y recibí seguimiento personalizado.",
  },
  {
    key: "agencia",
    match: ["agencia", "marketing", "publicidad", "comunicacion", "branding", "creativa", "ads", "diseño", "software"],
    modules: ["crm", "proyectos", "rrhh", "caja", "sitio"],
    servicios: [
      { nombre: "Estrategia & branding", detalle: "Construimos tu marca de la identidad al mensaje." },
      { nombre: "Performance & Ads", detalle: "Campañas que venden, medidas al peso." },
      { nombre: "Contenido & redes", detalle: "Calendario, producción y comunidad activa." },
    ],
    sobre:
      "Hacemos crecer negocios con estrategia, creatividad y datos. Contanos tu proyecto y armamos una propuesta a medida.",
  },
  {
    key: "tienda",
    match: ["tienda", "comercio", "ropa", "indument", "moda", "ecommerce", "e-commerce", "boutique", "kiosco", "almacen", "distribu", "mayorista"],
    modules: ["crm", "catalogo", "caja", "sitio"],
    servicios: [
      { nombre: "Catálogo online", detalle: "Mirá todos nuestros productos con stock al día." },
      { nombre: "Envíos", detalle: "Despachamos a todo el país." },
      { nombre: "Atención por WhatsApp", detalle: "Te asesoramos y cerramos la compra al instante." },
    ],
    sobre:
      "Los productos que buscás, con el stock siempre actualizado. Comprá fácil y recibí novedades y ofertas.",
  },
  {
    key: "taller",
    match: ["taller", "mecanic", "service", "scooter", "moto", "automotor", "vehicul", "gomeria", "chapa", "pintura", "lubricentro"],
    modules: ["crm", "turnos", "caja", "sitio"],
    servicios: [
      { nombre: "Service general", detalle: "Mantenimiento preventivo completo de tu vehículo." },
      { nombre: "Diagnóstico", detalle: "Detectamos la falla y te pasamos presupuesto claro." },
      { nombre: "Reparaciones", detalle: "Trabajos con repuestos de calidad y garantía." },
    ],
    sobre:
      "Tu vehículo en manos de confianza. Pedí turno para el service, recibí recordatorios y mantené tu historial al día.",
  },
  {
    key: "gimnasio",
    match: ["gimnasio", "gym", "fitness", "crossfit", "pilates", "yoga", "box", "deportiv", "natacion"],
    modules: ["crm", "turnos", "rrhh", "caja", "sitio"],
    servicios: [
      { nombre: "Musculación", detalle: "Sala equipada con plan personalizado." },
      { nombre: "Clases grupales", detalle: "Funcional, ritmos y más, todos los días." },
      { nombre: "Entrenamiento personalizado", detalle: "Acompañamiento 1 a 1 para tus objetivos." },
    ],
    sobre:
      "Vení a entrenar con nosotros. Reservá tu clase, sumate a la comunidad y recibí seguimiento para no aflojar.",
  },
];

const GENERIC: RubroProfile = {
  key: "generico",
  match: [],
  modules: ["crm", "caja", "sitio"],
  servicios: [
    { nombre: "Nuestros servicios", detalle: "Contanos qué necesitás y te ayudamos." },
    { nombre: "Atención por WhatsApp", detalle: "Respondemos tus consultas al instante." },
  ],
  sobre: "Bienvenido. Conocé lo que hacemos y escribinos para empezar.",
};

/** Resuelve el perfil del rubro (keyword match, acento-insensible). */
export function resolveRubroProfile(rubro: string | null | undefined): RubroProfile {
  const r = norm(rubro ?? "");
  if (r) {
    for (const p of PROFILES) {
      if (p.match.some((kw) => r.includes(norm(kw)))) return p;
    }
  }
  return GENERIC;
}

/** Módulos default sugeridos para el rubro (incluye "sitio"). */
export function defaultModulesForRubro(rubro: string | null | undefined): OsModule[] {
  return resolveRubroProfile(rubro).modules;
}

/** Sanea/normaliza una lista de módulos elegidos: válidos, sin duplicar, "sitio" siempre. */
export function normalizeModules(input: string[] | undefined): OsModule[] {
  const valid = (input ?? []).filter((m): m is OsModule => (OS_MODULES as readonly string[]).includes(m));
  const set = new Set<OsModule>(valid);
  set.add("sitio");
  // Preservar orden canónico de OS_MODULES
  return OS_MODULES.filter((m) => set.has(m));
}

/** Settings de ejemplo (servicios + sobre) para sembrar el sitio del rubro. */
export function seedSettingsForRubro(
  rubro: string | null | undefined,
  nombre: string
): { servicios: { nombre: string; detalle: string }[]; sobre: string } {
  const p = resolveRubroProfile(rubro);
  return {
    servicios: p.servicios,
    sobre: p.sobre.replace(/\bnosotros\b/i, nombre),
  };
}

