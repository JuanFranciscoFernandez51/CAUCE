import { PrismaClient, BizArea, Level } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

type SeedRecipe = {
  name: string;
  area: BizArea;
  level: Level;
  apps: string[];
  solves: string;
  variables: { key: string; label: string; type: string; required: boolean; help?: string }[];
  buildHours: number;
};

const V = (key: string, label: string, required = true, help?: string, type = "text") => ({
  key,
  label,
  type,
  required,
  help,
});

const RECIPES: SeedRecipe[] = [
  // ── Atención al cliente ──
  {
    name: "Bot FAQ + captura de lead (WhatsApp o IG)",
    area: "ATENCION", level: "N2",
    apps: ["whatsapp", "instagram", "claude"],
    solves: "Responde 24/7 las preguntas frecuentes, califica al interesado, carga el lead y avisa solo si está caliente. La receta del pack Starter.",
    variables: [
      V("nombre_negocio", "Nombre del negocio"),
      V("faqs", "Preguntas y respuestas frecuentes", true, "Una por línea: pregunta | respuesta", "textarea"),
      V("horarios", "Horarios de atención"),
      V("telefono_aviso", "WhatsApp donde avisar leads calientes"),
      V("tono", "Tono del bot", false, "ej: amable e informal"),
    ],
    buildHours: 2,
  },
  {
    name: "Respuesta y derivación de reclamos",
    area: "ATENCION", level: "N2",
    apps: ["whatsapp", "claude", "sheets"],
    solves: "Clasifica el reclamo, responde lo resolvible y deriva lo grave a un humano con todo el contexto.",
    variables: [
      V("categorias", "Categorías de reclamos", true, "ej: demora, producto fallado, facturación", "textarea"),
      V("telefono_derivacion", "WhatsApp del responsable"),
      V("politicas", "Políticas de resolución", false, "qué puede resolver el bot solo", "textarea"),
    ],
    buildHours: 3,
  },
  {
    name: "Encuesta post-venta / pedido de reseña",
    area: "ATENCION", level: "N1",
    apps: ["whatsapp", "sheets"],
    solves: "Mensaje automático después de la entrega: pide reseña en Google/redes y registra la satisfacción.",
    variables: [
      V("link_resena", "Link de reseña (Google/redes)"),
      V("mensaje", "Mensaje de agradecimiento", false, "", "textarea"),
      V("dias_post_entrega", "Días después de la entrega", true, "ej: 2", "number"),
    ],
    buildHours: 1,
  },
  // ── Ventas / CRM ──
  {
    name: "Captura multicanal → CRM",
    area: "VENTAS_CRM", level: "N2",
    apps: ["instagram", "facebook", "web", "sheets", "whatsapp"],
    solves: "Todo lead de web/IG/FB entra al CRM con fuente y datos, y recibe respuesta de bienvenida automática.",
    variables: [
      V("canales", "Canales a conectar", true, "ej: IG, FB, formulario web"),
      V("destino_crm", "Dónde vive tu CRM", true, "Sheets, sistema propio, Cauce OS"),
      V("mensaje_bienvenida", "Mensaje de bienvenida", true, "", "textarea"),
    ],
    buildHours: 3,
  },
  {
    name: "Seguimiento de presupuesto no cerrado",
    area: "VENTAS_CRM", level: "N1",
    apps: ["whatsapp", "sheets"],
    solves: "Cadencia automática de toques (24h, 72h, 7 días) hasta que el cliente responda. Ningún presupuesto muere por olvido.",
    variables: [
      V("cadencia", "Cadencia de toques", true, "ej: 24h, 72h, 7d"),
      V("mensajes", "Mensajes de cada toque", true, "uno por línea", "textarea"),
    ],
    buildHours: 2,
  },
  {
    name: "Calificación + cotización automática",
    area: "VENTAS_CRM", level: "N3",
    apps: ["whatsapp", "claude", "sheets", "gmail"],
    solves: "La IA califica el lead, arma la cotización desde tu plantilla y dispara el seguimiento.",
    variables: [
      V("criterios", "Criterios de calificación", true, "", "textarea"),
      V("plantilla_cotizacion", "Plantilla de cotización", true, "", "textarea"),
      V("lista_precios", "Lista de precios (link o planilla)"),
    ],
    buildHours: 6,
  },
  {
    name: "Reactivación de clientes inactivos",
    area: "VENTAS_CRM", level: "N2",
    apps: ["whatsapp", "sheets"],
    solves: "Detecta clientes sin compra en X meses y les manda una campaña de reactivación por WhatsApp.",
    variables: [
      V("meses_inactividad", "Meses sin compra", true, "ej: 6", "number"),
      V("oferta", "Oferta o mensaje de reactivación", true, "", "textarea"),
      V("origen_datos", "De dónde salen los clientes", true, "Sheets, sistema, Cauce OS"),
    ],
    buildHours: 3,
  },
  // ── Marketing ──
  {
    name: "Publicación programada multicanal",
    area: "MARKETING", level: "N2",
    apps: ["sheets", "instagram", "facebook"],
    solves: "Calendario de contenido en Sheets → publica en IG/FB automáticamente. Cargás una vez, sale solo.",
    variables: [
      V("sheet_calendario", "Planilla del calendario"),
      V("cuentas", "Cuentas de IG/FB a publicar"),
      V("horarios_publicacion", "Horarios preferidos", false),
    ],
    buildHours: 3,
  },
  {
    name: "Generador de contenido por caso de éxito",
    area: "MARKETING", level: "N3",
    apps: ["claude", "sheets", "instagram"],
    solves: "Toma datos reales del negocio y genera posts y copies con IA para que apruebes con un click.",
    variables: [
      V("fuente_datos", "Fuente de casos/datos", true, "ventas, trabajos terminados, reseñas"),
      V("tono_marca", "Tono de la marca", true, "", "textarea"),
      V("frecuencia", "Frecuencia de generación", true, "ej: semanal"),
    ],
    buildHours: 5,
  },
  {
    name: "Respuesta automática a comentarios/DMs de campañas",
    area: "MARKETING", level: "N2",
    apps: ["instagram", "facebook", "claude"],
    solves: "Comentario en un anuncio → DM automático con la info y captura del dato. Ningún interesado queda sin responder.",
    variables: [
      V("palabras_clave", "Palabras clave que disparan", true, "ej: precio, info"),
      V("respuesta_dm", "Mensaje de DM", true, "", "textarea"),
    ],
    buildHours: 3,
  },
  // ── Operaciones / Stock / Catálogo ──
  {
    name: "Alerta de stock bajo",
    area: "OPERACIONES", level: "N1",
    apps: ["sheets", "whatsapp"],
    solves: "Lee el stock (Sheets o tu sistema) y te avisa por WhatsApp cuando un ítem baja del mínimo.",
    variables: [
      V("origen_stock", "Dónde está el stock", true, "Sheets, sistema, Cauce OS"),
      V("minimos", "Mínimos por producto o general"),
      V("telefono_aviso", "WhatsApp donde avisar"),
    ],
    buildHours: 1.5,
  },
  {
    name: "Catálogo sincronizado",
    area: "OPERACIONES", level: "N2",
    apps: ["sheets", "whatsapp", "meta"],
    solves: "Tu planilla de productos → catálogo de WhatsApp Business / feed de Meta, siempre al día.",
    variables: [
      V("sheet_productos", "Planilla de productos"),
      V("destino", "Destino", true, "catálogo WhatsApp, feed Meta, ambos"),
    ],
    buildHours: 4,
  },
  {
    name: "Confirmación y seguimiento de pedidos",
    area: "OPERACIONES", level: "N2",
    apps: ["whatsapp", "sheets"],
    solves: "Pedido nuevo → confirmación al cliente → aviso de estado → aviso de entrega. El cliente nunca pregunta '¿salió mi pedido?'.",
    variables: [
      V("origen_pedidos", "De dónde entran los pedidos"),
      V("estados", "Estados del pedido", true, "ej: confirmado, en preparación, enviado, entregado"),
    ],
    buildHours: 4,
  },
  // ── Turnos / Agenda ──
  {
    name: "Recordatorio de turnos/citas",
    area: "TURNOS", level: "N1",
    apps: ["calendar", "sheets", "whatsapp"],
    solves: "Lee tu agenda (Calendar/Sheets), recuerda el turno por WhatsApp y registra confirmación o cancelación.",
    variables: [
      V("origen_agenda", "Dónde está la agenda", true, "Calendar, Sheets, Cauce OS"),
      V("horas_antes", "Horas de anticipación", true, "ej: 24", "number"),
      V("mensaje_recordatorio", "Mensaje del recordatorio", true, "", "textarea"),
    ],
    buildHours: 2,
  },
  {
    name: "Agendado self-service por WhatsApp",
    area: "TURNOS", level: "N3",
    apps: ["whatsapp", "claude", "calendar"],
    solves: "El cliente pide turno por WhatsApp, el bot ofrece los huecos libres y agenda solo. Integra con el módulo Turnos de Cauce OS.",
    variables: [
      V("duracion_turno", "Duración del turno (min)", true, "ej: 30", "number"),
      V("agenda_destino", "Agenda destino", true, "Calendar o módulo Turnos de Cauce OS"),
      V("servicios", "Servicios agendables", true, "uno por línea", "textarea"),
    ],
    buildHours: 6,
  },
  // ── RRHH / Empleados ──
  {
    name: "Registro de entradas y salidas",
    area: "RRHH", level: "N2",
    apps: ["whatsapp", "sheets"],
    solves: "El empleado marca entrada/salida por WhatsApp (o form), queda registrado con hora, y el dueño recibe el reporte semanal de horas.",
    variables: [
      V("empleados", "Lista de empleados", true, "nombre y teléfono, uno por línea", "textarea"),
      V("destino_registro", "Dónde se registra", true, "Sheets o módulo RRHH de Cauce OS"),
      V("dia_reporte", "Día del reporte semanal", true, "ej: viernes"),
    ],
    buildHours: 3,
  },
  {
    name: "Recordatorio de turnos de empleados",
    area: "RRHH", level: "N1",
    apps: ["sheets", "whatsapp"],
    solves: "Aviso automático del turno del día siguiente a cada empleado; alerta al dueño si alguien no confirma.",
    variables: [
      V("origen_turnos", "Dónde están los turnos del personal"),
      V("hora_aviso", "Hora del aviso", true, "ej: 20:00"),
      V("telefono_dueno", "WhatsApp del dueño"),
    ],
    buildHours: 2,
  },
  // ── Finanzas / Admin ──
  {
    name: "Venta → factura → registro",
    area: "FINANZAS", level: "N2",
    apps: ["sheets", "afip", "gmail"],
    solves: "El alta de una venta dispara la factura y la registra en la planilla contable. Cero doble carga.",
    variables: [
      V("origen_ventas", "De dónde salen las ventas", true, "Sheets, sistema, módulo Caja de Cauce OS"),
      V("tipo_factura", "Tipo de factura", true, "A o B"),
      V("planilla_contable", "Planilla contable destino"),
    ],
    buildHours: 4,
  },
  {
    name: "Conciliación de pagos",
    area: "FINANZAS", level: "N3",
    apps: ["mercadopago", "sheets"],
    solves: "Cruza los cobros de Mercado Pago con pedidos/facturas y marca las diferencias. Encontrás los baches sin revisar a mano.",
    variables: [
      V("cuenta_mp", "Cuenta de Mercado Pago"),
      V("origen_pedidos", "Pedidos/facturas contra qué cruzar"),
      V("frecuencia", "Frecuencia", true, "diaria o semanal"),
    ],
    buildHours: 5,
  },
  {
    name: "Recordatorio de cobros pendientes",
    area: "FINANZAS", level: "N1",
    apps: ["sheets", "whatsapp"],
    solves: "Detecta facturas vencidas y manda el recordatorio de pago solo. Cobrás sin perseguir.",
    variables: [
      V("origen_facturas", "Dónde están las facturas"),
      V("dias_vencida", "Días de vencida para avisar", true, "ej: 3", "number"),
      V("mensaje_cobro", "Mensaje de recordatorio", true, "", "textarea"),
    ],
    buildHours: 1.5,
  },
];

async function main() {
  console.log("🌱 Seed de Cauce v2…");

  // ── Recetario (idempotente por nombre) ──
  for (const r of RECIPES) {
    const existing = await db.recipe.findFirst({ where: { name: r.name } });
    if (existing) {
      await db.recipe.update({ where: { id: existing.id }, data: { ...r, variables: r.variables } });
    } else {
      await db.recipe.create({ data: { ...r, variables: r.variables } });
    }
  }
  console.log(`✅ ${RECIPES.length} recetas`);

  // ── PricingConfig (defaults si no existe; no pisa cambios de Fran) ──
  const { DEFAULT_PRICING } = await import("../src/lib/pricing");
  await db.pricingConfig.upsert({
    where: { id: "singleton" },
    create: {
      id: "singleton",
      dolarArs: DEFAULT_PRICING.dolarArs,
      ivaPct: DEFAULT_PRICING.ivaPct,
      packs: DEFAULT_PRICING.packs,
      modulePricing: DEFAULT_PRICING.modulePricing,
      roadmapPriceUsd: DEFAULT_PRICING.roadmapPriceUsd,
      roadmapCredit: DEFAULT_PRICING.roadmapCredit,
    },
    update: {},
  });
  console.log("✅ PricingConfig");

  // ── Admin: Fran ──
  const adminPass = process.env.SEED_ADMIN_PASSWORD || "cauce2026";
  await db.user.upsert({
    where: { username: "fran" },
    create: {
      username: "fran",
      name: "Francisco Fernández",
      role: "ADMIN",
      passwordHash: await bcrypt.hash(adminPass, 10),
    },
    update: {},
  });
  console.log(`✅ admin "fran" (contraseña: ${process.env.SEED_ADMIN_PASSWORD ? "(env)" : "cauce2026 — CAMBIALA"})`);

  // ── Tenant demo: Vespa Bahía (caso real del criterio "SALIÓ") ──
  const vespa = await db.client.upsert({
    where: { slug: "vespabahia" },
    create: {
      name: "Vespa Bahía",
      slug: "vespabahia",
      rubro: "venta y service de scooters",
      pack: "SCALE",
      status: "ACTIVE",
      mrr: 350,
      contactName: "Francisco Fernández",
      email: "administracion@vespabahia.com",
      whatsapp: "+5492914713920",
      branding: {
        displayName: "Vespa Bahía",
        primary: "#1d4ed8",
        accent: "#f97316",
      },
      modules: ["crm", "turnos"],
      customFields: {
        contact: [{ key: "modelo_moto", label: "Modelo de moto", type: "text" }],
        appointment: [{ key: "tipo_service", label: "Tipo de service", type: "select", options: ["Service común", "Service mayor", "Reparación", "Garantía"] }],
      },
      settings: {
        horarios: "Lun a Vie 9-13 y 16-20, Sáb 9-13",
        faqs: [
          { q: "¿Hacen service de Vespa?", a: "Sí, somos especialistas en Vespa y scooters. Service común y mayor con repuestos originales." },
          { q: "¿Venden usadas?", a: "Sí, tenemos Vespas y scooters usados seleccionados con garantía." },
          { q: "¿Trabajan con financiación?", a: "Sí, financiamos con tarjeta y créditos prendarios." },
        ],
      },
    },
    update: {},
  });

  await db.user.upsert({
    where: { username: "vespa" },
    create: {
      username: "vespa",
      name: "Vespa Bahía",
      role: "CLIENT",
      clientId: vespa.id,
      passwordHash: await bcrypt.hash(process.env.SEED_CLIENT_PASSWORD || "vespa2026", 10),
    },
    update: { clientId: vespa.id },
  });

  // Disponibilidad de turnos del taller (Lun-Vie 9-13 / 16-20, Sáb 9-13)
  const avail = await db.availability.count({ where: { clientId: vespa.id } });
  if (avail === 0) {
    const rows: { clientId: string; weekday: number; startTime: string; endTime: string; slotMinutes: number }[] = [];
    for (const d of [1, 2, 3, 4, 5]) {
      rows.push({ clientId: vespa.id, weekday: d, startTime: "09:00", endTime: "13:00", slotMinutes: 60 });
      rows.push({ clientId: vespa.id, weekday: d, startTime: "16:00", endTime: "20:00", slotMinutes: 60 });
    }
    rows.push({ clientId: vespa.id, weekday: 6, startTime: "09:00", endTime: "13:00", slotMinutes: 60 });
    await db.availability.createMany({ data: rows });
  }

  // Automatización demo: el bot FAQ de Vespa (en TEST hasta que se conecte n8n)
  const faqRecipe = await db.recipe.findFirst({ where: { name: { contains: "Bot FAQ" } } });
  const existingAuto = await db.automation.findFirst({ where: { clientId: vespa.id } });
  if (!existingAuto && faqRecipe) {
    await db.automation.create({
      data: {
        clientId: vespa.id,
        recipeId: faqRecipe.id,
        name: "Bot FAQ Vespa Bahía (WhatsApp)",
        status: "TEST",
        health: "UNKNOWN",
        config: {
          nombre_negocio: "Vespa Bahía",
          horarios: "Lun a Vie 9-13 y 16-20, Sáb 9-13",
          telefono_aviso: "+5492914713920",
          tono: "amable e informal, argentino",
        },
      },
    });
  }
  console.log("✅ Tenant demo Vespa Bahía (usuario: vespa / vespa2026)");

  console.log("🌊 Seed completo.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
