/**
 * E3 — 3 demos PROFUNDAS por rubro, con datos que cuentan una historia:
 *  1. bahiamotos    — local de motos: ventas c/cuotas+permuta, taller, talles, caja
 *  2. escuelaolas   — escuela deportiva: instructores, turnos, lista de espera, caja
 *  3. clubpiston    — club: evento con cronómetro, competidores con tiempos
 * Idempotente: si el slug existe, lo borra y lo re-crea (son demos).
 * Uso: npx tsx scripts/demo-3profundas.ts
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { procesosParaRubro } from "../src/lib/procesos-catalogo";

const db = new PrismaClient();

const hoy = new Date();
const dia = (offset: number) => {
  const d = new Date(hoy.getTime() + offset * 24 * 60 * 60 * 1000);
  return d.toLocaleDateString("en-CA", { timeZone: "America/Argentina/Buenos_Aires" });
};
const fecha = (offset: number, hora = 12) => new Date(`${dia(offset)}T${String(hora).padStart(2, "0")}:00:00-03:00`);

async function limpiar(slug: string) {
  const c = await db.client.findUnique({ where: { slug } });
  if (!c) return;
  await db.lead.updateMany({ where: { clientId: c.id }, data: { clientId: null } });
  await db.project.updateMany({ where: { clientId: c.id }, data: { clientId: null } });
  await db.user.deleteMany({ where: { clientId: c.id } });
  await db.client.delete({ where: { id: c.id } });
}

async function crearBase(opts: {
  slug: string;
  name: string;
  rubro: string;
  primary: string;
  accent: string;
  modules: string[];
  settings?: object;
}) {
  await limpiar(opts.slug);
  const client = await db.client.create({
    data: {
      name: opts.name,
      slug: opts.slug,
      rubro: opts.rubro,
      pack: "SCALE",
      status: "ACTIVE",
      mrr: 430,
      modules: opts.modules,
      branding: { displayName: opts.name, primary: opts.primary, accent: opts.accent },
      settings: opts.settings ?? {},
    },
  });
  await db.user.create({
    data: {
      username: opts.slug,
      name: opts.name,
      role: "CLIENT",
      osRole: "dueno",
      clientId: client.id,
      passwordHash: await bcrypt.hash(`${opts.slug}2026`, 10),
    },
  });
  const procesos = procesosParaRubro(opts.rubro);
  await db.proceso.createMany({
    data: procesos.map((p, i) => ({
      clientId: client.id,
      nombre: p.nombre,
      queHace: p.queHace,
      cuando: p.cuando,
      estado: "ACTIVO" as const,
      orden: i,
      ultimaCorrida: fecha(0, 9),
    })),
  });
  return client;
}

// ────────────────────────────────────────────────────────────
async function bahiaMotos() {
  const c = await crearBase({
    slug: "bahiamotos",
    name: "Bahía Motos",
    rubro: "venta y service de motos",
    primary: "#C8102E",
    accent: "#1A2332",
    modules: ["crm", "ventas", "taller", "catalogo", "caja", "sitio"],
  });

  // Contactos con historia
  const nombres: [string, string, string, string][] = [
    ["Marcos Peralta", "2914556677", "cliente", "caliente"],
    ["Lucía Benítez", "2914112233", "interesado", "caliente"],
    ["Jorge Ávila", "2914998877", "contactado", "tibio"],
    ["Sofía Ramírez", "2915443322", "cliente", "tibio"],
    ["Raúl Ortega", "2914771122", "nuevo", "frio"],
  ];
  const contactos = [];
  for (const [name, phone, stage, temperatura] of nombres) {
    contactos.push(
      await db.contact.create({
        data: { clientId: c.id, name, phone, stage, temperatura, source: "manual", lastTouchAt: fecha(-2) },
      })
    );
  }

  // Ventas: una entregada saldada, una señada con cuotas + permuta
  await db.venta.create({
    data: {
      clientId: c.id,
      numero: 1,
      contactId: contactos[0].id,
      descripcion: "Honda XR150L 0km",
      precioArs: 4800000,
      senaArs: 1000000,
      pagos: [{ fecha: dia(-12), montoArs: 3800000, medio: "transferencia" }],
      estado: "ENTREGADA",
      entregadaAt: fecha(-10),
    },
  });
  await db.venta.create({
    data: {
      clientId: c.id,
      numero: 2,
      contactId: contactos[1].id,
      descripcion: "Yamaha FZ 2022 usada",
      precioArs: 5200000,
      senaArs: 500000,
      permutaDetalle: "Gilera Smash 110 2018",
      permutaValorArs: 900000,
      pagos: [{ fecha: dia(-5), montoArs: 800000, medio: "efectivo" }],
      cuotas: { cantidad: 12, valorArs: 250000, diaVencimiento: 10 },
      estado: "SENADA",
    },
  });

  // Taller: OTs en todos los estados
  const ots: [number, string | null, string, string, string, object[], number, number][] = [
    [1, contactos[3].id, "Vespa Primavera 150 · AB123CD", "Service 10.000 km", "EN_REPARACION", [
      { descripcion: "Aceite y filtro", cantidad: 1, precioArs: 45000, tipo: "repuesto" },
      { descripcion: "Mano de obra service", cantidad: 1, precioArs: 60000, tipo: "mano_obra" },
    ], 105000, 0],
    [2, contactos[2].id, "Honda Wave 110 · AC456EF", "No arranca en frío", "LISTA", [
      { descripcion: "Batería YTX5", cantidad: 1, precioArs: 85000, tipo: "repuesto" },
      { descripcion: "Diagnóstico + cambio", cantidad: 1, precioArs: 30000, tipo: "mano_obra" },
    ], 115000, 50000],
    [3, contactos[0].id, "Honda XR150L · AD789GH", "Primer service (garantía)", "ENTREGADA", [
      { descripcion: "Service de garantía", cantidad: 1, precioArs: 40000, tipo: "mano_obra" },
    ], 40000, 40000],
  ];
  for (const [numero, contactId, equipo, motivo, estado, items, total, pagado] of ots) {
    await db.ordenTrabajo.create({
      data: {
        clientId: c.id,
        numero,
        contactId,
        equipo,
        motivoIngreso: motivo,
        estado: estado as never,
        items: items as never,
        totalArs: total,
        pagadoArs: pagado,
        diagnostico: estado === "INGRESADA" ? null : "Revisado en banco.",
        ...(estado === "ENTREGADA" ? { entregadaAt: fecha(-3) } : {}),
      },
    });
  }

  // Catálogo con talles
  await db.product.createMany({
    data: [
      { clientId: c.id, name: "Casco LS2 Rebellion", priceArs: 185000, stock: 9, minStock: 2, talles: { S: 2, M: 4, L: 3, XL: 0 } },
      { clientId: c.id, name: "Campera cordura touring", priceArs: 240000, stock: 6, minStock: 2, talles: { M: 2, L: 2, XL: 2 } },
      { clientId: c.id, name: "Aceite Motul 5100 15W50", priceArs: 28000, stock: 24, minStock: 6 },
      { clientId: c.id, name: "Guantes proteccion carbono", priceArs: 65000, stock: 3, minStock: 4 },
    ],
  });

  // Caja: cuentas, costos fijos, movimientos y un arqueo cerrado que cuadró
  const efectivo = await db.account.create({
    data: { clientId: c.id, name: "Efectivo", kind: "efectivo", currency: "ARS", balance: 350000 },
  });
  await db.account.createMany({
    data: [
      { clientId: c.id, name: "Banco Galicia", kind: "banco", currency: "ARS", balance: 4200000 },
      { clientId: c.id, name: "Dólares", kind: "dolares", currency: "USD", balance: 1500 },
    ],
  });
  await db.costoFijo.createMany({
    data: [
      { clientId: c.id, concepto: "Alquiler local", montoArs: 950000, orden: 0 },
      { clientId: c.id, concepto: "Sueldos (2 mecánicos)", montoArs: 2400000, orden: 1 },
      { clientId: c.id, concepto: "Luz + gas + internet", montoArs: 180000, orden: 2 },
    ],
  });
  await db.cashMovement.createMany({
    data: [
      { clientId: c.id, kind: "venta", concept: "Seña Yamaha FZ", amountArs: 500000, method: "efectivo", date: fecha(-5, 11), accountId: efectivo.id },
      { clientId: c.id, kind: "venta", concept: "Service Wave (seña)", amountArs: 50000, method: "efectivo", date: fecha(0, 10), accountId: efectivo.id },
      { clientId: c.id, kind: "venta", concept: "Repuestos mostrador", amountArs: 93000, method: "mp", date: fecha(0, 12) },
      { clientId: c.id, kind: "gasto", concept: "Proveedor repuestos", amountArs: 210000, method: "transferencia", date: fecha(-1, 16) },
    ],
  });
  await db.cajaDia.create({
    data: {
      clientId: c.id,
      fecha: dia(-1),
      usuario: "Bahía Motos",
      cerradaEl: fecha(-1, 20),
      saldos: {
        create: [
          { moneda: "ARS", saldoInicial: 200000, ingresos: 550000, egresos: 0, contado: 750000, diferencia: 0 },
        ],
      },
    },
  });

  // Para hoy: mensajes armados
  await db.outreachTarea.createMany({
    data: [
      { clientId: c.id, tipo: "trabajo-listo", contactId: contactos[2].id, nombre: "Jorge Ávila", telefono: "2914998877", mensaje: "Hola Jorge! Tu Honda Wave 110 ya está lista para retirar 🙌 Total: $115.000. Te esperamos.", fechaProgramada: dia(0) },
      { clientId: c.id, tipo: "seguimiento-consulta", contactId: contactos[4].id, nombre: "Raúl Ortega", telefono: "2914771122", mensaje: "Hola Raúl! Te escribimos de Bahía Motos: hace unos días nos consultaste y no queremos dejarte colgado. ¿Seguís interesado? 🙌", fechaProgramada: dia(0) },
    ],
  });

  console.log("✅ bahiamotos — ventas+taller+talles+caja (usuario: bahiamotos / bahiamotos2026)");
}

// ────────────────────────────────────────────────────────────
async function escuelaOlas() {
  const c = await crearBase({
    slug: "escuelaolas",
    name: "Escuela Olas del Sur",
    rubro: "escuela deportiva de surf y kite",
    primary: "#128FCC",
    accent: "#8DC63F",
    modules: ["crm", "turnos", "caja", "sitio"],
  });

  // Instructores como recursos
  const insta = await db.employee.create({ data: { clientId: c.id, name: "Cami Torres", role: "Instructora de surf", active: true } });
  const instb = await db.employee.create({ data: { clientId: c.id, name: "Nico Funes", role: "Instructor de kite", active: true } });

  // Disponibilidad Lun-Sáb 9-13 y 15-18
  const avail: object[] = [];
  for (const d of [1, 2, 3, 4, 5, 6]) {
    avail.push({ clientId: c.id, weekday: d, startTime: "09:00", endTime: "13:00", slotMinutes: 60 });
    avail.push({ clientId: c.id, weekday: d, startTime: "15:00", endTime: "18:00", slotMinutes: 60 });
  }
  await db.availability.createMany({ data: avail as never });

  // Alumnos + turnos esta semana (hoy, mañana, pasado) en varios estados
  const alumnos: [string, string][] = [
    ["Valentina Ríos", "2914001122"],
    ["Tomás Aguirre", "2914223344"],
    ["Josefina Paz", "2915667788"],
    ["Bruno Salas", "2914889900"],
  ];
  const cts = [];
  for (const [name, phone] of alumnos) {
    cts.push(
      await db.contact.create({
        data: { clientId: c.id, name, phone, stage: "cliente", temperatura: "tibio", source: "auto-agendado", lastTouchAt: fecha(-1) },
      })
    );
  }
  const turnos: [number, number, string, string, string][] = [
    [0, 10, "CONFIRMED", "Clase de surf inicial", insta.id],
    [0, 15, "PENDING", "Clase de kite nivel 2", instb.id],
    [1, 9, "CONFIRMED", "Clase de surf intermedio", insta.id],
    [1, 11, "CONFIRMED", "Clase de kite inicial", instb.id],
    [2, 16, "PENDING", "Clase de surf inicial", insta.id],
  ];
  for (let i = 0; i < turnos.length; i++) {
    const [off, hora, status, title, empId] = turnos[i];
    const ct = cts[i % cts.length];
    const startsAt = fecha(off, hora);
    await db.appointment.create({
      data: {
        clientId: c.id,
        contactId: ct.id,
        employeeId: empId,
        title,
        startsAt,
        endsAt: new Date(startsAt.getTime() + 60 * 60000),
        status: status as never,
        source: "auto-agendado",
      },
    });
  }

  // Lista de espera para el sábado
  await db.listaEspera.createMany({
    data: [
      { clientId: c.id, fecha: dia(3), nombre: "Martina Vega", telefono: "2914334455", estado: "ESPERANDO" },
      { clientId: c.id, fecha: dia(3), nombre: "Pedro Lamas", telefono: "2915001199", estado: "ESPERANDO" },
    ],
  });

  // Caja simple: costos + movimientos + arqueo de ayer con diferencia (para mostrar el rojo)
  await db.costoFijo.createMany({
    data: [
      { clientId: c.id, concepto: "Alquiler galpón + depósito", montoArs: 480000, orden: 0 },
      { clientId: c.id, concepto: "Seguro de alumnos", montoArs: 120000, orden: 1 },
    ],
  });
  await db.cashMovement.createMany({
    data: [
      { clientId: c.id, kind: "venta", concept: "Clase de surf x2", amountArs: 90000, method: "efectivo", date: fecha(0, 11) },
      { clientId: c.id, kind: "venta", concept: "Pack 4 clases kite", amountArs: 260000, method: "mp", date: fecha(-1, 12) },
    ],
  });
  await db.cajaDia.create({
    data: {
      clientId: c.id,
      fecha: dia(-1),
      usuario: "Escuela Olas del Sur",
      cerradaEl: fecha(-1, 19),
      saldos: {
        create: [{ moneda: "ARS", saldoInicial: 50000, ingresos: 90000, egresos: 0, contado: 135000, diferencia: -5000 }],
      },
    },
  });

  // Mensajes de hoy: recordatorios de los turnos de mañana
  await db.outreachTarea.createMany({
    data: [
      { clientId: c.id, tipo: "recordatorio-turno", contactId: cts[2].id, nombre: "Josefina Paz", telefono: "2915667788", mensaje: "Hola Josefina! Te recordamos tu clase de surf de mañana a las 09:00 h en Escuela Olas del Sur. ¿Confirmás? 🙌", fechaProgramada: dia(0) },
      { clientId: c.id, tipo: "recordatorio-turno", contactId: cts[3].id, nombre: "Bruno Salas", telefono: "2914889900", mensaje: "Hola Bruno! Te recordamos tu clase de kite de mañana a las 11:00 h en Escuela Olas del Sur. ¿Confirmás? 🙌", fechaProgramada: dia(0) },
    ],
  });

  console.log("✅ escuelaolas — turnos+instructores+espera+caja (usuario: escuelaolas / escuelaolas2026)");
}

// ────────────────────────────────────────────────────────────
async function clubPiston() {
  const c = await crearBase({
    slug: "clubpiston",
    name: "Club Pistón",
    rubro: "club de motos y eventos deportivos",
    primary: "#E84E1B",
    accent: "#F4C941",
    modules: ["crm", "eventos", "caja", "sitio"],
  });

  const evento = await db.evento.create({
    data: {
      clientId: c.id,
      nombre: "3ª Gymkhana del Pistón",
      fecha: dia(8),
      lugar: "Predio Ferial, Bahía Blanca",
      categorias: ["Clásica", "Moderna", "Libre"],
      cupo: 60,
      inscripcionesAbiertas: true,
      activo: true,
    },
  });

  const comps: [number, string, string, string, [number, number, boolean][]][] = [
    [7, "Diego Manrique", "2914010101", "Clásica", [[52340, 2, false], [49810, 0, false]]],
    [11, "Ana Clara Solís", "2914020202", "Moderna", [[47230, 0, false]]],
    [23, "Franco Ledesma", "2914030303", "Libre", [[51000, 3, false], [50120, 5, false]]],
    [42, "Mora Castelli", "2914040404", "Moderna", [[48990, 2, false]]],
    [77, "Julián Prieto", "2914050505", "Clásica", [[60110, 0, true]]],
    [99, "Rita Fuentes", "2914060606", "Libre", []],
  ];
  for (const [numero, nombre, telefono, categoria, intentosRaw] of comps) {
    await db.competidor.create({
      data: {
        eventoId: evento.id,
        numero,
        nombre,
        telefono,
        categoria,
        fuente: "publica",
        intentos: intentosRaw.map(([ms, penalSeg, dsq]) => ({ ms, penalSeg, dsq })),
      },
    });
    await db.contact.create({
      data: { clientId: c.id, name: nombre, phone: telefono, stage: "cliente", source: "evento", lastTouchAt: fecha(-1) },
    });
  }

  await db.costoFijo.createMany({
    data: [
      { clientId: c.id, concepto: "Sede social (alquiler)", montoArs: 300000, orden: 0 },
      { clientId: c.id, concepto: "Seguro de eventos", montoArs: 90000, orden: 1 },
    ],
  });
  await db.cashMovement.createMany({
    data: [
      { clientId: c.id, kind: "venta", concept: "Inscripciones gymkhana x6", amountArs: 180000, method: "mp", date: fecha(-2, 12) },
      { clientId: c.id, kind: "gasto", concept: "Conos y señalización", amountArs: 45000, method: "efectivo", date: fecha(-3, 15) },
    ],
  });

  console.log("✅ clubpiston — evento con cronómetro y ranking (usuario: clubpiston / clubpiston2026)");
}

async function main() {
  console.log("🌱 Demos profundas E3…");
  await bahiaMotos();
  await escuelaOlas();
  await clubPiston();
  console.log("🌊 Listo: bahiamotos · escuelaolas · clubpiston");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
