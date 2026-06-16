/**
 * seed-rico.ts — Datos RICOS y CREÍBLES por rubro para los 12 tenants de Cauce OS.
 * Objetivo: que los dashboards y módulos se vean VIVOS (contactos en distintos
 * stages, turnos de hoy, tareas vencidas, stock bajo, caja con ventas de hoy,
 * fichajes abiertos, campos custom llenos).
 *
 * - IDEMPOTENTE: si un tenant ya tiene >=12 contactos, lo saltea.
 * - ADITIVO: nunca borra nada; sólo agrega.
 * - Fechas: relativas a hoy (hora argentina UTC-3) con offsets fijos por índice.
 *
 * Uso: npx tsx scripts/seed-rico.ts
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

// ── Helpers de fecha (hora argentina UTC-3) ──────────────────────────────
const ART = "America/Argentina/Buenos_Aires";
function argDateStr(d: Date = new Date()): string {
  return d.toLocaleDateString("en-CA", { timeZone: ART });
}
const TODAY = argDateStr(); // "YYYY-MM-DD"
/** Instante en hora argentina para un offset de días + hora del día. */
function at(dayOffset: number, hour: number, minute = 0): Date {
  const noon = new Date(`${TODAY}T12:00:00-03:00`);
  const day = argDateStr(new Date(noon.getTime() + dayOffset * 86_400_000));
  const hh = String(hour).padStart(2, "0");
  const mm = String(minute).padStart(2, "0");
  return new Date(`${day}T${hh}:${mm}:00-03:00`);
}
/** Fecha (sin hora puntual) hace/dentro de N días — para lastTouchAt, dueAt, caja. */
function daysFromNow(n: number, hour = 12): Date {
  return at(n, hour);
}

// ── Tipos de datos por tenant ────────────────────────────────────────────
type CT = {
  name: string; phone: string; email?: string; stage: string;
  source: string; notes?: string; custom?: Record<string, unknown>;
  touchDays: number; // offset (negativo = pasado) para lastTouchAt
};
type AP = {
  title: string; dayOffset: number; hour: number; durMin?: number;
  status: "PENDING" | "CONFIRMED" | "DONE" | "CANCELLED";
  source: string; custom?: Record<string, unknown>; contactIdx?: number;
};
type TK = { title: string; dueDays: number; done?: boolean; contactIdx?: number };
type PR = { name: string; priceArs: number; stock: number; minStock: number; active?: boolean; custom?: Record<string, unknown> };
type CM = { kind: "venta" | "gasto" | "ajuste"; concept: string; amountArs: number; method?: string; dayOffset: number };
type EMP = { name: string; phone?: string; role?: string };
type TE = { empIdx: number; inDay: number; inHour: number; outDay?: number; outHour?: number; source?: string };

type Seed = {
  modules: string[];
  contacts: CT[];
  appts?: AP[];
  tasks?: TK[];
  products?: PR[];
  cash?: CM[];
  employees?: EMP[];
  timeEntries?: TE[];
};

const STAGES = ["nuevo", "contactado", "interesado", "cliente"];
function st(i: number) { return STAGES[i % STAGES.length]; }
function src(i: number) { return i % 3 === 0 ? "manual" : "bot"; } // mayoría bot

// ── DATA por tenant ────────────────────────────────────────────────────────
const SEEDS: Record<string, Seed> = {

  // ════════ VESPABAHIA — scooters: crm + turnos ════════
  vespabahia: {
    modules: ["crm", "turnos"],
    contacts: [
      { name: "Gastón Rivero", phone: "+5492915560101", email: "gaston.rivero@gmail.com", stage: "cliente", source: "manual", custom: { modelo_moto: "Vespa Primavera 150" }, notes: "Cliente fiel, hace el service siempre acá", touchDays: -3 },
      { name: "Luciana Maldonado", phone: "+5492915560102", stage: "interesado", source: "bot", custom: { modelo_moto: "Vespa Sprint 150" }, notes: "Vino del bot: consultó financiación", touchDays: -1 },
      { name: "Federico Sosa", phone: "+5492915560103", stage: "nuevo", source: "bot", custom: { modelo_moto: "Piaggio Liberty 125" }, notes: "Vino del bot: pidió turno de service", touchDays: 0 },
      { name: "Carolina Vega", phone: "+5492915560104", stage: "cliente", source: "manual", custom: { modelo_moto: "Vespa GTS 300" }, notes: "Compró 0km en marzo", touchDays: -190 },
      { name: "Matías Ledesma", phone: "+5492915560105", stage: "contactado", source: "bot", custom: { modelo_moto: "Vespa Primavera 150" }, touchDays: -8 },
      { name: "Romina Acuña", phone: "+5492915560106", stage: "interesado", source: "bot", custom: { modelo_moto: "Piaggio Medley 150" }, notes: "Quiere ver colores", touchDays: -2 },
      { name: "Diego Paniagua", phone: "+5492915560107", stage: "cliente", source: "manual", custom: { modelo_moto: "Vespa Sprint 150" }, notes: "Garantía vigente", touchDays: -200 },
      { name: "Sabrina Toledo", phone: "+5492915560108", stage: "nuevo", source: "bot", custom: { modelo_moto: "Vespa Primavera 50" }, touchDays: -1 },
      { name: "Ezequiel Ramos", phone: "+5492915560109", stage: "contactado", source: "manual", custom: { modelo_moto: "Piaggio Liberty 150" }, touchDays: -5 },
      { name: "Florencia Quinteros", phone: "+5492915560110", stage: "interesado", source: "bot", custom: { modelo_moto: "Vespa GTS 300" }, notes: "Vino del bot: usado o 0km", touchDays: -4 },
      { name: "Hernán Villalba", phone: "+5492915560111", stage: "cliente", source: "manual", custom: { modelo_moto: "Vespa Sprint 50" }, touchDays: -210 },
      { name: "Antonella Cabrera", phone: "+5492915560112", stage: "nuevo", source: "bot", custom: { modelo_moto: "Piaggio Medley 125" }, touchDays: 0 },
      { name: "Joaquín Méndez", phone: "+5492915560113", stage: "interesado", source: "bot", custom: { modelo_moto: "Vespa Primavera 150" }, touchDays: -6 },
      { name: "Valentina Ríos", phone: "+5492915560114", stage: "cliente", source: "manual", custom: { modelo_moto: "Vespa GTS Super 300" }, touchDays: -12 },
    ],
    appts: [
      { title: "Service común — Primavera (Rivero)", dayOffset: 0, hour: 9, status: "CONFIRMED", source: "manual", custom: { tipo_service: "Service común" }, contactIdx: 0 },
      { title: "Garantía — Sprint (Paniagua)", dayOffset: 0, hour: 11, status: "CONFIRMED", source: "manual", custom: { tipo_service: "Garantía" }, contactIdx: 6 },
      { title: "Service mayor — GTS (Vega)", dayOffset: 0, hour: 15, status: "PENDING", source: "bot", custom: { tipo_service: "Service mayor" }, contactIdx: 3 },
      { title: "Reparación — Liberty (Sosa)", dayOffset: 0, hour: 17, status: "PENDING", source: "bot", custom: { tipo_service: "Reparación" }, contactIdx: 2 },
      { title: "Service común — Medley (Acuña)", dayOffset: 1, hour: 10, status: "CONFIRMED", source: "bot", custom: { tipo_service: "Service común" }, contactIdx: 5 },
      { title: "Entrega 0km — Sprint (Toledo)", dayOffset: 1, hour: 16, status: "CONFIRMED", source: "manual", custom: { tipo_service: "Service común" }, contactIdx: 7 },
      { title: "Service mayor — Primavera (Méndez)", dayOffset: 2, hour: 9, status: "PENDING", source: "bot", custom: { tipo_service: "Service mayor" }, contactIdx: 12 },
      { title: "Reparación — GTS (Ríos)", dayOffset: 3, hour: 11, status: "CONFIRMED", source: "manual", custom: { tipo_service: "Reparación" }, contactIdx: 13 },
      { title: "Service común — Liberty (Ramos)", dayOffset: 4, hour: 14, status: "PENDING", source: "bot", custom: { tipo_service: "Service común" }, contactIdx: 8 },
      { title: "Garantía — Sprint (Villalba)", dayOffset: 5, hour: 10, status: "PENDING", source: "manual", custom: { tipo_service: "Garantía" }, contactIdx: 10 },
      { title: "Service común — Medley (Cabrera)", dayOffset: 6, hour: 12, status: "CONFIRMED", source: "bot", custom: { tipo_service: "Service común" }, contactIdx: 11 },
    ],
    tasks: [
      { title: "Llamar a Vega para coordinar service mayor GTS", dueDays: -2, contactIdx: 3 },
      { title: "Pedir repuestos para reparación Liberty", dueDays: -1 },
      { title: "Pasar presupuesto financiación a Maldonado", dueDays: 1, contactIdx: 1 },
      { title: "Confirmar entrega 0km del viernes", dueDays: 3 },
      { title: "Cerrar venta usado GTS con Quinteros", dueDays: 2, done: true, contactIdx: 9 },
    ],
  },

  // ════════ ESTUDIO CONTABLE GIMÉNEZ — crm + caja ════════
  estudiocontablegimenez: {
    modules: ["crm", "caja"],
    contacts: [
      { name: "Ferretería El Tornillo SRL", phone: "+5492915561101", email: "admin@eltornillo.com.ar", stage: "cliente", source: "manual", custom: { cuit: "30-71234567-8", condicion_iva: "Responsable Inscripto" }, notes: "Honorarios mensuales, vence el 10", touchDays: -2 },
      { name: "Kiosco Lula", phone: "+5492915561102", stage: "cliente", source: "manual", custom: { cuit: "27-30111222-3", condicion_iva: "Monotributo" }, touchDays: -200 },
      { name: "Consultora Andina", phone: "+5492915561103", stage: "interesado", source: "bot", notes: "Vino del bot: pidió presupuesto de liquidación de sueldos", touchDays: -1 },
      { name: "Panadería La Espiga", phone: "+5492915561104", stage: "cliente", source: "manual", custom: { cuit: "30-68999111-2", condicion_iva: "Responsable Inscripto" }, touchDays: -5 },
      { name: "Verdulería Don Pepe", phone: "+5492915561105", stage: "cliente", source: "manual", custom: { cuit: "20-25333111-9", condicion_iva: "Monotributo" }, touchDays: -190 },
      { name: "Estudio Jurídico Ramírez", phone: "+5492915561106", stage: "contactado", source: "bot", notes: "Vino del bot: alta de monotributo socios", touchDays: -3 },
      { name: "Distribuidora Sur", phone: "+5492915561107", stage: "cliente", source: "manual", custom: { cuit: "30-71555888-4", condicion_iva: "Responsable Inscripto" }, touchDays: -7 },
      { name: "Carla Domínguez (autónoma)", phone: "+5492915561108", stage: "interesado", source: "bot", custom: { condicion_iva: "Monotributo" }, touchDays: -2 },
      { name: "Taller Gómez", phone: "+5492915561109", stage: "nuevo", source: "bot", notes: "Vino del bot: consulta de inscripción", touchDays: 0 },
      { name: "Inmobiliaria Costa", phone: "+5492915561110", stage: "cliente", source: "manual", custom: { cuit: "30-70222333-1", condicion_iva: "Responsable Inscripto" }, touchDays: -210 },
      { name: "Gimnasio Olimpo", phone: "+5492915561111", stage: "contactado", source: "manual", custom: { condicion_iva: "Responsable Inscripto" }, touchDays: -8 },
      { name: "Roberto Salas (comercio)", phone: "+5492915561112", stage: "interesado", source: "bot", custom: { condicion_iva: "Exento" }, touchDays: -4 },
      { name: "Farmacia Central", phone: "+5492915561113", stage: "cliente", source: "manual", custom: { cuit: "30-69888777-6", condicion_iva: "Responsable Inscripto" }, touchDays: -1 },
      { name: "Café Esquina", phone: "+5492915561114", stage: "nuevo", source: "bot", touchDays: 0 },
      { name: "Lavadero El Sol", phone: "+5492915561115", stage: "cliente", source: "manual", custom: { condicion_iva: "Monotributo" }, touchDays: -15 },
    ],
    tasks: [
      { title: "Reclamar honorarios vencidos de Ferretería El Tornillo", dueDays: -3, contactIdx: 0 },
      { title: "Presentar IVA del mes — clientes RI", dueDays: -1 },
      { title: "Pasar presupuesto a Consultora Andina", dueDays: 1, contactIdx: 2 },
      { title: "Cargar libro de sueldos de Distribuidora Sur", dueDays: 2 },
      { title: "Alta de monotributo Carla Domínguez", dueDays: 4, done: true, contactIdx: 7 },
    ],
    cash: [
      { kind: "venta", concept: "Honorarios mensuales — Ferretería El Tornillo", amountArs: 185000, method: "transferencia", dayOffset: 0 },
      { kind: "venta", concept: "Honorarios — Distribuidora Sur", amountArs: 220000, method: "transferencia", dayOffset: 0 },
      { kind: "venta", concept: "Liquidación de sueldos — Farmacia Central", amountArs: 95000, method: "mp", dayOffset: 0 },
      { kind: "venta", concept: "Honorarios — Panadería La Espiga", amountArs: 140000, method: "transferencia", dayOffset: -1 },
      { kind: "venta", concept: "Alta de monotributo — Carla Domínguez", amountArs: 35000, method: "efectivo", dayOffset: -2 },
      { kind: "gasto", concept: "AFIP — tasa profesional", amountArs: 28000, method: "transferencia", dayOffset: -2 },
      { kind: "venta", concept: "Honorarios — Inmobiliaria Costa", amountArs: 160000, method: "transferencia", dayOffset: -4 },
      { kind: "venta", concept: "Trámite inscripción — Taller Gómez", amountArs: 42000, method: "mp", dayOffset: -5 },
      { kind: "gasto", concept: "Sistema contable (suscripción)", amountArs: 31000, method: "mp", dayOffset: -6 },
      { kind: "venta", concept: "Honorarios — Verdulería Don Pepe", amountArs: 80000, method: "efectivo", dayOffset: -7 },
      { kind: "venta", concept: "Confección balance — Distribuidora Sur", amountArs: 310000, method: "transferencia", dayOffset: -9 },
      { kind: "venta", concept: "Honorarios — Estudio Jurídico Ramírez", amountArs: 175000, method: "transferencia", dayOffset: -11 },
      { kind: "gasto", concept: "Alquiler oficina", amountArs: 290000, method: "transferencia", dayOffset: -12 },
      { kind: "venta", concept: "Honorarios — Gimnasio Olimpo", amountArs: 150000, method: "mp", dayOffset: -14 },
      { kind: "venta", concept: "Liquidación de sueldos — Lavadero El Sol", amountArs: 70000, method: "efectivo", dayOffset: -16 },
      { kind: "gasto", concept: "Servicios (luz/internet)", amountArs: 54000, method: "transferencia", dayOffset: -18 },
      { kind: "venta", concept: "Honorarios — Café Esquina", amountArs: 90000, method: "mp", dayOffset: -20 },
      { kind: "venta", concept: "Asesoramiento impositivo — Roberto Salas", amountArs: 65000, method: "efectivo", dayOffset: -24 },
    ],
  },

  // ════════ PELUQUERÍA LUCAS — crm + turnos ════════
  peluquerialucas: {
    modules: ["crm", "turnos"],
    contacts: [
      { name: "Marcos Brizuela", phone: "+5492915562101", stage: "cliente", source: "manual", custom: { servicio_preferido: "Corte + barba" }, touchDays: -7 },
      { name: "Tomás Iglesias", phone: "+5492915562102", stage: "cliente", source: "bot", custom: { servicio_preferido: "Corte" }, notes: "Vino del bot: pidió turno solo", touchDays: -2 },
      { name: "Nahuel Ferreyra", phone: "+5492915562103", stage: "cliente", source: "manual", custom: { servicio_preferido: "Barba" }, touchDays: -3 },
      { name: "Brian Sosa", phone: "+5492915562104", stage: "interesado", source: "bot", custom: { servicio_preferido: "Corte + barba" }, touchDays: -1 },
      { name: "Camila Núñez", phone: "+5492915562105", stage: "cliente", source: "bot", custom: { servicio_preferido: "Color" }, touchDays: -200 },
      { name: "Lautaro Gómez", phone: "+5492915562106", stage: "cliente", source: "manual", custom: { servicio_preferido: "Corte" }, touchDays: -10 },
      { name: "Agustín Pereyra", phone: "+5492915562107", stage: "nuevo", source: "bot", custom: { servicio_preferido: "Corte" }, touchDays: 0 },
      { name: "Maximiliano Díaz", phone: "+5492915562108", stage: "contactado", source: "bot", custom: { servicio_preferido: "Corte + barba" }, touchDays: -4 },
      { name: "Rocío Medina", phone: "+5492915562109", stage: "cliente", source: "manual", custom: { servicio_preferido: "Color" }, touchDays: -190 },
      { name: "Franco Aguirre", phone: "+5492915562110", stage: "cliente", source: "bot", custom: { servicio_preferido: "Barba" }, touchDays: -5 },
      { name: "Julián Castro", phone: "+5492915562111", stage: "interesado", source: "bot", custom: { servicio_preferido: "Corte" }, touchDays: -2 },
      { name: "Emanuel Ruiz", phone: "+5492915562112", stage: "nuevo", source: "manual", touchDays: 0 },
      { name: "Damián Soto", phone: "+5492915562113", stage: "cliente", source: "bot", custom: { servicio_preferido: "Corte + barba" }, touchDays: -6 },
      { name: "Ignacio Vera", phone: "+5492915562114", stage: "cliente", source: "manual", custom: { servicio_preferido: "Corte" }, touchDays: -1 },
    ],
    appts: [
      { title: "Corte + barba — Brizuela", dayOffset: 0, hour: 10, status: "CONFIRMED", source: "manual", custom: { servicio: "Corte + barba" }, contactIdx: 0 },
      { title: "Corte — Iglesias", dayOffset: 0, hour: 11, status: "CONFIRMED", source: "bot", custom: { servicio: "Corte" }, contactIdx: 1 },
      { title: "Barba — Ferreyra", dayOffset: 0, hour: 15, status: "PENDING", source: "bot", custom: { servicio: "Barba" }, contactIdx: 2 },
      { title: "Color — Núñez", dayOffset: 0, hour: 16, status: "CONFIRMED", source: "manual", custom: { servicio: "Color" }, contactIdx: 4 },
      { title: "Corte + barba — Díaz", dayOffset: 0, hour: 18, status: "PENDING", source: "bot", custom: { servicio: "Corte + barba" }, contactIdx: 7 },
      { title: "Corte — Gómez", dayOffset: 1, hour: 10, status: "CONFIRMED", source: "bot", custom: { servicio: "Corte" }, contactIdx: 5 },
      { title: "Color — Medina", dayOffset: 1, hour: 14, status: "CONFIRMED", source: "manual", custom: { servicio: "Color" }, contactIdx: 8 },
      { title: "Barba — Aguirre", dayOffset: 2, hour: 11, status: "PENDING", source: "bot", custom: { servicio: "Barba" }, contactIdx: 9 },
      { title: "Corte + barba — Soto", dayOffset: 2, hour: 17, status: "CONFIRMED", source: "bot", custom: { servicio: "Corte + barba" }, contactIdx: 12 },
      { title: "Corte — Castro", dayOffset: 3, hour: 10, status: "PENDING", source: "bot", custom: { servicio: "Corte" }, contactIdx: 10 },
      { title: "Corte — Vera", dayOffset: 4, hour: 16, status: "CONFIRMED", source: "manual", custom: { servicio: "Corte" }, contactIdx: 13 },
      { title: "Corte + barba — Sosa", dayOffset: 5, hour: 12, status: "PENDING", source: "bot", custom: { servicio: "Corte + barba" }, contactIdx: 3 },
    ],
    tasks: [
      { title: "Confirmar turnos del sábado por WhatsApp", dueDays: -1 },
      { title: "Reponer cera y after shave", dueDays: -2 },
      { title: "Subir promo 2x1 corte+barba a IG", dueDays: 1 },
      { title: "Recordar a Medina retoque de color", dueDays: 3, contactIdx: 8 },
    ],
  },

  // ════════ PIZZERÍA DON VITO — crm + catalogo ════════
  pizzeriadonvito: {
    modules: ["crm", "catalogo"],
    contacts: [
      { name: "Lucía Ferreyra", phone: "+5492915563101", stage: "cliente", source: "bot", custom: { zona_delivery: "Centro", pedido_habitual: "Muzza grande + fainá" }, notes: "Vino del bot: pide todos los viernes", touchDays: -2 },
      { name: "Hernán Acosta", phone: "+5492915563102", stage: "interesado", source: "bot", custom: { zona_delivery: "Universitario" }, notes: "Vino del bot: preguntó por pizza sin TACC", touchDays: -1 },
      { name: "Paula Giménez", phone: "+5492915563103", stage: "cliente", source: "bot", custom: { zona_delivery: "Villa Mitre", pedido_habitual: "Napolitana + Coca 1.5" }, touchDays: -3 },
      { name: "Marcelo Ojeda", phone: "+5492915563104", stage: "cliente", source: "manual", custom: { zona_delivery: "Centro", pedido_habitual: "Especial + empanadas" }, touchDays: -5 },
      { name: "Yésica Romero", phone: "+5492915563105", stage: "nuevo", source: "bot", custom: { zona_delivery: "Otra" }, touchDays: 0 },
      { name: "Cristian Bravo", phone: "+5492915563106", stage: "cliente", source: "bot", custom: { zona_delivery: "Universitario", pedido_habitual: "Muzza + fugazza" }, touchDays: -200 },
      { name: "Daniela Suárez", phone: "+5492915563107", stage: "interesado", source: "bot", custom: { zona_delivery: "Centro" }, touchDays: -2 },
      { name: "Gabriel Ponce", phone: "+5492915563108", stage: "cliente", source: "manual", custom: { zona_delivery: "Villa Mitre", pedido_habitual: "Calabresa grande" }, touchDays: -8 },
      { name: "Noelia Cáceres", phone: "+5492915563109", stage: "nuevo", source: "bot", touchDays: 0 },
      { name: "Sebastián Luna", phone: "+5492915563110", stage: "cliente", source: "bot", custom: { zona_delivery: "Centro", pedido_habitual: "2 muzzas + Sprite" }, touchDays: -1 },
      { name: "Verónica Ibarra", phone: "+5492915563111", stage: "contactado", source: "manual", custom: { zona_delivery: "Universitario" }, touchDays: -190 },
      { name: "Pablo Herrera", phone: "+5492915563112", stage: "interesado", source: "bot", custom: { zona_delivery: "Otra" }, touchDays: -4 },
      { name: "Mariana Flores", phone: "+5492915563113", stage: "cliente", source: "bot", custom: { zona_delivery: "Centro", pedido_habitual: "Roquefort + fainá" }, touchDays: -6 },
    ],
    tasks: [
      { title: "Cargar promo del finde en el bot", dueDays: -1 },
      { title: "Reponer cajas de pizza (alerta stock)", dueDays: -2 },
      { title: "Responder consulta sin TACC de Acosta", dueDays: 1, contactIdx: 1 },
      { title: "Actualizar precios de bebidas en el catálogo", dueDays: 2 },
    ],
    products: [
      { name: "Pizza Muzzarella grande", priceArs: 8500, stock: 40, minStock: 10, custom: { categoria: "Pizzas" } },
      { name: "Pizza Napolitana grande", priceArs: 9500, stock: 30, minStock: 10, custom: { categoria: "Pizzas" } },
      { name: "Pizza Especial grande", priceArs: 11000, stock: 25, minStock: 10, custom: { categoria: "Pizzas" } },
      { name: "Pizza Fugazza grande", priceArs: 9000, stock: 8, minStock: 10, custom: { categoria: "Pizzas" } },
      { name: "Pizza Calabresa grande", priceArs: 10500, stock: 15, minStock: 8, custom: { categoria: "Pizzas" } },
      { name: "Pizza Roquefort grande", priceArs: 11500, stock: 0, minStock: 6, custom: { categoria: "Pizzas" } },
      { name: "Fainá porción", priceArs: 1800, stock: 60, minStock: 20, custom: { categoria: "Acompañamientos" } },
      { name: "Empanadas (docena)", priceArs: 9600, stock: 18, minStock: 12, custom: { categoria: "Empanadas" } },
      { name: "Empanada de carne", priceArs: 900, stock: 5, minStock: 24, custom: { categoria: "Empanadas" } },
      { name: "Empanada de jamón y queso", priceArs: 900, stock: 40, minStock: 24, custom: { categoria: "Empanadas" } },
      { name: "Coca-Cola 1.5L", priceArs: 2800, stock: 36, minStock: 12, custom: { categoria: "Bebidas" } },
      { name: "Sprite 1.5L", priceArs: 2800, stock: 9, minStock: 12, custom: { categoria: "Bebidas" } },
      { name: "Agua saborizada 1.5L", priceArs: 2200, stock: 20, minStock: 10, custom: { categoria: "Bebidas" } },
      { name: "Cerveza Quilmes 1L", priceArs: 3500, stock: 0, minStock: 8, custom: { categoria: "Bebidas" } },
      { name: "Postre flan casero", priceArs: 2500, stock: 14, minStock: 6, custom: { categoria: "Postres" } },
    ],
  },

  // ════════ INMOBILIARIA ÁLVAREZ — crm ════════
  inmobiliariaalvarezpropiedades: {
    modules: ["crm"],
    contacts: [
      { name: "Valeria Ponce", phone: "+5492915564101", stage: "interesado", source: "bot", custom: { operacion: "Alquiler", zona: "Centro", presupuesto_usd: 400 }, notes: "Vino del bot: depto 2 amb", touchDays: -2 },
      { name: "Rodolfo Genta", phone: "+5492915564102", stage: "contactado", source: "manual", custom: { operacion: "Tasación", zona: "Palihue" }, touchDays: -5 },
      { name: "María Inés Vidal", phone: "+5492915564103", stage: "nuevo", source: "bot", custom: { operacion: "Compra", zona: "Universitario", presupuesto_usd: 85000 }, notes: "Vino del bot: consulta de Zonaprop", touchDays: 0 },
      { name: "Esteban Carrizo", phone: "+5492915564104", stage: "interesado", source: "bot", custom: { operacion: "Compra", zona: "Centro", presupuesto_usd: 120000 }, touchDays: -1 },
      { name: "Lorena Bustos", phone: "+5492915564105", stage: "cliente", source: "manual", custom: { operacion: "Venta", zona: "Palihue", presupuesto_usd: 210000 }, notes: "Vende casa, exclusividad firmada", touchDays: -3 },
      { name: "Gonzalo Arce", phone: "+5492915564106", stage: "nuevo", source: "bot", custom: { operacion: "Alquiler", zona: "Universitario", presupuesto_usd: 350 }, touchDays: 0 },
      { name: "Patricia Molina", phone: "+5492915564107", stage: "contactado", source: "bot", custom: { operacion: "Compra", zona: "Norte", presupuesto_usd: 95000 }, touchDays: -200 },
      { name: "Walter Figueroa", phone: "+5492915564108", stage: "interesado", source: "manual", custom: { operacion: "Tasación", zona: "Centro" }, touchDays: -4 },
      { name: "Cecilia Pérez", phone: "+5492915564109", stage: "cliente", source: "bot", custom: { operacion: "Alquiler", zona: "Centro", presupuesto_usd: 450 }, notes: "Firmó alquiler, garantía OK", touchDays: -6 },
      { name: "Andrés Cardozo", phone: "+5492915564110", stage: "nuevo", source: "bot", custom: { operacion: "Compra", zona: "Palihue", presupuesto_usd: 180000 }, touchDays: 0 },
      { name: "Silvia Romano", phone: "+5492915564111", stage: "interesado", source: "manual", custom: { operacion: "Venta", zona: "Universitario", presupuesto_usd: 140000 }, touchDays: -190 },
      { name: "Maximiliano Ávila", phone: "+5492915564112", stage: "contactado", source: "bot", custom: { operacion: "Alquiler", zona: "Norte", presupuesto_usd: 380 }, touchDays: -8 },
      { name: "Daniela Ojeda", phone: "+5492915564113", stage: "interesado", source: "bot", custom: { operacion: "Compra", zona: "Centro", presupuesto_usd: 70000 }, touchDays: -2 },
      { name: "Ramiro Sánchez", phone: "+5492915564114", stage: "nuevo", source: "bot", custom: { operacion: "Tasación", zona: "Palihue" }, touchDays: -1 },
    ],
    tasks: [
      { title: "Seguimiento presupuesto alquiler Valeria Ponce (toque 2)", dueDays: -2, contactIdx: 0 },
      { title: "Coordinar tasación en Palihue (Genta)", dueDays: -1, contactIdx: 1 },
      { title: "Subir fotos del depto de Cecilia a la web", dueDays: 1 },
      { title: "Llamar a Vidal por la propiedad de Zonaprop", dueDays: 2, contactIdx: 2 },
      { title: "Firmar exclusividad con Bustos", dueDays: 3, done: true, contactIdx: 4 },
    ],
  },

  // ════════ TIENDA NUBE URBANA — crm + catalogo ════════
  tiendanubeurbana: {
    modules: ["crm", "catalogo"],
    contacts: [
      { name: "Agustina Roldán", phone: "+5492915565101", stage: "cliente", source: "bot", custom: { talle: "M", canal: "Instagram" }, notes: "Vino del bot: compró en la campaña de ads", touchDays: -1 },
      { name: "Camila Funes", phone: "+5492915565102", stage: "interesado", source: "bot", custom: { talle: "S", canal: "Instagram" }, notes: "Vino del bot: preguntó stock del vestido lino", touchDays: -2 },
      { name: "Martina Ocampo", phone: "+5492915565103", stage: "cliente", source: "bot", custom: { talle: "L", canal: "Web" }, touchDays: -3 },
      { name: "Sofía Aguilar", phone: "+5492915565104", stage: "nuevo", source: "bot", custom: { talle: "M", canal: "Instagram" }, touchDays: 0 },
      { name: "Belén Cardozo", phone: "+5492915565105", stage: "cliente", source: "manual", custom: { talle: "XL", canal: "WhatsApp" }, touchDays: -200 },
      { name: "Julieta Mansilla", phone: "+5492915565106", stage: "interesado", source: "bot", custom: { talle: "XS", canal: "Instagram" }, touchDays: -1 },
      { name: "Rocío Benítez", phone: "+5492915565107", stage: "cliente", source: "bot", custom: { talle: "S", canal: "Web" }, touchDays: -5 },
      { name: "Florencia Ledesma", phone: "+5492915565108", stage: "contactado", source: "manual", custom: { talle: "M", canal: "WhatsApp" }, touchDays: -190 },
      { name: "Antonella Ríos", phone: "+5492915565109", stage: "nuevo", source: "bot", custom: { talle: "L", canal: "Instagram" }, touchDays: 0 },
      { name: "Micaela Torres", phone: "+5492915565110", stage: "cliente", source: "bot", custom: { talle: "S", canal: "Instagram" }, touchDays: -2 },
      { name: "Carla Domínguez", phone: "+5492915565111", stage: "interesado", source: "bot", custom: { talle: "M", canal: "Web" }, touchDays: -4 },
      { name: "Valentina Sosa", phone: "+5492915565112", stage: "cliente", source: "manual", custom: { talle: "XL", canal: "WhatsApp" }, touchDays: -7 },
      { name: "Lucía Navarro", phone: "+5492915565113", stage: "nuevo", source: "bot", custom: { talle: "XS", canal: "Instagram" }, touchDays: -1 },
    ],
    tasks: [
      { title: "Reponer talles S del vestido lino (alerta de stock)", dueDays: -1 },
      { title: "Responder DM de Funes sobre stock", dueDays: -2, contactIdx: 1 },
      { title: "Subir nueva campaña de invierno a IG", dueDays: 1 },
      { title: "Armar combos de liquidación", dueDays: 3 },
    ],
    products: [
      { name: "Vestido lino", priceArs: 38000, stock: 2, minStock: 6, custom: { talles: "XS-S-M-L", categoria: "Vestidos" } },
      { name: "Jean mom fit", priceArs: 42000, stock: 14, minStock: 6, custom: { talles: "36-44", categoria: "Pantalones" } },
      { name: "Sweater oversize", priceArs: 35000, stock: 9, minStock: 5, custom: { talles: "S-M-L", categoria: "Abrigos" } },
      { name: "Campera puffer", priceArs: 68000, stock: 0, minStock: 4, custom: { talles: "S-M-L-XL", categoria: "Abrigos" } },
      { name: "Remera básica algodón", priceArs: 14000, stock: 50, minStock: 15, custom: { talles: "XS-XL", categoria: "Remeras" } },
      { name: "Buzo canguro", priceArs: 32000, stock: 4, minStock: 8, custom: { talles: "S-M-L", categoria: "Abrigos" } },
      { name: "Pollera midi tableada", priceArs: 29000, stock: 11, minStock: 5, custom: { talles: "S-M-L", categoria: "Polleras" } },
      { name: "Pantalón palazzo", priceArs: 36000, stock: 7, minStock: 5, custom: { talles: "S-M-L", categoria: "Pantalones" } },
      { name: "Top morley", priceArs: 18000, stock: 3, minStock: 6, custom: { talles: "XS-S-M", categoria: "Tops" } },
      { name: "Camisa oversize lino", priceArs: 33000, stock: 16, minStock: 5, custom: { talles: "S-M-L", categoria: "Camisas" } },
      { name: "Short de jean", priceArs: 24000, stock: 12, minStock: 6, custom: { talles: "36-44", categoria: "Shorts" } },
      { name: "Vestido satén fiesta", priceArs: 54000, stock: 1, minStock: 4, custom: { talles: "S-M-L", categoria: "Vestidos" } },
      { name: "Tapado paño", priceArs: 89000, stock: 6, minStock: 3, custom: { talles: "S-M-L", categoria: "Abrigos" } },
      { name: "Calza térmica", priceArs: 16000, stock: 30, minStock: 10, custom: { talles: "S-M-L-XL", categoria: "Básicos" } },
    ],
  },

  // ════════ DISTRIBUIDORA CARUSO — crm + catalogo + caja ════════
  distribuidoracarusomayorista: {
    modules: ["crm", "catalogo", "caja"],
    contacts: [
      { name: "Supermercado El Águila", phone: "+5492915566101", stage: "cliente", source: "manual", custom: { cuit: "30-65888999-1", lista: "Mayorista A", dia_reparto: "Martes" }, touchDays: -2 },
      { name: "Almacén Doña Rosa", phone: "+5492915566102", stage: "cliente", source: "manual", custom: { cuit: "27-22333444-5", lista: "Minorista", dia_reparto: "Jueves" }, touchDays: -3 },
      { name: "Kiosco 24hs Alem", phone: "+5492915566103", stage: "interesado", source: "bot", notes: "Vino del bot: pidió lista mayorista", touchDays: -1 },
      { name: "Autoservicio La Plaza", phone: "+5492915566104", stage: "cliente", source: "manual", custom: { cuit: "30-70111222-3", lista: "Mayorista A", dia_reparto: "Lunes" }, touchDays: -5 },
      { name: "Despensa San Cayetano", phone: "+5492915566105", stage: "cliente", source: "manual", custom: { cuit: "20-28444555-6", lista: "Mayorista B", dia_reparto: "Miércoles" }, touchDays: -200 },
      { name: "Maxikiosco Centro", phone: "+5492915566106", stage: "contactado", source: "bot", custom: { lista: "Minorista" }, touchDays: -8 },
      { name: "Supermercado Norte", phone: "+5492915566107", stage: "cliente", source: "manual", custom: { cuit: "30-71222333-9", lista: "Mayorista A", dia_reparto: "Viernes" }, touchDays: -1 },
      { name: "Almacén El Trébol", phone: "+5492915566108", stage: "interesado", source: "bot", custom: { lista: "Mayorista B" }, touchDays: -4 },
      { name: "Fiambrería La Italiana", phone: "+5492915566109", stage: "cliente", source: "manual", custom: { cuit: "27-30555666-1", lista: "Mayorista B", dia_reparto: "Martes" }, touchDays: -190 },
      { name: "Rotisería Don Carlos", phone: "+5492915566110", stage: "nuevo", source: "bot", touchDays: 0 },
      { name: "Verdulería Frutos", phone: "+5492915566111", stage: "interesado", source: "bot", custom: { lista: "Minorista" }, touchDays: -2 },
      { name: "Bar La Estación", phone: "+5492915566112", stage: "contactado", source: "manual", custom: { lista: "Mayorista B" }, touchDays: -6 },
      { name: "Minimercado Sur", phone: "+5492915566113", stage: "cliente", source: "manual", custom: { cuit: "30-69777888-2", lista: "Mayorista A", dia_reparto: "Jueves" }, touchDays: -3 },
      { name: "Kiosco Las Heras", phone: "+5492915566114", stage: "nuevo", source: "bot", touchDays: 0 },
    ],
    tasks: [
      { title: "Revisar diferencias de conciliación MP de ayer", dueDays: -1 },
      { title: "Confirmar pedido semanal de El Águila", dueDays: -2, contactIdx: 0 },
      { title: "Pasar lista mayorista a Kiosco 24hs Alem", dueDays: 1, contactIdx: 2 },
      { title: "Reponer stock de yerba (alerta)", dueDays: 1 },
      { title: "Coordinar reparto del viernes — zona norte", dueDays: 2 },
    ],
    products: [
      { name: "Yerba Mate 1kg (bulto x10)", priceArs: 95000, stock: 4, minStock: 6, custom: { unidad: "bulto x10" } },
      { name: "Aceite girasol 1.5L (caja x12)", priceArs: 78000, stock: 12, minStock: 8, custom: { unidad: "caja x12" } },
      { name: "Fideos guiseros 500g (bulto x20)", priceArs: 42000, stock: 20, minStock: 10, custom: { unidad: "bulto x20" } },
      { name: "Arroz largo fino 1kg (bulto x10)", priceArs: 38000, stock: 5, minStock: 8, custom: { unidad: "bulto x10" } },
      { name: "Azúcar 1kg (bulto x10)", priceArs: 33000, stock: 0, minStock: 6, custom: { unidad: "bulto x10" } },
      { name: "Harina 000 1kg (bulto x10)", priceArs: 28000, stock: 30, minStock: 10, custom: { unidad: "bulto x10" } },
      { name: "Gaseosa cola 2.25L (pack x6)", priceArs: 21000, stock: 18, minStock: 10, custom: { unidad: "pack x6" } },
      { name: "Agua mineral 2L (pack x6)", priceArs: 13000, stock: 25, minStock: 10, custom: { unidad: "pack x6" } },
      { name: "Papel higiénico (bulto x18)", priceArs: 34000, stock: 8, minStock: 6, custom: { unidad: "bulto x18" } },
      { name: "Detergente 750ml (caja x12)", priceArs: 29000, stock: 3, minStock: 6, custom: { unidad: "caja x12" } },
      { name: "Galletitas surtidas (caja x24)", priceArs: 36000, stock: 14, minStock: 8, custom: { unidad: "caja x24" } },
      { name: "Leche larga vida 1L (caja x12)", priceArs: 24000, stock: 0, minStock: 8, custom: { unidad: "caja x12" } },
      { name: "Conserva de tomate 520g (caja x24)", priceArs: 48000, stock: 16, minStock: 8, custom: { unidad: "caja x24" } },
      { name: "Café molido 250g (caja x12)", priceArs: 67000, stock: 9, minStock: 6, custom: { unidad: "caja x12" } },
    ],
    cash: [
      { kind: "venta", concept: "Pedido — Supermercado El Águila", amountArs: 540000, method: "transferencia", dayOffset: 0 },
      { kind: "venta", concept: "Pedido — Minimercado Sur", amountArs: 310000, method: "mp", dayOffset: 0 },
      { kind: "venta", concept: "Pedido — Autoservicio La Plaza", amountArs: 425000, method: "transferencia", dayOffset: 0 },
      { kind: "venta", concept: "Pedido — Almacén Doña Rosa", amountArs: 95000, method: "efectivo", dayOffset: -1 },
      { kind: "gasto", concept: "Combustible camioneta de reparto", amountArs: 85000, method: "efectivo", dayOffset: -1 },
      { kind: "venta", concept: "Pedido — Supermercado Norte", amountArs: 480000, method: "transferencia", dayOffset: -2 },
      { kind: "venta", concept: "Pedido — Despensa San Cayetano", amountArs: 220000, method: "mp", dayOffset: -2 },
      { kind: "gasto", concept: "Compra a proveedor — yerba", amountArs: 760000, method: "transferencia", dayOffset: -3 },
      { kind: "venta", concept: "Pedido — Fiambrería La Italiana", amountArs: 180000, method: "transferencia", dayOffset: -4 },
      { kind: "venta", concept: "Pedido — Maxikiosco Centro", amountArs: 130000, method: "mp", dayOffset: -5 },
      { kind: "gasto", concept: "Sueldo repartidor (quincena)", amountArs: 450000, method: "transferencia", dayOffset: -6 },
      { kind: "venta", concept: "Pedido — Bar La Estación", amountArs: 165000, method: "efectivo", dayOffset: -7 },
      { kind: "venta", concept: "Pedido — Supermercado El Águila", amountArs: 510000, method: "transferencia", dayOffset: -9 },
      { kind: "gasto", concept: "Compra a proveedor — aceite y harina", amountArs: 620000, method: "transferencia", dayOffset: -10 },
      { kind: "venta", concept: "Pedido — Verdulería Frutos", amountArs: 88000, method: "mp", dayOffset: -12 },
      { kind: "venta", concept: "Pedido — Almacén El Trébol", amountArs: 240000, method: "transferencia", dayOffset: -14 },
      { kind: "gasto", concept: "Alquiler depósito", amountArs: 520000, method: "transferencia", dayOffset: -15 },
      { kind: "venta", concept: "Pedido — Autoservicio La Plaza", amountArs: 390000, method: "transferencia", dayOffset: -18 },
      { kind: "venta", concept: "Pedido — Minimercado Sur", amountArs: 285000, method: "mp", dayOffset: -20 },
      { kind: "venta", concept: "Pedido — Supermercado Norte", amountArs: 460000, method: "transferencia", dayOffset: -24 },
    ],
  },

  // ════════ GIMNASIO FUERZA SUR — crm + turnos + rrhh ════════
  gimnasiofuerzasur: {
    modules: ["crm", "turnos", "rrhh"],
    contacts: [
      { name: "Julieta Páez", phone: "+5492915567101", stage: "cliente", source: "manual", custom: { plan: "Mensual" }, touchDays: -3 },
      { name: "Nico Aramburu", phone: "+5492915567102", stage: "cliente", source: "bot", custom: { plan: "Trimestral" }, notes: "Vino del bot: reservó clase solo", touchDays: -1 },
      { name: "Brenda Ríos", phone: "+5492915567103", stage: "interesado", source: "bot", custom: { plan: "Mensual" }, touchDays: -2 },
      { name: "Leandro Cabrera", phone: "+5492915567104", stage: "cliente", source: "manual", custom: { plan: "Anual" }, touchDays: -200 },
      { name: "Sofía Maldonado", phone: "+5492915567105", stage: "cliente", source: "bot", custom: { plan: "Pase libre" }, touchDays: -5 },
      { name: "Tomás Giménez", phone: "+5492915567106", stage: "nuevo", source: "bot", custom: { plan: "Mensual" }, touchDays: 0 },
      { name: "Carla Suárez", phone: "+5492915567107", stage: "contactado", source: "bot", custom: { plan: "Trimestral" }, touchDays: -190 },
      { name: "Diego Ferreyra", phone: "+5492915567108", stage: "cliente", source: "manual", custom: { plan: "Mensual" }, touchDays: -7 },
      { name: "Micaela Ojeda", phone: "+5492915567109", stage: "interesado", source: "bot", custom: { plan: "Mensual" }, touchDays: -1 },
      { name: "Franco Medina", phone: "+5492915567110", stage: "cliente", source: "bot", custom: { plan: "Anual" }, touchDays: -4 },
      { name: "Valentina Castro", phone: "+5492915567111", stage: "nuevo", source: "bot", custom: { plan: "Mensual" }, touchDays: 0 },
      { name: "Agustín Romero", phone: "+5492915567112", stage: "cliente", source: "manual", custom: { plan: "Pase libre" }, touchDays: -8 },
      { name: "Rocío Benítez", phone: "+5492915567113", stage: "interesado", source: "bot", custom: { plan: "Trimestral" }, touchDays: -2 },
      { name: "Martín Sosa", phone: "+5492915567114", stage: "cliente", source: "bot", custom: { plan: "Mensual" }, touchDays: -6 },
    ],
    appts: [
      { title: "Funcional 8hs — Páez", dayOffset: 0, hour: 8, status: "CONFIRMED", source: "manual", custom: { clase: "Funcional" }, contactIdx: 0 },
      { title: "Spinning 10hs — Aramburu", dayOffset: 0, hour: 10, status: "CONFIRMED", source: "bot", custom: { clase: "Spinning" }, contactIdx: 1 },
      { title: "Yoga 18hs — Maldonado", dayOffset: 0, hour: 18, status: "PENDING", source: "bot", custom: { clase: "Yoga" }, contactIdx: 4 },
      { title: "Funcional 19hs — Ríos", dayOffset: 0, hour: 19, status: "CONFIRMED", source: "bot", custom: { clase: "Funcional" }, contactIdx: 2 },
      { title: "Musculación 20hs — Ferreyra", dayOffset: 0, hour: 20, status: "PENDING", source: "manual", custom: { clase: "Musculación" }, contactIdx: 7 },
      { title: "Spinning 9hs — Medina", dayOffset: 1, hour: 9, status: "CONFIRMED", source: "bot", custom: { clase: "Spinning" }, contactIdx: 9 },
      { title: "Funcional 19hs — Sosa", dayOffset: 1, hour: 19, status: "CONFIRMED", source: "bot", custom: { clase: "Funcional" }, contactIdx: 13 },
      { title: "Yoga 18hs — Ojeda", dayOffset: 2, hour: 18, status: "PENDING", source: "bot", custom: { clase: "Yoga" }, contactIdx: 8 },
      { title: "Musculación 20hs — Romero", dayOffset: 2, hour: 20, status: "CONFIRMED", source: "manual", custom: { clase: "Musculación" }, contactIdx: 11 },
      { title: "Funcional 8hs — Cabrera", dayOffset: 3, hour: 8, status: "CONFIRMED", source: "manual", custom: { clase: "Funcional" }, contactIdx: 3 },
      { title: "Spinning 10hs — Benítez", dayOffset: 4, hour: 10, status: "PENDING", source: "bot", custom: { clase: "Spinning" }, contactIdx: 12 },
      { title: "Funcional 19hs — Giménez", dayOffset: 5, hour: 19, status: "PENDING", source: "bot", custom: { clase: "Funcional" }, contactIdx: 5 },
    ],
    tasks: [
      { title: "Armar grilla de profes de la semana que viene", dueDays: -1 },
      { title: "Cobrar planes vencidos (recordatorio automático)", dueDays: -2 },
      { title: "Renovar pase libre de Maldonado", dueDays: 1, contactIdx: 4 },
      { title: "Reponer toallas y alcohol en gel", dueDays: 2 },
    ],
    employees: [
      { name: "Pedro Lamas", phone: "+5492915567201", role: "Profe de musculación" },
      { name: "Sol Aguirre", phone: "+5492915567202", role: "Profe de funcional" },
      { name: "Maxi Duarte", phone: "+5492915567203", role: "Profe de spinning" },
      { name: "Belu Ramírez", phone: "+5492915567204", role: "Profe de yoga" },
      { name: "Cristian Vega", phone: "+5492915567205", role: "Recepción" },
    ],
    timeEntries: [
      { empIdx: 0, inDay: 0, inHour: 7 }, // abierto hoy
      { empIdx: 4, inDay: 0, inHour: 8 }, // abierto hoy
      { empIdx: 1, inDay: 0, inHour: 9, outDay: 0, outHour: 13 },
      { empIdx: 2, inDay: -1, inHour: 8, outDay: -1, outHour: 16 },
      { empIdx: 3, inDay: -1, inHour: 17, outDay: -1, outHour: 21 },
      { empIdx: 0, inDay: -2, inHour: 7, outDay: -2, outHour: 15 },
      { empIdx: 1, inDay: -2, inHour: 9, outDay: -2, outHour: 18 },
    ],
  },

  // ════════ CLÍNICA DENTAL IRIARTE — crm + turnos + rrhh ════════
  clinicadentaliriarte: {
    modules: ["crm", "turnos", "rrhh"],
    contacts: [
      { name: "Graciela Mansilla", phone: "+5492915568101", stage: "cliente", source: "manual", custom: { obra_social: "IOMA", nro_afiliado: "445566/01" }, touchDays: -3 },
      { name: "Pablo Quiroga", phone: "+5492915568102", stage: "cliente", source: "bot", custom: { obra_social: "Particular" }, notes: "Vino del bot: pidió turno por WhatsApp", touchDays: -1 },
      { name: "Marta Ledesma", phone: "+5492915568103", stage: "cliente", source: "manual", custom: { obra_social: "OSDE", nro_afiliado: "112233/04" }, touchDays: -2 },
      { name: "Jorge Ávila", phone: "+5492915568104", stage: "interesado", source: "bot", custom: { obra_social: "Swiss Medical", nro_afiliado: "998877/02" }, touchDays: -1 },
      { name: "Rosa Giménez", phone: "+5492915568105", stage: "cliente", source: "manual", custom: { obra_social: "IOMA", nro_afiliado: "667788/01" }, touchDays: -200 },
      { name: "Daniel Ferreyra", phone: "+5492915568106", stage: "nuevo", source: "bot", custom: { obra_social: "Particular" }, touchDays: 0 },
      { name: "Liliana Sosa", phone: "+5492915568107", stage: "cliente", source: "bot", custom: { obra_social: "OSDE", nro_afiliado: "334455/01" }, touchDays: -5 },
      { name: "Hugo Maldonado", phone: "+5492915568108", stage: "contactado", source: "manual", custom: { obra_social: "Swiss Medical", nro_afiliado: "778899/03" }, touchDays: -190 },
      { name: "Patricia Núñez", phone: "+5492915568109", stage: "cliente", source: "bot", custom: { obra_social: "Particular" }, touchDays: -4 },
      { name: "Esteban Ríos", phone: "+5492915568110", stage: "interesado", source: "bot", custom: { obra_social: "IOMA", nro_afiliado: "223344/02" }, touchDays: -2 },
      { name: "Mónica Pérez", phone: "+5492915568111", stage: "nuevo", source: "bot", touchDays: 0 },
      { name: "Carlos Bravo", phone: "+5492915568112", stage: "cliente", source: "manual", custom: { obra_social: "OSDE", nro_afiliado: "556677/01" }, touchDays: -6 },
      { name: "Andrea Cabrera", phone: "+5492915568113", stage: "interesado", source: "bot", custom: { obra_social: "Particular" }, touchDays: -3 },
    ],
    appts: [
      { title: "Limpieza — Mansilla", dayOffset: 0, hour: 9, status: "CONFIRMED", source: "manual", custom: { sillon: "1", tratamiento: "Limpieza" }, contactIdx: 0 },
      { title: "Consulta — Quiroga", dayOffset: 0, hour: 10, status: "CONFIRMED", source: "bot", custom: { sillon: "2", tratamiento: "Consulta" }, contactIdx: 1 },
      { title: "Conducto — Ledesma", dayOffset: 0, hour: 11, status: "PENDING", source: "manual", custom: { sillon: "1", tratamiento: "Conducto" }, contactIdx: 2 },
      { title: "Ortodoncia (control) — Núñez", dayOffset: 0, hour: 16, status: "CONFIRMED", source: "bot", custom: { sillon: "3", tratamiento: "Ortodoncia" }, contactIdx: 8 },
      { title: "Extracción — Bravo", dayOffset: 0, hour: 17, status: "PENDING", source: "manual", custom: { sillon: "2", tratamiento: "Extracción" }, contactIdx: 11 },
      { title: "Limpieza — Sosa", dayOffset: 1, hour: 9, status: "CONFIRMED", source: "bot", custom: { sillon: "1", tratamiento: "Limpieza" }, contactIdx: 6 },
      { title: "Consulta — Ávila", dayOffset: 1, hour: 15, status: "PENDING", source: "bot", custom: { sillon: "2", tratamiento: "Consulta" }, contactIdx: 3 },
      { title: "Conducto — Ríos", dayOffset: 2, hour: 10, status: "CONFIRMED", source: "bot", custom: { sillon: "1", tratamiento: "Conducto" }, contactIdx: 9 },
      { title: "Ortodoncia (control) — Cabrera", dayOffset: 2, hour: 16, status: "PENDING", source: "bot", custom: { sillon: "3", tratamiento: "Ortodoncia" }, contactIdx: 12 },
      { title: "Limpieza — Giménez", dayOffset: 3, hour: 11, status: "CONFIRMED", source: "manual", custom: { sillon: "1", tratamiento: "Limpieza" }, contactIdx: 4 },
      { title: "Consulta — Ferreyra", dayOffset: 4, hour: 9, status: "PENDING", source: "bot", custom: { sillon: "2", tratamiento: "Consulta" }, contactIdx: 5 },
      { title: "Extracción — Maldonado", dayOffset: 5, hour: 10, status: "PENDING", source: "manual", custom: { sillon: "2", tratamiento: "Extracción" }, contactIdx: 7 },
    ],
    tasks: [
      { title: "Migrar fichas de papel a la ficha digital (lote 1)", dueDays: -2 },
      { title: "Confirmar autorizaciones IOMA del lunes", dueDays: -1 },
      { title: "Recordar control de ortodoncia a Núñez", dueDays: 1, contactIdx: 8 },
      { title: "Pedir insumos: anestesia y guantes", dueDays: 2 },
    ],
    employees: [
      { name: "Dra. Paula Iriarte", phone: "+5492915568201", role: "Odontóloga" },
      { name: "Dra. Lucía Sanz", phone: "+5492915568202", role: "Odontóloga" },
      { name: "Dr. Martín Reyes", phone: "+5492915568203", role: "Endodoncista" },
      { name: "Noelia Vargas", phone: "+5492915568204", role: "Secretaria" },
      { name: "Andrea Pinto", phone: "+5492915568205", role: "Asistente dental" },
    ],
    timeEntries: [
      { empIdx: 0, inDay: 0, inHour: 8 }, // abierto hoy
      { empIdx: 3, inDay: 0, inHour: 8, source: "whatsapp" }, // abierto hoy
      { empIdx: 1, inDay: 0, inHour: 9, outDay: 0, outHour: 13 },
      { empIdx: 4, inDay: -1, inHour: 8, outDay: -1, outHour: 17 },
      { empIdx: 2, inDay: -1, inHour: 14, outDay: -1, outHour: 20 },
      { empIdx: 0, inDay: -2, inHour: 8, outDay: -2, outHour: 16 },
    ],
  },

  // ════════ HOTEL COSTA MÉDANOS — crm + caja ════════
  hotelcostamedanos: {
    modules: ["crm", "caja"],
    contacts: [
      { name: "Familia Ledesma", phone: "+5492915569101", stage: "cliente", source: "bot", custom: { origen_reserva: "WhatsApp", habitacion: "4 (vista al mar)", sena_pendiente: "No" }, notes: "Vino del bot: reservó finde largo", touchDays: -2 },
      { name: "Sergio Maidana", phone: "+5492915569102", stage: "interesado", source: "bot", custom: { origen_reserva: "Instagram", sena_pendiente: "Sí" }, notes: "Vino del bot: cotizó enero, falta seña", touchDays: -1 },
      { name: "Familia Gutiérrez", phone: "+5492915569103", stage: "cliente", source: "bot", custom: { origen_reserva: "Booking", habitacion: "7", sena_pendiente: "No" }, touchDays: -3 },
      { name: "Marcela Ibáñez", phone: "+5492915569104", stage: "interesado", source: "bot", custom: { origen_reserva: "WhatsApp", sena_pendiente: "Sí" }, notes: "Falta seña reserva febrero", touchDays: -1 },
      { name: "Pareja Rossi", phone: "+5492915569105", stage: "cliente", source: "manual", custom: { origen_reserva: "Repetidor", habitacion: "2", sena_pendiente: "No" }, touchDays: -200 },
      { name: "Familia Acosta", phone: "+5492915569106", stage: "nuevo", source: "bot", custom: { origen_reserva: "Instagram", sena_pendiente: "Sí" }, touchDays: 0 },
      { name: "Roberto Sánchez", phone: "+5492915569107", stage: "cliente", source: "bot", custom: { origen_reserva: "Booking", habitacion: "9", sena_pendiente: "No" }, touchDays: -5 },
      { name: "Familia Vera", phone: "+5492915569108", stage: "contactado", source: "manual", custom: { origen_reserva: "WhatsApp", sena_pendiente: "Sí" }, touchDays: -190 },
      { name: "Laura Domínguez", phone: "+5492915569109", stage: "cliente", source: "bot", custom: { origen_reserva: "Repetidor", habitacion: "5", sena_pendiente: "No" }, touchDays: -4 },
      { name: "Familia Paz", phone: "+5492915569110", stage: "nuevo", source: "bot", custom: { origen_reserva: "Instagram", sena_pendiente: "Sí" }, touchDays: 0 },
      { name: "Cristina Molina", phone: "+5492915569111", stage: "interesado", source: "bot", custom: { origen_reserva: "WhatsApp", sena_pendiente: "Sí" }, touchDays: -2 },
      { name: "Familia Torres", phone: "+5492915569112", stage: "cliente", source: "manual", custom: { origen_reserva: "Booking", habitacion: "11", sena_pendiente: "No" }, touchDays: -7 },
      { name: "Esteban Ferraro", phone: "+5492915569113", stage: "interesado", source: "bot", custom: { origen_reserva: "Instagram", sena_pendiente: "Sí" }, touchDays: -3 },
    ],
    tasks: [
      { title: "Perseguir seña de Sergio Maidana (recordatorio activo)", dueDays: -2, contactIdx: 1 },
      { title: "Perseguir seña de Marcela Ibáñez", dueDays: -1, contactIdx: 3 },
      { title: "Cargar tarifas de temporada alta en el bot", dueDays: 1 },
      { title: "Enviar encuesta post-estadía a Familia Torres", dueDays: 2, contactIdx: 11 },
      { title: "Cruzar cobros MP con reservas de la semana", dueDays: 3 },
    ],
    cash: [
      { kind: "venta", concept: "Estadía 3 noches — Familia Ledesma (hab. 4)", amountArs: 285000, method: "transferencia", dayOffset: 0 },
      { kind: "venta", concept: "Seña reserva enero — Familia Gutiérrez", amountArs: 120000, method: "mp", dayOffset: 0 },
      { kind: "venta", concept: "Estadía 2 noches — Pareja Rossi (hab. 2)", amountArs: 160000, method: "efectivo", dayOffset: 0 },
      { kind: "venta", concept: "Estadía 4 noches — Roberto Sánchez (hab. 9)", amountArs: 380000, method: "transferencia", dayOffset: -1 },
      { kind: "gasto", concept: "Lavandería (ropa blanca)", amountArs: 65000, method: "transferencia", dayOffset: -1 },
      { kind: "venta", concept: "Seña reserva febrero — Familia Vera", amountArs: 90000, method: "mp", dayOffset: -2 },
      { kind: "venta", concept: "Estadía 5 noches — Laura Domínguez (hab. 5)", amountArs: 450000, method: "transferencia", dayOffset: -3 },
      { kind: "gasto", concept: "Comisión Booking", amountArs: 78000, method: "transferencia", dayOffset: -3 },
      { kind: "venta", concept: "Estadía 2 noches — Familia Torres (hab. 11)", amountArs: 170000, method: "mp", dayOffset: -4 },
      { kind: "gasto", concept: "Sueldo mucamas (quincena)", amountArs: 520000, method: "transferencia", dayOffset: -5 },
      { kind: "venta", concept: "Estadía 3 noches — Cristina Molina", amountArs: 240000, method: "transferencia", dayOffset: -7 },
      { kind: "venta", concept: "Desayunos extra y minibar", amountArs: 35000, method: "efectivo", dayOffset: -7 },
      { kind: "gasto", concept: "Mantenimiento pileta", amountArs: 48000, method: "efectivo", dayOffset: -9 },
      { kind: "venta", concept: "Estadía 6 noches — Familia Acosta", amountArs: 540000, method: "transferencia", dayOffset: -11 },
      { kind: "venta", concept: "Seña reserva marzo — Esteban Ferraro", amountArs: 100000, method: "mp", dayOffset: -13 },
      { kind: "gasto", concept: "Servicios (gas/luz/agua)", amountArs: 130000, method: "transferencia", dayOffset: -15 },
      { kind: "venta", concept: "Estadía 4 noches — Familia Paz", amountArs: 360000, method: "transferencia", dayOffset: -18 },
      { kind: "venta", concept: "Estadía 2 noches — Marcela Ibáñez", amountArs: 150000, method: "mp", dayOffset: -22 },
    ],
  },

  // ════════ TALLER FUNES HNOS — crm + turnos ════════
  tallerfuneshnos: {
    modules: ["crm", "turnos"],
    contacts: [
      { name: "Raúl Barrionuevo", phone: "+5492915560901", stage: "cliente", source: "manual", custom: { vehiculo: "Toyota Hilux 2019", patente: "AD123CD", km: 98000 }, notes: "Service cada 10.000 km", touchDays: -3 },
      { name: "Mónica Sepúlveda", phone: "+5492915560902", stage: "interesado", source: "bot", custom: { vehiculo: "Fiat Cronos 2021", patente: "AE456FG", km: 42000 }, notes: "Vino del bot: pidió turno para frenos", touchDays: -1 },
      { name: "Aldo Ferreira", phone: "+5492915560903", stage: "cliente", source: "manual", custom: { vehiculo: "VW Amarok 2018", patente: "AC789HJ", km: 130000 }, touchDays: -5 },
      { name: "Sandra Ojeda", phone: "+5492915560904", stage: "cliente", source: "bot", custom: { vehiculo: "Ford Ka 2020", patente: "AD321KL", km: 55000 }, touchDays: -2 },
      { name: "Marcelo Ruiz", phone: "+5492915560905", stage: "nuevo", source: "bot", custom: { vehiculo: "Chevrolet Onix 2022", patente: "AF654MN", km: 28000 }, touchDays: 0 },
      { name: "Gustavo Paz", phone: "+5492915560906", stage: "cliente", source: "manual", custom: { vehiculo: "Renault Kangoo 2017", patente: "AB987PQ", km: 165000 }, touchDays: -200 },
      { name: "Liliana Vera", phone: "+5492915560907", stage: "interesado", source: "bot", custom: { vehiculo: "Peugeot 208 2021", patente: "AE111RS", km: 38000 }, touchDays: -1 },
      { name: "Hernán Díaz", phone: "+5492915560908", stage: "contactado", source: "bot", custom: { vehiculo: "Toyota Etios 2019", patente: "AD222TU", km: 72000 }, touchDays: -190 },
      { name: "Carla Méndez", phone: "+5492915560909", stage: "cliente", source: "manual", custom: { vehiculo: "Fiat Toro 2020", patente: "AE333VW", km: 89000 }, touchDays: -4 },
      { name: "Néstor Aguirre", phone: "+5492915560910", stage: "nuevo", source: "bot", custom: { vehiculo: "Renault Sandero 2018", patente: "AC444XY", km: 110000 }, touchDays: 0 },
      { name: "Patricia Soto", phone: "+5492915560911", stage: "interesado", source: "bot", custom: { vehiculo: "VW Gol Trend 2016", patente: "AB555ZA", km: 145000 }, touchDays: -2 },
      { name: "Diego Funes (cliente)", phone: "+5492915560912", stage: "cliente", source: "manual", custom: { vehiculo: "Ford Ranger 2021", patente: "AE666BC", km: 64000 }, touchDays: -6 },
      { name: "Roxana Pereyra", phone: "+5492915560913", stage: "cliente", source: "bot", custom: { vehiculo: "Citroën C3 2019", patente: "AD777DE", km: 81000 }, touchDays: -7 },
    ],
    appts: [
      { title: "Service 100.000 km — Hilux (Barrionuevo)", dayOffset: 0, hour: 8, status: "CONFIRMED", source: "manual", custom: { trabajo: "Service", mecanico: "Diego" }, contactIdx: 0 },
      { title: "Frenos — Cronos (Sepúlveda)", dayOffset: 0, hour: 10, status: "CONFIRMED", source: "bot", custom: { trabajo: "Frenos", mecanico: "Martín" }, contactIdx: 1 },
      { title: "Embrague — Amarok (Ferreira)", dayOffset: 0, hour: 14, status: "PENDING", source: "manual", custom: { trabajo: "Embrague", mecanico: "Cacho" }, contactIdx: 2 },
      { title: "Diagnóstico — Onix (Ruiz)", dayOffset: 0, hour: 16, status: "PENDING", source: "bot", custom: { trabajo: "Diagnóstico", mecanico: "Luis" }, contactIdx: 4 },
      { title: "Service — Ka (Ojeda)", dayOffset: 1, hour: 9, status: "CONFIRMED", source: "bot", custom: { trabajo: "Service", mecanico: "Diego" }, contactIdx: 3 },
      { title: "Frenos — 208 (Vera)", dayOffset: 1, hour: 11, status: "PENDING", source: "bot", custom: { trabajo: "Frenos", mecanico: "Martín" }, contactIdx: 6 },
      { title: "Service — Kangoo (Paz)", dayOffset: 2, hour: 8, status: "CONFIRMED", source: "manual", custom: { trabajo: "Service", mecanico: "Pedro" }, contactIdx: 5 },
      { title: "Diagnóstico — Etios (Díaz)", dayOffset: 2, hour: 15, status: "PENDING", source: "bot", custom: { trabajo: "Diagnóstico", mecanico: "Luis" }, contactIdx: 7 },
      { title: "Embrague — Toro (Méndez)", dayOffset: 3, hour: 9, status: "CONFIRMED", source: "manual", custom: { trabajo: "Embrague", mecanico: "Cacho" }, contactIdx: 8 },
      { title: "Service — Ranger (Funes)", dayOffset: 4, hour: 10, status: "PENDING", source: "manual", custom: { trabajo: "Service", mecanico: "Diego" }, contactIdx: 11 },
      { title: "Frenos — Sandero (Aguirre)", dayOffset: 5, hour: 14, status: "PENDING", source: "bot", custom: { trabajo: "Frenos", mecanico: "Martín" }, contactIdx: 9 },
      { title: "Service — C3 (Pereyra)", dayOffset: 6, hour: 9, status: "CONFIRMED", source: "bot", custom: { trabajo: "Service", mecanico: "Pedro" }, contactIdx: 12 },
    ],
    tasks: [
      { title: "Avisar a Barrionuevo que la Hilux está lista (auto listo)", dueDays: -1, contactIdx: 0 },
      { title: "Pedir pastillas de freno para la Cronos", dueDays: -2 },
      { title: "Pasar presupuesto de embrague a Ferreira", dueDays: 1, contactIdx: 2 },
      { title: "Recordatorio service por km — Kangoo de Paz", dueDays: 2, contactIdx: 5 },
    ],
  },

  // ════════ LA BASSE — escuela de esquí/snow: crm + turnos + caja ════════
  labasse: {
    modules: ["crm", "turnos", "caja"],
    contacts: [
      { name: "Familia Belgrano", phone: "+5492915570101", stage: "cliente", source: "bot", custom: { disciplina: "Esquí", nivel: "Primera vez", edad: 38, fechas_viaje: "15-22 julio" }, notes: "Vino del bot: clases para toda la familia", touchDays: -2 },
      { name: "Tomás Etcheverry", phone: "+5492915570102", stage: "interesado", source: "bot", custom: { disciplina: "Snowboard", nivel: "Principiante", edad: 19, fechas_viaje: "10-14 julio" }, touchDays: -1 },
      { name: "Camila Ferrari", phone: "+5492915570103", stage: "cliente", source: "bot", custom: { disciplina: "Esquí", nivel: "Intermedio", edad: 27, fechas_viaje: "1-7 agosto" }, touchDays: -3 },
      { name: "Joaquín Lema", phone: "+5492915570104", stage: "nuevo", source: "bot", custom: { disciplina: "Snowboard", nivel: "Primera vez", edad: 22, fechas_viaje: "20-25 julio" }, touchDays: 0 },
      { name: "Familia Castagnino", phone: "+5492915570105", stage: "cliente", source: "manual", custom: { disciplina: "Ambas", nivel: "Principiante", edad: 41, fechas_viaje: "17-24 julio" }, touchDays: -200 },
      { name: "Valentina Russo", phone: "+5492915570106", stage: "interesado", source: "bot", custom: { disciplina: "Esquí", nivel: "Avanzado", edad: 31, fechas_viaje: "5-9 agosto" }, touchDays: -1 },
      { name: "Bautista Olivera", phone: "+5492915570107", stage: "cliente", source: "bot", custom: { disciplina: "Snowboard", nivel: "Intermedio", edad: 24, fechas_viaje: "12-16 julio" }, touchDays: -4 },
      { name: "Delfina Paez", phone: "+5492915570108", stage: "nuevo", source: "bot", custom: { disciplina: "Esquí", nivel: "Primera vez", edad: 8, fechas_viaje: "19-23 julio" }, notes: "Clase para niños", touchDays: 0 },
      { name: "Familia Quiroga", phone: "+5492915570109", stage: "contactado", source: "manual", custom: { disciplina: "Esquí", nivel: "Principiante", edad: 45, fechas_viaje: "26-31 julio" }, touchDays: -190 },
      { name: "Nicolás Brandán", phone: "+5492915570110", stage: "cliente", source: "bot", custom: { disciplina: "Snowboard", nivel: "Avanzado", edad: 29, fechas_viaje: "8-12 agosto" }, touchDays: -2 },
      { name: "Sofía Carranza", phone: "+5492915570111", stage: "interesado", source: "bot", custom: { disciplina: "Esquí", nivel: "Intermedio", edad: 35, fechas_viaje: "14-18 julio" }, touchDays: -1 },
      { name: "Mateo Funes", phone: "+5492915570112", stage: "cliente", source: "bot", custom: { disciplina: "Esquí", nivel: "Principiante", edad: 12, fechas_viaje: "21-25 julio" }, notes: "Clase para niños", touchDays: -5 },
      { name: "Familia Aramendi", phone: "+5492915570113", stage: "nuevo", source: "bot", custom: { disciplina: "Ambas", nivel: "Primera vez", edad: 39, fechas_viaje: "2-8 agosto" }, touchDays: 0 },
      { name: "Lucía Vidal", phone: "+5492915570114", stage: "cliente", source: "manual", custom: { disciplina: "Esquí", nivel: "Avanzado", edad: 33, fechas_viaje: "9-15 agosto" }, touchDays: -6 },
    ],
    appts: [
      { title: "Clase individual esquí — Familia Belgrano", dayOffset: 0, hour: 9, status: "CONFIRMED", source: "bot", custom: { disciplina: "Esquí", tipo_clase: "Familiar", nivel: "Primera vez" }, contactIdx: 0 },
      { title: "Clase grupal snow — Etcheverry", dayOffset: 0, hour: 10, status: "CONFIRMED", source: "bot", custom: { disciplina: "Snowboard", tipo_clase: "Grupal", nivel: "Principiante" }, contactIdx: 1 },
      { title: "Clase individual esquí — Ferrari", dayOffset: 0, hour: 12, status: "PENDING", source: "bot", custom: { disciplina: "Esquí", tipo_clase: "Individual", nivel: "Intermedio" }, contactIdx: 2 },
      { title: "Clase niños esquí — Delfina Paez", dayOffset: 0, hour: 14, status: "CONFIRMED", source: "bot", custom: { disciplina: "Esquí", tipo_clase: "Individual", nivel: "Primera vez" }, contactIdx: 7 },
      { title: "Clase grupal snow — Olivera", dayOffset: 0, hour: 15, status: "PENDING", source: "bot", custom: { disciplina: "Snowboard", tipo_clase: "Grupal", nivel: "Intermedio" }, contactIdx: 6 },
      { title: "Clase familiar — Familia Castagnino", dayOffset: 1, hour: 9, status: "CONFIRMED", source: "manual", custom: { disciplina: "Esquí", tipo_clase: "Familiar", nivel: "Principiante" }, contactIdx: 4 },
      { title: "Clase individual esquí — Russo", dayOffset: 1, hour: 11, status: "PENDING", source: "bot", custom: { disciplina: "Esquí", tipo_clase: "Individual", nivel: "Avanzado" }, contactIdx: 5 },
      { title: "Clase individual snow — Lema", dayOffset: 2, hour: 10, status: "CONFIRMED", source: "bot", custom: { disciplina: "Snowboard", tipo_clase: "Individual", nivel: "Primera vez" }, contactIdx: 3 },
      { title: "Clase niños esquí — Mateo Funes", dayOffset: 2, hour: 14, status: "PENDING", source: "bot", custom: { disciplina: "Esquí", tipo_clase: "Individual", nivel: "Principiante" }, contactIdx: 11 },
      { title: "Clase individual snow — Brandán", dayOffset: 3, hour: 12, status: "CONFIRMED", source: "bot", custom: { disciplina: "Snowboard", tipo_clase: "Individual", nivel: "Avanzado" }, contactIdx: 9 },
      { title: "Clase grupal esquí — Carranza", dayOffset: 4, hour: 10, status: "PENDING", source: "bot", custom: { disciplina: "Esquí", tipo_clase: "Grupal", nivel: "Intermedio" }, contactIdx: 10 },
      { title: "Clase familiar — Familia Aramendi", dayOffset: 5, hour: 9, status: "PENDING", source: "bot", custom: { disciplina: "Esquí", tipo_clase: "Familiar", nivel: "Primera vez" }, contactIdx: 12 },
    ],
    tasks: [
      { title: "Confirmar instructores para la semana del 15", dueDays: -1 },
      { title: "Cobrar seña pendiente de Quiroga", dueDays: -2, contactIdx: 8 },
      { title: "Coordinar alquiler de equipos con el rental", dueDays: 1 },
      { title: "Armar grupo de principiantes del 20/7", dueDays: 2 },
    ],
    cash: [
      { kind: "venta", concept: "Paquete 5 clases familiar — Familia Belgrano", amountArs: 320000, method: "transferencia", dayOffset: 0 },
      { kind: "venta", concept: "Clase grupal snow — Etcheverry", amountArs: 45000, method: "mp", dayOffset: 0 },
      { kind: "venta", concept: "Clase niños esquí — Delfina Paez", amountArs: 38000, method: "efectivo", dayOffset: 0 },
      { kind: "venta", concept: "Paquete 3 clases individuales — Ferrari", amountArs: 165000, method: "transferencia", dayOffset: -1 },
      { kind: "gasto", concept: "Comisión instructores (día)", amountArs: 90000, method: "efectivo", dayOffset: -1 },
      { kind: "venta", concept: "Clase grupal snow — Olivera", amountArs: 45000, method: "mp", dayOffset: -2 },
      { kind: "venta", concept: "Paquete familiar — Familia Castagnino", amountArs: 280000, method: "transferencia", dayOffset: -3 },
      { kind: "gasto", concept: "Alquiler equipos al rental", amountArs: 120000, method: "transferencia", dayOffset: -3 },
      { kind: "venta", concept: "Clase individual avanzado — Russo", amountArs: 60000, method: "mp", dayOffset: -4 },
      { kind: "venta", concept: "Seña paquete — Familia Quiroga", amountArs: 100000, method: "transferencia", dayOffset: -5 },
      { kind: "venta", concept: "Clase individual snow — Brandán", amountArs: 60000, method: "efectivo", dayOffset: -7 },
      { kind: "gasto", concept: "Combustible traslado a base", amountArs: 55000, method: "efectivo", dayOffset: -8 },
      { kind: "venta", concept: "Clase niños esquí — Mateo Funes", amountArs: 38000, method: "mp", dayOffset: -9 },
      { kind: "venta", concept: "Paquete grupal — Carranza", amountArs: 135000, method: "transferencia", dayOffset: -11 },
      { kind: "gasto", concept: "Seguro de actividad (mes)", amountArs: 95000, method: "transferencia", dayOffset: -13 },
      { kind: "venta", concept: "Clase individual avanzado — Vidal", amountArs: 60000, method: "transferencia", dayOffset: -16 },
      { kind: "venta", concept: "Paquete familiar — Familia Aramendi", amountArs: 290000, method: "mp", dayOffset: -20 },
    ],
  },
};

// ── Ejecución ────────────────────────────────────────────────────────────
async function main() {
  console.log(`🌊 seed-rico — hoy (ART) = ${TODAY}\n`);
  const summary: string[] = [];

  for (const [slug, seed] of Object.entries(SEEDS)) {
    const c = await db.client.findUnique({ where: { slug } });
    if (!c) { console.log(`⏭️  ${slug}: NO existe el tenant — salteado`); continue; }

    // Marcador de idempotencia
    const existing = await db.contact.count({ where: { clientId: c.id } });
    if (existing >= 12) {
      console.log(`⏭️  ${slug}: ya tiene ${existing} contactos (>=12) — salteado`);
      continue;
    }

    const counts = { contacts: 0, appts: 0, tasks: 0, products: 0, cash: 0, employees: 0, timeEntries: 0 };
    const contactIds: string[] = [];

    // Contactos (idempotente por teléfono dentro del tenant)
    for (const ct of seed.contacts) {
      let row = await db.contact.findFirst({ where: { clientId: c.id, phone: ct.phone } });
      if (!row) {
        row = await db.contact.create({
          data: {
            clientId: c.id, name: ct.name, phone: ct.phone, email: ct.email ?? null,
            stage: ct.stage, source: ct.source, notes: ct.notes ?? null,
            custom: (ct.custom ?? {}) as object, lastTouchAt: daysFromNow(ct.touchDays),
          },
        });
        counts.contacts++;
      }
      contactIds.push(row.id);
    }

    // Turnos
    if (seed.modules.includes("turnos") && seed.appts) {
      for (const ap of seed.appts) {
        const start = at(ap.dayOffset, ap.hour);
        const end = new Date(start.getTime() + (ap.durMin ?? 30) * 60_000);
        await db.appointment.create({
          data: {
            clientId: c.id, title: ap.title, startsAt: start, endsAt: end,
            status: ap.status, source: ap.source, custom: (ap.custom ?? {}) as object,
            contactId: ap.contactIdx != null ? (contactIds[ap.contactIdx] ?? null) : null,
          },
        });
        counts.appts++;
      }
    }

    // Tareas CRM
    if (seed.tasks) {
      for (const t of seed.tasks) {
        await db.crmTask.create({
          data: {
            clientId: c.id, title: t.title, done: t.done ?? false,
            dueAt: daysFromNow(t.dueDays, 10),
            contactId: t.contactIdx != null ? (contactIds[t.contactIdx] ?? null) : null,
          },
        });
        counts.tasks++;
      }
    }

    // Productos
    if (seed.modules.includes("catalogo") && seed.products) {
      for (const p of seed.products) {
        await db.product.create({
          data: {
            clientId: c.id, name: p.name, priceArs: p.priceArs,
            stock: p.stock, minStock: p.minStock, active: p.active ?? true,
            custom: (p.custom ?? {}) as object,
          },
        });
        counts.products++;
      }
    }

    // Caja
    if (seed.modules.includes("caja") && seed.cash) {
      for (const m of seed.cash) {
        await db.cashMovement.create({
          data: {
            clientId: c.id, kind: m.kind, concept: m.concept,
            amountArs: m.amountArs, method: m.method ?? null,
            createdAt: daysFromNow(m.dayOffset, 11),
          },
        });
        counts.cash++;
      }
    }

    // Empleados + fichajes
    if (seed.modules.includes("rrhh") && seed.employees) {
      const empIds: string[] = [];
      for (const e of seed.employees) {
        const emp = await db.employee.create({
          data: { clientId: c.id, name: e.name, phone: e.phone ?? null, role: e.role ?? null, active: true },
        });
        empIds.push(emp.id);
        counts.employees++;
      }
      for (const te of seed.timeEntries ?? []) {
        const empId = empIds[te.empIdx];
        if (!empId) continue;
        await db.timeEntry.create({
          data: {
            clientId: c.id, employeeId: empId,
            clockIn: at(te.inDay, te.inHour),
            clockOut: te.outDay != null && te.outHour != null ? at(te.outDay, te.outHour) : null,
            source: te.source ?? "web",
          },
        });
        counts.timeEntries++;
      }
    }

    const line = `✅ ${slug} [${seed.modules.join("+")}] — contactos:${counts.contacts} turnos:${counts.appts} tareas:${counts.tasks} productos:${counts.products} caja:${counts.cash} empleados:${counts.employees} fichajes:${counts.timeEntries}`;
    console.log(line);
    summary.push(line);
  }

  console.log(`\n──────── RESUMEN ────────`);
  summary.forEach((s) => console.log(s));
  console.log(`\n🌊 seed-rico terminado sin errores.`);
}

main()
  .catch((e) => { console.error("❌ ERROR:", e); process.exit(1); })
  .finally(() => db.$disconnect());
