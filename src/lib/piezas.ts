/**
 * PIEZAS Y PRECIOS — el modelo de presupuesto de Cauce (jul-2026):
 * BASE fija (lo que va siempre) + piezas con precio chico y visible.
 * La venta se presenta en 3 capas: resultado (horas recuperadas) →
 * caso espejo (así quedó X) → desglose pieza por pieza.
 * Números calibrados con Fran: base 500+40, ancla MF 1.500+80,
 * valor empleado USD 1.500/mes.
 */

/** Costo mensual de un empleado (USD) — para valuar las horas recuperadas. */
export const VALOR_EMPLEADO_USD_MES = 1500;
/** Horas laborales de un mes (~22 días × 8 hs). */
export const HORAS_MES = 176;

export type Pieza = {
  key: string;
  label: string;
  queIncluye: string;
  setupUsd: number;
  monthlyUsd: number;
  /** micro = ajuste fino, se muestran aparte y suman de a poco. */
  micro?: boolean;
};

/** La base va SIEMPRE: sin base no hay entrega. */
export const PIEZA_BASE: Pieza = {
  key: "base",
  label: "Base Cauce",
  queIncluye:
    "Tu página web completa (servicios, fotos, horarios, ubicación, contacto), tu sistema de gestión con CRM y tus procesos automáticos base, todo con tu marca. Hosting, mantenimiento y soporte directo.",
  setupUsd: 300,
  monthlyUsd: 40,
};

export const PIEZAS: Pieza[] = [
  // ── Módulos grandes ────────────────────────────────────
  { key: "taller", label: "Taller / órdenes de trabajo", queIncluye: "Ingreso → diagnóstico → lista → entregada, con fotos, items, saldo, OT imprimible y aviso automático al cliente.", setupUsd: 40, monthlyUsd: 15 },
  { key: "ventas", label: "Ventas con señas y cuotas", queIncluye: "Señas, permutas, pagos, financiación propia, boleto imprimible y 'por cobrar' de un vistazo.", setupUsd: 40, monthlyUsd: 15 },
  { key: "presupuestos", label: "Presupuestos que se convierten", queIncluye: "Cotizás, lo mandás por WhatsApp y al aceptar se convierte en orden de trabajo con un clic.", setupUsd: 40, monthlyUsd: 5 },
  { key: "turnos", label: "Agenda y turnos online", queIncluye: "Calendario mensual y semanal, tus clientes se agendan solos desde la web, recordatorios y lista de espera.", setupUsd: 40, monthlyUsd: 10 },
  { key: "catalogo", label: "Catálogo y stock", queIncluye: "Productos con fotos, precios, stock por talle y alerta de mínimos.", setupUsd: 40, monthlyUsd: 10 },
  { key: "caja", label: "Finanzas y caja diaria", queIncluye: "Arqueo de caja con diferencia en verde/rojo, cuentas, costos fijos y punto de equilibrio del mes.", setupUsd: 40, monthlyUsd: 10 },
  { key: "eventos", label: "Eventos con cronómetro", queIncluye: "Inscripción online, cronómetro con penalizaciones y ranking en vivo para proyectar en pantalla.", setupUsd: 40, monthlyUsd: 15 },
  { key: "rrhh", label: "Equipo y fichaje", queIncluye: "Tu gente, sus horarios y sus fichadas, ordenados.", setupUsd: 40, monthlyUsd: 5 },

  // ── Micro-piezas (ajuste fino, precios chicos) ─────────
  { key: "pestana-extra", label: "Pestaña de admin extra", queIncluye: "Una sección más, a tu medida.", setupUsd: 40, monthlyUsd: 2, micro: true },
  { key: "carrito", label: "Carrito de ventas en la web", queIncluye: "Tus clientes arman el pedido desde la web.", setupUsd: 40, monthlyUsd: 2, micro: true },
  { key: "filtros", label: "Filtros y búsquedas avanzadas", queIncluye: "Encontrá cualquier cosa en dos letras.", setupUsd: 40, monthlyUsd: 1, micro: true },
  { key: "imprimibles", label: "Documentos imprimibles con tu marca", queIncluye: "OTs, boletos y presupuestos en PDF, listos para firmar.", setupUsd: 40, monthlyUsd: 1, micro: true },
  { key: "campos-propios", label: "Campos a medida", queIncluye: "Los datos que TU negocio necesita (patente, talle, obra social…).", setupUsd: 40, monthlyUsd: 1, micro: true },
  { key: "galeria-fotos", label: "Galería de fotos en la web", queIncluye: "El local por dentro, en la página.", setupUsd: 40, monthlyUsd: 1, micro: true },
];

/** Casos espejo: la puerta de entrada del presupuesto ("querés algo como esto"). */
export type Espejo = {
  key: string;
  nombre: string;
  rubro: string;
  historia: string;
  /** Tenant del que salen las capturas reales. */
  shotsSlug: string;
  /** El ancla de precio del caso. */
  setupUsd: number;
  monthlyUsd: number;
  /** Piezas que lleva este armado (para precargar el armador). */
  piezas: string[];
};

export const ESPEJOS: Espejo[] = [
  {
    key: "motos",
    nombre: "Motos Fernández",
    rubro: "Concesionaria y taller de motos · Bahía Blanca",
    historia: "Ventas con cuotas y permutas, taller completo y recordatorios de service que recuperan clientes solos. Su dueño hoy se dedica a vender.",
    shotsSlug: "bahiamotos",
    setupUsd: 999,
    monthlyUsd: 80,
    piezas: ["taller", "ventas", "presupuestos", "catalogo", "caja", "imprimibles", "campos-propios", "filtros"],
  },
  {
    key: "escuela",
    nombre: "Escuela deportiva",
    rubro: "Clases, instructores y reservas · costa",
    historia: "Los alumnos se agendan solos desde la web, con recordatorios automáticos y lista de espera cuando el día se llena. Caja diaria con arqueo.",
    shotsSlug: "escuelaolas",
    setupUsd: 999,
    monthlyUsd: 65,
    piezas: ["turnos", "caja", "galeria-fotos", "filtros"],
  },
  {
    key: "club",
    nombre: "Club con eventos",
    rubro: "Club de motos y competencias",
    historia: "Inscripciones online que caen al CRM, cronómetro con penalizaciones y ranking en vivo proyectado en pantalla el día de la fecha.",
    shotsSlug: "clubpiston",
    setupUsd: 999,
    monthlyUsd: 60,
    piezas: ["eventos", "caja", "galeria-fotos"],
  },
];

const todasLasPiezas = new Map(PIEZAS.map((p) => [p.key, p]));

/** Suma base + piezas elegidas. */
export function calcularPiezas(keys: string[]): { setupUsd: number; monthlyUsd: number } {
  let setup = PIEZA_BASE.setupUsd;
  let monthly = PIEZA_BASE.monthlyUsd;
  for (const k of keys) {
    const p = todasLasPiezas.get(k);
    if (!p) continue;
    setup += p.setupUsd;
    monthly += p.monthlyUsd;
  }
  return { setupUsd: setup, monthlyUsd: monthly };
}

/** Valor mensual (USD) de las horas semanales recuperadas, a costo de empleado. */
export function valorHorasUsdMes(horasSemana: number): number {
  const horasMes = horasSemana * 4.33;
  return Math.round((horasMes * VALOR_EMPLEADO_USD_MES) / HORAS_MES);
}
