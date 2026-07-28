/**
 * RI CARS AUTOMOTORES — tenant real (concesionaria multimarca de Bahía Blanca).
 * Crea: tenant (template "concesionaria") + user, Finanzas (cuentas + categorías),
 * los 74 vehículos limpios del scrape (fotos reales en Cloudinary, vistas reales),
 * 12 mandatos/boletos de ejemplo (con ventas en Finanzas), 8 consultas (+ CRM),
 * publicaciones IG/ML demo y procesos.
 * Limpieza de datos del scrape: precios placeholder (1.111 / 1.111.111.111.111)
 * → null ("Consultar precio"), "Baic Baic" → BAIC, trims, dedup Ford Territory.
 * Idempotente: borra y re-crea el slug ricars. NO toca otros tenants NI crea
 * leads en el CRM de Cauce (el lead de Ricars ya existe, cargado a mano).
 * Uso: npx tsx --env-file=.env scripts/seed-ricars.ts
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { readFileSync } from "node:fs";
import { procesosParaRubro } from "../src/lib/procesos-catalogo";

const db = new PrismaClient();

const DATA_DIR =
  "/private/tmp/claude-501/-Users-juanfri-Documents-CLAUDE-CODE-WEB-NUEVA-MOTOS-FERNANDEZ/e2daaa89-dbe3-496d-88e6-e463232ff2e2/scratchpad/ricars";

type VehiculoJson = {
  slug: string;
  marca: string;
  modelo: string;
  version: string | null;
  anio: number;
  kilometros: number;
  precioUsd: number | null;
  precioArs: number | null;
  moneda: string;
  condicion: string;
  transmision: string | null;
  combustible: string | null;
  color: string | null;
  tipo: string;
  motor: string | null;
  destacado: boolean;
  oferta: boolean;
  vistas: number;
  descripcion: string | null;
  creado: string;
  fotos: { cloudinary: string }[];
};

type MarcaJson = {
  nombre: string;
  eslogan: string;
  claim: string;
  logo: { principal: { cloudinary: string }; fondoNegro: { cloudinary: string } };
  contacto: {
    direcciones: { texto: string; maps: string }[];
    telefonos: string[];
    email: string;
    horarios: string;
    dueno: string;
  };
  redes: { instagram: string; facebook: string; mercadolibre: string };
  serviciosFooter: string[];
  nosotros: {
    historia: string;
    numeros: { valor: string; label: string }[];
    valores?: string[];
  };
};

// RNG determinístico (mismo seed → mismos datos demo).
let semilla = 20260728;
function rnd(): number {
  semilla = (semilla * 1103515245 + 12345) % 2 ** 31;
  return semilla / 2 ** 31;
}
const entre = (min: number, max: number) => Math.floor(rnd() * (max - min + 1)) + min;
const elegir = <T,>(arr: T[]): T => arr[Math.floor(rnd() * arr.length)];

// ── Limpieza de datos del scrape ──────────────────────────────────────────

function esPlaceholder(moneda: string, precio: number | null): boolean {
  if (precio == null) return true;
  if (moneda === "USD") return precio < 2000 || precio > 500_000;
  return precio < 1_000_000;
}

function limpiarVehiculo(v: VehiculoJson) {
  let marca = (v.marca ?? "").trim();
  let modelo = (v.modelo ?? "").trim();
  let version = (v.version ?? "")?.trim() || null;

  // "Merces Benz" → "Mercedes-Benz"
  if (/^merces\s*benz$/i.test(marca)) marca = "Mercedes-Benz";
  // "Baic Baic BJ60" → marca BAIC, modelo BJ60
  if (/^baic$/i.test(marca)) {
    marca = "BAIC";
    if (/^baic$/i.test(modelo) && version) {
      modelo = version;
      version = null;
    }
  }
  // Modelo en mayúsculas gritadas tipo "TERRITORY " → "Territory"
  if (modelo === modelo.toUpperCase() && modelo.length > 3) {
    modelo = modelo.charAt(0) + modelo.slice(1).toLowerCase();
  }

  const precioRaw = v.moneda === "USD" ? v.precioUsd : v.precioArs;
  const precio = esPlaceholder(v.moneda, precioRaw) ? null : precioRaw;

  // Km placeholder en 0km (1111) → 0
  const km = v.condicion === "0km" && v.kilometros === 1111 ? 0 : Math.max(0, v.kilometros ?? 0);

  return {
    slug: v.slug,
    marca,
    modelo,
    version,
    anio: v.anio,
    km,
    precio,
    moneda: v.moneda === "USD" ? "USD" : "ARS",
    condicion: v.condicion === "0km" ? "0km" : "usado",
    tipo: (v.tipo ?? "sedan").trim(),
    transmision: v.transmision?.trim() || null,
    combustible: v.combustible?.trim() || null,
    color: v.color?.trim() || null,
    motor: v.motor?.trim() || null,
    destacado: Boolean(v.destacado),
    oferta: Boolean(v.oferta),
    vistas: Math.max(0, v.vistas ?? 0),
    descripcion: v.descripcion?.trim() || null,
    fotos: (v.fotos ?? []).map((f) => f.cloudinary).filter(Boolean),
    ingresadoEl: new Date(v.creado),
  };
}

async function limpiar(slug: string) {
  const c = await db.client.findUnique({ where: { slug } });
  if (!c) return;
  // El lead de Ricars en el CRM de Cauce se preserva (queda desvinculado).
  await db.lead.updateMany({ where: { clientId: c.id }, data: { clientId: null } });
  await db.project.updateMany({ where: { clientId: c.id }, data: { clientId: null } });
  await db.user.deleteMany({ where: { clientId: c.id } });
  await db.client.delete({ where: { id: c.id } }); // cascada borra todo lo Conce*
}

async function main() {
  const inventario: VehiculoJson[] = JSON.parse(
    readFileSync(`${DATA_DIR}/inventario.json`, "utf8")
  );
  const marca: MarcaJson = JSON.parse(readFileSync(`${DATA_DIR}/marca.json`, "utf8"));
  console.log(`Leídos ${inventario.length} vehículos del scrape`);

  await limpiar("ricars");

  const rubro = "Concesionaria de autos multimarca — 0KM y usados (Bahía Blanca)";
  const client = await db.client.create({
    data: {
      name: "Ri Cars Automotores",
      slug: "ricars",
      rubro,
      pack: "SCALE",
      status: "PROSPECT",
      whatsapp: "5492915038204",
      email: marca.contacto.email,
      contactName: marca.contacto.dueno,
      phone: marca.contacto.telefonos[0] ?? null,
      modules: ["crm", "caja", "sitio"],
      branding: {
        displayName: "Ri Cars Automotores",
        primary: "#D18E00",
        accent: "#B7891B",
        logo: marca.logo.principal.cloudinary,
        estilo: { esquinas: "suaves", nav: "izquierda", densidad: "comoda", grupos: "abierto" },
      },
      settings: {
        template: "concesionaria",
        eslogan: marca.eslogan,
        claim: marca.claim,
        instagram: "ricar_s_automotores",
        facebook: marca.redes.facebook,
        mercadolibre: marca.redes.mercadolibre,
        horarios: "Lun a Sáb de 9 a 19 hs · Domingos con cita previa",
        whatsapps: ["5492915038204", "5492914683337"],
        sucursales: [
          {
            direccion: marca.contacto.direcciones[0]?.texto ?? "Hipólito Yrigoyen 3754, Bahía Blanca",
            maps: marca.contacto.direcciones[0]?.maps,
            whatsapp: "5492915038204",
          },
          {
            direccion: marca.contacto.direcciones[1]?.texto ?? "Hipólito Yrigoyen 3700, Bahía Blanca",
            maps: marca.contacto.direcciones[1]?.maps,
            whatsapp: "5492914683337",
          },
        ],
        nosotros: {
          historia: marca.nosotros.historia,
          numeros: marca.nosotros.numeros,
          valores: marca.nosotros.valores ?? [
            "🤝 Transparencia en cada operación",
            "🔍 Cada usado revisado antes de entrar al salón",
            "📄 Gestoría y transferencia sin vueltas",
          ],
        },
        serviciosFooter: marca.serviciosFooter,
        logoOscuro: marca.logo.fondoNegro.cloudinary,
      },
    },
  });
  console.log(`Tenant creado: ${client.id}`);

  await db.user.create({
    data: {
      username: "ricars",
      name: "Ri Cars Automotores",
      role: "CLIENT",
      osRole: "dueno",
      clientId: client.id,
      passwordHash: await bcrypt.hash("ricars2026", 10),
    },
  });

  // ── Procesos base del rubro ──
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

  // ── Finanzas: cuentas + categorías ──
  const cuentaCaja = await db.account.create({
    data: { clientId: client.id, name: "Caja pesos", kind: "efectivo", currency: "ARS", saldoInicial: 850_000, orden: 0 },
  });
  const cuentaBanco = await db.account.create({
    data: { clientId: client.id, name: "Banco", kind: "banco", currency: "ARS", saldoInicial: 4_200_000, orden: 1 },
  });
  const cuentaUsd = await db.account.create({
    data: { clientId: client.id, name: "Dólares", kind: "dolares", currency: "USD", saldoInicial: 12_000, orden: 2 },
  });

  const catIngreso = [
    "Venta de vehículos",
    "Señas y anticipos",
    "Comisiones por consignación",
    "Otros ingresos",
  ];
  const catGasto = [
    "Compra de vehículos",
    "Gestoría y transferencias",
    "Alquiler",
    "Sueldos",
    "Impuestos",
    "Publicidad",
    "Servicios",
    "Otros gastos",
  ];
  await db.categoriaFinanciera.createMany({
    data: [
      ...catIngreso.map((nombre, i) => ({ clientId: client.id, nombre, tipo: "INGRESO", orden: i })),
      ...catGasto.map((nombre, i) => ({ clientId: client.id, nombre, tipo: "GASTO", orden: i })),
    ],
  });

  // ── Vehículos: limpiar + dedup + crear ──
  const limpios = inventario.map(limpiarVehiculo);

  // Dedup (los 2 Ford Territory idénticos): clave marca|modelo|version|anio|km|precio
  const vistos = new Map<string, (typeof limpios)[number]>();
  for (const v of limpios) {
    const clave = [v.marca.toLowerCase(), v.modelo.toLowerCase(), (v.version ?? "").toLowerCase(), v.anio, v.km, v.precio ?? "null", v.moneda].join("|");
    const previo = vistos.get(clave);
    if (previo) {
      // Nos quedamos con uno solo, sumando lo mejor de ambos.
      previo.vistas = Math.max(previo.vistas, v.vistas);
      if (v.fotos.length > previo.fotos.length) previo.fotos = v.fotos;
      console.log(`Dedup: ${v.marca} ${v.modelo} ${v.anio} (${v.slug})`);
      continue;
    }
    vistos.set(clave, v);
  }
  const finales = [...vistos.values()];

  // Slugs únicos (por si el dedup dejó slugs -1 huérfanos no hay problema).
  const slugsUsados = new Set<string>();
  for (const v of finales) {
    let s = v.slug;
    for (let n = 2; slugsUsados.has(s); n++) s = `${v.slug}-${n}`;
    slugsUsados.add(s);
    v.slug = s;
  }

  await db.conceVehiculo.createMany({
    data: finales.map((v) => ({
      clientId: client.id,
      slug: v.slug,
      marca: v.marca,
      modelo: v.modelo,
      version: v.version,
      anio: v.anio,
      km: v.km,
      precio: v.precio,
      moneda: v.moneda,
      condicion: v.condicion,
      tipo: v.tipo,
      transmision: v.transmision,
      combustible: v.combustible,
      color: v.color,
      motor: v.motor,
      descripcion: v.descripcion,
      fotos: v.fotos,
      destacado: v.destacado,
      oferta: v.oferta,
      estado: "disponible",
      visitas: v.vistas,
      ingresadoEl: v.ingresadoEl,
      createdAt: v.ingresadoEl,
    })),
  });
  const vehiculos = await db.conceVehiculo.findMany({ where: { clientId: client.id } });
  console.log(`Vehículos creados: ${vehiculos.length} (fotos: ${finales.reduce((s, v) => s + v.fotos.length, 0)})`);

  // ── 12 mandatos/boletos de ejemplo ──
  const NOMBRES = [
    "Marcos Etcheverry", "Silvina Roldán", "Diego Manfredi", "Carla Suárez",
    "Rubén Aguilera", "Natalia Pared", "Gustavo Iriarte", "Vanina Lucero",
    "Federico Bassi", "Lorena Campos", "Oscar Bilbao", "Mariana Quiroga",
  ];
  const CALLES = ["Alsina", "Zelarrayán", "Fuerte Argentino", "Casanova", "Sarmiento", "Brown"];
  const DOMINIOS = ["AC512BF", "AE904KL", "AF338PQ", "AD771WS", "AG105TR", "OPS443", "AB662MN", "AE217CV"];
  const ahora = Date.now();

  const conPrecio = vehiculos.filter((v) => v.precio != null);
  const usadosStock = conPrecio.filter((v) => v.condicion === "usado");

  const docsCompletos = (okHasta: number) =>
    [
      "Título del automotor",
      "Cédula verde",
      "Verificación policial",
      "Informe de dominio",
      "Libre deuda de patentes",
      "Libre deuda de infracciones",
      "Formulario 08 firmado",
      "VTV vigente",
    ].map((item, i) => ({ item, ok: i < okHasta }));

  // 6 MANDATOS: 4 vigentes sobre autos del stock (consignados) + 2 concretados históricos.
  let nMandato = 0;
  const mandatosVigentes = usadosStock.slice(0, 4);
  for (const v of mandatosVigentes) {
    nMandato++;
    await db.conceOperacion.create({
      data: {
        clientId: client.id,
        tipo: "MANDATO",
        numero: nMandato,
        fecha: new Date(ahora - entre(5, 60) * 86_400_000),
        nombre: NOMBRES[nMandato - 1],
        dni: String(entre(20_000_000, 44_000_000)),
        domicilio: `${elegir(CALLES)} ${entre(100, 3400)}, Bahía Blanca`,
        telefono: `291${entre(4000000, 5999999)}`,
        vehiculoId: v.id,
        dominio: DOMINIOS[nMandato - 1],
        documentacion: docsCompletos(entre(4, 8)),
        precio: v.precio,
        moneda: v.moneda,
        comisionPct: elegir([4, 5, 6]),
        formaPago: "contado",
        condiciones:
          "El mandante autoriza a Ri Cars Automotores a exhibir y gestionar la venta del vehículo detallado. La comisión se percibe al concretarse la operación.",
        estado: "VIGENTE",
      },
    });
  }
  const mandatosConcretados = [
    { texto: "Chevrolet Onix LTZ 2021", precio: 18_500_000, moneda: "ARS", com: 5 },
    { texto: "Toyota Etios XLS 2018", precio: 14_200_000, moneda: "ARS", com: 5 },
  ];
  for (const m of mandatosConcretados) {
    nMandato++;
    await db.conceOperacion.create({
      data: {
        clientId: client.id,
        tipo: "MANDATO",
        numero: nMandato,
        fecha: new Date(ahora - entre(20, 80) * 86_400_000),
        nombre: NOMBRES[nMandato - 1],
        dni: String(entre(20_000_000, 44_000_000)),
        domicilio: `${elegir(CALLES)} ${entre(100, 3400)}, Bahía Blanca`,
        telefono: `291${entre(4000000, 5999999)}`,
        vehiculoTexto: m.texto,
        dominio: elegir(DOMINIOS),
        documentacion: docsCompletos(8),
        precio: m.precio,
        moneda: m.moneda,
        comisionPct: m.com,
        formaPago: "contado",
        estado: "CONCRETADA",
      },
    });
  }

  // 6 BOLETOS: 2 vigentes con seña (reservan el auto) + 4 concretados este mes (ventas).
  let nBoleto = 0;
  const boletosVigentes = usadosStock.slice(4, 6);
  for (const v of boletosVigentes) {
    nBoleto++;
    await db.conceOperacion.create({
      data: {
        clientId: client.id,
        tipo: "BOLETO",
        numero: nBoleto,
        fecha: new Date(ahora - entre(1, 8) * 86_400_000),
        nombre: NOMBRES[5 + nBoleto],
        dni: String(entre(20_000_000, 44_000_000)),
        domicilio: `${elegir(CALLES)} ${entre(100, 3400)}, Bahía Blanca`,
        telefono: `291${entre(4000000, 5999999)}`,
        vehiculoId: v.id,
        documentacion: docsCompletos(entre(5, 8)),
        precio: v.precio,
        moneda: v.moneda,
        sena: Math.round((v.precio ?? 0) * 0.1),
        formaPago: elegir(["transferencia", "permuta + efectivo"]),
        condiciones: "Seña del 10%. Saldo contra entrega del vehículo con la transferencia iniciada.",
        estado: "VIGENTE",
      },
    });
    await db.conceVehiculo.update({ where: { id: v.id }, data: { estado: "reservado" } });
  }

  const inicioMes = new Date();
  inicioMes.setDate(1);
  const boletosConcretados = [
    { texto: "Peugeot 208 Allure 2020", precio: 19_800_000, moneda: "ARS", cuenta: cuentaBanco },
    { texto: "Ford EcoSport SE 2019", precio: 17_500_000, moneda: "ARS", cuenta: cuentaBanco },
    { texto: "Volkswagen Gol Trend 2017", precio: 12_300_000, moneda: "ARS", cuenta: cuentaCaja },
    { texto: "Toyota Hilux SRV 2020", precio: 38_500, moneda: "USD", cuenta: cuentaUsd },
  ];
  for (const b of boletosConcretados) {
    nBoleto++;
    const fecha = new Date(
      Math.max(inicioMes.getTime() + 86_400_000, ahora - entre(1, 20) * 86_400_000)
    );
    const op = await db.conceOperacion.create({
      data: {
        clientId: client.id,
        tipo: "BOLETO",
        numero: nBoleto,
        fecha,
        updatedAt: fecha,
        nombre: NOMBRES[5 + nBoleto],
        dni: String(entre(20_000_000, 44_000_000)),
        domicilio: `${elegir(CALLES)} ${entre(100, 3400)}, Bahía Blanca`,
        telefono: `291${entre(4000000, 5999999)}`,
        vehiculoTexto: b.texto,
        dominio: elegir(DOMINIOS),
        documentacion: docsCompletos(8),
        precio: b.precio,
        moneda: b.moneda,
        sena: 0,
        formaPago: b.cuenta === cuentaCaja ? "contado" : "transferencia",
        estado: "CONCRETADA",
      },
    });
    // Venta → movimiento en Finanzas (conexión módulo caja).
    await db.cashMovement.create({
      data: {
        clientId: client.id,
        kind: "venta",
        concept: `Venta ${b.texto} — ${op.nombre} (Boleto #${op.numero})`,
        categoria: "Venta de vehículos",
        amountArs: b.precio,
        moneda: b.cuenta.currency,
        method: b.cuenta === cuentaCaja ? "efectivo" : "transferencia",
        accountId: b.cuenta.id,
        date: fecha,
      },
    });
  }
  console.log(`Operaciones creadas: ${nMandato} mandatos + ${nBoleto} boletos`);

  // Algunos gastos para que Finanzas respire.
  const gastos = [
    { concept: "Alquiler salón Hipólito Yrigoyen", categoria: "Alquiler", monto: 1_450_000, dias: 25, cuenta: cuentaBanco },
    { concept: "Gestoría transferencias del mes", categoria: "Gestoría y transferencias", monto: 380_000, dias: 9, cuenta: cuentaBanco },
    { concept: "Pauta Instagram + cartelería", categoria: "Publicidad", monto: 250_000, dias: 12, cuenta: cuentaBanco },
    { concept: "Lavadero y detailing unidades", categoria: "Servicios", monto: 180_000, dias: 4, cuenta: cuentaCaja },
  ];
  for (const g of gastos) {
    await db.cashMovement.create({
      data: {
        clientId: client.id,
        kind: "gasto",
        concept: g.concept,
        categoria: g.categoria,
        amountArs: g.monto,
        moneda: g.cuenta.currency,
        method: g.cuenta === cuentaCaja ? "efectivo" : "transferencia",
        accountId: g.cuenta.id,
        date: new Date(ahora - g.dias * 86_400_000),
      },
    });
  }

  // Recalcular balances cache.
  for (const cuenta of [cuentaCaja, cuentaBanco, cuentaUsd]) {
    const movs = await db.cashMovement.findMany({
      where: { clientId: client.id, accountId: cuenta.id },
      select: { kind: true, amountArs: true },
    });
    const neto = movs.reduce((s, m) => s + (m.kind === "gasto" ? -m.amountArs : m.amountArs), 0);
    await db.account.update({
      where: { id: cuenta.id },
      data: { balance: cuenta.saldoInicial + neto },
    });
  }

  // ── 8 consultas (+ contactos en el CRM del tenant) ──
  const masVistos = [...vehiculos].sort((a, b) => b.visitas - a.visitas);
  const consultas = [
    { nombre: "Javier Domínguez", contacto: "2914556677", mensaje: "Hola! ¿La Frontier sigue disponible? ¿Toman mi Ranger 2016 en parte de pago?", estado: "NUEVA", origen: "web", vehiculo: masVistos[0] },
    { nombre: "Paula Giacobbe", contacto: "2915889900", mensaje: "¿Qué anticipo necesito para llevarme un usado financiado? Tengo hasta 10 millones.", estado: "NUEVA", origen: "web", vehiculo: null },
    { nombre: "Matías Le Bihan", contacto: "2914112233", mensaje: "Buenas! Busco algo familiar hasta 30 millones, ¿qué me recomiendan del stock?", estado: "NUEVA", origen: "chatbot", vehiculo: null },
    { nombre: "Rocío Fernández", contacto: "2916773344", mensaje: "¿El 0km se entrega patentado? ¿Cuánto demora?", estado: "NUEVA", origen: "web", vehiculo: masVistos[3] ?? null },
    { nombre: "Hernán Salaberry", contacto: "2915440011", mensaje: "Quiero vender mi Amarok 2019, ¿trabajan consignación? ¿Qué comisión cobran?", estado: "RESPONDIDA", origen: "web", vehiculo: null },
    { nombre: "Luciana Petrucci", contacto: "luciana.petrucci@gmail.com", mensaje: "¿Puedo ir a ver el auto el sábado a la mañana? ¿Hace falta turno?", estado: "RESPONDIDA", origen: "web", vehiculo: masVistos[5] ?? null },
    { nombre: "Ariel Maidana", contacto: "2914998855", mensaje: "¿Aceptan permuta por una moto + efectivo?", estado: "RESPONDIDA", origen: "chatbot", vehiculo: masVistos[8] ?? null },
    { nombre: "Sofía Arruti", contacto: "2915223399", mensaje: "Hola, ¿el precio publicado es contado? ¿Hay diferencia con tarjeta?", estado: "RESPONDIDA", origen: "web", vehiculo: masVistos[10] ?? null },
  ];
  for (const c of consultas) {
    await db.conceConsulta.create({
      data: {
        clientId: client.id,
        nombre: c.nombre,
        contacto: c.contacto,
        mensaje: c.mensaje,
        vehiculoId: c.vehiculo?.id ?? null,
        origen: c.origen,
        estado: c.estado,
        createdAt: new Date(ahora - entre(0, 9) * 86_400_000 - entre(1, 80_000_000)),
      },
    });
    await db.contact.create({
      data: {
        clientId: client.id,
        name: c.nombre,
        phone: c.contacto.includes("@") ? null : c.contacto,
        email: c.contacto.includes("@") ? c.contacto : null,
        source: c.origen === "chatbot" ? "chatbot web" : "web concesionaria",
        stage: "nuevo",
        temperatura: c.vehiculo ? "caliente" : "tibio",
        notes: `${c.vehiculo ? `Consulta por: ${c.vehiculo.marca} ${c.vehiculo.modelo} ${c.vehiculo.anio}\n` : ""}${c.mensaje}`,
        lastTouchAt: new Date(),
      },
    });
  }
  console.log(`Consultas creadas: ${consultas.length}`);

  // ── Publicaciones demo: 2 IG + 1 ML ──
  const destacadosConFoto = vehiculos
    .filter((v) => v.destacado && Array.isArray(v.fotos) && (v.fotos as string[]).length > 0)
    .slice(0, 3);
  const paraPublicar = destacadosConFoto.length >= 3 ? destacadosConFoto : masVistos.slice(0, 3);
  const maniana11 = new Date(ahora + 86_400_000);
  maniana11.setUTCHours(14, 0, 0, 0); // 11:00 ART
  const captionDe = (v: (typeof vehiculos)[number]) =>
    [
      `${v.marca} ${v.modelo}${v.version ? ` ${v.version}` : ""} ${v.anio} ${v.condicion === "0km" ? "0KM 🆕" : ""}`.trim(),
      v.condicion === "0km" ? "Entrega inmediata" : `${v.km.toLocaleString("es-AR")} km`,
      v.precio ? (v.moneda === "USD" ? `US$ ${v.precio.toLocaleString("es-AR")}` : `$ ${v.precio.toLocaleString("es-AR")}`) : "Consultar precio",
      "",
      "📍 Hipólito Yrigoyen 3754, Bahía Blanca",
      "📲 291 503-8204",
      "",
      "#ricars #bahiablanca #autos #usados #0km",
    ].join("\n");

  await db.concePublicacion.create({
    data: {
      clientId: client.id,
      vehiculoId: paraPublicar[0].id,
      canal: "instagram",
      caption: captionDe(paraPublicar[0]),
      fotos: (paraPublicar[0].fotos as string[]).slice(0, 10),
      programadaPara: maniana11,
      estado: "PROGRAMADA",
    },
  });
  await db.concePublicacion.create({
    data: {
      clientId: client.id,
      vehiculoId: paraPublicar[1].id,
      canal: "instagram",
      caption: captionDe(paraPublicar[1]),
      fotos: (paraPublicar[1].fotos as string[]).slice(0, 10),
      estado: "PUBLICADA",
      publicadaEn: new Date(ahora - 3 * 86_400_000),
    },
  });
  await db.concePublicacion.create({
    data: {
      clientId: client.id,
      vehiculoId: paraPublicar[2].id,
      canal: "mercadolibre",
      caption: `${captionDe(paraPublicar[2])}\n\n${paraPublicar[2].descripcion ?? ""}`.trim(),
      fotos: (paraPublicar[2].fotos as string[]).slice(0, 10),
      estado: "BORRADOR",
    },
  });

  console.log("✅ Seed de Ri Cars listo");
  console.log("   Login OS: ricars / ricars2026 → /os/ricars");
  console.log("   Web: /sitio/ricars");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
