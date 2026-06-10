/**
 * Demo end-to-end pedida por Francisco (2026-06-10):
 * 10 leads de complejidad variada → diagnóstico IA → blueprint → aprobar →
 * cliente + automatizaciones TEST con config → QA → usuario de portal →
 * suscripción + uso del mes → reporte mensual.
 * Lo único que queda pendiente es la provisión real en n8n (sin credenciales).
 *
 * Uso: npx tsx scripts/demo-leads.ts
 */
import { PrismaClient, LeadSource } from "@prisma/client";
import bcrypt from "bcryptjs";
import { runDiagnostico } from "../src/lib/diagnostico";
import { aprobarBlueprint, runQA } from "../src/lib/provision";
import { generarRoadmap } from "../src/lib/roadmap";
import { generateMonthlyReport } from "../src/lib/reports";
import { currentPeriod } from "../src/lib/usage";

const db = new PrismaClient();

type Demo = {
  name: string;
  business: string;
  rubro: string;
  email: string;
  whatsapp: string;
  source: LeadSource;
  intake: Record<string, unknown>;
  callNotes?: string; // para los de consultoría
  usageMsgs: number; // mensajes simulados del mes
};

const DEMOS: Demo[] = [
  {
    // N1 — lo más simple: recordatorio de cobros
    name: "Marta Giménez",
    business: "Estudio Contable Giménez",
    rubro: "estudio contable",
    email: "marta@estudiogimenez.com.ar",
    whatsapp: "+5492914000001",
    source: "INTAKE",
    intake: {
      tamano: "2-5",
      dolores: ["FINANZAS"],
      detalle: "Pierdo horas todos los meses persiguiendo clientes que no pagan los honorarios.",
      frecuencia: "varias",
      apps: ["WhatsApp", "Sheets/Excel"],
      urgencia: "este mes",
      presupuesto: "hasta 50 USD",
    },
    usageMsgs: 120,
  },
  {
    // N1/N2 — recordatorio de turnos
    name: "Lucas Peralta",
    business: "Peluquería Lucas",
    rubro: "peluquería",
    email: "lucas.pelu@gmail.com",
    whatsapp: "+5492914000002",
    source: "INTAKE",
    intake: {
      tamano: "solo yo",
      dolores: ["TURNOS"],
      detalle: "Se me caen 4 o 5 turnos por semana porque la gente se olvida.",
      frecuencia: "todo el día",
      apps: ["WhatsApp", "Google Calendar"],
      urgencia: "ya mismo",
      presupuesto: "hasta 50 USD",
    },
    usageMsgs: 340,
  },
  {
    // N2 — bot FAQ Starter clásico
    name: "Carla Ríos",
    business: "Pizzería Don Vito",
    rubro: "pizzería y delivery",
    email: "donvitobb@gmail.com",
    whatsapp: "+5492914000003",
    source: "INTAKE",
    intake: {
      tamano: "2-5",
      dolores: ["ATENCION"],
      detalle: "Nos escriben 80 veces por día preguntando precios, horarios y si hay delivery. No damos abasto.",
      frecuencia: "todo el día",
      apps: ["WhatsApp", "Instagram"],
      urgencia: "ya mismo",
      presupuesto: "50-300",
    },
    usageMsgs: 980,
  },
  {
    // N2 — captura multicanal + seguimiento
    name: "Federico Álvarez",
    business: "Inmobiliaria Álvarez Propiedades",
    rubro: "inmobiliaria",
    email: "fede@alvarezprop.com.ar",
    whatsapp: "+5492914000004",
    source: "INTAKE",
    intake: {
      tamano: "2-5",
      dolores: ["VENTAS_CRM", "ATENCION"],
      detalle: "Las consultas de Zonaprop, IG y la web quedan desparramadas y la mitad no se contesta a tiempo. Los presupuestos de alquiler se enfrían.",
      frecuencia: "varias",
      apps: ["WhatsApp", "Instagram", "Sheets/Excel"],
      urgencia: "este mes",
      presupuesto: "50-300",
    },
    usageMsgs: 450,
  },
  {
    // N2/N3 — marketing + atención
    name: "Sofía Mendoza",
    business: "Tienda Nube Urbana",
    rubro: "tienda de ropa online",
    email: "hola@nubeurbana.com",
    whatsapp: "+5492914000005",
    source: "INTAKE",
    intake: {
      tamano: "2-5",
      dolores: ["MARKETING", "ATENCION", "OPERACIONES"],
      detalle: "No llego a publicar contenido todos los días, y cuando corremos ads los DMs explotan y se pierden ventas. También me pasa de vender sin stock.",
      frecuencia: "todo el día",
      apps: ["Instagram", "Sheets/Excel", "Mercado Pago"],
      urgencia: "este mes",
      presupuesto: "300-1000",
    },
    usageMsgs: 1250,
  },
  {
    // N3 — operaciones + finanzas
    name: "Roberto Caruso",
    business: "Distribuidora Caruso Mayorista",
    rubro: "distribuidora mayorista de alimentos",
    email: "ventas@carusomayorista.com.ar",
    whatsapp: "+5492914000006",
    source: "INTAKE",
    intake: {
      tamano: "6-20",
      dolores: ["OPERACIONES", "FINANZAS", "VENTAS_CRM"],
      detalle: "Tomamos 60 pedidos por día por WhatsApp a mano, el stock vive desactualizado y la facturación es doble carga. Conciliar Mercado Pago nos lleva un día entero por semana.",
      frecuencia: "todo el día",
      apps: ["WhatsApp", "Sheets/Excel", "Mercado Pago", "sistema propio"],
      urgencia: "ya mismo",
      presupuesto: "300-1000",
    },
    usageMsgs: 2100,
  },
  {
    // N3 — turnos self-service + RRHH
    name: "Vanesa Ortiz",
    business: "Gimnasio Fuerza Sur",
    rubro: "gimnasio y clases grupales",
    email: "info@fuerzasur.com.ar",
    whatsapp: "+5492914000007",
    source: "INTAKE",
    intake: {
      tamano: "6-20",
      dolores: ["TURNOS", "RRHH", "ATENCION"],
      detalle: "Queremos que la gente reserve clases sola por WhatsApp. Además tengo 8 profes y armar los horarios y controlar quién vino es un caos.",
      frecuencia: "todo el día",
      apps: ["WhatsApp", "Sheets/Excel"],
      urgencia: "este mes",
      presupuesto: "300-1000",
    },
    usageMsgs: 1600,
  },
  {
    // CONSULTORÍA → N4 Scale: clínica dental (software propio)
    name: "Dra. Paula Iriarte",
    business: "Clínica Dental Iriarte",
    rubro: "clínica odontológica",
    email: "paula@dentaliriarte.com.ar",
    whatsapp: "+5492914000008",
    source: "CONSULTORIA",
    intake: {
      consulta: "No sé bien qué se puede automatizar, hoy todo es papel y WhatsApp. Quiero modernizar la clínica entera.",
      preferencia: "mañana",
    },
    callNotes:
      "Clínica con 3 sillones, 2 odontólogas + 1 secretaria. Agenda en papel, historia clínica en carpetas. Pierden 10-15 turnos/mes por olvidos. La secretaria pasa 3hs/día al teléfono dando turnos. Quieren: agenda digital con recordatorios automáticos, que el paciente pida turno por WhatsApp solo, ficha de paciente con historial y obra social, control de entradas/salidas del personal, y reportes de facturación por profesional. No tienen ningún sistema actual. Presupuesto: hasta 1500 USD de arranque + mensual razonable. Urgencia alta, la secretaria renuncia a fin de mes.",
    usageMsgs: 800,
  },
  {
    // CONSULTORÍA → N4 Scale/Custom: hotel boutique
    name: "Martín Echeverría",
    business: "Hotel Costa Médanos",
    rubro: "hotel boutique (12 habitaciones)",
    email: "gerencia@costamedanos.com.ar",
    whatsapp: "+5492914000009",
    source: "CONSULTORIA",
    intake: {
      consulta: "Quiero meterle IA al hotel pero no sé por dónde arrancar.",
      preferencia: "tarde",
    },
    callNotes:
      "Hotel de 12 habitaciones en Monte Hermoso. Reservas por Booking, WhatsApp e IG — las de WhatsApp/IG se anotan en un Excel y hubo doble-booking 3 veces este verano. Check-in manual. Quieren: bot que responda disponibilidad y precios 24/7, registro centralizado de reservas directas, recordatorio de seña pendiente (pierden reservas porque nadie persigue la seña), encuesta post-estadía pidiendo reseña en Google, control de horarios de mucamas y recepcionistas. Facturación: quieren cruzar cobros de MP con reservas. Presupuesto: a definir según propuesta, son dos socios.",
    usageMsgs: 1900,
  },
  {
    // CONSULTORÍA → N3/N4: taller mecánico multi-área
    name: "Diego Funes",
    business: "Taller Funes Hnos",
    rubro: "taller mecánico integral",
    email: "tallerfunes@gmail.com",
    whatsapp: "+5492914000010",
    source: "CONSULTORIA",
    intake: {
      consulta: "Mi hijo dice que estamos perdiendo plata por desorganizados. Quiero ver qué se puede hacer.",
      preferencia: "indistinto",
    },
    callNotes:
      "Taller con 5 mecánicos, trabajan a agenda llena. Los clientes llaman para pedir turno y nadie atiende el teléfono (están abajo del auto). Presupuestos se pasan por WhatsApp y no se les hace seguimiento — calculan que cierran la mitad de lo que podrían. No avisan al cliente cuando el auto está listo, el playón vive lleno. Querrían: turnos por WhatsApp self-service, seguimiento automático de presupuestos, aviso de 'auto listo' automático, recordatorio de service por kilometraje/tiempo (tienen historial en un Excel de 8 años), y registro de qué mecánico hizo qué. Presupuesto: 300-1000 USD/mes está OK si se paga solo.",
    usageMsgs: 700,
  },
];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ─────────────────────────────────────────────────────────────
// FALLBACK CURADO: si la API de Anthropic no tiene créditos,
// el blueprint/roadmap sale de acá (curado a mano contra el
// recetario real). Cuando haya créditos, los leads nuevos se
// diagnostican con IA normalmente.
// ─────────────────────────────────────────────────────────────
type Curated = {
  level: "N1" | "N2" | "N3" | "N4";
  pack: "STARTER" | "PRO" | "SCALE" | "CUSTOM";
  setup: number;
  monthly: number;
  score: number;
  summary: string;
  recipeNames: string[];
  flow: { paso: number; titulo: string; detalle: string }[];
  roadmap?: {
    resumen: string;
    fases: {
      titulo: string;
      objetivo: string;
      items: { receta: string; area: string; nivel: string; impacto: string }[];
      packSugerido: string;
      precioEstimadoUsd: { setup: number; mensual: number };
    }[];
  };
};

const CURATED: Record<string, Curated> = {
  "+5492914000001": {
    level: "N1", pack: "STARTER", setup: 0, monthly: 45, score: 55,
    summary: "Tu problema es clarísimo y tiene arreglo rápido: las facturas vencidas se detectan solas y el recordatorio de pago sale automático por WhatsApp, con el tono que elijas. Vos no perseguís más a nadie: el sistema insiste por vos y te avisa cuando alguien sigue sin pagar.",
    recipeNames: ["Recordatorio de cobros pendientes"],
    flow: [
      { paso: 1, titulo: "Conectar la planilla de honorarios", detalle: "Leemos tu Excel/Sheets de facturación tal como está hoy." },
      { paso: 2, titulo: "Detección de vencidos", detalle: "Todos los días el sistema marca qué clientes tienen honorarios vencidos hace más de 3 días." },
      { paso: 3, titulo: "Recordatorio automático", detalle: "Sale el mensaje de cobro por WhatsApp, cordial y firme, con reintentos a los 7 días." },
      { paso: 4, titulo: "Aviso a Marta", detalle: "Si después de 2 toques no hay respuesta, te llega el resumen para que decidas vos." },
    ],
  },
  "+5492914000002": {
    level: "N1", pack: "STARTER", setup: 0, monthly: 45, score: 60,
    summary: "Cada turno olvidado es plata que no vuelve. Esto se arregla con un recordatorio automático por WhatsApp el día anterior: el cliente confirma o cancela con un toque, y vos ves la agenda real. Los que cancelan liberan el hueco a tiempo para llenarlo.",
    recipeNames: ["Recordatorio de turnos/citas"],
    flow: [
      { paso: 1, titulo: "Conectar tu Google Calendar", detalle: "Leemos los turnos como los cargás hoy, sin cambiar tu rutina." },
      { paso: 2, titulo: "Recordatorio 24h antes", detalle: "Mensaje automático con fecha, hora y botones de confirmar/cancelar." },
      { paso: 3, titulo: "Registro de respuestas", detalle: "Confirmaciones y cancelaciones quedan registradas; los huecos liberados te llegan al toque." },
    ],
  },
  "+5492914000003": {
    level: "N2", pack: "STARTER", setup: 0, monthly: 45, score: 75,
    summary: "80 consultas por día de precios y horarios es exactamente lo que un bot resuelve mejor que una persona: responde al instante, 24/7, en WhatsApp e IG, con tu carta y tus promos. Y cuando alguien quiere pedir, te lo pasa caliente con todos los datos. Ustedes cocinan, el bot atiende.",
    recipeNames: ["Bot FAQ + captura de lead (WhatsApp o IG)"],
    flow: [
      { paso: 1, titulo: "Cargar carta, precios y horarios", detalle: "El bot aprende tu menú, promos, zona de delivery y horarios." },
      { paso: 2, titulo: "Atención 24/7", detalle: "Responde al instante las preguntas repetidas en WhatsApp e Instagram." },
      { paso: 3, titulo: "Captura de pedidos", detalle: "Cuando alguien quiere pedir, junta los datos y te avisa al instante para confirmar." },
      { paso: 4, titulo: "Reporte mensual", detalle: "Cuántos mensajes atendió, cuántos pedidos capturó, qué pregunta más la gente." },
    ],
  },
  "+5492914000004": {
    level: "N2", pack: "PRO", setup: 500, monthly: 300, score: 80,
    summary: "Tenés dos fugas: consultas que llegan por todos lados y nadie centraliza, y presupuestos que mueren por falta de seguimiento. Lo encauzamos así: toda consulta (IG, web, WhatsApp) entra a un solo lugar con respuesta de bienvenida automática, y cada presupuesto que pasás recibe seguimiento automático a las 24h, 72h y 7 días hasta que el interesado conteste.",
    recipeNames: ["Captura multicanal → CRM", "Seguimiento de presupuesto no cerrado"],
    flow: [
      { paso: 1, titulo: "Unificar canales", detalle: "IG, web y WhatsApp entran a un CRM único con fuente y datos del interesado." },
      { paso: 2, titulo: "Bienvenida instantánea", detalle: "Nadie queda sin respuesta: el sistema saluda y junta los datos clave (zona, presupuesto, operación)." },
      { paso: 3, titulo: "Seguimiento de tasaciones y alquileres", detalle: "Cadencia automática 24h/72h/7d sobre cada presupuesto enviado, hasta respuesta." },
      { paso: 4, titulo: "Visibilidad total", detalle: "Pipeline de interesados por estado: nuevo, contactado, en negociación." },
    ],
  },
  "+5492914000005": {
    level: "N3", pack: "PRO", setup: 800, monthly: 300, score: 82,
    summary: "Tres frentes, una solución coordinada: el contenido se programa desde una planilla y sale solo todos los días; cuando corrés ads, cada comentario y DM recibe respuesta automática que captura la venta; y el stock avisa antes de quedarte sin talles. Vendés más con el mismo equipo.",
    recipeNames: ["Publicación programada multicanal", "Respuesta automática a comentarios/DMs de campañas", "Alerta de stock bajo"],
    flow: [
      { paso: 1, titulo: "Calendario de contenido", detalle: "Cargás los posts en una planilla y se publican solos en IG/FB en tus horarios." },
      { paso: 2, titulo: "Ads que se atienden solos", detalle: "Comentario en el anuncio → DM automático con info y captura del dato. Cero ventas perdidas por demora." },
      { paso: 3, titulo: "Stock bajo control", detalle: "Cuando un producto baja del mínimo, te llega el aviso por WhatsApp antes de vender sin stock." },
    ],
  },
  "+5492914000006": {
    level: "N3", pack: "PRO", setup: 1200, monthly: 350, score: 90,
    summary: "Con 60 pedidos diarios a mano, cada mejora se multiplica: confirmación y seguimiento de pedidos automáticos (el cliente deja de preguntar '¿salió?'), stock que avisa solo, cada venta dispara su factura sin doble carga, y la conciliación de Mercado Pago pasa de un día a minutos. Esto se paga solo el primer mes.",
    recipeNames: ["Confirmación y seguimiento de pedidos", "Alerta de stock bajo", "Venta → factura → registro", "Conciliación de pagos"],
    flow: [
      { paso: 1, titulo: "Pedidos con seguimiento automático", detalle: "Pedido nuevo → confirmación → en preparación → enviado → entregado. El cliente informado sin que nadie escriba." },
      { paso: 2, titulo: "Stock conectado", detalle: "Mínimos por producto: el aviso llega antes del faltante." },
      { paso: 3, titulo: "Venta → factura → registro", detalle: "El alta de venta dispara la factura y la registra en tu contabilidad. Cero doble carga." },
      { paso: 4, titulo: "Conciliación MP automática", detalle: "Cobros cruzados contra pedidos/facturas, diferencias marcadas para revisar solo lo que no cierra." },
    ],
  },
  "+5492914000007": {
    level: "N3", pack: "SCALE", setup: 1500, monthly: 430, score: 85,
    summary: "Lo tuyo pide sistema propio: reservas de clases self-service por WhatsApp (la gente elige el hueco y queda anotada sola), recordatorios automáticos, y el módulo de RRHH para tus 8 profes con marcación de entrada/salida y reporte de horas. Todo con tu marca: Fuerza Sur, no una app de terceros.",
    recipeNames: ["Agendado self-service por WhatsApp", "Recordatorio de turnos/citas", "Registro de entradas y salidas", "Recordatorio de turnos de empleados"],
    flow: [
      { paso: 1, titulo: "Tu sistema con tu marca (Cauce OS)", detalle: "Módulos Turnos + RRHH con los colores y el nombre de Fuerza Sur." },
      { paso: 2, titulo: "Reserva de clases por WhatsApp", detalle: "El socio pide turno, el bot ofrece los huecos libres y agenda solo. Cae directo en tu agenda." },
      { paso: 3, titulo: "Recordatorios y presentismo", detalle: "Aviso automático de la clase + registro de asistencia." },
      { paso: 4, titulo: "RRHH de los profes", detalle: "Marcación de entrada/salida por WhatsApp y reporte semanal de horas por profe." },
    ],
  },
  "+5492914000008": {
    level: "N4", pack: "SCALE", setup: 1500, monthly: 430, score: 95,
    summary: "La clínica necesita pasar del papel a SU sistema, y justo eso es Cauce OS: agenda digital con turnos que los pacientes piden solos por WhatsApp, recordatorios que recuperan esos 10-15 turnos perdidos por mes, ficha de paciente con historial y obra social, y control de horarios del personal. Con la marca de la clínica y sin depender de la secretaria que se va.",
    recipeNames: ["Agendado self-service por WhatsApp", "Recordatorio de turnos/citas", "Registro de entradas y salidas"],
    flow: [
      { paso: 1, titulo: "Cauce OS: CRM + Turnos + RRHH", detalle: "Ficha de paciente (historial, obra social), agenda por sillón y profesional, control de personal. Su marca, su dominio." },
      { paso: 2, titulo: "Turnos self-service", detalle: "El paciente pide turno por WhatsApp y el bot ofrece huecos reales de la agenda. La secretaria deja de ser cuello de botella." },
      { paso: 3, titulo: "Recordatorios anti-olvido", detalle: "24h antes, con confirmación. Los 10-15 turnos perdidos/mes vuelven a la caja." },
      { paso: 4, titulo: "Carga inicial y capacitación", detalle: "Migramos pacientes desde las carpetas (planilla mediante) y dejamos al equipo operando." },
    ],
    roadmap: {
      resumen: "La clínica está 100% en papel y eso hoy es una ventaja: no hay sistema viejo que migrar. Proponemos dos fases: primero el sistema base (agenda + ficha de pacientes + recordatorios) que resuelve la urgencia de la secretaria que renuncia, y después la capa de autoservicio y RRHH. En 30 días la clínica opera digital; en 60, los pacientes se agendan solos.",
      fases: [
        {
          titulo: "Fase 1 — Sistema base (semanas 1-3)",
          objetivo: "Reemplazar el papel: agenda digital, ficha de pacientes y recordatorios automáticos.",
          items: [
            { receta: "Cauce OS — módulos CRM + Turnos", area: "TURNOS", nivel: "N4", impacto: "Agenda por sillón y profesional + ficha con historial y obra social, con la marca de la clínica" },
            { receta: "Recordatorio de turnos/citas", area: "TURNOS", nivel: "N1", impacto: "Recupera los 10-15 turnos/mes que hoy se pierden por olvido" },
          ],
          packSugerido: "SCALE",
          precioEstimadoUsd: { setup: 1500, mensual: 350 },
        },
        {
          titulo: "Fase 2 — Autoservicio + personal (semanas 4-6)",
          objetivo: "Que el paciente se agende solo y el personal marque asistencia.",
          items: [
            { receta: "Agendado self-service por WhatsApp", area: "TURNOS", nivel: "N3", impacto: "Libera 3hs/día de teléfono: el bot ofrece huecos reales y agenda solo" },
            { receta: "Registro de entradas y salidas", area: "RRHH", nivel: "N2", impacto: "Control de horarios del personal con reporte semanal" },
          ],
          packSugerido: "SCALE",
          precioEstimadoUsd: { setup: 0, mensual: 80 },
        },
      ],
    },
  },
  "+5492914000009": {
    level: "N4", pack: "CUSTOM", setup: 2500, monthly: 500, score: 92,
    summary: "El hotel tiene un problema de oro: demanda que se pierde por desorden. Lo encauzamos en capas: bot que responde disponibilidad y precios 24/7, registro centralizado de reservas directas (chau doble-booking), persecución automática de señas pendientes, reseñas post-estadía y conciliación de Mercado Pago. La gestión de reservas con calendario de habitaciones es desarrollo a medida sobre Cauce OS.",
    recipeNames: ["Bot FAQ + captura de lead (WhatsApp o IG)", "Recordatorio de cobros pendientes", "Encuesta post-venta / pedido de reseña", "Conciliación de pagos"],
    flow: [
      { paso: 1, titulo: "Bot de disponibilidad 24/7", detalle: "Responde fechas, precios y servicios en WhatsApp e IG; captura la reserva directa." },
      { paso: 2, titulo: "Reservas centralizadas (Cauce OS + módulo a medida)", detalle: "Calendario de las 12 habitaciones: las reservas de WhatsApp/IG dejan de vivir en un Excel." },
      { paso: 3, titulo: "Señas que se cobran solas", detalle: "Recordatorio automático de seña pendiente con link de pago; sin seña a las 48h, te avisa." },
      { paso: 4, titulo: "Reseñas y conciliación", detalle: "Encuesta post-estadía pidiendo reseña en Google + cruce automático de cobros MP contra reservas." },
    ],
    roadmap: {
      resumen: "Costa Médanos pierde reservas directas (las más rentables) por atención lenta y seguimiento manual de señas. El roadmap va de lo inmediato a lo estructural: primero el bot y la persecución de señas (impacto en 2 semanas), después el sistema de reservas propio sobre Cauce OS con el calendario de habitaciones como módulo a medida, y al final reseñas + conciliación para cerrar el círculo.",
      fases: [
        {
          titulo: "Fase 1 — Parar la pérdida (semanas 1-2)",
          objetivo: "Atender 24/7 y cobrar las señas sin perseguir.",
          items: [
            { receta: "Bot FAQ + captura de lead (WhatsApp o IG)", area: "ATENCION", nivel: "N2", impacto: "Disponibilidad y precios respondidos al instante, reservas capturadas" },
            { receta: "Recordatorio de cobros pendientes", area: "FINANZAS", nivel: "N1", impacto: "Señas perseguidas solas: menos reservas caídas" },
          ],
          packSugerido: "PRO",
          precioEstimadoUsd: { setup: 500, mensual: 300 },
        },
        {
          titulo: "Fase 2 — Sistema de reservas propio (semanas 3-7)",
          objetivo: "Centralizar reservas directas con calendario de habitaciones (módulo a medida sobre Cauce OS).",
          items: [
            { receta: "Cauce OS — CRM + Caja + módulo Reservas a medida", area: "OPERACIONES", nivel: "N4", impacto: "Chau doble-booking: una sola vista de las 12 habitaciones" },
          ],
          packSugerido: "CUSTOM",
          precioEstimadoUsd: { setup: 2000, mensual: 170 },
        },
        {
          titulo: "Fase 3 — Cerrar el círculo (semana 8)",
          objetivo: "Reputación y números en orden.",
          items: [
            { receta: "Encuesta post-venta / pedido de reseña", area: "ATENCION", nivel: "N1", impacto: "Más reseñas en Google = más reservas directas" },
            { receta: "Conciliación de pagos", area: "FINANZAS", nivel: "N3", impacto: "Cobros MP cruzados contra reservas, diferencias a la vista" },
          ],
          packSugerido: "CUSTOM",
          precioEstimadoUsd: { setup: 0, mensual: 30 },
        },
      ],
    },
  },
  "+5492914000010": {
    level: "N3", pack: "SCALE", setup: 1200, monthly: 430, score: 88,
    summary: "El hijo tiene razón: el taller pierde plata en tres lugares — turnos que no se toman porque nadie atiende, presupuestos sin seguimiento (la mitad se enfría) y el playón lleno de autos listos sin avisar. Todo eso se automatiza, y el historial de 8 años en Excel es una mina de oro: recordatorios de service que traen clientes solos.",
    recipeNames: ["Agendado self-service por WhatsApp", "Seguimiento de presupuesto no cerrado", "Confirmación y seguimiento de pedidos", "Reactivación de clientes inactivos"],
    flow: [
      { paso: 1, titulo: "Turnos sin teléfono", detalle: "El cliente pide turno por WhatsApp y el bot agenda solo en los huecos del taller. Nadie sale de abajo del auto." },
      { paso: 2, titulo: "Presupuestos que no se enfrían", detalle: "Seguimiento automático 24h/72h/7d de cada presupuesto pasado por WhatsApp." },
      { paso: 3, titulo: "Auto listo, aviso automático", detalle: "Cambio de estado → mensaje al cliente. El playón se vacía solo." },
      { paso: 4, titulo: "Service por historial (Cauce OS CRM)", detalle: "El Excel de 8 años entra al CRM: recordatorio automático de service por tiempo/kilometraje. Clientes que vuelven solos." },
    ],
    roadmap: {
      resumen: "Taller a agenda llena con tres fugas claras. Primero los quick wins que se sienten en caja en dos semanas (turnos self-service + seguimiento de presupuestos + aviso de auto listo). Después, el sistema propio: CRM con el historial de 8 años para recordatorios de service y registro de qué mecánico hizo qué. Con la mitad de los presupuestos fríos recuperados, el mensual se paga varias veces.",
      fases: [
        {
          titulo: "Fase 1 — Quick wins (semanas 1-2)",
          objetivo: "Cortar las tres fugas de plata ya.",
          items: [
            { receta: "Agendado self-service por WhatsApp", area: "TURNOS", nivel: "N3", impacto: "Turnos que entran solos sin atender el teléfono" },
            { receta: "Seguimiento de presupuesto no cerrado", area: "VENTAS_CRM", nivel: "N1", impacto: "Recupera presupuestos que hoy mueren por olvido" },
            { receta: "Confirmación y seguimiento de pedidos", area: "OPERACIONES", nivel: "N2", impacto: "Aviso de 'auto listo' automático: playón despejado" },
          ],
          packSugerido: "PRO",
          precioEstimadoUsd: { setup: 700, mensual: 300 },
        },
        {
          titulo: "Fase 2 — El sistema del taller (semanas 3-6)",
          objetivo: "CRM propio con historial y service programado.",
          items: [
            { receta: "Cauce OS — CRM + Turnos", area: "VENTAS_CRM", nivel: "N4", impacto: "Historial de 8 años activado: ficha por cliente y por vehículo, registro por mecánico" },
            { receta: "Reactivación de clientes inactivos", area: "VENTAS_CRM", nivel: "N2", impacto: "Recordatorio de service por tiempo/km: clientes que vuelven solos" },
          ],
          packSugerido: "SCALE",
          precioEstimadoUsd: { setup: 500, mensual: 130 },
        },
      ],
    },
  },
};

/** Crea el blueprint curado replicando los efectos de runDiagnostico. */
async function curatedBlueprint(leadId: string, c: Curated) {
  const recipes = await db.recipe.findMany({
    where: { name: { in: c.recipeNames } },
    select: { id: true },
  });
  const bp = await db.blueprint.create({
    data: {
      leadId,
      status: "DRAFT",
      level: c.level,
      summary: c.summary,
      flow: c.flow,
      recipeIds: recipes.map((r) => r.id),
      suggestedPack: c.pack,
      suggestedSetup: c.setup,
      suggestedMonthly: c.monthly,
    },
  });
  await db.lead.update({ where: { id: leadId }, data: { score: c.score, status: "QUALIFIED" } });
  const lead = await db.lead.findUniqueOrThrow({ where: { id: leadId } });
  const existing = await db.project.findFirst({ where: { leadId } });
  if (!existing) {
    await db.project.create({
      data: {
        title: `${lead.business || lead.name} — automatización`,
        stage: "DIAGNOSTICO",
        level: c.level,
        setupFee: c.setup,
        leadId,
      },
    });
  }
  return bp;
}

async function main() {
  const period = currentPeriod();
  console.log(`🌊 Demo end-to-end — período ${period}\n`);

  const resumen: string[] = [];

  for (const [i, d] of DEMOS.entries()) {
    console.log(`\n━━━ ${i + 1}/10 · ${d.business} (${d.source}) ━━━`);

    // 0) Lead idempotente (por whatsapp)
    let lead = await db.lead.findFirst({ where: { whatsapp: d.whatsapp } });
    if (!lead) {
      lead = await db.lead.create({
        data: {
          source: d.source,
          name: d.name,
          business: d.business,
          rubro: d.rubro,
          email: d.email,
          whatsapp: d.whatsapp,
          intake: d.intake as object,
        },
      });
    }
    console.log(`  lead ✓ (${lead.id})`);

    // 1) Consultoría: nota + roadmap IA
    if (d.source === "CONSULTORIA" && d.callNotes) {
      let note = await db.consultNote.findFirst({ where: { leadId: lead.id } });
      if (!note) {
        note = await db.consultNote.create({
          data: {
            leadId: lead.id,
            status: "SCHEDULED",
            scheduledAt: new Date(Date.now() - 24 * 3600 * 1000),
            callNotes: d.callNotes,
          },
        });
      } else if (!note.callNotes) {
        await db.consultNote.update({ where: { id: note.id }, data: { callNotes: d.callNotes } });
      }
      const hasRoadmap = await db.roadmap.findUnique({ where: { consultNoteId: note.id } });
      if (!hasRoadmap) {
        try {
          console.log("  generando roadmap con IA…");
          await generarRoadmap(note.id);
          console.log("  roadmap (IA) ✓");
        } catch (e) {
          const curated = CURATED[d.whatsapp];
          if (!curated?.roadmap) throw e;
          console.log(`  IA no disponible (${(e as Error).message.slice(0, 60)}…) → roadmap curado`);
          await db.roadmap.create({
            data: { consultNoteId: note.id, content: curated.roadmap, status: "sent" },
          });
          console.log("  roadmap (curado) ✓");
        }
        await db.consultNote.update({ where: { id: note.id }, data: { status: "ROADMAP_SENT" } });
      }
      // el intake para el diagnóstico usa las notas de la llamada
      await db.lead.update({
        where: { id: lead.id },
        data: { intake: { ...d.intake, notas_consultoria: d.callNotes } as object },
      });
    }

    // 2) Diagnóstico IA → blueprint
    let bp = await db.blueprint.findFirst({ where: { leadId: lead.id }, orderBy: { createdAt: "desc" } });
    if (!bp) {
      try {
        console.log("  diagnosticando con IA…");
        const { blueprintId } = await runDiagnostico(lead.id);
        bp = await db.blueprint.findUniqueOrThrow({ where: { id: blueprintId } });
        await sleep(800); // respiro entre llamadas a la API
      } catch (e) {
        console.log(`  IA no disponible (${(e as Error).message.slice(0, 60)}…) → blueprint curado`);
        bp = await curatedBlueprint(lead.id, CURATED[d.whatsapp]);
      }
      console.log(`  blueprint ✓ nivel ${bp.level}, pack ${bp.suggestedPack}, setup USD ${bp.suggestedSetup}, mensual USD ${bp.suggestedMonthly}, ${bp.recipeIds.length} receta(s)`);
    }

    // 3) Aprobar → cliente + automatizaciones TEST
    let clientId = (await db.lead.findUniqueOrThrow({ where: { id: lead.id } })).clientId;
    if (!clientId) {
      ({ clientId } = await aprobarBlueprint(bp.id));
      console.log(`  aprobado ✓ cliente ${clientId}`);
    }
    const client = await db.client.findUniqueOrThrow({ where: { id: clientId } });

    // 4) Config de variables en cada automatización (datos del negocio)
    const autos = await db.automation.findMany({ where: { clientId }, include: { recipe: true } });
    for (const a of autos) {
      const vars = (a.recipe?.variables as { key: string; label: string }[] | null) ?? [];
      const config: Record<string, string> = (a.config as Record<string, string> | null) ?? {};
      for (const v of vars) {
        if (config[v.key]) continue;
        config[v.key] = defaultVar(v.key, d);
      }
      await db.automation.update({ where: { id: a.id }, data: { config } });
    }
    console.log(`  config de ${autos.length} automatización(es) ✓`);

    // 5) QA
    for (const a of autos) {
      await runQA(a.id);
    }
    console.log("  QA corrido ✓ (la vinculación n8n queda pendiente a propósito)");

    // 6) Proyecto a QA (build hecho, falta provisión n8n)
    const project = await db.project.findFirst({ where: { leadId: lead.id } });
    if (project && project.stage === "BUILD") {
      await db.project.update({
        where: { id: project.id },
        data: { stage: "QA", notes: "Build listo. Provisión en n8n pendiente de credenciales (decisión de Fran 10/06)." },
      });
    }

    // 7) Usuario de portal
    const username = client.slug;
    const password = `${client.slug}2026`;
    const existingUser = await db.user.findUnique({ where: { username } });
    if (!existingUser) {
      await db.user.create({
        data: {
          username,
          name: d.name,
          role: "CLIENT",
          clientId,
          passwordHash: await bcrypt.hash(password, 10),
        },
      });
    }

    // 8) Suscripción + uso del mes + reporte
    const sub = await db.subscription.findFirst({ where: { clientId } });
    if (!sub) {
      await db.subscription.create({
        data: { clientId, pack: client.pack, monthlyUsd: client.mrr, status: "ACTIVE" },
      });
    }
    await db.usage.upsert({
      where: { clientId_period: { clientId, period } },
      create: { clientId, period, messages: d.usageMsgs, tokensIn: d.usageMsgs * 600, tokensOut: d.usageMsgs * 220, costUsd: Math.round(d.usageMsgs * 0.004 * 100) / 100 },
      update: { messages: d.usageMsgs },
    });
    await generateMonthlyReport(clientId);
    console.log(`  portal ✓ usuario: ${username} / ${password} · uso ${d.usageMsgs} msgs · reporte ✓`);

    resumen.push(
      `${i + 1}. ${d.business} — ${bp.level} · ${bp.suggestedPack} · setup USD ${bp.suggestedSetup} + USD ${bp.suggestedMonthly}/mes · ${autos.length} automatización(es) · portal: ${username}/${password}`
    );
  }

  console.log("\n\n══════════ RESUMEN ══════════");
  for (const r of resumen) console.log(r);
  console.log("\n🌊 Demo completa.");
}

function defaultVar(key: string, d: Demo): string {
  const k = key.toLowerCase();
  if (k.includes("nombre_negocio")) return d.business;
  if (k.includes("telefono") || k.includes("whatsapp")) return d.whatsapp;
  if (k.includes("horario")) return "Lun a Vie 9-18, Sáb 9-13";
  if (k.includes("tono")) return "amable e informal, argentino";
  if (k.includes("faq")) return "¿Cuánto sale? | Depende del trabajo, pasanos detalle y te cotizamos.\n¿Dónde están? | Bahía Blanca, atendemos por WhatsApp.";
  if (k.includes("mensaje") || k.includes("respuesta")) return `¡Hola! Gracias por escribirle a ${d.business}. En breve te respondemos.`;
  if (k.includes("dia") && k.includes("reporte")) return "viernes";
  if (k.includes("hora")) return "20:00";
  if (k.includes("frecuencia") || k.includes("cadencia")) return "24h, 72h, 7d";
  if (k.includes("dias") || k.includes("meses")) return "3";
  if (k.includes("duracion")) return "30";
  if (k.includes("link")) return "https://g.page/r/demo-resena";
  if (k.includes("criterio")) return "presupuesto declarado, urgencia, zona";
  if (k.includes("categoria") || k.includes("estado")) return "consulta, pedido, reclamo, otro";
  if (k.includes("canal") || k.includes("cuenta")) return "WhatsApp e Instagram";
  if (k.includes("sheet") || k.includes("planilla") || k.includes("origen") || k.includes("destino") || k.includes("agenda")) return "Planilla del negocio (a conectar en onboarding)";
  if (k.includes("empleado")) return "Equipo del negocio (se carga en onboarding)";
  if (k.includes("servicio")) return "Atención general";
  if (k.includes("oferta")) return "10% de descuento esta semana";
  if (k.includes("politica")) return "El bot resuelve consultas generales; reclamos graves se derivan.";
  if (k.includes("minimo")) return "5";
  if (k.includes("tipo_factura")) return "A";
  if (k.includes("palabras")) return "precio, info, quiero";
  if (k.includes("plantilla")) return "Cotización estándar del negocio (se carga en onboarding)";
  if (k.includes("lista_precios")) return "Lista de precios vigente (se carga en onboarding)";
  return "A definir en onboarding";
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
