/**
 * Motor de PLAYBOOKS por rubro — el corazón de la "profundidad por rubro" de Cauce OS.
 *
 * FILOSOFÍA (inquebrantable): una sola codebase, cero forks. Cada tenant se
 * diferencia por DATOS y CONFIGURACIÓN. Este módulo resuelve un Playbook a partir
 * del campo libre `Client.rubro` y le da al home de cada tenant la cara de un ERP
 * hecho a medida del negocio: cómo llama a sus clientes ("paciente", "huésped",
 * "socio"), qué métricas le importan, qué alertas accionables tiene hoy.
 *
 * Todo se computa SIEMPRE scopeado por clientId. Sin colores hardcodeados:
 * cada KPI/alerta declara un `tone` que las primitivas de ui.tsx tematizan.
 *
 * NOTA sobre CRM (`crmStages`): cada playbook ya declara las etapas propias del
 * rubro, pero el board del CRM (src/app/os/[slug]/crm + _components/crm-board.tsx,
 * contact-detail, contact-new-form y la API PATCH) hoy usan el literal fijo
 * CRM_STAGES de _lib/labels.ts, y los valores de `Contact.stage` están persistidos
 * en la DB. Cablear estas etapas requiere tocar 4 componentes + la ruta API +
 * migrar valores existentes; es riesgoso para esta entrega, así que se deja
 * declarado acá para una próxima iteración SIN tocar el CRM. (ver brief)
 */

import type { PrismaClient } from "@prisma/client";
import type { Client } from "@prisma/client";
import { addDays, argDateStr, dayRange, monthStart } from "@/app/os/[slug]/_lib/dates";

// ── Tipos ────────────────────────────────────────────────

/** Tonos válidos de las primitivas (Stat/Badge) — jamás un hex. */
export type Tone = "default" | "success" | "warning" | "destructive";
export type ButtonVariant = "primary" | "secondary" | "accent" | "ghost";

/** Cómo nombra el negocio a sus contactos y a sus citas. */
export interface Glossary {
  /** Contacto en singular: "paciente", "huésped", "socio", "cliente". */
  contact: string;
  /** Contacto en plural: "pacientes", "huéspedes", "socios". */
  contacts: string;
  /** La cita/turno en singular: "turno", "clase", "reserva", "cita". */
  appointment: string;
  /** La cita/turno en plural: "turnos", "clases", "reservas", "citas". */
  appointments: string;
}

export interface CrmStage {
  key: string;
  label: string;
}

export interface QuickAction {
  label: string;
  /** Href RELATIVO a la base del tenant (`/os/{slug}`). Ej: "/turnos/nuevo". */
  href: string;
  variant: ButtonVariant;
  /** Módulo que debe estar activo para mostrar la acción (opcional). */
  requires?: TenantModule;
}

/** Rangos de fecha pre-calculados que recibe cada compute (hora argentina). */
export interface DateRanges {
  /** "YYYY-MM-DD" de hoy (calendario argentino). */
  today: string;
  todayStart: Date;
  todayEnd: Date;
  /** Fin (exclusivo) de la ventana de 7 días desde hoy. */
  weekEnd: Date;
  /** Primer instante del mes calendario actual. */
  monthStart: Date;
  /** Instante de hace 30 días (para "en riesgo", recurrencia, etc.). */
  thirtyDaysAgo: Date;
  /** Instante de hace 180 días (para "sin contacto hace 6 meses"). */
  sixMonthsAgo: Date;
}

/** Lo mínimo que un compute necesita saber del tenant. */
export interface TenantCtx {
  id: string;
  modules: TenantModule[];
}

type TenantModule = "crm" | "turnos" | "catalogo" | "taller" | "ventas" | "eventos" | "rrhh" | "caja" | "proyectos" | "sitio";

export type KpiValue = number | string;

export interface KpiDef {
  key: string;
  label: string;
  hint?: string;
  tone?: Tone;
  /** Módulo requerido para que el KPI tenga sentido (se filtra si falta). */
  requires?: TenantModule;
  compute: (db: PrismaClient, tenant: TenantCtx, ranges: DateRanges) => Promise<KpiValue>;
}

export interface AlertResult {
  count: number;
  label: string;
  /** Href RELATIVO a la base del tenant. */
  href: string;
  tone?: Tone;
}

export interface AlertDef {
  key: string;
  requires?: TenantModule;
  /** Devuelve la alerta o null si hoy no aplica (no hay nada que avisar). */
  compute: (
    db: PrismaClient,
    tenant: TenantCtx,
    ranges: DateRanges
  ) => Promise<AlertResult | null>;
}

export interface Playbook {
  /** Clave del rubro resuelto (para debug/telemetría). */
  key: string;
  glossary: Glossary;
  heroSubtitle: string;
  crmStages: CrmStage[];
  quickActions: QuickAction[];
  kpis: KpiDef[];
  alerts: AlertDef[];
}

// ── Helpers de fechas para el home ───────────────────────

/** Arma los rangos de fecha (en hora argentina) que consumen los compute. */
export function buildRanges(now: Date = new Date()): DateRanges {
  const today = argDateStr(now);
  const { start: todayStart, end: todayEnd } = dayRange(today);
  const { end: weekEnd } = dayRange(addDays(today, 6));
  return {
    today,
    todayStart,
    todayEnd,
    weekEnd,
    monthStart: monthStart(now),
    thirtyDaysAgo: new Date(now.getTime() - 30 * 86_400_000),
    sixMonthsAgo: new Date(now.getTime() - 180 * 86_400_000),
  };
}

const fmtArs = (n: number) =>
  n.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });

// ── KPIs reutilizables (composición sobre los modelos existentes) ──

const kpiTurnosHoy = (label: string, hint: string): KpiDef => ({
  key: "turnos_hoy",
  label,
  hint,
  requires: "turnos",
  compute: (db, t, r) =>
    db.appointment.count({
      where: {
        clientId: t.id,
        startsAt: { gte: r.todayStart, lt: r.todayEnd },
        status: { not: "CANCELLED" },
      },
    }),
});

const kpiTurnosSemana = (label: string): KpiDef => ({
  key: "turnos_semana",
  label,
  hint: "próximos 7 días",
  requires: "turnos",
  compute: (db, t, r) =>
    db.appointment.count({
      where: {
        clientId: t.id,
        startsAt: { gte: r.todayStart, lt: r.weekEnd },
        status: { not: "CANCELLED" },
      },
    }),
});

const kpiPctConfirmados: KpiDef = {
  key: "pct_confirmados",
  label: "Confirmados hoy",
  hint: "del total agendado hoy",
  requires: "turnos",
  compute: async (db, t, r) => {
    const where = {
      clientId: t.id,
      startsAt: { gte: r.todayStart, lt: r.todayEnd },
      status: { not: "CANCELLED" as const },
    };
    const [total, confirmados] = await Promise.all([
      db.appointment.count({ where }),
      db.appointment.count({ where: { ...where, status: "CONFIRMED" } }),
    ]);
    if (total === 0) return "—";
    return `${Math.round((confirmados / total) * 100)}%`;
  },
};

const kpiContactos = (label: string, hint: string): KpiDef => ({
  key: "contactos",
  label,
  hint,
  requires: "crm",
  compute: (db, t) => db.contact.count({ where: { clientId: t.id } }),
});

const kpiNuevosMes = (label: string): KpiDef => ({
  key: "nuevos_mes",
  label,
  hint: "altas este mes",
  requires: "crm",
  tone: "success",
  compute: (db, t, r) =>
    db.contact.count({ where: { clientId: t.id, createdAt: { gte: r.monthStart } } }),
});

const kpiIngresosMes: KpiDef = {
  key: "ingresos_mes",
  label: "Ingresos del mes",
  hint: "ventas registradas en caja",
  requires: "caja",
  compute: async (db, t, r) => {
    const agg = await db.cashMovement.aggregate({
      where: { clientId: t.id, kind: "venta", createdAt: { gte: r.monthStart } },
      _sum: { amountArs: true },
    });
    return fmtArs(agg._sum.amountArs ?? 0);
  },
};

const kpiVentasHoy: KpiDef = {
  key: "ventas_hoy",
  label: "Ventas de hoy",
  hint: "cobrado en el día",
  requires: "caja",
  tone: "success",
  compute: async (db, t, r) => {
    const agg = await db.cashMovement.aggregate({
      where: {
        clientId: t.id,
        kind: "venta",
        createdAt: { gte: r.todayStart, lt: r.todayEnd },
      },
      _sum: { amountArs: true },
    });
    return fmtArs(agg._sum.amountArs ?? 0);
  },
};

const kpiTicketPromedio: KpiDef = {
  key: "ticket_promedio",
  label: "Ticket promedio",
  hint: "por venta este mes",
  requires: "caja",
  compute: async (db, t, r) => {
    const agg = await db.cashMovement.aggregate({
      where: { clientId: t.id, kind: "venta", createdAt: { gte: r.monthStart } },
      _avg: { amountArs: true },
      _count: true,
    });
    if (!agg._count) return "—";
    return fmtArs(Math.round(agg._avg.amountArs ?? 0));
  },
};

const kpiProductos: KpiDef = {
  key: "productos",
  label: "Productos activos",
  hint: "en tu catálogo",
  requires: "catalogo",
  compute: (db, t) => db.product.count({ where: { clientId: t.id, active: true } }),
};

const kpiStockBajo: KpiDef = {
  key: "stock_bajo",
  label: "Stock bajo",
  hint: "por debajo del mínimo",
  requires: "catalogo",
  tone: "warning",
  compute: async (db, t) => {
    // Prisma no compara dos columnas en `where`; lo resolvemos en memoria
    // sobre el set chico de productos activos del tenant.
    const prods = await db.product.findMany({
      where: { clientId: t.id, active: true },
      select: { stock: true, minStock: true },
    });
    return prods.filter((p) => p.stock <= p.minStock).length;
  },
};

const kpiSociosActivos: KpiDef = {
  key: "socios",
  label: "Socios",
  hint: "total en tu CRM",
  requires: "crm",
  compute: (db, t) => db.contact.count({ where: { clientId: t.id } }),
};

const kpiEnRiesgo = (label: string): KpiDef => ({
  key: "en_riesgo",
  label,
  hint: "sin turno en 30 días",
  requires: "turnos",
  tone: "warning",
  compute: async (db, t, r) => {
    // Contactos cuyo último turno fue hace +30 días (o que nunca tuvieron uno reciente).
    const recientes = await db.appointment.findMany({
      where: { clientId: t.id, startsAt: { gte: r.thirtyDaysAgo }, contactId: { not: null } },
      select: { contactId: true },
      distinct: ["contactId"],
    });
    const activos = new Set(recientes.map((a) => a.contactId));
    const total = await db.contact.count({ where: { clientId: t.id } });
    return Math.max(0, total - activos.size);
  },
});

const kpiEmpleadosActivos: KpiDef = {
  key: "empleados",
  label: "Equipo activo",
  hint: "empleados dados de alta",
  requires: "rrhh",
  compute: (db, t) => db.employee.count({ where: { clientId: t.id, active: true } }),
};

// ── Alertas reutilizables ────────────────────────────────

const alertStockBajo: AlertDef = {
  key: "stock_bajo",
  requires: "catalogo",
  compute: async (db, t) => {
    const prods = await db.product.findMany({
      where: { clientId: t.id, active: true },
      select: { stock: true, minStock: true },
    });
    const n = prods.filter((p) => p.stock <= p.minStock).length;
    if (n === 0) return null;
    return {
      count: n,
      label: `${n} producto${n === 1 ? "" : "s"} bajo el stock mínimo`,
      href: "/catalogo",
      tone: "warning",
    };
  },
};

const alertSinStock: AlertDef = {
  key: "sin_stock",
  requires: "catalogo",
  compute: async (db, t) => {
    const n = await db.product.count({
      where: { clientId: t.id, active: true, stock: { lte: 0 } },
    });
    if (n === 0) return null;
    return {
      count: n,
      label: `${n} producto${n === 1 ? "" : "s"} sin stock`,
      href: "/catalogo",
      tone: "destructive",
    };
  },
};

const alertTurnosSinConfirmar: AlertDef = {
  key: "turnos_sin_confirmar",
  requires: "turnos",
  compute: async (db, t, r) => {
    const n = await db.appointment.count({
      where: {
        clientId: t.id,
        startsAt: { gte: r.todayStart, lt: r.weekEnd },
        status: "PENDING",
      },
    });
    if (n === 0) return null;
    return {
      count: n,
      label: `${n} turno${n === 1 ? "" : "s"} sin confirmar esta semana`,
      href: "/turnos",
      tone: "warning",
    };
  },
};

const alertTareasVencidas: AlertDef = {
  key: "tareas_vencidas",
  requires: "crm",
  compute: async (db, t, r) => {
    const n = await db.crmTask.count({
      where: { clientId: t.id, done: false, dueAt: { lt: r.todayStart } },
    });
    if (n === 0) return null;
    return {
      count: n,
      label: `${n} tarea${n === 1 ? "" : "s"} vencida${n === 1 ? "" : "s"} en el CRM`,
      href: "/crm",
      tone: "destructive",
    };
  },
};

const alertSenaPendiente: AlertDef = {
  key: "sena_pendiente",
  requires: "turnos",
  compute: async (db, t, r) => {
    // Reservas futuras marcadas con `custom.sena_pendiente = true`.
    const appts = await db.appointment.findMany({
      where: {
        clientId: t.id,
        startsAt: { gte: r.todayStart },
        status: { not: "CANCELLED" },
      },
      select: { custom: true },
    });
    const n = appts.filter(
      (a) => (a.custom as Record<string, unknown> | null)?.sena_pendiente === true
    ).length;
    if (n === 0) return null;
    return {
      count: n,
      label: `${n} reserva${n === 1 ? "" : "s"} con seña pendiente de cobro`,
      href: "/turnos",
      tone: "warning",
    };
  },
};

/** Contactos sin contacto hace +6 meses → oportunidad de recompra/seguimiento. */
const alertSinSeguimiento = (noun: string, nounPlural: string): AlertDef => ({
  key: "sin_seguimiento",
  requires: "crm",
  compute: async (db, t, r) => {
    const n = await db.contact.count({
      where: {
        clientId: t.id,
        OR: [{ lastTouchAt: { lt: r.sixMonthsAgo } }, { lastTouchAt: null }],
      },
    });
    if (n === 0) return null;
    return {
      count: n,
      label: `${n} ${n === 1 ? noun : nounPlural} sin seguimiento hace +6 meses`,
      href: "/crm",
      tone: "warning",
    };
  },
});

// ── Quick actions reutilizables ──────────────────────────

const qaContacto = (label: string): QuickAction => ({
  label,
  href: "/crm/nuevo",
  variant: "secondary",
  requires: "crm",
});
const qaTurno = (label: string): QuickAction => ({
  label,
  href: "/turnos/nuevo",
  variant: "primary",
  requires: "turnos",
});
const qaProducto: QuickAction = {
  label: "+ Producto",
  href: "/catalogo/nuevo",
  variant: "secondary",
  requires: "catalogo",
};
const qaCaja: QuickAction = {
  label: "Ver caja",
  href: "/caja",
  variant: "ghost",
  requires: "caja",
};

// ── Glosarios y stages por rubro ─────────────────────────

const G = {
  cliente: { contact: "cliente", contacts: "clientes", appointment: "turno", appointments: "turnos" },
  paciente: { contact: "paciente", contacts: "pacientes", appointment: "turno", appointments: "turnos" },
  alumno: { contact: "alumno", contacts: "alumnos", appointment: "clase", appointments: "clases" },
  socio: { contact: "socio", contacts: "socios", appointment: "clase", appointments: "clases" },
  huesped: { contact: "huésped", contacts: "huéspedes", appointment: "reserva", appointments: "reservas" },
  comensal: { contact: "comensal", contacts: "comensales", appointment: "pedido", appointments: "pedidos" },
  interesado: { contact: "interesado", contacts: "interesados", appointment: "visita", appointments: "visitas" },
} satisfies Record<string, Glossary>;

const STAGES = {
  generic: [
    { key: "nuevo", label: "Nuevo" },
    { key: "contactado", label: "Contactado" },
    { key: "interesado", label: "Interesado" },
    { key: "cliente", label: "Cliente" },
    { key: "perdido", label: "Perdido" },
  ],
  clinica: [
    { key: "nuevo", label: "Nuevo" },
    { key: "agendo", label: "Agendó" },
    { key: "en_tratamiento", label: "En tratamiento" },
    { key: "alta", label: "Alta" },
    { key: "seguimiento", label: "Seguimiento" },
  ],
  inmobiliaria: [
    { key: "consulta", label: "Consulta" },
    { key: "visita", label: "Visita" },
    { key: "reserva", label: "Reserva" },
    { key: "cerrada", label: "Cerrada" },
    { key: "perdida", label: "Perdida" },
  ],
  gimnasio: [
    { key: "prueba", label: "Clase de prueba" },
    { key: "socio", label: "Socio" },
    { key: "en_riesgo", label: "En riesgo" },
    { key: "baja", label: "Baja" },
  ],
  hotel: [
    { key: "consulta", label: "Consulta" },
    { key: "reservado", label: "Reservado" },
    { key: "hospedado", label: "Hospedado" },
    { key: "checkout", label: "Check-out" },
    { key: "recurrente", label: "Recurrente" },
  ],
  taller: [
    { key: "nuevo", label: "Nuevo" },
    { key: "presupuestado", label: "Presupuestado" },
    { key: "en_taller", label: "En taller" },
    { key: "entregado", label: "Entregado" },
    { key: "fidelizado", label: "Fidelizado" },
  ],
} satisfies Record<string, CrmStage[]>;

// ── Definición de los playbooks por rubro ────────────────

type PlaybookFactory = () => Omit<Playbook, "key">;

/** Reglas keyword → playbook. Se evalúan en orden; gana la primera que matchea. */
const RULES: Array<{ key: string; match: string[]; build: PlaybookFactory }> = [
  // ── Clínica / consultorio odontológico ──
  {
    key: "clinica",
    match: ["odonto", "dental", "clinica", "clínica", "consultorio", "salud"],
    build: () => ({
      glossary: G.paciente,
      heroSubtitle: "El estado de tu consultorio hoy: agenda, pacientes y tratamientos.",
      crmStages: STAGES.clinica,
      quickActions: [qaTurno("+ Turno"), qaContacto("+ Paciente")],
      kpis: [
        kpiTurnosHoy("Turnos hoy", "pacientes agendados"),
        { ...kpiContactos("Pacientes activos", "en tu CRM"), key: "pacientes" },
        kpiTurnosSemana("Próxima semana"),
        kpiPctConfirmados,
      ],
      alerts: [
        alertTurnosSinConfirmar,
        alertSinSeguimiento("paciente", "pacientes"),
        alertTareasVencidas,
      ],
    }),
  },
  // ── Gimnasio / clases grupales ──
  {
    key: "gimnasio",
    match: ["gimnasio", "gym", "fitness", "crossfit", "clases grupales"],
    build: () => ({
      glossary: G.socio,
      heroSubtitle: "Cómo viene tu gimnasio: socios, clases del día y quién está en riesgo.",
      crmStages: STAGES.gimnasio,
      quickActions: [qaTurno("+ Clase"), qaContacto("+ Socio")],
      kpis: [
        kpiSociosActivos,
        kpiEnRiesgo("Socios en riesgo"),
        kpiTurnosHoy("Clases hoy", "clases programadas"),
        kpiEmpleadosActivos,
      ],
      alerts: [
        {
          ...alertSinSeguimiento("socio", "socios"),
          key: "socios_riesgo",
        },
        alertTurnosSinConfirmar,
      ],
    }),
  },
  // ── Hotel boutique ──
  {
    key: "hotel",
    match: ["hotel", "hosteria", "hostería", "hospedaje", "posada", "cabañas", "cabanas"],
    build: () => ({
      glossary: G.huesped,
      heroSubtitle: "Tu hotel de un vistazo: ingresos del mes, reservas y señas por cobrar.",
      crmStages: STAGES.hotel,
      quickActions: [qaContacto("+ Huésped"), qaCaja],
      kpis: [
        kpiIngresosMes,
        { ...kpiContactos("Huéspedes", "en tu CRM"), key: "huespedes" },
        kpiTicketPromedio,
        kpiNuevosMes("Nuevos huéspedes"),
      ],
      alerts: [alertTareasVencidas, alertSinSeguimiento("huésped", "huéspedes")],
    }),
  },
  // ── Inmobiliaria ──
  {
    key: "inmobiliaria",
    match: ["inmobiliaria", "propiedades", "bienes raices", "bienes raíces", "real estate"],
    build: () => ({
      glossary: G.interesado,
      heroSubtitle: "Tu cartera comercial: interesados, visitas y operaciones en curso.",
      crmStages: STAGES.inmobiliaria,
      quickActions: [qaContacto("+ Interesado")],
      kpis: [
        { ...kpiContactos("Interesados", "en tu cartera"), key: "interesados" },
        kpiNuevosMes("Nuevas consultas"),
        {
          key: "pendientes",
          label: "Tareas pendientes",
          hint: "seguimientos por hacer",
          requires: "crm",
          tone: "warning",
          compute: (db, t) =>
            db.crmTask.count({ where: { clientId: t.id, done: false } }),
        },
      ],
      alerts: [alertTareasVencidas, alertSinSeguimiento("interesado", "interesados")],
    }),
  },
  // ── Pizzería / delivery / gastronomía ──
  {
    key: "gastronomia",
    match: ["pizzeria", "pizzería", "delivery", "restaurante", "resto", "bar", "comida", "gastronom"],
    build: () => ({
      glossary: G.comensal,
      heroSubtitle: "Tu local hoy: carta, stock de insumos y movimiento de caja.",
      crmStages: STAGES.generic,
      quickActions: [qaProducto, qaContacto("+ Cliente"), qaCaja],
      kpis: [
        kpiProductos,
        kpiStockBajo,
        kpiVentasHoy,
        kpiTicketPromedio,
      ],
      alerts: [alertSinStock, alertStockBajo],
    }),
  },
  // ── Distribuidora mayorista ──
  {
    key: "distribuidora",
    match: ["distribuidora", "mayorista", "almacen", "almacén", "abastecimiento"],
    build: () => ({
      glossary: G.cliente,
      heroSubtitle: "Tu operación mayorista: facturación del mes, stock y clientes activos.",
      crmStages: STAGES.generic,
      quickActions: [qaProducto, qaContacto("+ Cliente"), qaCaja],
      kpis: [
        kpiIngresosMes,
        kpiStockBajo,
        kpiProductos,
        { ...kpiContactos("Clientes activos", "en tu cartera"), key: "clientes_activos" },
      ],
      alerts: [alertSinStock, alertStockBajo, alertTareasVencidas],
    }),
  },
  // ── Tienda de ropa online ──
  {
    key: "tienda",
    match: ["tienda", "ropa", "indumentaria", "moda", "ecommerce", "e-commerce", "boutique"],
    build: () => ({
      glossary: G.cliente,
      heroSubtitle: "Tu tienda hoy: catálogo, stock por reponer y ventas del día.",
      crmStages: STAGES.generic,
      quickActions: [qaProducto, qaContacto("+ Cliente")],
      kpis: [
        kpiProductos,
        kpiStockBajo,
        { ...kpiContactos("Clientes", "en tu CRM"), key: "clientes" },
        kpiNuevosMes("Nuevos este mes"),
      ],
      alerts: [alertSinStock, alertStockBajo],
    }),
  },
  // ── Estudio contable ──
  {
    key: "contable",
    match: ["contable", "contador", "estudio contable", "impuestos", "fiscal", "tributario"],
    build: () => ({
      glossary: G.cliente,
      heroSubtitle: "Tu estudio al día: clientes, cobros del mes y vencimientos por seguir.",
      crmStages: STAGES.generic,
      quickActions: [qaContacto("+ Cliente"), qaCaja],
      kpis: [
        kpiContactos("Clientes", "en tu cartera"),
        kpiIngresosMes,
        {
          key: "vencimientos",
          label: "Vencimientos",
          hint: "tareas con fecha pendiente",
          requires: "crm",
          tone: "warning",
          compute: (db, t, r) =>
            db.crmTask.count({
              where: {
                clientId: t.id,
                done: false,
                dueAt: { gte: r.todayStart, lt: r.weekEnd },
              },
            }),
        },
        kpiNuevosMes("Altas del mes"),
      ],
      alerts: [alertTareasVencidas, alertSinSeguimiento("cliente", "clientes")],
    }),
  },
  // ── Peluquería / estética ──
  {
    key: "peluqueria",
    match: ["peluqueria", "peluquería", "barberia", "barbería", "estetica", "estética", "spa", "uñas", "manicura"],
    build: () => ({
      glossary: G.cliente,
      heroSubtitle: "Tu agenda de hoy y cómo viene la semana en el salón.",
      crmStages: STAGES.taller,
      quickActions: [qaTurno("+ Turno"), qaContacto("+ Cliente")],
      kpis: [
        kpiTurnosHoy("Turnos hoy", "clientes agendados"),
        kpiTurnosSemana("Esta semana"),
        kpiContactos("Clientes", "en tu CRM"),
        kpiPctConfirmados,
      ],
      alerts: [alertTurnosSinConfirmar, alertSinSeguimiento("cliente", "clientes")],
    }),
  },
  // ── Taller mecánico ──
  {
    key: "taller",
    match: ["taller", "mecanic", "mecánic", "service", "scooter", "moto", "automotor", "vehicul", "vehícul"],
    build: () => ({
      glossary: G.cliente,
      heroSubtitle: "Tu taller hoy: turnos de service, semana y clientes para fidelizar.",
      crmStages: STAGES.taller,
      quickActions: [qaTurno("+ Turno"), qaContacto("+ Cliente")],
      kpis: [
        kpiTurnosHoy("Turnos hoy", "services agendados"),
        kpiTurnosSemana("Esta semana"),
        kpiContactos("Clientes", "en tu CRM"),
        kpiPctConfirmados,
      ],
      alerts: [
        alertTurnosSinConfirmar,
        alertSinSeguimiento("cliente", "clientes"),
        alertSenaPendiente,
      ],
    }),
  },
  // ── Escuela de esquí / snowboard / deportes ──
  {
    key: "escuela",
    match: ["escuela", "esqui", "esquí", "snowboard", "ski", "academia", "instructor", "clases de"],
    build: () => ({
      glossary: G.alumno,
      heroSubtitle: "Tu escuela hoy: clases del día, alumnos y caja de la temporada.",
      crmStages: STAGES.generic,
      quickActions: [qaTurno("+ Clase"), qaContacto("+ Alumno"), qaCaja],
      kpis: [
        kpiTurnosHoy("Clases hoy", "clases agendadas"),
        kpiTurnosSemana("Esta semana"),
        { ...kpiContactos("Alumnos", "en tu CRM"), key: "alumnos" },
        kpiIngresosMes,
      ],
      alerts: [alertTurnosSinConfirmar, alertSenaPendiente],
    }),
  },
  // ── Agencia de marketing / publicidad ──
  {
    key: "agencia",
    match: ["agencia", "marketing", "publicidad", "comunicacion", "comunicación", "branding", "creativa", "ads"],
    build: () => ({
      glossary: { contact: "cuenta", contacts: "cuentas", appointment: "reunión", appointments: "reuniones" },
      heroSubtitle: "Tu agencia hoy: proyectos en curso, entregas de la semana y el equipo.",
      crmStages: STAGES.generic,
      quickActions: [
        { label: "+ Proyecto", href: "/proyectos", variant: "primary", requires: "proyectos" },
        qaContacto("+ Cuenta"),
      ],
      kpis: [
        {
          key: "proyectos_activos",
          label: "Proyectos en curso",
          hint: "activos ahora",
          requires: "proyectos",
          tone: "default",
          compute: (db, t) =>
            db.proyecto.count({ where: { clientId: t.id, status: { in: ["en_curso", "revision"] } } }),
        },
        {
          key: "entregados",
          label: "Entregados",
          hint: "proyectos cerrados",
          requires: "proyectos",
          tone: "success",
          compute: (db, t) => db.proyecto.count({ where: { clientId: t.id, status: "entregado" } }),
        },
        {
          key: "tareas_pend",
          label: "Tareas del equipo",
          hint: "pendientes",
          requires: "proyectos",
          tone: "warning",
          compute: (db, t) =>
            db.proyectoTarea.count({ where: { clientId: t.id, status: { not: "hecho" } } }),
        },
        { ...kpiContactos("Cuentas", "clientes activos"), key: "cuentas" },
      ],
      alerts: [alertTareasVencidas],
    }),
  },
];

/** Playbook genérico — fallback honesto cuando el rubro no matchea ninguna regla. */
function genericPlaybook(): Omit<Playbook, "key"> {
  return {
    glossary: G.cliente,
    heroSubtitle: "Esto es lo que está pasando en tu negocio hoy.",
    crmStages: STAGES.generic,
    quickActions: [qaContacto("+ Contacto"), qaTurno("+ Turno"), qaProducto, qaCaja],
    kpis: [
      kpiContactos("Contactos", "total en tu CRM"),
      kpiNuevosMes("Nuevos este mes"),
      {
        key: "tareas_pendientes",
        label: "Tareas pendientes",
        hint: "por hacer en el CRM",
        requires: "crm",
        tone: "warning",
        compute: (db, t) => db.crmTask.count({ where: { clientId: t.id, done: false } }),
      },
      kpiTurnosSemana("Turnos esta semana"),
      kpiProductos,
    ],
    alerts: [alertTurnosSinConfirmar, alertStockBajo, alertTareasVencidas],
  };
}

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

/**
 * Resuelve el Playbook a partir del campo libre `rubro`.
 * Matchea por keywords (acento-insensible); si nada matchea, fallback genérico.
 */
export function resolvePlaybook(rubro: string | null | undefined): Playbook {
  const r = norm(rubro ?? "");
  if (r) {
    for (const rule of RULES) {
      if (rule.match.some((kw) => r.includes(norm(kw)))) {
        return { key: rule.key, ...rule.build() };
      }
    }
  }
  return { key: "generico", ...genericPlaybook() };
}

/** Conveniencia: resuelve el playbook directamente desde el Client. */
export function playbookForClient(client: Pick<Client, "rubro">): Playbook {
  return resolvePlaybook(client.rubro);
}
