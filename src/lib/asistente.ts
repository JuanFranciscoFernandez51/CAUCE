import type Anthropic from "@anthropic-ai/sdk";
import type { Client, Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import { tenantBranding, tenantModules, MODULE_LABELS, type OsModule } from "@/lib/tenant";
import { TIME_RE, DATE_RE, weekdayOf, fmtDayLabel } from "@/app/os/[slug]/_lib/dates";
import { hasOverlap } from "@/app/os/[slug]/_lib/slots";

/**
 * Cerebro del Asistente de IA del panel del tenant.
 * TODO scopeado por clientId. Las tools de escritura JAMÁS ejecutan acá:
 * sólo devuelven una PROPUESTA que el dueño confirma desde el front,
 * y el endpoint /asistente/aplicar la ejecuta (revalidando ownership + zod).
 */

// ── Resumen real del sistema del tenant (counts scopeados) ──────────────
export type TenantSummary = {
  contactos: number;
  turnosProximos: number;
  turnosHoy: number;
  productosActivos: number;
  propiedadesActivas: number;
  proyectosActivos: number;
  empleadosActivos: number;
  saldoArs: number;
};

/** Aviso del día: algo que el dueño/equipo debería revisar ahora. */
export type Alerta = {
  modulo: OsModule;
  /** Ruta relativa al módulo dentro del panel del tenant (sin el /os/[slug] inicial). */
  href: string;
  emoji: string;
  titulo: string;
  detalle: string;
};

const HOY_TZ = "America/Argentina/Buenos_Aires";

export async function buildTenantSummary(
  tenant: Client,
  modules: OsModule[]
): Promise<TenantSummary> {
  const id = tenant.id;
  const has = (m: OsModule) => modules.includes(m);
  const now = new Date();
  const todayStr = now.toLocaleDateString("en-CA", { timeZone: HOY_TZ });
  const todayStart = new Date(`${todayStr}T00:00:00-03:00`);
  const todayEnd = new Date(todayStart.getTime() + 86_400_000);

  const [
    contactos,
    turnosProximos,
    turnosHoy,
    productosActivos,
    propiedadesActivas,
    proyectosActivos,
    empleadosActivos,
    saldoAgg,
  ] = await Promise.all([
    has("crm") ? db.contact.count({ where: { clientId: id } }) : Promise.resolve(0),
    has("turnos")
      ? db.appointment.count({
          where: { clientId: id, startsAt: { gte: now }, status: { in: ["PENDING", "CONFIRMED"] } },
        })
      : Promise.resolve(0),
    has("turnos")
      ? db.appointment.count({
          where: { clientId: id, startsAt: { gte: todayStart, lt: todayEnd } },
        })
      : Promise.resolve(0),
    has("catalogo")
      ? db.product.count({ where: { clientId: id, active: true } })
      : Promise.resolve(0),
    has("sitio")
      ? db.listing.count({ where: { clientId: id, active: true } })
      : Promise.resolve(0),
    has("proyectos")
      ? db.proyecto.count({
          where: { clientId: id, status: { in: ["propuesta", "en_curso", "revision"] } },
        })
      : Promise.resolve(0),
    has("rrhh")
      ? db.employee.count({ where: { clientId: id, active: true } })
      : Promise.resolve(0),
    has("caja")
      ? db.account.aggregate({ where: { clientId: id, active: true }, _sum: { balance: true } })
      : Promise.resolve({ _sum: { balance: 0 } }),
  ]);

  return {
    contactos,
    turnosProximos,
    turnosHoy,
    productosActivos,
    propiedadesActivas,
    proyectosActivos,
    empleadosActivos,
    saldoArs: saldoAgg._sum.balance ?? 0,
  };
}

// ── Proactividad: alertas reales del día (scopeadas + por módulo) ────────
const DIAS_SIN_SEGUIMIENTO = 14; // contacto sin tocar hace +14 días = a seguir

/**
 * Avisos del día que aplican al tenant según sus módulos activos.
 * TODO scopeado por clientId. Devuelve a lo sumo las pocas cosas que importan
 * para mostrarlas arriba del chat ANTES de que el usuario pregunte.
 */
export async function buildAlertas(tenant: Client, modules: OsModule[]): Promise<Alerta[]> {
  const id = tenant.id;
  const has = (m: OsModule) => modules.includes(m);
  const now = new Date();
  const todayStr = now.toLocaleDateString("en-CA", { timeZone: HOY_TZ });
  const todayStart = new Date(`${todayStr}T00:00:00-03:00`);
  const todayEnd = new Date(todayStart.getTime() + 86_400_000);
  const sinSeguimientoAntes = new Date(now.getTime() - DIAS_SIN_SEGUIMIENTO * 86_400_000);

  const [turnosSinConfirmarHoy, stockBajo, tareasVencidas, contactosSinSeguimiento] =
    await Promise.all([
      has("turnos")
        ? db.appointment.count({
            where: {
              clientId: id,
              status: "PENDING",
              startsAt: { gte: todayStart, lt: todayEnd },
            },
          })
        : Promise.resolve(0),
      has("catalogo")
        ? db.product.count({
            where: { clientId: id, active: true, stock: { lte: db.product.fields.minStock } },
          })
        : Promise.resolve(0),
      has("crm")
        ? db.crmTask.count({
            where: { clientId: id, done: false, dueAt: { lt: now } },
          })
        : Promise.resolve(0),
      has("crm")
        ? db.contact.count({
            where: {
              clientId: id,
              OR: [{ lastTouchAt: null }, { lastTouchAt: { lt: sinSeguimientoAntes } }],
            },
          })
        : Promise.resolve(0),
    ]);

  const alertas: Alerta[] = [];

  if (turnosSinConfirmarHoy > 0) {
    alertas.push({
      modulo: "turnos",
      href: "turnos",
      emoji: "📅",
      titulo: turnosSinConfirmarHoy === 1 ? "1 turno sin confirmar hoy" : `${turnosSinConfirmarHoy} turnos sin confirmar hoy`,
      detalle: "Revisalos y confirmalos antes de que pase el día.",
    });
  }
  if (stockBajo > 0) {
    alertas.push({
      modulo: "catalogo",
      href: "catalogo",
      emoji: "📦",
      titulo: stockBajo === 1 ? "1 producto con stock bajo" : `${stockBajo} productos con stock bajo`,
      detalle: "Están en o por debajo del mínimo. Conviene reponer.",
    });
  }
  if (tareasVencidas > 0) {
    alertas.push({
      modulo: "crm",
      href: "crm",
      emoji: "⏰",
      titulo: tareasVencidas === 1 ? "1 tarea vencida" : `${tareasVencidas} tareas vencidas`,
      detalle: "Tenés tareas del CRM con la fecha pasada sin completar.",
    });
  }
  if (contactosSinSeguimiento > 0) {
    alertas.push({
      modulo: "crm",
      href: "crm",
      emoji: "👋",
      titulo:
        contactosSinSeguimiento === 1
          ? "1 contacto sin seguimiento"
          : `${contactosSinSeguimiento} contactos sin seguimiento`,
      detalle: `Sin contacto hace más de ${DIAS_SIN_SEGUIMIENTO} días. Quizá vale un mensaje.`,
    });
  }

  return alertas;
}

// ── System prompt con TODA la info del negocio ──────────────────────────
const WEEKDAYS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

export async function buildSystemPrompt(
  tenant: Client,
  modules: OsModule[],
  summary: TenantSummary,
  isOwner: boolean,
  alertas: Alerta[] = []
): Promise<string> {
  const branding = tenantBranding(tenant);
  const settings = (tenant.settings as Record<string, unknown> | null) ?? {};
  const availability = await db.availability.findMany({
    where: { clientId: tenant.id },
    orderBy: [{ weekday: "asc" }, { startTime: "asc" }],
  });

  const horariosTxt =
    availability.length > 0
      ? availability
          .map((a) => `${WEEKDAYS[a.weekday]} ${a.startTime}–${a.endTime} (turnos de ${a.slotMinutes} min)`)
          .join("; ")
      : "sin horarios de atención cargados";

  const modulosTxt = modules.length ? modules.map((m) => MODULE_LABELS[m]).join(", ") : "ninguno";

  const alertasTxt = alertas.length
    ? alertas.map((a) => `- ${a.titulo}: ${a.detalle}`).join("\n")
    : "- Nada urgente por ahora.";

  return [
    `Sos el asistente del sistema de "${branding.displayName}". Conocés a fondo SU sistema en Cauce OS y sólo hablás de SU negocio.`,
    `Respondé en español rioplatense, claro y corto. NUNCA inventes datos: si no lo tenés en este contexto, decí que no lo sabés o que lo revise en el módulo correspondiente.`,
    ``,
    `DATOS DEL NEGOCIO`,
    `- Nombre: ${tenant.name}${branding.displayName !== tenant.name ? ` (se muestra como "${branding.displayName}")` : ""}`,
    `- Rubro: ${tenant.rubro ?? "—"}`,
    `- Módulos activos: ${modulosTxt}`,
    `- Marca: color principal ${branding.primary}, color de acento ${branding.accent}`,
    `- Contacto de la cuenta: ${tenant.contactName ?? "—"} · email ${tenant.email ?? "—"} · tel ${tenant.phone ?? "—"} · WhatsApp ${tenant.whatsapp ?? "—"}`,
    `- Horarios de atención: ${horariosTxt}`,
    `- Otros datos del negocio (settings): ${JSON.stringify(settings)}`,
    ``,
    `RESUMEN ACTUAL (números reales de su sistema, ya scopeados a su cuenta)`,
    `- Contactos en el CRM: ${summary.contactos}`,
    `- Turnos próximos (pendientes/confirmados): ${summary.turnosProximos} — hoy: ${summary.turnosHoy}`,
    `- Productos activos: ${summary.productosActivos}`,
    `- Propiedades/publicaciones activas: ${summary.propiedadesActivas}`,
    `- Proyectos activos: ${summary.proyectosActivos}`,
    `- Empleados activos: ${summary.empleadosActivos}`,
    `- Saldo total en cuentas (ARS): ${summary.saldoArs}`,
    ``,
    `AVISOS DEL DÍA (lo que conviene revisar ahora, ya scopeado a su cuenta)`,
    alertasTxt,
    `Si el usuario saluda, pregunta "¿cómo viene el día?" o "¿qué tengo pendiente?", arrancá mencionando de forma proactiva lo más urgente de estos avisos (1 o 2 cosas, no toda la lista) y ofrecé ayudar a resolverlo. Si no hay avisos, decí que está todo al día. No inventes avisos que no estén acá.`,
    ``,
    isOwner
      ? `PODÉS PROPONER CAMBIOS Y ALTAS con las herramientas disponibles: marca, datos del negocio, horarios, contacto de la cuenta, y además crear un turno, agregar un producto o cargar un contacto (cada una sólo si el módulo correspondiente está activo). Cuando uses una herramienta, NO la des por hecha: el dueño todavía tiene que confirmar la propuesta con un botón. Después de proponer, contá en una frase qué dejaste listo para confirmar. Si te piden algo de un módulo que no está activo, aclaralo en vez de proponerlo.`
      : `Este usuario es del equipo (no es el dueño): SÓLO consultá e informá. No podés cambiar ni crear nada; si te piden un cambio o un alta, aclará que eso lo tiene que hacer el dueño desde el Asistente o la Configuración.`,
    `Nunca borres nada, ni toques finanzas ni datos de clientes de forma masiva.`,
  ].join("\n");
}

// ── Tools de escritura (sólo dueño) — devuelven PROPUESTAS ───────────────
export const ASISTENTE_TOOLS: Anthropic.Tool[] = [
  {
    name: "cambiar_branding",
    description:
      "Propone cambiar la marca del sistema: nombre visible y/o colores. Los colores deben venir en hex #RRGGBB. Sólo incluí los campos que pediste cambiar.",
    input_schema: {
      type: "object",
      properties: {
        displayName: { type: "string", description: "Nombre visible del sistema" },
        primary: { type: "string", description: "Color principal en hex, ej #2E6BFF" },
        accent: { type: "string", description: "Color de acento en hex, ej #F59E0B" },
      },
    },
  },
  {
    name: "editar_datos_negocio",
    description:
      "Propone actualizar datos del negocio que viven en settings: dirección, teléfono de atención, horarios de atención (texto) y FAQs del bot. Sólo incluí lo que cambia.",
    input_schema: {
      type: "object",
      properties: {
        direccion: { type: "string" },
        telefono: { type: "string" },
        horariosTexto: { type: "string", description: "Horarios de atención en texto libre" },
        faqs: {
          type: "array",
          description: "Preguntas frecuentes del bot",
          items: {
            type: "object",
            properties: { pregunta: { type: "string" }, respuesta: { type: "string" } },
            required: ["pregunta", "respuesta"],
          },
        },
      },
    },
  },
  {
    name: "agregar_horario_disponibilidad",
    description:
      "Propone agregar una franja de atención a la agenda. weekday: 0=domingo .. 6=sábado. start/end en formato HH:MM 24hs.",
    input_schema: {
      type: "object",
      properties: {
        weekday: { type: "integer", description: "0=domingo .. 6=sábado" },
        start: { type: "string", description: "Hora de inicio HH:MM" },
        end: { type: "string", description: "Hora de fin HH:MM" },
        slotMinutes: { type: "integer", description: "Minutos por turno (default 30)" },
      },
      required: ["weekday", "start", "end"],
    },
  },
  {
    name: "actualizar_dato_contacto",
    description:
      "Propone actualizar el email, teléfono y/o WhatsApp de la cuenta del negocio. Sólo incluí lo que cambia.",
    input_schema: {
      type: "object",
      properties: {
        email: { type: "string" },
        phone: { type: "string" },
        whatsapp: { type: "string" },
      },
    },
  },
];

// Tools de alta que dependen del módulo activo del tenant.
const TOOL_CREAR_TURNO: Anthropic.Tool = {
  name: "crear_turno",
  description:
    "Propone crear un turno en la agenda. fecha en YYYY-MM-DD, hora en HH:MM 24hs. Sólo para tenants con el módulo de Turnos. Si te dicen 'mañana' u otra referencia, convertila a la fecha exacta usando que HOY es el día actual argentino.",
  input_schema: {
    type: "object",
    properties: {
      titulo: { type: "string", description: "Motivo o título del turno" },
      fecha: { type: "string", description: "Fecha del turno YYYY-MM-DD" },
      hora: { type: "string", description: "Hora de inicio HH:MM 24hs" },
      nombre_cliente: { type: "string", description: "Nombre de la persona del turno (opcional)" },
    },
    required: ["titulo", "fecha", "hora"],
  },
};

const TOOL_AGREGAR_PRODUCTO: Anthropic.Tool = {
  name: "agregar_producto",
  description:
    "Propone agregar un producto al catálogo. Precio en pesos argentinos. Sólo para tenants con el módulo de Catálogo.",
  input_schema: {
    type: "object",
    properties: {
      nombre: { type: "string", description: "Nombre del producto" },
      precio_ars: { type: "number", description: "Precio en ARS (opcional)" },
      stock: { type: "integer", description: "Stock inicial (opcional, default 0)" },
      minimo: { type: "integer", description: "Stock mínimo para avisar (opcional, default 0)" },
    },
    required: ["nombre"],
  },
};

const TOOL_AGREGAR_CONTACTO: Anthropic.Tool = {
  name: "agregar_contacto",
  description:
    "Propone cargar un contacto en el CRM. Sólo para tenants con el módulo de CRM. Si ya existe uno con el mismo teléfono, se reusa en vez de duplicar.",
  input_schema: {
    type: "object",
    properties: {
      nombre: { type: "string", description: "Nombre del contacto" },
      telefono: { type: "string", description: "Teléfono (opcional)" },
      email: { type: "string", description: "Email (opcional)" },
      etapa: { type: "string", description: "Etapa del pipeline (opcional, ej: nuevo)" },
    },
    required: ["nombre"],
  },
};

/**
 * Tools disponibles para el dueño según los módulos activos del tenant.
 * Las de alta (turno/producto/contacto) sólo aparecen si su módulo está activo,
 * así el asistente no propone algo que el negocio no tiene.
 */
export function buildAsistenteTools(modules: OsModule[]): Anthropic.Tool[] {
  const tools = [...ASISTENTE_TOOLS];
  if (modules.includes("turnos")) tools.push(TOOL_CREAR_TURNO);
  if (modules.includes("catalogo")) tools.push(TOOL_AGREGAR_PRODUCTO);
  if (modules.includes("crm")) tools.push(TOOL_AGREGAR_CONTACTO);
  return tools;
}

// ── Validación + aplicación de una propuesta confirmada ──────────────────
const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Color inválido (ej: #2E6BFF)");

export const accionSchema = z.discriminatedUnion("tool", [
  z.object({
    tool: z.literal("cambiar_branding"),
    input: z
      .object({
        displayName: z.string().trim().min(1).max(80).optional(),
        primary: hex.optional(),
        accent: hex.optional(),
      })
      .refine((v) => v.displayName || v.primary || v.accent, "No hay ningún cambio de marca"),
  }),
  z.object({
    tool: z.literal("editar_datos_negocio"),
    input: z
      .object({
        direccion: z.string().trim().max(200).optional(),
        telefono: z.string().trim().max(60).optional(),
        horariosTexto: z.string().trim().max(400).optional(),
        faqs: z
          .array(
            z.object({
              pregunta: z.string().trim().min(1).max(200),
              respuesta: z.string().trim().min(1).max(800),
            })
          )
          .max(30)
          .optional(),
      })
      .refine(
        (v) => v.direccion || v.telefono || v.horariosTexto || v.faqs,
        "No hay ningún dato para actualizar"
      ),
  }),
  z.object({
    tool: z.literal("agregar_horario_disponibilidad"),
    input: z.object({
      weekday: z.number().int().min(0).max(6),
      start: z.string().regex(TIME_RE, "Hora de inicio inválida"),
      end: z.string().regex(TIME_RE, "Hora de fin inválida"),
      slotMinutes: z.number().int().min(5).max(480).default(30),
    }),
  }),
  z.object({
    tool: z.literal("actualizar_dato_contacto"),
    input: z
      .object({
        email: z.string().trim().email("Email inválido").max(120).optional(),
        phone: z.string().trim().max(60).optional(),
        whatsapp: z.string().trim().max(60).optional(),
      })
      .refine((v) => v.email || v.phone || v.whatsapp, "No hay ningún dato para actualizar"),
  }),
  z.object({
    tool: z.literal("crear_turno"),
    input: z.object({
      titulo: z.string().trim().min(1, "Falta el motivo del turno").max(120),
      fecha: z.string().regex(DATE_RE, "Fecha inválida (YYYY-MM-DD)"),
      hora: z.string().regex(TIME_RE, "Hora inválida (HH:MM)"),
      nombre_cliente: z.string().trim().min(1).max(120).optional(),
    }),
  }),
  z.object({
    tool: z.literal("agregar_producto"),
    input: z.object({
      nombre: z.string().trim().min(1, "Falta el nombre del producto").max(120),
      precio_ars: z.number().nonnegative("El precio no puede ser negativo").max(1_000_000_000).optional(),
      stock: z.number().int().min(0).max(1_000_000).optional(),
      minimo: z.number().int().min(0).max(1_000_000).optional(),
    }),
  }),
  z.object({
    tool: z.literal("agregar_contacto"),
    input: z
      .object({
        nombre: z.string().trim().min(1, "Falta el nombre del contacto").max(120),
        telefono: z.string().trim().max(60).optional(),
        email: z.string().trim().email("Email inválido").max(120).optional(),
        etapa: z.string().trim().max(40).optional(),
      }),
  }),
]);

export type AccionConfirmada = z.infer<typeof accionSchema>;

/** Aplica una propuesta YA validada, scopeada al tenant. Devuelve un texto de confirmación. */
export async function aplicarAccion(tenant: Client, accion: AccionConfirmada): Promise<string> {
  const id = tenant.id;
  const modules = tenantModules(tenant);
  const requireModule = (m: OsModule, label: string) => {
    if (!modules.includes(m)) throw new Error(`El módulo de ${label} no está activo en tu sistema`);
  };

  if (accion.tool === "crear_turno") {
    requireModule("turnos", "Turnos");
    const { titulo, fecha, hora, nombre_cliente } = accion.input;
    const startsAt = new Date(`${fecha}T${hora}:00-03:00`);
    if (Number.isNaN(startsAt.getTime())) throw new Error("La fecha u hora del turno no es válida");

    // Duración: tomamos el slotMinutes de la disponibilidad de ese día, o 30 por defecto.
    const weekday = weekdayOf(fecha);
    const block = await db.availability.findFirst({
      where: { clientId: id, weekday },
      orderBy: { startTime: "asc" },
      select: { slotMinutes: true },
    });
    const minutes = block?.slotMinutes && block.slotMinutes > 0 ? block.slotMinutes : 30;
    const endsAt = new Date(startsAt.getTime() + minutes * 60_000);

    // No permitir choque con otro turno no cancelado (reusa la lógica de slots).
    if (await hasOverlap(id, startsAt, endsAt)) {
      throw new Error("Ya hay un turno en ese horario. Probá con otro horario.");
    }

    // Si vino nombre, dejamos el contacto enganchado (dedup por nombre dentro del tenant).
    let contactId: string | undefined;
    if (nombre_cliente) {
      const existing = await db.contact.findFirst({
        where: { clientId: id, name: nombre_cliente },
        select: { id: true },
      });
      contactId = existing?.id;
    }

    await db.appointment.create({
      data: {
        clientId: id,
        title: titulo,
        startsAt,
        endsAt,
        status: "PENDING",
        source: "asistente",
        ...(contactId ? { contactId } : {}),
      },
    });
    return `Listo, cargué el turno "${titulo}" para el ${fmtDayLabel(fecha)} a las ${hora} (queda pendiente de confirmar).`;
  }

  if (accion.tool === "agregar_producto") {
    requireModule("catalogo", "Catálogo");
    const { nombre, precio_ars, stock, minimo } = accion.input;
    await db.product.create({
      data: {
        clientId: id,
        name: nombre,
        priceArs: precio_ars ?? null,
        stock: stock ?? 0,
        minStock: minimo ?? 0,
        active: true,
      },
    });
    return `Listo, agregué el producto "${nombre}" al catálogo.`;
  }

  if (accion.tool === "agregar_contacto") {
    requireModule("crm", "CRM");
    const { nombre, telefono, email, etapa } = accion.input;
    // Dedup por teléfono dentro del tenant.
    if (telefono) {
      const existing = await db.contact.findFirst({
        where: { clientId: id, phone: telefono },
        select: { id: true, name: true },
      });
      if (existing) {
        return `Ese teléfono ya estaba cargado como "${existing.name}", así que no dupliqué el contacto.`;
      }
    }
    await db.contact.create({
      data: {
        clientId: id,
        name: nombre,
        phone: telefono ?? null,
        email: email ?? null,
        stage: etapa || "nuevo",
        source: "asistente",
      },
    });
    return `Listo, cargué a "${nombre}" en el CRM.`;
  }

  if (accion.tool === "cambiar_branding") {
    const current = (tenant.branding as Record<string, unknown> | null) ?? {};
    const next = { ...current };
    if (accion.input.displayName) next.displayName = accion.input.displayName;
    if (accion.input.primary) next.primary = accion.input.primary;
    if (accion.input.accent) next.accent = accion.input.accent;
    await db.client.update({ where: { id }, data: { branding: next as Prisma.InputJsonValue } });
    return "Listo, actualicé la marca de tu sistema.";
  }

  if (accion.tool === "editar_datos_negocio") {
    const current = (tenant.settings as Record<string, unknown> | null) ?? {};
    const next: Record<string, unknown> = { ...current };
    if (accion.input.direccion !== undefined) next.direccion = accion.input.direccion;
    if (accion.input.telefono !== undefined) next.telefono = accion.input.telefono;
    if (accion.input.horariosTexto !== undefined) next.horariosTexto = accion.input.horariosTexto;
    if (accion.input.faqs !== undefined) next.faqs = accion.input.faqs;
    await db.client.update({ where: { id }, data: { settings: next as Prisma.InputJsonValue } });
    return "Listo, actualicé los datos de tu negocio.";
  }

  if (accion.tool === "agregar_horario_disponibilidad") {
    const { weekday, start, end, slotMinutes } = accion.input;
    if (end <= start) throw new Error("La franja tiene que terminar después de empezar");
    await db.availability.create({
      data: { clientId: id, weekday, startTime: start, endTime: end, slotMinutes },
    });
    return `Listo, agregué la franja de ${WEEKDAYS[weekday]} de ${start} a ${end}.`;
  }

  // actualizar_dato_contacto
  const data: { email?: string; phone?: string; whatsapp?: string } = {};
  if (accion.input.email !== undefined) data.email = accion.input.email;
  if (accion.input.phone !== undefined) data.phone = accion.input.phone;
  if (accion.input.whatsapp !== undefined) data.whatsapp = accion.input.whatsapp;
  await db.client.update({ where: { id }, data });
  return "Listo, actualicé los datos de contacto de tu cuenta.";
}

/** Texto humano que describe una propuesta, para mostrar en la tarjeta de confirmación. */
export function describirAccion(accion: AccionConfirmada): { titulo: string; detalle: string } {
  switch (accion.tool) {
    case "cambiar_branding": {
      const partes: string[] = [];
      if (accion.input.displayName) partes.push(`nombre → "${accion.input.displayName}"`);
      if (accion.input.primary) partes.push(`color principal → ${accion.input.primary}`);
      if (accion.input.accent) partes.push(`color de acento → ${accion.input.accent}`);
      return { titulo: "Cambiar la marca del sistema", detalle: partes.join(" · ") };
    }
    case "editar_datos_negocio": {
      const partes: string[] = [];
      if (accion.input.direccion !== undefined) partes.push(`dirección → ${accion.input.direccion || "(vacío)"}`);
      if (accion.input.telefono !== undefined) partes.push(`teléfono → ${accion.input.telefono || "(vacío)"}`);
      if (accion.input.horariosTexto !== undefined) partes.push(`horarios → ${accion.input.horariosTexto || "(vacío)"}`);
      if (accion.input.faqs !== undefined) partes.push(`${accion.input.faqs.length} FAQ(s)`);
      return { titulo: "Actualizar datos del negocio", detalle: partes.join(" · ") };
    }
    case "agregar_horario_disponibilidad":
      return {
        titulo: "Agregar horario de atención",
        detalle: `${WEEKDAYS[accion.input.weekday]} de ${accion.input.start} a ${accion.input.end} (turnos de ${accion.input.slotMinutes ?? 30} min)`,
      };
    case "actualizar_dato_contacto": {
      const partes: string[] = [];
      if (accion.input.email !== undefined) partes.push(`email → ${accion.input.email}`);
      if (accion.input.phone !== undefined) partes.push(`teléfono → ${accion.input.phone}`);
      if (accion.input.whatsapp !== undefined) partes.push(`WhatsApp → ${accion.input.whatsapp}`);
      return { titulo: "Actualizar contacto de la cuenta", detalle: partes.join(" · ") };
    }
    case "crear_turno": {
      const partes = [`${fmtDayLabel(accion.input.fecha)} a las ${accion.input.hora}`];
      if (accion.input.nombre_cliente) partes.push(`con ${accion.input.nombre_cliente}`);
      return {
        titulo: `Cargar turno: ${accion.input.titulo}`,
        detalle: partes.join(" · "),
      };
    }
    case "agregar_producto": {
      const partes: string[] = [];
      if (accion.input.precio_ars !== undefined)
        partes.push(`$${accion.input.precio_ars.toLocaleString("es-AR")}`);
      if (accion.input.stock !== undefined) partes.push(`stock ${accion.input.stock}`);
      if (accion.input.minimo !== undefined) partes.push(`mínimo ${accion.input.minimo}`);
      return {
        titulo: `Agregar producto: ${accion.input.nombre}`,
        detalle: partes.length ? partes.join(" · ") : "Sin precio ni stock por ahora",
      };
    }
    case "agregar_contacto": {
      const partes: string[] = [];
      if (accion.input.telefono) partes.push(`tel ${accion.input.telefono}`);
      if (accion.input.email) partes.push(accion.input.email);
      if (accion.input.etapa) partes.push(`etapa ${accion.input.etapa}`);
      return {
        titulo: `Cargar contacto: ${accion.input.nombre}`,
        detalle: partes.length ? partes.join(" · ") : "Sin datos de contacto adicionales",
      };
    }
  }
}
