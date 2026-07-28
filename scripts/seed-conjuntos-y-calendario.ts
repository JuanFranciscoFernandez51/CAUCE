import { db } from "../src/lib/db";
import { uploadToTenant } from "../src/lib/storage";
import { readFileSync, writeFileSync } from "fs";
import path from "path";

/**
 * Campaña de lanzamiento v2:
 * - Sube los 8 videos (5 cortos de Fran + 3 largos nuestros) a Cloudinary.
 * - Crea 2 campañas DRAFT en el panel: "Reels cortos" y "Casos largos".
 * - Carga 30 MktPost DRAFT con fecha sugerida (calendario de agosto) — caption
 *   listo + prompt de Claude Design en `idea`. Nada se publica solo: Fran aprueba.
 */

const SCRATCH =
  "/private/tmp/claude-501/-Users-juanfri-Documents-CLAUDE-CODE-WEB-NUEVA-MOTOS-FERNANDEZ/e2daaa89-dbe3-496d-88e6-e463232ff2e2/scratchpad";
const DIR = path.join(SCRATCH, "ads-videos");
const WA = "https://wa.me/5492915757101?text=" + encodeURIComponent("Hola! Vi el video de Cauce. Tengo un negocio de ");

const BASE_PROMPT =
  "Pieza para Instagram de Cauce (software 100% a medida para PyMEs argentinas, cauceapp.com.ar). " +
  "Formato 1080x1350 (4:5). Paleta: fondo azul noche #0B1220 con degradé sutil a #182337, azules #2E6BFF #5E8CFF #9DB6FF, " +
  "acento cian #7FE8FF, texto blanco #F4F7FC. Tipografía sans-serif bold, minimal y tecnológica, sin fotos de stock. " +
  "El isologo de Cauce son tres líneas de corriente que convergen en un punto cian (esquina inferior). Todo el texto en español argentino (vos). ";

async function subir(nombre: string): Promise<string> {
  const up = await uploadToTenant({
    slug: "sistema",
    scope: ["ads-videos"],
    buffer: readFileSync(path.join(DIR, nombre)),
    originalName: nombre,
  });
  console.log("☁️", nombre, "→", up.url.slice(0, 80));
  return up.url;
}

// [dia, tipo, titulo, caption, promptEspecifico | videoKey]
type Entrada = {
  dia: number;
  tipo: "grafica" | "carrusel" | "reel-corto" | "video-largo";
  titulo: string;
  caption: string;
  extra: string; // prompt específico (gráficas) o clave de video
};

const HASH = "\n\n#cauce #softwareamedida #pymes #bahiablanca #automatizacion #chauexcel";

const CALENDARIO: Entrada[] = [
  { dia: 1, tipo: "reel-corto", titulo: "Reel corto 1 — gancho", caption: "¿Tu negocio todavía vive en planillas? Mirá esto 👀\n\nSoftware hecho 100% a tu medida. Escribinos." + HASH, extra: "corto1" },
  { dia: 2, tipo: "grafica", titulo: "Dolor — el cuaderno", caption: "El cuaderno no te avisa cuándo vence una cuota. Tu sistema sí.\n\nCauce arma software a la medida exacta de tu negocio: tus procesos, tu marca, tus precios." + HASH, extra: "Ilustración flat minimal: un cuaderno de espiral gastado a la izquierda (gris, apagado) y a la derecha una pantalla limpia con una notificación brillante en cian '⚠ Cuota vence hoy'. Título bold arriba: 'El cuaderno no te avisa. Tu sistema sí.'" },
  { dia: 3, tipo: "grafica", titulo: "Feature — Finanzas solas", caption: "¿Cuánto ganaste este mes? Si tenés que abrir Excel para saberlo, tenemos que hablar.\n\nCon Cauce los números se arman solos con cada venta." + HASH, extra: "Mockup estilizado de un dashboard de finanzas: tarjeta grande 'Resultado del mes' con número positivo en cian, mini gráfico de barras azules subiendo. Título: '¿Cuánto ganaste este mes? Tu sistema lo sabe solo.'" },
  { dia: 4, tipo: "reel-corto", titulo: "Reel corto 2", caption: "Cada cliente que entra queda registrado. Cada aviso sale solo. Así trabaja un negocio con Cauce ⚡" + HASH, extra: "corto2" },
  { dia: 5, tipo: "carrusel", titulo: "Caso — Motos Fernández (3 slides)", caption: "Motos Fernández migró toda la concesionaria a su sistema: stock, ventas, taller, Instagram, Mercado Libre y finanzas.\n\nDeslizá para ver cómo →" + HASH, extra: "Carrusel de 3 slides. S1: título 'Una concesionaria entera adentro de un sistema' + silueta de moto en líneas azules. S2: lista con checks cian: Stock que cierra solo · Mandatos en 2 minutos · Instagram con un botón · Cuotas que se controlan solas. S3: 'Hecho 100% a su medida. El tuyo también se puede.' + CTA WhatsApp." },
  { dia: 6, tipo: "grafica", titulo: "Educativo — ¿Qué es a medida?", caption: "Software a medida NO es una plantilla con tu logo.\n\nEs sentarnos con vos, entender cómo trabajás, y que el sistema se adapte a tu manera. No al revés." + HASH, extra: "Comparación en dos columnas: izquierda 'Plantilla' (caja rígida gris con un negocio apretado adentro), derecha 'A medida' (forma fluida azul que abraza la silueta del negocio). Título: 'Tu negocio no debería adaptarse al software.'" },
  { dia: 7, tipo: "grafica", titulo: "Prueba social — 7 sistemas vivos", caption: "Concesionarias, una escuela de esquí en Bariloche, una fábrica de espejos, un bazar de playa, pantallas LED…\n\n7 negocios reales trabajan todos los días con sistemas Cauce." + HASH, extra: "Grilla de 6 íconos de rubros en línea minimal (moto, esquí, espejo, bazar/conchilla, pantalla LED, scooter) conectados por líneas de corriente que convergen en el isologo. Título: '7 negocios reales. 7 sistemas a medida.'" },
  { dia: 8, tipo: "video-largo", titulo: "Video — Chau Excel (Motos Fernández)", caption: "¿Sentís que el negocio te maneja a vos? 🎥\n\nAsí lo resolvió una concesionaria de Bahía Blanca: mirá su sistema real por dentro, con documentos que salen solos y finanzas que se arman con cada venta." + HASH, extra: "largo-chau-excel" },
  { dia: 9, tipo: "grafica", titulo: "Dolor — WhatsApp desbordado", caption: "Responder WhatsApp no es un sistema de gestión.\n\nCada consulta que se te pasa es una venta que se va. Con Cauce, todo cae al sistema y nada se pierde." + HASH, extra: "Teléfono con burbujas de WhatsApp desbordando por todos lados (caóticas, verdes apagadas) que se ordenan en una lista limpia con estados de colores al pasar por el isologo. Título: 'Que no se te escape ninguna venta.'" },
  { dia: 10, tipo: "grafica", titulo: "Feature — Documentos solos", caption: "Entra una moto → se carga el mandato → el documento sale con número y todo, listo para firmar.\n\nAsí de simple es con un sistema hecho para vos." + HASH, extra: "Documento A4 estilizado saliendo de una impresora imaginaria de líneas azules, con sello 'N° MV-0061' en cian y una firma. Título: 'Tus documentos, con tu marca, en un clic.'" },
  { dia: 11, tipo: "reel-corto", titulo: "Reel corto 3", caption: "De la planilla al sistema: así se ve el cambio 📊➡️⚡" + HASH, extra: "corto3" },
  { dia: 12, tipo: "grafica", titulo: "Caso — La Base (Bariloche)", caption: "Una escuela de esquí con +40 instructores en el Cerro Catedral.\n\nReservas que entran solas desde la web, check-in con QR, caja en 4 monedas y liquidaciones automáticas." + HASH, extra: "Montaña estilizada en líneas azules con copos, un QR minimal en cian y un calendario con días ocupados. Título: 'Del Excel al Cerro Catedral: reservas que entran solas.'" },
  { dia: 13, tipo: "grafica", titulo: "Educativo — Precio claro", caption: "Sin sorpresas: base USD 300 + 40/mes. Cada pieza que sumás, 40. Negocio completo real desde 999.\n\nSabés lo que pagás y lo que te llevás." + HASH, extra: "Tres tarjetas de precio minimalistas escalonadas (BASE 300 · PIEZAS 40 c/u · COMPLETO desde 999) con la del medio destacada en borde cian. Título: 'Precios de frente, como debe ser.'" },
  { dia: 14, tipo: "grafica", titulo: "Feature — Instagram 1 botón", caption: "Publicar en Instagram: un botón. En Mercado Libre: otro.\n\nTu catálogo trabaja solo mientras vos vendés." + HASH, extra: "Un botón grande redondeado cian con el ícono de IG y flechas que salen hacia miniaturas de publicaciones. Título: 'Tu Instagram publica solo. En serio.'" },
  { dia: 15, tipo: "video-largo", titulo: "Video — La Base completo", caption: "🎥 Recorrido completo: la web donde reservan los alumnos y el sistema que ve el equipo.\n\nUna escuela de esquí real, funcionando con Cauce todos los días." + HASH, extra: "largo-la-base" },
  { dia: 16, tipo: "grafica", titulo: "Dolor — El dueño pulpo", caption: "Vender, cobrar, responder, publicar, controlar el stock… ¿todo vos?\n\nUn sistema a medida te devuelve las horas para lo importante: vender más." + HASH, extra: "Silueta de una persona con 6 brazos sosteniendo íconos (teléfono, planilla, cajita de plata, foto, caja de stock) que se relajan cuando los íconos fluyen por las corrientes del isologo. Título: 'Soltá. El sistema se encarga.'" },
  { dia: 17, tipo: "grafica", titulo: "Caso — Zatiori", caption: "Una fábrica de espejos artesanales donde el cliente diseña el suyo en la web y el pedido cae directo al taller.\n\nSu Instagram publica solo, todos los días." + HASH, extra: "Espejo con marco de madera estilizado en líneas cálidas sobre el fondo azul, con un wizard de 3 pasos al lado (forma → medida → precio). Título: 'El cliente diseña. El taller fabrica. El sistema ordena.'" },
  { dia: 18, tipo: "reel-corto", titulo: "Reel corto 4", caption: "Tu competencia ya está automatizando. ¿Y vos? ⏱️" + HASH, extra: "corto4" },
  { dia: 19, tipo: "grafica", titulo: "Feature — Facturación ARCA", caption: "Factura electrónica oficial (CAE + QR de ARCA) desde el mismo sistema donde cargás la venta.\n\nSin tipear dos veces. Sin errores." + HASH, extra: "Factura estilizada con QR y sello CAE en cian, saliendo de la pantalla del sistema. Título: 'Facturás en ARCA sin salir de tu sistema.'" },
  { dia: 20, tipo: "grafica", titulo: "Confianza — Cómo trabajamos", caption: "1. Nos sentamos con vos y entendemos tu negocio.\n2. Te mostramos tu sistema funcionando con TUS datos.\n3. Lo usás. Lo ajustamos. Crece con vos.\n\nAsí de simple." + HASH, extra: "Tres pasos numerados con líneas de corriente conectándolos: mesa de reunión → pantalla con demo → gráfico creciendo. Título: 'Así trabajamos: sin humo.'" },
  { dia: 21, tipo: "grafica", titulo: "Dato — Empleado vs Sistema", caption: "Un empleado administrativo: USD 1.500/mes + aguinaldo + vacaciones.\n\nTu sistema Cauce: desde USD 40/mes, trabaja 24/7 y no se toma licencia. No reemplaza personas: les saca lo repetitivo de encima." + HASH, extra: "Infografía comparativa dos columnas: 'Tareas repetitivas a mano' (reloj, USD 1.500/mes) vs 'Sistema Cauce' (rayo cian, desde USD 40/mes, 24/7). Título: 'Dejá lo repetitivo para el sistema.'" },
  { dia: 22, tipo: "reel-corto", titulo: "Reel corto 5", caption: "Un negocio ordenado vende más. Punto. 🐚⚡" + HASH, extra: "corto5" },
  { dia: 23, tipo: "grafica", titulo: "Caso — La Estación (bazar)", caption: "Un bazar de deco & home de Monte Hermoso con +500 productos online, carrito, despacho organizado y finanzas conectadas a cada venta.\n\nDe Instagram a tienda completa." + HASH, extra: "Conchilla marina estilizada en aqua sobre el fondo azul de Cauce, con una grilla de productos minimal y un carrito. Título: 'De bazar de playa a tienda online completa.'" },
  { dia: 24, tipo: "grafica", titulo: "Feature — Avisos que salen solos", caption: "El recordatorio de service. El aviso de cuota. El seguimiento del presupuesto.\n\nTodo sale solo por WhatsApp, en el momento justo. Es el mensaje que más plata recupera." + HASH, extra: "Tres burbujas de WhatsApp estilizadas saliendo de un reloj, cada una con su etiqueta (Service · Cuota · Seguimiento) y un tilde cian. Título: 'Los avisos que te hacen ganar plata salen solos.'" },
  { dia: 25, tipo: "grafica", titulo: "Educativo — Tus datos son tuyos", caption: "Tu sistema, tu marca, tus datos.\n\nNada de plataformas que te encierran: si un día te querés ir, tus datos se van con vos. Así trabajamos." + HASH, extra: "Un candado abierto en cian con datos (documentos, fichas) fluyendo libres por las corrientes azules hacia el dueño (silueta). Título: 'Tus datos son tuyos. Siempre.'" },
  { dia: 26, tipo: "video-largo", titulo: "Video — Tres negocios", caption: "🎥 Una escuela de esquí, una fábrica de espejos y una concesionaria oficial.\n\nTres negocios distintos, un mismo secreto: software hecho a su medida, y no al revés." + HASH, extra: "largo-tres-negocios" },
  { dia: 27, tipo: "grafica", titulo: "Dolor — Fin de mes a ciegas", caption: "Llega fin de mes y... ¿ganaste o perdiste?\n\nCon Cauce lo sabés todos los días: ingresos, gastos, margen y punto de equilibrio, en vivo." + HASH, extra: "Un signo de pregunta gris grande que se transforma en un gráfico de barras cian nítido al cruzar las líneas de corriente. Título: 'Fin de mes sin sorpresas.'" },
  { dia: 28, tipo: "grafica", titulo: "Caso — Ave Fénix (pantallas LED)", caption: "Circuito de pantallas LED: contratos, ocupación en vivo en la web y el aviso de cobro que sale solo del 1 al 5 de cada mes.\n\nOtro rubro, otra medida exacta." + HASH, extra: "Pantalla LED estilizada en un poste urbano con barra de ocupación (28/30 spots) en cian y un calendario con los días 1-5 marcados. Título: 'Hasta las pantallas de la calle tienen su sistema.'" },
  { dia: 29, tipo: "grafica", titulo: "Confianza — Sistemas que se muestran", caption: "No te mostramos mockups: te mostramos sistemas REALES funcionando, con capturas de verdad.\n\nEntrá a cauceapp.com.ar/casos y miralos por dentro." + HASH, extra: "Tres ventanas de navegador superpuestas con capturas esquemáticas de dashboards (barras, tablas, kanban) y un sello 'REAL' en cian. Título: 'Sistemas reales. Capturas reales. Cero humo.'" },
  { dia: 30, tipo: "grafica", titulo: "CTA — Tu sistema en 15 minutos", caption: "15 minutos por WhatsApp: nos contás tu negocio, te decimos exactamente qué armaríamos y cuánto sale.\n\nSin compromiso. Con precios de frente. 👉 Link en bio" + HASH, extra: "Pieza de cierre fuerte: isologo grande centrado con las corrientes iluminadas, título 'Tu sistema a medida empieza con un mensaje' y burbuja de WhatsApp con '15 minutos, sin compromiso'. CTA cauceapp.com.ar." },
];

async function main() {
  // 1) subir videos
  const urls: Record<string, string> = {};
  for (const n of ["corto1", "corto2", "corto3", "corto4", "corto5", "largo-chau-excel", "largo-tres-negocios", "largo-la-base"]) {
    urls[n] = await subir(n + ".mp4");
  }

  // 2) campañas DRAFT
  const base = {
    objective: "OUTCOME_TRAFFIC",
    dailyBudgetCents: 500000, // $5.000/día
    startDate: new Date("2026-08-01T12:00:00-03:00"),
    endDate: new Date("2026-08-31T23:59:00-03:00"),
    status: "DRAFT",
    audienceConfig: { ageMin: 25, ageMax: 60, genders: [], countries: ["AR"], cities: [], interests: ["Small business owners", "Entrepreneurship"] },
    creativeMediaType: "VIDEO",
    creativeCallToAction: "WHATSAPP_MESSAGE" as string,
    destinationUrl: WA,
  };
  await db.mktCampaign.create({
    data: {
      ...base,
      name: "Cauce — Reels cortos (lanzamiento)",
      creativeCaption: "Software hecho 100% a la medida de tu negocio. 15 minutos por WhatsApp y te mostramos el tuyo.",
      creativeVideoUrl: urls.corto1,
      adItems: [1, 2, 3, 4, 5].map((i) => ({
        nombre: `Reel corto ${i}`,
        videoUrl: urls[`corto${i}`],
        caption: "¿Tu negocio todavía vive en planillas? Software hecho 100% a tu medida — escribinos y en 15 minutos te mostramos el tuyo.",
      })),
    },
  });
  await db.mktCampaign.create({
    data: {
      ...base,
      name: "Cauce — Casos largos (lanzamiento)",
      creativeCaption: "Mirá un sistema real por dentro: documentos que salen solos, finanzas que se arman con cada venta.",
      creativeVideoUrl: urls["largo-chau-excel"],
      adItems: [
        { nombre: "Chau Excel — Motos Fernández", videoUrl: urls["largo-chau-excel"], caption: "¿Sentís que el negocio te maneja a vos? Mirá cómo lo resolvió una concesionaria real de Bahía Blanca." },
        { nombre: "Tres negocios", videoUrl: urls["largo-tres-negocios"], caption: "Una escuela de esquí, una fábrica de espejos y una concesionaria: tres negocios, un mismo secreto." },
        { nombre: "La Base — caso completo", videoUrl: urls["largo-la-base"], caption: "Recorrido completo por un sistema real: de la web donde reservan los alumnos al panel del equipo." },
      ],
    },
  });
  console.log("📢 2 campañas DRAFT creadas");

  // 3) calendario de 30 posts DRAFT con fecha sugerida
  let creados = 0;
  for (const e of CALENDARIO) {
    const fecha = new Date(`2026-08-${String(e.dia).padStart(2, "0")}T11:00:00-03:00`);
    const esVideo = e.tipo === "reel-corto" || e.tipo === "video-largo";
    await db.mktPost.create({
      data: {
        titulo: `Día ${e.dia} — ${e.titulo}`,
        caption: e.caption,
        idea: esVideo ? null : BASE_PROMPT + e.extra,
        mediaType: e.tipo === "reel-corto" ? "REEL" : e.tipo === "video-largo" ? "VIDEO" : e.tipo === "carrusel" ? "PHOTO_CAROUSEL" : "PHOTO",
        videoUrls: esVideo ? [urls[e.extra]] : [],
        imageUrls: [],
        platforms: ["IG"],
        scheduledAt: fecha,
        status: "DRAFT", // Fran aprueba y pasa a programada — nada sale solo
        origen: "ia",
      },
    });
    creados++;
  }
  console.log("🗓️", creados, "publicaciones del calendario creadas (DRAFT con fecha)");

  // 4) archivo con los prompts para Claude Design
  let txt = "PROMPTS CLAUDE DESIGN — 30 PUBLICACIONES CAUCE (AGOSTO)\n";
  txt += "Base de marca (va implícita en cada prompt):\n" + BASE_PROMPT + "\n\n";
  for (const e of CALENDARIO) {
    const esVideo = e.tipo === "reel-corto" || e.tipo === "video-largo";
    txt += `────────────────────────────\nDÍA ${e.dia} · ${e.titulo} · ${e.tipo.toUpperCase()}\n`;
    txt += `CAPTION:\n${e.caption}\n`;
    txt += esVideo ? `PIEZA: video ya listo (${e.extra}) — no necesita diseño.\n` : `PROMPT DISEÑO:\n${BASE_PROMPT}${e.extra}\n`;
    txt += "\n";
  }
  writeFileSync("/Users/juanfri/Desktop/anuncios-cauce/CALENDARIO-30-DIAS-Y-PROMPTS.txt", txt);
  console.log("📄 archivo de prompts escrito");
}

main().then(() => process.exit(0));
