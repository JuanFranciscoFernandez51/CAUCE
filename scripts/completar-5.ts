/**
 * Completa el delivery de 3 tenants nuevos (lead + blueprint + automatizaciones)
 * para que sus presentaciones se vean completas. Clínica y Distribuidora ya están.
 * Idempotente. Uso: npx tsx scripts/completar-5.ts
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

type Spec = {
  slug: string;
  lead: { name: string; business: string; rubro: string; email: string; whatsapp: string; web: string; instagram: string };
  level: "N1" | "N2" | "N3" | "N4";
  pack: "STARTER" | "PRO" | "SCALE" | "CUSTOM";
  setup: number;
  monthly: number;
  summary: string;
  flow: { paso: number; titulo: string; detalle: string }[];
  recetas: string[]; // nombres exactos del recetario
  config: Record<string, string>;
};

const SPECS: Spec[] = [
  {
    slug: "marenco-propiedades",
    lead: { name: "Luis Marenco", business: "Marenco Propiedades", rubro: "inmobiliaria", email: "info@marencopropiedades.com", whatsapp: "+5492914830001", web: "marencopropiedades.com", instagram: "@marencopropiedades" },
    level: "N3", pack: "SCALE", setup: 1500, monthly: 500,
    summary:
      "Marenco Propiedades recibe consultas dispersas por Zonaprop, Instagram y la web, y la mitad se enfría sin seguimiento. Lo encauzamos: toda consulta entra a un CRM único con bienvenida automática, cada presupuesto de alquiler/venta recibe seguimiento solo, y la web propia con catálogo capta interesados y agenda visitas sin intervención manual.",
    flow: [
      { paso: 1, titulo: "Web con catálogo propio", detalle: "Las propiedades publicadas captan consultas 24/7; cada una cae al CRM con su fuente." },
      { paso: 2, titulo: "CRM unificado", detalle: "IG, web y WhatsApp en un solo lugar, con bienvenida instantánea y datos clave (zona, presupuesto, operación)." },
      { paso: 3, titulo: "Seguimiento de tasaciones", detalle: "Cadencia automática 24h/72h/7d sobre cada presupuesto hasta que el interesado responde." },
      { paso: 4, titulo: "Agenda de visitas", detalle: "Las visitas se coordinan y recuerdan solas; nada se pierde." },
    ],
    recetas: ["Captura multicanal → CRM", "Seguimiento de presupuesto no cerrado", "Recordatorio de turnos/citas"],
    config: { nombre_negocio: "Marenco Propiedades", telefono: "+5492914830001", criterios: "operación, zona, presupuesto", frecuencia_seguimiento: "24h, 72h, 7d" },
  },
  {
    slug: "lume-studio",
    lead: { name: "Romina Lume", business: "Lume Studio", rubro: "peluquería y estética", email: "turnos@lumestudio.com", whatsapp: "+5492914840001", web: "", instagram: "@lumestudio" },
    level: "N3", pack: "PRO", setup: 0, monthly: 300,
    summary:
      "Lume Studio pierde turnos por olvidos y horas al teléfono coordinando agenda. Con agendado self-service por WhatsApp la clienta reserva sola en los huecos reales, los recordatorios automáticos bajan el ausentismo, y la reactivación trae de vuelta a las que hace rato no vienen. Todo cae en su agenda y su base de clientas.",
    flow: [
      { paso: 1, titulo: "Reserva por WhatsApp", detalle: "La clienta pide turno, el bot ofrece los huecos libres por estilista y agenda solo." },
      { paso: 2, titulo: "Recordatorio anti-ausencia", detalle: "Aviso 24h antes con confirmar/cancelar; el hueco liberado se reutiliza." },
      { paso: 3, titulo: "Reactivación", detalle: "A las clientas sin visita hace meses les llega una oferta para volver." },
    ],
    recetas: ["Agendado self-service por WhatsApp", "Recordatorio de turnos/citas", "Reactivación de clientes inactivos"],
    config: { nombre_negocio: "Lume Studio", telefono: "+5492914840001", tono: "cercano y canchero", meses_inactivo: "3" },
  },
  {
    slug: "pulso-studio",
    lead: { name: "Caro Vidal", business: "Pulso Studio", rubro: "agencia de marketing", email: "hola@pulsostudio.com", whatsapp: "+5492914820001", web: "pulsostudio.com", instagram: "@pulsostudio" },
    level: "N3", pack: "SCALE", setup: 800, monthly: 600,
    summary:
      "Pulso Studio maneja varias cuentas en paralelo y se le escapan propuestas sin seguimiento y entregas sin método. Centralizamos las consultas de nuevas cuentas en un CRM, automatizamos el seguimiento de cada presupuesto, programamos el contenido propio de la agencia, y ordenamos los proyectos del equipo de punta a punta con tablero y tareas asignadas.",
    flow: [
      { paso: 1, titulo: "Nuevas cuentas al CRM", detalle: "Cada consulta de marca interesada entra ordenada, nadie queda sin respuesta." },
      { paso: 2, titulo: "Seguimiento de propuestas", detalle: "Las propuestas comerciales reciben cadencia automática hasta el sí." },
      { paso: 3, titulo: "Proyectos del equipo", detalle: "Tablero por proyecto con tareas, responsables y entregas — de propuesta a entregado." },
      { paso: 4, titulo: "Contenido programado", detalle: "El contenido propio de la agencia se publica solo según el calendario." },
    ],
    recetas: ["Captura multicanal → CRM", "Seguimiento de presupuesto no cerrado", "Publicación programada multicanal"],
    config: { nombre_negocio: "Pulso Studio", telefono: "+5492914820001", criterios: "industria, presupuesto, urgencia", hora_publicacion: "10:00" },
  },
];

async function main() {
  for (const s of SPECS) {
    const c = await db.client.findUnique({ where: { slug: s.slug } });
    if (!c) { console.log("— no existe", s.slug); continue; }

    // Lead (idempotente por clientId)
    let lead = await db.lead.findFirst({ where: { clientId: c.id } });
    if (!lead) {
      lead = await db.lead.create({
        data: {
          source: "CONSULTORIA", status: "CONVERTED", clientId: c.id,
          name: s.lead.name, business: s.lead.business, rubro: s.lead.rubro,
          email: s.lead.email, whatsapp: s.lead.whatsapp, score: 88,
          intake: { web: s.lead.web || null, instagram: s.lead.instagram || null, origen: "demo-presentacion" },
        },
      });
    }

    // Blueprint
    let bp = await db.blueprint.findFirst({ where: { leadId: lead.id } });
    if (!bp) {
      const recipes = await db.recipe.findMany({ where: { name: { in: s.recetas } }, select: { id: true } });
      bp = await db.blueprint.create({
        data: {
          leadId: lead.id, status: "APPROVED", level: s.level,
          summary: s.summary, flow: s.flow, recipeIds: recipes.map((r) => r.id),
          suggestedPack: s.pack, suggestedSetup: s.setup, suggestedMonthly: s.monthly,
        },
      });
    }

    // Automatizaciones ACTIVE con config
    if ((await db.automation.count({ where: { clientId: c.id } })) === 0) {
      const recipes = await db.recipe.findMany({ where: { name: { in: s.recetas } } });
      for (const r of recipes) {
        await db.automation.create({
          data: { clientId: c.id, recipeId: r.id, name: r.name, status: "ACTIVE", health: "OK", config: s.config },
        });
      }
    }
    const autos = await db.automation.count({ where: { clientId: c.id } });
    console.log(`✅ ${s.slug.padEnd(28)} blueprint ${bp.level}/${bp.suggestedPack} · ${autos} automatizaciones`);
  }
  console.log("\n🌊 Listo. 5 clientes con presentación completa:");
  console.log("  marenco-propiedades · lume-studio · pulso-studio · clinicadentaliriarte · distribuidoracarusomayorista");
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
