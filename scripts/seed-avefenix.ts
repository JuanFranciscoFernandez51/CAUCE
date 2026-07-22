/**
 * AVE FÉNIX PUBLICIDAD — tenant real desde su Excel (AVE FENIX 2026.xlsx).
 * Crea: tenant + user, 11 pantallas con contratos (slots por repetición),
 * CRM con todos los anunciantes, libro diario completo a Finanzas,
 * cuenta con saldo real, costos fijos y procesos (incluido aviso de cobro 1-5).
 * Idempotente: borra y re-crea el slug avefenix.
 * Uso: npx tsx scripts/seed-avefenix.ts
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { readFileSync } from "node:fs";
import { procesosParaRubro } from "../src/lib/procesos-catalogo";

const db = new PrismaClient();

const DATA_PATH =
  "/private/tmp/claude-501/-Users-juanfri-Documents-CLAUDE-CODE-WEB-NUEVA-MOTOS-FERNANDEZ/e2daaa89-dbe3-496d-88e6-e463232ff2e2/scratchpad/avefenix-data.json";

type Data = {
  diario: { fecha: string; egreso: number; ingreso: number; detalle: string }[];
  ultimoSaldo: number | null;
  activos: { cliente: string; factura: string; ultimoMonto: number }[];
  pantallas: { nombre: string; medidas: string; resolucion: string; clientes: string[] }[];
  agencia: { cliente: string; ultimoMonto: number }[];
};

/** Alias/typos del Excel → nombre canónico. */
const ALIAS: Record<string, string> = {
  "HARL DEALER (TELEFONOS)": "HARD DEALER",
  "HARL DEALER": "HARD DEALER",
  "CENTRO OGFTALMOLOGICO": "CENTRO OFTALMOLOGICO",
  "POR SU POLLO": "POLLERIA PORSUPOLLO",
  "INMOBILIARIA ELIZABET": "INMOBILIARIA ELIZABETH",
};

function canon(nombre: string): string {
  const up = nombre.trim().toUpperCase().replace(/\s+/g, " ");
  return ALIAS[up] ?? up;
}

/** "POLLERIA PORSUPOLLO" → "Pollería Porsupollo" (título simple). */
function titulo(up: string): string {
  return up
    .toLowerCase()
    .split(" ")
    .map((w) => (w.length > 2 ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ")
    .replace(/\b(de|del|la|el|los|y)\b/gi, (m) => m.toLowerCase());
}

/** Datos extra por pantalla: zona + foto local (bajadas de su web). */
const PANTALLA_EXTRA: Record<string, { zona: string; foto?: string }> = {
  "ZELARRAYAN E IRIGOYEN": { zona: "Microcentro · Plaza Rivadavia" },
  "VIEYTES Y RONDEAU": { zona: "Nodo familiar · Teatro Don Bosco" },
  "COLON Y BRUNEL": { zona: "Club Olimpo · Polo industrial" },
  "COLON Y CHILE": { zona: "Acceso · Club Olimpo" },
  "PARCHAPE Y FALUCHO": { zona: "Zona estación", foto: "/avefenix/Parchappefalucho.png" },
  "VIEYTES Y MORENO": { zona: "Corredor Vieytes", foto: "/avefenix/morenoyvieytes.png" },
  "VIEYTES Y MANUEL MOLINA": { zona: "Corredor Vieytes", foto: "/avefenix/VieytesyManuelMolina.png" },
  "ESTOMBA Y RODRIGUEZ": { zona: "Zona norte", foto: "/avefenix/Estomba.png" },
  "VIAMONTE Y JUAN MOLINA": { zona: "Zona residencial", foto: "/avefenix/MolinayViamonte.png" },
  "CHICLANA Y BELGRANO": { zona: "Corredor Chiclana" },
  "AV. DUFAUR Y FARO RECALADA": { zona: "Monte Hermoso", foto: "/avefenix/monte.png" },
};

async function limpiar(slug: string) {
  const c = await db.client.findUnique({ where: { slug } });
  if (!c) return;
  await db.lead.updateMany({ where: { clientId: c.id }, data: { clientId: null } });
  await db.project.updateMany({ where: { clientId: c.id }, data: { clientId: null } });
  await db.user.deleteMany({ where: { clientId: c.id } });
  await db.client.delete({ where: { id: c.id } });
}

async function main() {
  const data: Data = JSON.parse(readFileSync(DATA_PATH, "utf8"));
  await limpiar("avefenix");

  const rubro = "Publicidad DOOH — circuito de pantallas LED";
  const client = await db.client.create({
    data: {
      name: "Ave Fénix Publicidad",
      slug: "avefenix",
      rubro,
      pack: "SCALE",
      status: "ACTIVE",
      mrr: 0,
      phone: "291-4121109",
      whatsapp: "5492914121109",
      email: "info@avefenixleds.com.ar",
      modules: ["crm", "pantallas", "caja", "sitio"],
      branding: {
        displayName: "AVE FÉNIX LEDS",
        primary: "#0DCCF2",
        accent: "#F59E0B",
        logo: "/avefenix/logo.png",
        estilo: { esquinas: "rectas", nav: "izquierda", densidad: "comoda", grupos: "abierto" },
      },
      settings: {
        template: "dooh",
        instagram: "avefenixpublicidad",
        datosNegocio: { direccion: "Bahía Blanca", telefono: "291-4121109" },
        sobre:
          "La red de publicidad digital exterior líder en Bahía Blanca. Circuito de pantallas LED en posiciones estratégicas: microcentro, accesos y zonas residenciales. Conectando marcas con personas, todos los días del año de 7 a 24 h.",
      },
    },
  });

  await db.user.create({
    data: {
      username: "avefenix",
      name: "Ave Fénix Publicidad",
      role: "CLIENT",
      osRole: "dueno",
      clientId: client.id,
      passwordHash: await bcrypt.hash("avefenix2026", 10),
    },
  });

  // ── Procesos (base + aviso de cobro mensual por rubro) ──
  const procesos = procesosParaRubro(rubro);
  await db.proceso.createMany({
    data: procesos.map((p, i) => ({
      clientId: client.id,
      nombre: p.nombre,
      queHace: p.queHace,
      cuando: p.cuando,
      estado: "ACTIVO" as const,
      orden: i,
    })),
  });

  // ── CRM: todos los anunciantes (activos + pantallas + agencia) ──
  const factura = new Map(data.activos.map((a) => [canon(a.cliente), a.factura]));
  const montoActivo = new Map(data.activos.map((a) => [canon(a.cliente), a.ultimoMonto]));
  const agenciaMonto = new Map(data.agencia.map((a) => [canon(a.cliente), a.ultimoMonto]));

  const nombres = new Set<string>();
  for (const a of data.activos) nombres.add(canon(a.cliente));
  for (const p of data.pantallas) for (const c of p.clientes) nombres.add(canon(c));
  for (const a of data.agencia) nombres.add(canon(a.cliente));

  const contactoId = new Map<string, string>();
  for (const up of [...nombres].sort()) {
    const notas: string[] = [];
    const f = factura.get(up);
    if (f && f.toUpperCase() !== "NO") notas.push(`Factura: ${f}`);
    if (f && f.toUpperCase() === "NO") notas.push("Factura: no");
    const ag = agenciaMonto.get(up);
    if (ag) notas.push(`Agencia: $${Math.round(ag).toLocaleString("es-AR")}/mes`);
    const c = await db.contact.create({
      data: {
        clientId: client.id,
        name: titulo(up),
        stage: "cliente",
        source: "importado",
        notes: notas.join(" · ") || null,
      },
    });
    contactoId.set(up, c.id);
  }

  // ── Pantallas + contratos (slots = repeticiones en la columna) ──
  // Monto: el mensual del cliente se reparte en partes iguales entre sus pantallas.
  const pantallasDelCliente = new Map<string, number>();
  for (const p of data.pantallas) {
    const unicos = new Set(p.clientes.map(canon));
    for (const u of unicos) pantallasDelCliente.set(u, (pantallasDelCliente.get(u) ?? 0) + 1);
  }

  let contratos = 0;
  for (let i = 0; i < data.pantallas.length; i++) {
    const p = data.pantallas[i];
    const extra = PANTALLA_EXTRA[p.nombre] ?? { zona: null as unknown as string };
    const pantalla = await db.pantalla.create({
      data: {
        clientId: client.id,
        nombre: titulo(p.nombre)
          .replace(/\bE\b/g, "e")
          .replace(/\bY\b/g, "y"),
        zona: extra.zona ?? null,
        medidas: p.medidas.replace("X", "x").replace("mts", "m") || null,
        resolucion: p.resolucion || null,
        fotoUrl: extra.foto ?? null,
        slotsTotal: 30,
        orden: i,
      },
    });

    // slots por cliente = veces que aparece en la columna
    const conteo = new Map<string, number>();
    for (const nombre of p.clientes) {
      const u = canon(nombre);
      conteo.set(u, (conteo.get(u) ?? 0) + 1);
    }
    for (const [u, slots] of conteo) {
      const total = montoActivo.get(u) ?? 0;
      const enPantallas = pantallasDelCliente.get(u) ?? 1;
      const monto = total > 0 ? Math.round(total / enPantallas) : 0;
      await db.pantallaContrato.create({
        data: {
          clientId: client.id,
          pantallaId: pantalla.id,
          contactId: contactoId.get(u) ?? null,
          slots,
          montoMensual: monto,
          estado: "activo",
          inicio: new Date("2026-03-01T12:00:00-03:00"),
          notas:
            total > 0 && enPantallas > 1
              ? `Abono total $${Math.round(total).toLocaleString("es-AR")}/mes repartido en ${enPantallas} pantallas`
              : total === 0
                ? "Definir monto"
                : null,
        },
      });
      contratos++;
    }
  }

  // ── Finanzas: cuenta con saldo real + libro diario completo ──
  const cuenta = await db.account.create({
    data: {
      clientId: client.id,
      name: "Caja general",
      kind: "efectivo",
      currency: "ARS",
      balance: data.ultimoSaldo ?? 0,
    },
  });

  const movimientos: {
    clientId: string;
    kind: string;
    concept: string;
    amountArs: number;
    date: Date;
    accountId: string;
  }[] = [];
  for (const m of data.diario) {
    const date = new Date(`${m.fecha}T12:00:00-03:00`);
    const concepto = (m.detalle || "").slice(0, 180);
    if (m.ingreso > 0) {
      movimientos.push({
        clientId: client.id,
        kind: "venta",
        concept: concepto || "Ingreso",
        amountArs: m.ingreso,
        date,
        accountId: cuenta.id,
      });
    }
    if (m.egreso > 0) {
      movimientos.push({
        clientId: client.id,
        kind: "gasto",
        concept: concepto || "Gasto",
        amountArs: m.egreso,
        date,
        accountId: cuenta.id,
      });
    }
  }
  await db.cashMovement.createMany({ data: movimientos });

  await db.costoFijo.createMany({
    data: [
      { clientId: client.id, concepto: "Alquiler Alsina", montoArs: 400000, orden: 0 },
      { clientId: client.id, concepto: "EDES (luz de pantallas)", montoArs: 350000, orden: 1 },
      { clientId: client.id, concepto: "Sueldo Iñaki", montoArs: 1100000, orden: 2 },
      { clientId: client.id, concepto: "Internet (pantallas + local)", montoArs: 30000, orden: 3 },
      { clientId: client.id, concepto: "Telefonía", montoArs: 28000, orden: 4 },
    ],
  });

  // Resumen
  const totalPantallas = await db.pantalla.count({ where: { clientId: client.id } });
  const totalContactos = await db.contact.count({ where: { clientId: client.id } });
  const facturacion = await db.pantallaContrato.aggregate({
    where: { clientId: client.id, estado: "activo" },
    _sum: { montoMensual: true },
  });
  console.log(`✅ avefenix creado:`);
  console.log(`   ${totalPantallas} pantallas · ${contratos} contratos · ${totalContactos} contactos`);
  console.log(`   ${movimientos.length} movimientos de caja · saldo $${(data.ultimoSaldo ?? 0).toLocaleString("es-AR")}`);
  console.log(`   Facturación mensual pantallas: $${Math.round(facturacion._sum.montoMensual ?? 0).toLocaleString("es-AR")}`);
  console.log(`   Login: avefenix / avefenix2026`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
