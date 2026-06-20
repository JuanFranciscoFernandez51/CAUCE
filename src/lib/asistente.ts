import type Anthropic from "@anthropic-ai/sdk";
import type { Client, Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import { tenantBranding, tenantModules, MODULE_LABELS, type OsModule } from "@/lib/tenant";
import { TIME_RE } from "@/app/os/[slug]/_lib/dates";

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

// ── System prompt con TODA la info del negocio ──────────────────────────
const WEEKDAYS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

export async function buildSystemPrompt(
  tenant: Client,
  modules: OsModule[],
  summary: TenantSummary,
  isOwner: boolean
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
    isOwner
      ? `PODÉS PROPONER CAMBIOS CHICOS con las herramientas disponibles (marca, datos del negocio, horarios, contacto de la cuenta). Cuando uses una herramienta, NO la des por hecha: el dueño todavía tiene que confirmar la propuesta con un botón. Después de proponer, contá en una frase qué cambio dejaste listo para confirmar.`
      : `Este usuario es del equipo (no es el dueño): SÓLO consultá e informá. No podés cambiar nada; si te piden un cambio, aclará que eso lo tiene que hacer el dueño desde el Asistente o la Configuración.`,
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
]);

export type AccionConfirmada = z.infer<typeof accionSchema>;

/** Aplica una propuesta YA validada, scopeada al tenant. Devuelve un texto de confirmación. */
export async function aplicarAccion(tenant: Client, accion: AccionConfirmada): Promise<string> {
  const id = tenant.id;

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
  }
}
