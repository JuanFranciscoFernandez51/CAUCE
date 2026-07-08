import type { BizArea } from "@prisma/client";

/**
 * CATÁLOGO DE PROCESOS — el nuevo "recetario", en código.
 *
 * Cada entrada es un proceso CONCRETO que Cauce deja corriendo dentro del
 * software del cliente (crons de Vercel + emails Resend + links wa.me),
 * sin herramientas externas. Los textos están en criollo porque son los
 * que ve el cliente en su lista de "cómo está armado mi negocio".
 *
 * Origen de cada proceso: los negocios reales donde ya funciona
 * (Motos Fernández, Vespa Bahía, La Base, Vespa Club).
 */
export type ProcesoCatalogo = {
  key: string;
  nombre: string;
  /** Qué hace, tal como se le explica al dueño del negocio. */
  queHace: string;
  /** Cuándo corre, en criollo. */
  cuando: string;
  area: BizArea;
  /** Palabras de rubro que activan este proceso en el onboarding. */
  rubros: string[];
  /** Va en toda entrega, sin importar el rubro. */
  base?: boolean;
};

export const PROCESOS_CATALOGO: ProcesoCatalogo[] = [
  // ── Base: van en toda entrega ──────────────────────────
  {
    key: "consulta-al-crm",
    nombre: "Toda consulta entra al CRM",
    queHace:
      "Cada consulta —web, WhatsApp, Instagram o mostrador— queda registrada como cliente, con respuesta de bienvenida al instante. Nada se pierde en el teléfono.",
    cuando: "Cuando entra una consulta",
    area: "ATENCION",
    rubros: [],
    base: true,
  },
  {
    key: "resumen-del-dia",
    nombre: "Resumen del día",
    queHace:
      "Todas las mañanas te llega el día armado: turnos de hoy, tareas pendientes y pagos por vencer. Empezás sabiendo qué hay.",
    cuando: "Todos los días a las 8:00",
    area: "OPERACIONES",
    rubros: [],
    base: true,
  },
  {
    key: "seguimiento-consultas",
    nombre: "Seguimiento de consultas frías",
    queHace:
      "Si una consulta queda sin respuesta del cliente unos días, te avisa y te deja el WhatsApp armado con un clic para retomarla.",
    cuando: "Todos los días a las 10:00",
    area: "VENTAS_CRM",
    rubros: [],
    base: true,
  },

  // ── Turnos y reservas ──────────────────────────────────
  {
    key: "recordatorio-turno",
    nombre: "Recordatorio de turno",
    queHace:
      "Le recuerda el turno al cliente el día anterior por WhatsApp y email. Las ausencias se desploman.",
    cuando: "Todos los días a las 9:00",
    area: "TURNOS",
    rubros: ["turno", "peluquer", "estetic", "salud", "clinic", "clínic", "dental", "consult", "taller", "gimnas", "escuela", "profe"],
  },
  {
    key: "reserva-vence-24h",
    nombre: "Reservas que vencen solas",
    queHace:
      "Una reserva sin pagar se cancela sola a las 24 horas y el lugar se libera. Si hay lista de espera, se le avisa al primero.",
    cuando: "Cada hora",
    area: "TURNOS",
    rubros: ["escuela", "clase", "gimnas", "instructor", "reserva", "evento"],
  },

  // ── Postventa y cobranzas ──────────────────────────────
  {
    key: "recordatorio-service",
    nombre: "Recordatorio de service",
    queHace:
      "A los meses de la compra, le avisa al cliente que le toca el service y le ofrece agendar turno. Es el mensaje que más plata recupera.",
    cuando: "Todos los días a las 12:00",
    area: "VENTAS_CRM",
    rubros: ["moto", "vespa", "auto", "bici", "concesionar", "taller"],
  },
  {
    key: "aviso-cuota",
    nombre: "Aviso de cuotas",
    queHace:
      "Avisa 3 días antes del vencimiento de cada cuota y reclama las atrasadas, con el mensaje de WhatsApp listo para mandar.",
    cuando: "Todos los días a las 12:00",
    area: "FINANZAS",
    rubros: ["moto", "financia", "cuota", "credito", "crédito", "concesionar"],
  },
  {
    key: "carrito-abandonado",
    nombre: "Rescate de carrito",
    queHace:
      "Si alguien carga el carrito y no termina la compra, a las 4 horas le llega un email con su carrito listo para pagar.",
    cuando: "Cada 30 minutos",
    area: "VENTAS_CRM",
    rubros: ["tienda", "indument", "ropa", "ecommerce", "comercio", "bazar", "accesorio"],
  },

  // ── Operaciones ────────────────────────────────────────
  {
    key: "stock-minimo",
    nombre: "Alerta de stock mínimo",
    queHace:
      "Cuando un producto llega al mínimo, te avisa antes de que te quedes sin mercadería.",
    cuando: "Todos los días a las 8:30",
    area: "OPERACIONES",
    rubros: ["tienda", "stock", "mercader", "comercio", "distribu", "mayorista", "repuesto"],
  },
  {
    key: "confirmacion-pedido",
    nombre: "Confirmaciones automáticas",
    queHace:
      "Cada pedido, reserva o turno dispara su email de confirmación al cliente y el aviso a vos. Nadie queda esperando una respuesta.",
    cuando: "Al instante, cuando pasa",
    area: "ATENCION",
    rubros: ["tienda", "pedido", "turno", "reserva", "comercio"],
  },

  // ── Finanzas y fiscal ──────────────────────────────────
  {
    key: "vencimientos-fiscales",
    nombre: "Avisos de vencimientos",
    queHace:
      "Te avisa 7, 3 y 1 día antes de cada vencimiento (IVA, IIBB, cargas sociales) para que ninguno te agarre dormido.",
    cuando: "Todos los días a las 11:00",
    area: "FINANZAS",
    rubros: ["factur", "fiscal", "contad"],
  },

  // ── Eventos deportivos ─────────────────────────────────
  {
    key: "inscripcion-evento",
    nombre: "Inscripciones que se cobran solas",
    queHace:
      "El competidor se inscribe desde la web, paga con Mercado Pago y queda confirmado con su comprobante por email. Si no paga en 45 minutos, el lugar se libera.",
    cuando: "Cuando alguien se inscribe",
    area: "OPERACIONES",
    rubros: ["evento", "club", "carrera", "gymkhana", "deport", "competencia"],
  },
];

/** Procesos sugeridos para un rubro: los base + los que matchean por palabra. */
export function procesosParaRubro(rubro: string | null | undefined): ProcesoCatalogo[] {
  const r = (rubro ?? "").toLowerCase();
  const especificos = PROCESOS_CATALOGO.filter(
    (p) => !p.base && p.rubros.some((palabra) => r.includes(palabra))
  );
  const base = PROCESOS_CATALOGO.filter((p) => p.base);
  return [...base, ...especificos];
}

/** Agrupa el catálogo por área (para la landing y el armador de presupuestos). */
export function catalogoPorArea(): Map<BizArea, ProcesoCatalogo[]> {
  const map = new Map<BizArea, ProcesoCatalogo[]>();
  for (const p of PROCESOS_CATALOGO) {
    const list = map.get(p.area) ?? [];
    list.push(p);
    map.set(p.area, list);
  }
  return map;
}
