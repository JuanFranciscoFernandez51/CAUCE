import type { BizArea } from "@prisma/client";

/**
 * Casos de uso públicos — organizados por DOLOR, no por industria.
 * Cada caso matchea un BizArea para traer las recetas reales de la DB.
 */
export type Caso = {
  slug: string;
  /** Título en primera persona: el dolor tal como lo dice el dueño del negocio. */
  dolor: string;
  /** Descripción del dolor, en el idioma del cliente. */
  descripcion: string;
  /** Cómo lo encauza Cauce — el "después". */
  solucion: string;
  area: BizArea;
  icon: string;
};

export const CASOS: Caso[] = [
  {
    slug: "no-doy-abasto-con-los-mensajes",
    dolor: "No doy abasto respondiendo mensajes",
    descripcion:
      "WhatsApp e Instagram explotan a toda hora. Respondés lo mismo cien veces, se te pasan consultas y cada mensaje sin contestar es una venta que se va a la competencia.",
    solucion:
      "Un bot con IA atiende 24/7 en tu tono: responde precios, horarios y preguntas frecuentes, deriva lo difícil a un humano y deja cada consulta registrada como lead. Vos solo entrás cuando hace falta cerrar.",
    area: "ATENCION",
    icon: "💬",
  },
  {
    slug: "presupuestos-que-se-enfrian",
    dolor: "Mando presupuestos y después nadie los sigue",
    descripcion:
      "Pasás el presupuesto, el cliente dice \"lo veo y te aviso\"… y ahí muere. Sin seguimiento, cada presupuesto enfriado es plata que ya tenías casi adentro.",
    solucion:
      "Cada presupuesto entra a un CRM que se mueve solo: recordatorios automáticos por WhatsApp a los días justos, alertas cuando un cliente se enfría y un tablero donde ves exactamente qué plata está en juego.",
    area: "VENTAS_CRM",
    icon: "📋",
  },
  {
    slug: "publicar-todos-los-dias",
    dolor: "No llego a publicar todos los días",
    descripcion:
      "Sabés que hay que estar en redes, pero entre atender y producir no te queda tiempo. Publicás cuando podés, sin constancia, y el alcance se desploma.",
    solucion:
      "La IA genera el contenido con tu tono y tus productos, te lo deja listo para aprobar y lo publica en horario. Vos revisás cinco minutos por semana; las redes corren solas.",
    area: "MARKETING",
    icon: "📣",
  },
  {
    slug: "stock-y-pedidos",
    dolor: "El stock y los pedidos me comen el día",
    descripcion:
      "Planillas desactualizadas, pedidos anotados en papelitos, faltantes que descubrís cuando el cliente ya pagó. Cada error de stock cuesta plata y reputación.",
    solucion:
      "Pedidos y stock sincronizados de punta a punta: cada venta descuenta inventario, los faltantes avisan solos antes de quedarte sin mercadería y los pedidos fluyen sin papelitos.",
    area: "OPERACIONES",
    icon: "📦",
  },
  {
    slug: "turnos-y-ausencias",
    dolor: "Pierdo plata con turnos que no se presentan",
    descripcion:
      "Coordinar turnos por WhatsApp es un ida y vuelta interminable. Y cuando el cliente falta sin avisar, ese hueco en la agenda no lo recuperás más.",
    solucion:
      "El bot agenda solo, manda recordatorios automáticos antes del turno y reagenda cancelaciones al toque. Las ausencias se desploman y tu agenda se llena sin que toques el teléfono.",
    area: "TURNOS",
    icon: "📅",
  },
  {
    slug: "horarios-de-empleados",
    dolor: "Armar los horarios del equipo es un dolor de cabeza",
    descripcion:
      "Francos, cambios de turno, llegadas tarde, horas extra que nadie registra. Todos los meses la misma pelea con la planilla y las dudas a fin de mes.",
    solucion:
      "Fichaje y horarios automatizados: cada empleado registra entrada y salida desde el celular, los cambios de turno se piden y aprueban solos, y a fin de mes tenés las horas calculadas sin discusiones.",
    area: "RRHH",
    icon: "👥",
  },
  {
    slug: "cobranzas-y-facturas",
    dolor: "Cobrar y facturar me lleva horas todas las semanas",
    descripcion:
      "Perseguir pagos vencidos da vergüenza y lleva tiempo. Facturar a mano, conciliar transferencias y saber cuánta plata entró de verdad es un trabajo aparte.",
    solucion:
      "Recordatorios de pago que salen solos (y cobran sin que vos persigas a nadie), facturación automática y un reporte de caja que te llega listo. La plata entra y vos te enterás, no la perseguís.",
    area: "FINANZAS",
    icon: "💸",
  },
];

export function getCaso(slug: string): Caso | undefined {
  return CASOS.find((c) => c.slug === slug);
}

// ── Negocios reales (capturas) ────────────────────────────
/**
 * Una captura real guardada en Client.settings.shots por
 * scripts/capturar-cliente.ts (subida a Cloudinary).
 */
export type Shot = {
  titulo: string;
  grupo: "web" | "sistema";
  url: string;
};

/** Slugs de tenants demo que queremos destacar como negocios reales, en orden. */
export const NEGOCIOS_DESTACADOS = [
  "marenco-propiedades",
  "lume-studio",
  "pulso-studio",
] as const;

/**
 * Frase honesta de "qué se logró", derivada del rubro cuando no hay una a mano.
 * Son negocios que YA funcionan con Cauce, así que hablamos en presente.
 */
export function logroPorRubro(rubro: string | null | undefined): string {
  const r = (rubro ?? "").toLowerCase();
  if (r.includes("inmob") || r.includes("propiedad"))
    return "Catálogo de propiedades online y consultas que entran solas al CRM.";
  if (r.includes("estudio") || r.includes("studio") || r.includes("dise"))
    return "Web con su marca y la operación ordenada en un solo lugar.";
  if (r.includes("salud") || r.includes("clínic") || r.includes("clinic") || r.includes("dental") || r.includes("consult"))
    return "Turnos online y agenda que se llena sin atender el teléfono.";
  if (r.includes("distrib") || r.includes("mayor") || r.includes("comercio"))
    return "Pedidos y stock sincronizados, sin planillas ni papelitos.";
  if (r.includes("gimnas") || r.includes("fitness") || r.includes("entren"))
    return "Reservas de clases y seguimiento de clientes, automatizados.";
  return "Su web, su sistema y sus automatizaciones funcionando en paralelo.";
}

/** Extrae las shots de un Client.settings de forma segura (puede no existir). */
export function shotsDeSettings(settings: unknown): Shot[] {
  if (!settings || typeof settings !== "object") return [];
  const raw = (settings as Record<string, unknown>).shots;
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (s): s is Shot =>
      !!s &&
      typeof s === "object" &&
      typeof (s as Shot).url === "string" &&
      typeof (s as Shot).titulo === "string"
  );
}

/** La captura a mostrar: preferimos la de la web; si no hay, la primera que haya. */
export function shotPrincipal(shots: Shot[]): Shot | undefined {
  return shots.find((s) => s.grupo === "web") ?? shots[0];
}

/** Etiquetas en español para cada área de negocio. */
export const AREA_LABELS: Record<BizArea, string> = {
  ATENCION: "Atención al cliente",
  VENTAS_CRM: "Ventas & CRM",
  MARKETING: "Marketing",
  OPERACIONES: "Operaciones & Stock",
  TURNOS: "Turnos & Agenda",
  RRHH: "RRHH",
  FINANZAS: "Finanzas",
};
