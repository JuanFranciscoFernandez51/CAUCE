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
  /** Horas por semana que le ahorra al negocio (estimación honesta). */
  horasSemana: number;
};

export const PROCESOS_CATALOGO: ProcesoCatalogo[] = [
  // ── Base: van en toda entrega ──────────────────────────
  {
    key: "consulta-al-crm",
    horasSemana: 2,
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
    horasSemana: 1,
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
    horasSemana: 1.5,
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
    horasSemana: 2,
    nombre: "Recordatorio de turno",
    queHace:
      "Le recuerda el turno al cliente el día anterior por WhatsApp y email. Las ausencias se desploman.",
    cuando: "Todos los días a las 9:00",
    area: "TURNOS",
    rubros: ["turno", "peluquer", "estetic", "salud", "clinic", "clínic", "dental", "consult", "taller", "gimnas", "escuela", "profe", "service", "scooter", "moto"],
  },
  {
    key: "reserva-vence-24h",
    horasSemana: 1,
    nombre: "Reservas que vencen solas",
    queHace:
      "Una reserva sin pagar se cancela sola a las 24 horas y el lugar se libera. Si hay lista de espera, se le avisa al primero.",
    cuando: "Cada hora",
    area: "TURNOS",
    rubros: ["escuela", "clase", "gimnas", "instructor", "reserva", "evento"],
  },
  {
    key: "lista-espera",
    horasSemana: 0.5,
    nombre: "Lista de espera que avisa sola",
    queHace:
      "Si un día está lleno, el cliente se anota desde la web. Cuando alguien cancela, te aparece el aviso con el WhatsApp listo para ofrecerle el lugar al primero de la fila.",
    cuando: "Cuando se libera un lugar",
    area: "TURNOS",
    rubros: ["turno", "peluquer", "estetic", "salud", "clinic", "clínic", "dental", "gimnas", "escuela", "taller", "service", "moto", "scooter"],
  },

  // ── Postventa y cobranzas ──────────────────────────────
  {
    key: "recordatorio-service",
    horasSemana: 2,
    nombre: "Recordatorio de service",
    queHace:
      "A los meses de la compra, le avisa al cliente que le toca el service y le ofrece agendar turno. Es el mensaje que más plata recupera.",
    cuando: "Todos los días a las 12:00",
    area: "VENTAS_CRM",
    rubros: ["moto", "vespa", "scooter", "auto", "bici", "concesionar", "taller", "service"],
  },
  {
    key: "aviso-cuota",
    horasSemana: 1,
    nombre: "Aviso de cuotas",
    queHace:
      "Avisa 3 días antes del vencimiento de cada cuota y reclama las atrasadas, con el mensaje de WhatsApp listo para mandar.",
    cuando: "Todos los días a las 12:00",
    area: "FINANZAS",
    rubros: ["moto", "financia", "cuota", "credito", "crédito", "concesionar"],
  },
  {
    key: "aviso-cobro-mensual",
    horasSemana: 2,
    nombre: "Aviso de cobro mensual",
    queHace:
      "Del 1 al 5 de cada mes arma la lista de clientes con abono activo y el WhatsApp de cobro listo para mandar, con el monto de cada uno. Nadie se queda sin avisar.",
    cuando: "Del 1 al 5 de cada mes, a las 9:00",
    area: "FINANZAS",
    rubros: ["pantalla", "publicidad", "abono", "mensual", "suscrip", "gimnasio", "led"],
  },
  {
    key: "carrito-abandonado",
    horasSemana: 0.5,
    nombre: "Rescate de carrito",
    queHace:
      "Si alguien carga el carrito y no termina la compra, a las 4 horas le llega un email con su carrito listo para pagar.",
    cuando: "Cada 30 minutos",
    area: "VENTAS_CRM",
    rubros: ["tienda", "indument", "ropa", "ecommerce", "comercio", "bazar", "accesorio"],
  },

  {
    key: "trabajo-listo",
    horasSemana: 1,
    nombre: "Aviso de trabajo listo",
    queHace:
      "Cuando marcás una orden de trabajo como lista, el aviso al cliente aparece armado con el WhatsApp a un clic: 'tu equipo está para retirar'.",
    cuando: "Cuando el trabajo está listo",
    area: "ATENCION",
    rubros: ["taller", "moto", "vespa", "scooter", "bici", "service", "mecanic", "reparac"],
  },

  // ── Operaciones ────────────────────────────────────────
  {
    key: "stock-minimo",
    horasSemana: 0.5,
    nombre: "Alerta de stock mínimo",
    queHace:
      "Cuando un producto llega al mínimo, te avisa antes de que te quedes sin mercadería.",
    cuando: "Todos los días a las 8:30",
    area: "OPERACIONES",
    rubros: ["tienda", "stock", "mercader", "comercio", "distribu", "mayorista", "repuesto"],
  },
  {
    key: "confirmacion-pedido",
    horasSemana: 1.5,
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
    horasSemana: 0.5,
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
    horasSemana: 3,
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
