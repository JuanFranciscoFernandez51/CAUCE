/**
 * LA ESTACIÓN DECO & HOME — tenant real (bazar de playa de Monte Hermoso).
 * Crea: tenant (template "bazar") + user, Finanzas (cuentas + categorías),
 * 500 productos del JSON con fotos reales, 25 pedidos vivos (con sus
 * CashMovements), consultas, cuentas de comprador demo, publicaciones IG
 * programadas y procesos.
 * Idempotente: borra y re-crea el slug laestacion. NO toca otros tenants.
 * Uso: npx tsx --env-file=.env scripts/seed-laestacion.ts
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { readFileSync } from "node:fs";
import { procesosParaRubro } from "../src/lib/procesos-catalogo";

const db = new PrismaClient();

const DATA_PATH =
  "/private/tmp/claude-501/-Users-juanfri-Documents-CLAUDE-CODE-WEB-NUEVA-MOTOS-FERNANDEZ/e2daaa89-dbe3-496d-88e6-e463232ff2e2/scratchpad/laestacion/productos-500.json";

const LOGO =
  "https://res.cloudinary.com/dgtlyzyra/image/upload/v1785175613/cauce/laestacion/marca/oylzr0lhpht5drgjinxa.jpg";

const FOTOS = [
  "https://res.cloudinary.com/dgtlyzyra/image/upload/v1785175614/cauce/laestacion/fotos/sswq9nzhxoqy3hhqf86o.jpg",
  "https://res.cloudinary.com/dgtlyzyra/image/upload/v1785175615/cauce/laestacion/fotos/ulnukqurlbrfzvccphjh.jpg",
  "https://res.cloudinary.com/dgtlyzyra/image/upload/v1785175616/cauce/laestacion/fotos/rth6k126hb5ezttattbn.jpg",
  "https://res.cloudinary.com/dgtlyzyra/image/upload/v1785175617/cauce/laestacion/fotos/hv2sd99jvud1mijcjihj.jpg",
  "https://res.cloudinary.com/dgtlyzyra/image/upload/v1785175618/cauce/laestacion/fotos/rjpmrqype0xqodhedv15.jpg",
  "https://res.cloudinary.com/dgtlyzyra/image/upload/v1785175619/cauce/laestacion/fotos/z3srf1pelgctfry3kwbn.jpg",
  "https://res.cloudinary.com/dgtlyzyra/image/upload/v1785175620/cauce/laestacion/fotos/b7ealfalyhsf4yy0syih.jpg",
  "https://res.cloudinary.com/dgtlyzyra/image/upload/v1785175621/cauce/laestacion/fotos/jqnbdfqtgzoyospw87cc.jpg",
  "https://res.cloudinary.com/dgtlyzyra/image/upload/v1785175622/cauce/laestacion/fotos/qb1yfkoccqfeuzpf3i3v.jpg",
  "https://res.cloudinary.com/dgtlyzyra/image/upload/v1785175623/cauce/laestacion/fotos/lqe9iva3sz7albvzxsls.jpg",
  "https://res.cloudinary.com/dgtlyzyra/image/upload/v1785175624/cauce/laestacion/fotos/vqhs1ls3qirpdigwqraz.jpg",
  "https://res.cloudinary.com/dgtlyzyra/image/upload/v1785175625/cauce/laestacion/fotos/v8mcskjs2bkabgawtuxi.jpg",
];

type ProductoJson = {
  nombre: string;
  categoria: string;
  precio: number;
  stock: number;
  destacado: boolean;
  descripcion: string;
};

// RNG determinístico (mismo seed → mismos datos demo).
let semilla = 20260727;
function rnd(): number {
  semilla = (semilla * 1103515245 + 12345) % 2 ** 31;
  return semilla / 2 ** 31;
}
const entre = (min: number, max: number) => Math.floor(rnd() * (max - min + 1)) + min;
const elegir = <T,>(arr: T[]): T => arr[Math.floor(rnd() * arr.length)];

function slugify(nombre: string): string {
  return nombre
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

async function limpiar(slug: string) {
  const c = await db.client.findUnique({ where: { slug } });
  if (!c) return;
  await db.lead.updateMany({ where: { clientId: c.id }, data: { clientId: null } });
  await db.project.updateMany({ where: { clientId: c.id }, data: { clientId: null } });
  await db.user.deleteMany({ where: { clientId: c.id } });
  await db.client.delete({ where: { id: c.id } }); // cascada borra todo lo Bazar*
}

async function main() {
  const productosJson: ProductoJson[] = JSON.parse(readFileSync(DATA_PATH, "utf8"));
  console.log(`Leídos ${productosJson.length} productos del JSON`);

  await limpiar("laestacion");

  const rubro = "Bazar deco & home — tienda online (Monte Hermoso)";
  const client = await db.client.create({
    data: {
      name: "La Estación Deco & Home",
      slug: "laestacion",
      rubro,
      pack: "SCALE",
      status: "ACTIVE",
      whatsapp: "5492921530000",
      email: "hola@laestaciondeco.com.ar",
      contactName: "La Estación",
      modules: ["crm", "caja", "sitio"],
      branding: {
        displayName: "La Estación Deco & Home",
        primary: "#3FA9A5",
        accent: "#2C6E8A",
        logo: LOGO,
        estilo: { esquinas: "redondeadas", nav: "izquierda", densidad: "comoda", grupos: "abierto" },
      },
      settings: {
        template: "bazar",
        instagram: "laestacionbazar",
        horarios: "Lunes a sábados 9:30 a 13 y 16:30 a 20:30\nDomingos 10 a 13 (temporada)",
        envioCosto: 9500,
        fotos: FOTOS,
        datosNegocio: {
          direccion: "Av. Argentina 234, Monte Hermoso",
          telefono: "2921 53-0000",
        },
        sobre:
          "La Estación Deco & Home nació como bazar de playa en Monte Hermoso. Hoy seleccionamos cada colección viajando a Expo CAFIRA y PRESENTES en Buenos Aires: vajilla, textiles, aromas y deco elegidos pieza por pieza, con envíos a todo el país.",
      },
    },
  });
  console.log(`Tenant creado: ${client.id}`);

  await db.user.create({
    data: {
      username: "laestacion",
      name: "La Estación Deco & Home",
      role: "CLIENT",
      osRole: "dueno",
      clientId: client.id,
      passwordHash: await bcrypt.hash("laestacion2026", 10),
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

  // ── Finanzas: cuentas + categorías (formato Vespa) ──
  const cuentaMp = await db.account.create({
    data: {
      clientId: client.id,
      name: "MercadoPago",
      kind: "mp",
      currency: "ARS",
      saldoInicial: 0,
      orden: 0,
    },
  });
  const cuentaEfectivo = await db.account.create({
    data: {
      clientId: client.id,
      name: "Efectivo local",
      kind: "efectivo",
      currency: "ARS",
      saldoInicial: 180_000,
      orden: 1,
    },
  });

  const catIngreso = ["Ventas tienda", "Envíos", "Ventas", "Cobros de clientes", "Otros ingresos"];
  const catGasto = [
    "Comisiones MP",
    "Compra de mercadería",
    "Proveedores",
    "Alquiler",
    "Sueldos",
    "Impuestos",
    "Servicios",
    "Marketing",
    "Otros gastos",
  ];
  await db.categoriaFinanciera.createMany({
    data: [
      ...catIngreso.map((nombre, i) => ({
        clientId: client.id,
        nombre,
        tipo: "INGRESO",
        orden: i,
      })),
      ...catGasto.map((nombre, i) => ({ clientId: client.id, nombre, tipo: "GASTO", orden: i })),
    ],
  });

  // ── 500 productos ──
  const usados = new Set<string>();
  const ahora = Date.now();
  const datosProductos = productosJson.map((p, i) => {
    let slug = slugify(p.nombre) || `producto-${i + 1}`;
    for (let n = 2; usados.has(slug); n++) slug = `${slugify(p.nombre)}-${n}`;
    usados.add(slug);

    // Fotos: ciclamos las 12 reales, 1 a 3 por producto (para que el carrusel ande).
    const cantFotos = 1 + ((i + p.nombre.length) % 3);
    const fotos = Array.from({ length: cantFotos }, (_, k) => FOTOS[(i + k * 5) % FOTOS.length]);

    // Visitas/vendidos coherentes: pocos productos estrella, cola larga.
    const estrella = rnd() < 0.08;
    const vendidos = estrella ? entre(25, 120) : rnd() < 0.5 ? entre(0, 12) : 0;
    const visitas = vendidos * entre(6, 14) + entre(0, 80);

    // Algunas ofertas (12%).
    const conOferta = rnd() < 0.12;
    const precioOferta = conOferta ? Math.round((p.precio * entre(70, 88)) / 100 / 100) * 100 : null;

    // Antigüedad: repartidos en 120 días; los últimos 30 aparecen como "NUEVO".
    const createdAt = new Date(ahora - entre(0, 120) * 86_400_000 - entre(0, 86_399_000));

    return {
      clientId: client.id,
      nombre: p.nombre,
      slug,
      categoria: p.categoria,
      precio: p.precio,
      precioOferta,
      stock: p.stock,
      fotos,
      descripcion: p.descripcion,
      destacado: p.destacado,
      activo: true,
      visitas,
      vendidos,
      sku: `LE-${String(i + 1).padStart(4, "0")}`,
      createdAt,
    };
  });
  for (let i = 0; i < datosProductos.length; i += 250) {
    await db.bazarProducto.createMany({ data: datosProductos.slice(i, i + 250) });
  }
  const productos = await db.bazarProducto.findMany({ where: { clientId: client.id } });
  console.log(`Productos creados: ${productos.length}`);

  // ── 3 cuentas de comprador demo ──
  const hashDemo = await bcrypt.hash("laestacion123", 10);
  const cuentasDemo = [
    { email: "sofia.demo@gmail.com", nombre: "Sofía Martínez", telefono: "2914445566", usoDescuento: true },
    { email: "valen.demo@gmail.com", nombre: "Valentina Ruiz", telefono: "2915556677", usoDescuento: false },
    { email: "caro.demo@hotmail.com", nombre: "Carolina Paz", telefono: "2916667788", usoDescuento: false },
  ];
  const cuentas = [];
  for (const c of cuentasDemo) {
    cuentas.push(
      await db.bazarCuenta.create({
        data: { clientId: client.id, email: c.email, hash: hashDemo, nombre: c.nombre, telefono: c.telefono, usoDescuento: c.usoDescuento },
      })
    );
  }

  // ── 25 pedidos repartidos en estados, últimos 30 días ──
  const ESTADOS: { estado: string; pago: boolean }[] = [
    { estado: "NUEVO", pago: false },
    { estado: "NUEVO", pago: false },
    { estado: "NUEVO", pago: false },
    { estado: "PAGADO", pago: true },
    { estado: "PAGADO", pago: true },
    { estado: "PAGADO", pago: true },
    { estado: "PAGADO", pago: true },
    { estado: "PREPARANDO", pago: true },
    { estado: "PREPARANDO", pago: true },
    { estado: "PREPARANDO", pago: true },
    { estado: "DESPACHADO", pago: true },
    { estado: "DESPACHADO", pago: true },
    { estado: "DESPACHADO", pago: true },
    { estado: "ENTREGADO", pago: true },
    { estado: "ENTREGADO", pago: true },
    { estado: "ENTREGADO", pago: true },
    { estado: "ENTREGADO", pago: true },
    { estado: "ENTREGADO", pago: true },
    { estado: "ENTREGADO", pago: true },
    { estado: "ENTREGADO", pago: true },
    { estado: "ENTREGADO", pago: true },
    { estado: "ENTREGADO", pago: true },
    { estado: "ENTREGADO", pago: true },
    { estado: "CANCELADO", pago: false },
    { estado: "CANCELADO", pago: false },
  ];
  const NOMBRES = [
    "Sofía Martínez", "Valentina Ruiz", "Carolina Paz", "Lucía Fernández", "Camila Torres",
    "Julieta Ríos", "Agustina López", "Mercedes Ibarra", "Paula Vega", "Florencia Sosa",
    "Marina Duarte", "Rocío Aguirre", "Belén Castro", "Milagros Ponce", "Josefina Aldao",
  ];
  const CIUDADES = ["Bahía Blanca", "Monte Hermoso", "Punta Alta", "Coronel Dorrego", "Tres Arroyos", "CABA", "La Plata"];
  const conFoto = productos.filter((p) => Array.isArray(p.fotos) && (p.fotos as string[]).length > 0);

  let numero = 0;
  for (const cfg of ESTADOS) {
    numero++;
    const cantItems = entre(1, 4);
    const elegidos = new Map<string, { p: (typeof productos)[number]; cant: number }>();
    for (let k = 0; k < cantItems; k++) {
      const p = elegir(conFoto);
      const previo = elegidos.get(p.id);
      elegidos.set(p.id, { p, cant: (previo?.cant ?? 0) + 1 });
    }
    const items = [...elegidos.values()].map(({ p, cant }) => ({
      productoId: p.id,
      nombre: p.nombre,
      precio: p.precioOferta ?? p.precio,
      cant,
      foto: (p.fotos as string[])[0] ?? null,
    }));
    const subtotal = items.reduce((s, i) => s + i.precio * i.cant, 0);

    // Descuentos: ~1 de cada 3 con cupón o cuenta.
    const dado = rnd();
    const cuentaPedido = dado < 0.15 ? elegir(cuentas) : null;
    const descuentoTipo = cuentaPedido ? "CUENTA10" : dado < 0.35 ? "POPUP5" : null;
    const descuentoMonto =
      descuentoTipo === "CUENTA10"
        ? Math.round(subtotal * 0.1)
        : descuentoTipo === "POPUP5"
          ? Math.round(subtotal * 0.05)
          : 0;

    const retiro = rnd() < 0.35;
    const envio = retiro ? 0 : 9500;
    const total = subtotal - descuentoMonto + envio;
    const nombre = cuentaPedido?.nombre ?? elegir(NOMBRES);
    const ciudad = elegir(CIUDADES);
    const fecha = new Date(ahora - entre(0, 29) * 86_400_000 - entre(1, 82_800_000));

    const pedido = await db.bazarPedido.create({
      data: {
        clientId: client.id,
        numero,
        items,
        subtotal,
        descuentoTipo,
        descuentoMonto,
        envio,
        total,
        estado: cfg.estado,
        nombre,
        telefono: `291${entre(4000000, 4999999)}`,
        email: cuentaPedido?.email ?? `${nombre.split(" ")[0].toLowerCase()}${entre(10, 99)}@gmail.com`,
        direccion: retiro ? null : `${elegir(["Alsina", "Chiclana", "Zelarrayán", "Las Dunas", "Costanera"])} ${entre(100, 2400)}`,
        ciudad: retiro ? null : ciudad,
        cp: retiro ? null : String(entre(7500, 8109)),
        notas: rnd() < 0.2 ? "¿Me lo pueden envolver para regalo? 🙏" : null,
        retiroEnLocal: retiro,
        seguimiento:
          cfg.estado === "DESPACHADO" || cfg.estado === "ENTREGADO"
            ? (retiro ? null : `CA${entre(100000000, 999999999)}AR`)
            : null,
        mpPaymentId: cfg.pago && rnd() < 0.8 ? String(entre(80000000000, 89999999999)) : null,
        cuentaId: cuentaPedido?.id ?? null,
        createdAt: fecha,
      },
    });

    // Pedido pagado → ingreso en Finanzas (cuenta MP o Efectivo).
    if (cfg.pago) {
      const efectivo = retiro && rnd() < 0.5;
      await db.cashMovement.create({
        data: {
          clientId: client.id,
          kind: "venta",
          concept: `Pedido #${pedido.numero} — ${nombre}`,
          categoria: "Ventas tienda",
          amountArs: total,
          moneda: "ARS",
          method: efectivo ? "efectivo" : "mp",
          accountId: efectivo ? cuentaEfectivo.id : cuentaMp.id,
          date: fecha,
        },
      });
    }
  }
  console.log(`Pedidos creados: ${numero}`);

  // Algunos gastos para que Finanzas respire (no solo ingresos).
  const gastos = [
    { concept: "Reposición vajilla Expo CAFIRA", categoria: "Compra de mercadería", monto: 480_000, dias: 22 },
    { concept: "Alquiler local", categoria: "Alquiler", monto: 350_000, dias: 25 },
    { concept: "Comisiones MercadoPago", categoria: "Comisiones MP", monto: 38_500, dias: 5 },
    { concept: "Pauta Instagram", categoria: "Marketing", monto: 60_000, dias: 12 },
  ];
  for (const g of gastos) {
    await db.cashMovement.create({
      data: {
        clientId: client.id,
        kind: "gasto",
        concept: g.concept,
        categoria: g.categoria,
        amountArs: g.monto,
        moneda: "ARS",
        method: "mp",
        accountId: cuentaMp.id,
        date: new Date(ahora - g.dias * 86_400_000),
      },
    });
  }

  // Recalcular balances cache de las dos cuentas.
  for (const cuenta of [cuentaMp, cuentaEfectivo]) {
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

  // ── 6 consultas ──
  const consultas = [
    { nombre: "Marcela Díaz", contacto: "2914887799", mensaje: "Hola! ¿El set de bowls Terracota viene en otro color? Lo quiero para regalar.", estado: "NUEVA", producto: true },
    { nombre: "Laura Giménez", contacto: "2923456712", mensaje: "¿Hacen envíos a Tres Arroyos? ¿Cuánto demora más o menos?", estado: "NUEVA", producto: false },
    { nombre: "Pedro Alonso", contacto: "1155667788", mensaje: "Quiero armar un regalo de casamiento por unos $150.000, ¿me ayudan a elegir?", estado: "NUEVA", producto: false },
    { nombre: "Cintia Vera", contacto: "cintia.vera@gmail.com", mensaje: "¿Las velas vienen con repuesto? Vi unas en el local en enero.", estado: "RESPONDIDA", producto: true },
    { nombre: "Romina Salas", contacto: "2914223311", mensaje: "¿Tienen manteles para mesa de 8? No los encuentro en la web.", estado: "RESPONDIDA", producto: false },
    { nombre: "Juan Etchart", contacto: "2916009988", mensaje: "Compré una lámpara la semana pasada y quiero otra igual, ¿queda stock?", estado: "RESPONDIDA", producto: true },
  ];
  for (const c of consultas) {
    await db.bazarConsulta.create({
      data: {
        clientId: client.id,
        nombre: c.nombre,
        contacto: c.contacto,
        mensaje: c.mensaje,
        productoId: c.producto ? elegir(conFoto).id : null,
        estado: c.estado,
        createdAt: new Date(ahora - entre(0, 6) * 86_400_000 - entre(1, 80_000_000)),
      },
    });
    await db.contact.create({
      data: {
        clientId: client.id,
        name: c.nombre,
        phone: c.contacto.includes("@") ? null : c.contacto,
        email: c.contacto.includes("@") ? c.contacto : null,
        source: "tienda web",
        stage: "nuevo",
        notes: c.mensaje,
        lastTouchAt: new Date(),
      },
    });
  }

  // Contactos CRM de las cuentas demo.
  for (const c of cuentasDemo) {
    await db.contact.create({
      data: {
        clientId: client.id,
        name: c.nombre,
        email: c.email,
        phone: c.telefono,
        source: "tienda web",
        stage: "cliente",
        notes: "Cuenta de la tienda online.",
        lastTouchAt: new Date(),
      },
    });
  }

  // ── 2 publicaciones IG programadas demo ──
  const destacadosConFoto = conFoto.filter((p) => p.destacado);
  const paraIg = (destacadosConFoto.length >= 2 ? destacadosConFoto : conFoto).slice(0, 2);
  const maniana11 = new Date(ahora + 86_400_000);
  maniana11.setUTCHours(14, 0, 0, 0); // 11:00 ART
  const pasado18 = new Date(ahora + 3 * 86_400_000);
  pasado18.setUTCHours(21, 0, 0, 0); // 18:00 ART
  const fechasIg = [maniana11, pasado18];
  for (let i = 0; i < paraIg.length; i++) {
    const p = paraIg[i];
    await db.bazarPublicacion.create({
      data: {
        clientId: client.id,
        productoId: p.id,
        caption: `${p.nombre} ✨\n$ ${(p.precioOferta ?? p.precio).toLocaleString("es-AR")}\nEnvíos a todo el país 🐚 #decohome #montehermoso`,
        fotos: p.fotos as string[],
        programadaPara: fechasIg[i],
        estado: "PROGRAMADA",
      },
    });
  }

  console.log("✅ Seed de La Estación listo");
  console.log("   Login OS: laestacion / laestacion2026 → /os/laestacion");
  console.log("   Web: /sitio/laestacion");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
