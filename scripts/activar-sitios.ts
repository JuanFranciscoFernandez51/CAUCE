/**
 * Activa el módulo "sitio" (web pública institucional) en TODOS los tenants
 * que no lo tengan, y siembra `servicios` + `sobre` de ejemplo por rubro en
 * Client.settings para que las homes se vean vivas desde el primer día.
 *
 * IDEMPOTENTE:
 *   - No duplica "sitio" si ya está en modules.
 *   - NO pisa servicios/sobre que el tenant ya haya cargado.
 *   - NO toca ninguna otra clave de settings ni datos de otros módulos.
 *
 * Uso: npx tsx scripts/activar-sitios.ts
 */
import { PrismaClient, Prisma } from "@prisma/client";
import { resolvePlaybook } from "../src/lib/playbooks";

const db = new PrismaClient();

/** Servicios + "sobre" de ejemplo por clave de playbook (rubro resuelto). */
const EJEMPLOS: Record<string, { servicios: { titulo: string; detalle: string }[]; sobre: string }> = {
  inmobiliaria: {
    servicios: [
      { titulo: "Compra y venta", detalle: "Te acompañamos en cada paso de la operación." },
      { titulo: "Alquileres", detalle: "Propiedades para vivir o invertir, con gestión integral." },
      { titulo: "Tasaciones", detalle: "Valuación profesional y sin cargo de tu propiedad." },
    ],
    sobre:
      "Somos una inmobiliaria con años de experiencia en la zona. Te asesoramos en cada operación con transparencia y compromiso para que tomes la mejor decisión.",
  },
  clinica: {
    servicios: [
      { titulo: "Consultas y diagnóstico", detalle: "Atención personalizada con turno previo." },
      { titulo: "Tratamientos", detalle: "Planes a medida según cada caso." },
      { titulo: "Controles y seguimiento", detalle: "Te acompañamos en toda la evolución." },
    ],
    sobre:
      "Nuestro equipo de profesionales se dedica a tu salud con atención cercana y tecnología de última generación. Pedí tu turno y conocenos.",
  },
  peluqueria: {
    servicios: [
      { titulo: "Cortes y peinados", detalle: "Para cada estilo y ocasión." },
      { titulo: "Color y tratamientos", detalle: "Cuidamos tu cabello con los mejores productos." },
      { titulo: "Reservá tu turno", detalle: "Elegí día, hora y profesional online." },
    ],
    sobre:
      "Somos un salón pensado para que vivas una experiencia única. Nuestro equipo de estilistas está para sacar tu mejor versión. Reservá tu turno online.",
  },
  gimnasio: {
    servicios: [
      { titulo: "Clases grupales", detalle: "Funcional, ritmos y más, en grupos reducidos." },
      { titulo: "Entrenamiento personalizado", detalle: "Planes según tu objetivo." },
      { titulo: "Asesoramiento", detalle: "Te acompañamos para que llegues a tu meta." },
    ],
    sobre:
      "Más que un gimnasio: una comunidad. Te ayudamos a entrenar mejor con planes a medida y profesores que te conocen por tu nombre.",
  },
  taller: {
    servicios: [
      { titulo: "Service y mantenimiento", detalle: "Mantené tu vehículo siempre a punto." },
      { titulo: "Diagnóstico y reparación", detalle: "Detectamos y resolvemos el problema." },
      { titulo: "Repuestos y accesorios", detalle: "Originales y de calidad." },
    ],
    sobre:
      "Trabajamos con responsabilidad y precios claros. Pedí tu turno de service y dejá tu vehículo en manos de quienes saben.",
  },
  gastronomia: {
    servicios: [
      { titulo: "Salón", detalle: "Te esperamos para disfrutar nuestra cocina." },
      { titulo: "Delivery y take away", detalle: "Pedí y disfrutá donde quieras." },
      { titulo: "Eventos", detalle: "Organizamos tu celebración." },
    ],
    sobre:
      "Cocinamos con ingredientes frescos y mucho amor. Vení a probar nuestra carta o pedí a domicilio: el sabor llega igual.",
  },
  hotel: {
    servicios: [
      { titulo: "Habitaciones", detalle: "Confort y descanso para tu estadía." },
      { titulo: "Reservas online", detalle: "Asegurá tu lugar en pocos pasos." },
      { titulo: "Servicios", detalle: "Todo lo que necesitás para una estadía perfecta." },
    ],
    sobre:
      "Un lugar pensado para tu descanso. Te recibimos con la calidez de siempre para que tu estadía sea inolvidable.",
  },
  tienda: {
    servicios: [
      { titulo: "Catálogo online", detalle: "Mirá todos nuestros productos." },
      { titulo: "Envíos", detalle: "Te lo llevamos a donde estés." },
      { titulo: "Atención personalizada", detalle: "Escribinos y te asesoramos." },
    ],
    sobre:
      "Seleccionamos cada producto con cuidado para ofrecerte lo mejor. Mirá nuestro catálogo y escribinos por cualquier consulta.",
  },
  distribuidora: {
    servicios: [
      { titulo: "Venta mayorista", detalle: "Mejores precios por volumen." },
      { titulo: "Logística propia", detalle: "Entregas en tiempo y forma." },
      { titulo: "Cuenta corriente", detalle: "Condiciones a medida para tu comercio." },
    ],
    sobre:
      "Abastecemos comercios de toda la región con stock permanente y entregas confiables. Sumate a nuestra red de clientes.",
  },
  contable: {
    servicios: [
      { titulo: "Liquidación de impuestos", detalle: "Cumplí en fecha y sin dolores de cabeza." },
      { titulo: "Asesoramiento", detalle: "Te orientamos en cada decisión." },
      { titulo: "Gestión integral", detalle: "Nos ocupamos de toda tu administración." },
    ],
    sobre:
      "Un estudio que te acompaña. Nos ocupamos de tus obligaciones para que vos te ocupes de hacer crecer tu negocio.",
  },
  escuela: {
    servicios: [
      { titulo: "Clases para todos los niveles", detalle: "Desde principiantes a avanzados." },
      { titulo: "Instructores certificados", detalle: "Aprendé con los mejores." },
      { titulo: "Reservá tu clase", detalle: "Elegí día y horario online." },
    ],
    sobre:
      "Enseñamos con pasión y experiencia. Sumate y aprendé a tu ritmo, con instructores que te acompañan en cada paso.",
  },
  agencia: {
    servicios: [
      { titulo: "Estrategia y branding", detalle: "Construimos tu marca desde cero." },
      { titulo: "Campañas de publicidad", detalle: "Llegá a más clientes." },
      { titulo: "Contenido y redes", detalle: "Gestionamos tu presencia digital." },
    ],
    sobre:
      "Somos un equipo creativo que potencia marcas. Pensamos estrategias a medida para que tu negocio crezca y se destaque.",
  },
  generico: {
    servicios: [
      { titulo: "Nuestros servicios", detalle: "Soluciones pensadas para vos." },
      { titulo: "Atención personalizada", detalle: "Escribinos y te ayudamos." },
      { titulo: "Calidad garantizada", detalle: "Trabajamos para que estés conforme." },
    ],
    sobre:
      "Trabajamos todos los días para ofrecerte el mejor servicio. Conocenos y descubrí por qué nuestros clientes nos eligen.",
  },
};

async function main() {
  const clients = await db.client.findMany({
    select: { id: true, name: true, slug: true, rubro: true, modules: true, settings: true },
  });

  let activados = 0;
  let yaTenian = 0;
  let sembrados = 0;

  for (const c of clients) {
    const modules = Array.isArray(c.modules) ? (c.modules as string[]) : [];
    const tieneSitio = modules.includes("sitio");

    const pb = resolvePlaybook(c.rubro);
    const ejemplo = EJEMPLOS[pb.key] ?? EJEMPLOS.generico;

    const settings = (c.settings as Record<string, unknown> | null) ?? {};
    const nuevoSettings = { ...settings };
    let tocoSettings = false;

    // Sembramos servicios/sobre SOLO si faltan — nunca pisamos lo cargado.
    if (
      !Array.isArray(nuevoSettings.servicios) ||
      (nuevoSettings.servicios as unknown[]).length === 0
    ) {
      nuevoSettings.servicios = ejemplo.servicios;
      tocoSettings = true;
    }
    if (typeof nuevoSettings.sobre !== "string" || !(nuevoSettings.sobre as string).trim()) {
      nuevoSettings.sobre = ejemplo.sobre;
      tocoSettings = true;
    }

    const data: Prisma.ClientUpdateInput = {};
    if (!tieneSitio) {
      data.modules = [...modules, "sitio"];
      activados++;
    } else {
      yaTenian++;
    }
    if (tocoSettings) {
      data.settings = nuevoSettings as Prisma.InputJsonValue;
      sembrados++;
    }

    if (Object.keys(data).length > 0) {
      await db.client.update({ where: { id: c.id }, data });
    }

    const flags = [
      tieneSitio ? "sitio✓" : "+sitio",
      tocoSettings ? "+contenido" : "contenido✓",
    ].join(" ");
    console.log(`  ${c.slug.padEnd(24)} [${pb.key}]  ${flags}`);
  }

  console.log("");
  console.log(`Tenants procesados: ${clients.length}`);
  console.log(`  Módulo "sitio" activado ahora: ${activados}`);
  console.log(`  Ya tenían "sitio": ${yaTenian}`);
  console.log(`  Contenido de ejemplo sembrado: ${sembrados}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
