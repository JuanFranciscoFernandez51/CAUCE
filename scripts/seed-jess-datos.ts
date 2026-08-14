/**
 * Jess Design: identidad y datos del panel que mandaron (jess.html).
 * La plantilla de servicios, el catálogo de mobiliario por sector, los tipos
 * y estados de evento salen tal cual de su DEFAULT_STATE y MOBILIARIO_CATALOG.
 */
import { db } from "../src/lib/db";

const PLANTILLA = {
  precio: 7500,
  moneda: "USD",
  servicios: [
    { nombre: "Gestión y planificación general", items: ["Reuniones de asesoramiento y seguimiento", "Desarrollo de la idea y estilo del evento", "Armado del cronograma general", "Organización de tiempos y logística", "Supervisión integral de cada etapa del proceso", "Resolución y seguimiento de necesidades del cliente"] },
    { nombre: "Asesoramiento personalizado", items: ["Acompañamiento permanente durante toda la planificación", "Búsqueda de propuestas acordes al estilo y presupuesto", "Sugerencias creativas y funcionales", "Asistencia en la toma de decisiones importantes"] },
    { nombre: "Gestión de proveedores", items: ["Selección y coordinación de proveedores", "Contacto y seguimiento con cada servicio contratado", "Organización de horarios de montaje y entregas", "Control y supervisión del cumplimiento de cada proveedor"] },
    { nombre: "Diseño y ambientación", items: ["Desarrollo conceptual y estética general del evento", "Distribución funcional de espacios", "Definición de sectores y circulación", "Coordinación de ambientación y montaje", "Mobiliario interior y exterior incluido", "Supervisión estética integral del evento"] },
    { nombre: "Coordinación operativa del evento", items: ["Presencia y coordinación el día del evento", "Supervisión del armado y desmontaje", "Coordinación de ingresos, tiempos y servicios", "Control del cronograma durante toda la celebración", "Resolución inmediata de imprevistos", "Comunicación constante con salón, catering, DJ y proveedores"] },
    { nombre: "Acompañamiento durante el evento", items: ["Recepción y asistencia general", "Seguimiento del servicio y atención al detalle", "Organización de momentos importantes", "Coordinación de ingresos especiales, shows, brindis y protocolos"] },
  ],
  nota: "El presupuesto puede adaptarse según la magnitud, cantidad de invitados y necesidades específicas del evento.",
};

const MOBILIARIO = [
  { sector: "Sector exterior", items: [
    { id: "cam-guay", nombre: "Camastro de Guayuvira 2m x 90cm", precio: 70000 },
    { id: "sil-gerv", nombre: "Sillón gervasoni de guayuvira", precio: 35000 },
    { id: "sil-abra", nombre: "Sillón abraci de Petiribi", precio: 35000 },
    { id: "mes-red", nombre: "Mesas ratonas redondas de hierro 60 y 80 cm", precio: 25000 },
    { id: "mes-rect", nombre: "Mesas ratonas rectangulares patas hierro tapa pinotea", precio: 40000 },
    { id: "mes-gerv", nombre: "Mesas ratonas gervasoni de hierro", precio: 25000 },
    { id: "bar-tif", nombre: "Mesas redondas tipo bar con 3 sillas tiffany negras", precio: 60000 },
    { id: "sil-cue", nombre: "Sillón de cuerina 1,20 m con funda", precio: 45000 },
    { id: "puf-cue", nombre: "Puf de cuerina 40×40 con funda", precio: 9000 },
    { id: "puf-dob", nombre: "Puf doble 1,00 m con funda", precio: 18000 },
    { id: "fun-puf", nombre: "Fundas puff", precio: 2000 },
    { id: "cam-can-d", nombre: "Camastro de caña doble", precio: 50000 },
    { id: "sil-can-s", nombre: "Sillón de caña simple", precio: 35000 },
    { id: "sil-can-d", nombre: "Sillón de caña doble", precio: 60000 },
    { id: "mes-cip", nombre: "Mesas de ciprés", precio: 25000 },
    { id: "almo", nombre: "Almohadones en tela Tusor Lino Pana off white", precio: 5000 },
    { id: "cam-hie-d", nombre: "Camastros de hierro doble", precio: 70000 },
    { id: "sil-hie-s", nombre: "Sillón de hierro simple", precio: 35000 },
  ]},
  { sector: "Sector interior", items: [
    { id: "sil-ches", nombre: "Sillones Chester", precio: 60000 },
    { id: "ban-ches", nombre: "Banquetas Chester", precio: 35000 },
    { id: "lam-cai", nombre: "Lámparas de caireles", precio: 70000 },
  ]},
  { sector: "Sector ceremonia", items: [
    { id: "dre-cer", nombre: "Dresuar para ceremonia y altar", precio: 65000 },
    { id: "sil-tif", nombre: "Sillas tiffany negras", precio: 9000 },
    { id: "sil-cro", nombre: "Sillas cross", precio: 12000 },
    { id: "alf-red", nombre: "Alfombra de yute natural importada redonda 1,8 m", precio: 60000 },
    { id: "alf-rec", nombre: "Alfombra de yute natural importada rectangular 2×2,5 m", precio: 90000 },
  ]},
  { sector: "Adicionales", items: [
    { id: "alf-yut", nombre: "Alfombras de yute", precio: 0 },
    { id: "can-yut", nombre: "Canastos de yute y diferentes texturas", precio: 0 },
    { id: "velas", nombre: "Velas", precio: 0 },
    { id: "vel-led", nombre: "Velas led", precio: 0 },
    { id: "fanales", nombre: "Fanales", precio: 0 },
    { id: "manteles", nombre: "Manteles", precio: 0 },
    { id: "cor-luz", nombre: "Cortina de luces", precio: 0 },
    { id: "car-led", nombre: "Cartel led Let's Party / Just Married", precio: 0 },
    { id: "car-sen", nombre: "Carteles de señalización", precio: 0 },
    { id: "est-hie", nombre: "Estructura de hierro o madera para altar o fotos", precio: 0 },
    { id: "car-cer", nombre: "Cartel de ceremonia", precio: 0 },
  ]},
];

async function main() {
  const t = await db.client.findUnique({ where: { slug: "jessdesign" } });
  if (!t) throw new Error("falta el tenant jessdesign");
  const br = (t.branding ?? {}) as Record<string, unknown>;
  const st = (t.settings ?? {}) as Record<string, unknown>;

  await db.client.update({
    where: { id: t.id },
    data: {
      branding: {
        ...br,
        displayName: "Jess Design",
        primary: "#1A1816", // botones negros
        accent: "#B85850",
        fondo: "#EDE8DE",
        tinta: "#1A1816",
        fuente: "var(--font-montserrat), ui-sans-serif, sans-serif",
        estilo: { esquinas: "suaves", nav: "arriba", densidad: "comoda" },
      },
      settings: {
        ...st,
        template: "eventos",
        instagram: "jessdesign.bb",
        plantillaCotizacion: PLANTILLA,
        mobiliario: MOBILIARIO,
        tiposEvento: ["Boda", "Cumpleaños", "Corporativo", "Baby Shower", "Aniversario", "Otros"],
        condicionesPresupuesto: PLANTILLA.nota,
      },
    },
  });

  // Eventos de muestra con hitos, para ver el tablero vivo
  await db.eventoOrg.deleteMany({ where: { clientId: t.id } });
  const en = (d: number) => { const x = new Date(); x.setDate(x.getDate() + d); return x; };
  await db.eventoOrg.createMany({
    data: [
      { clientId: t.id, nombre: "Boda Sofía & Juan", tipo: "boda", fecha: en(45), lugar: "Estancia La Madrugada", estado: "produccion", presupuesto: 9200000, cobrado: 4600000, contacto: "Sofía Etchart", telefono: "2914556677", hitos: [
        { titulo: "Confirmar menú con catering", fecha: en(7).toISOString(), hecho: false },
        { titulo: "Prueba de ambientación", fecha: en(20).toISOString(), hecho: false },
        { titulo: "Señar el DJ", fecha: en(-3).toISOString(), hecho: true },
      ]},
      { clientId: t.id, nombre: "15 de Emilia", tipo: "cumpleanos", fecha: en(90), lugar: "Salón Amadeus", estado: "confirmado", presupuesto: 5400000, cobrado: 1600000, contacto: "Valeria Ruiz", telefono: "2915889911", hitos: [
        { titulo: "Definir paleta y estilo", fecha: en(14).toISOString(), hecho: false },
      ]},
      { clientId: t.id, nombre: "Lanzamiento Bodega Alto Sur", tipo: "corporativo", fecha: en(21), lugar: "Hotel Argos", estado: "cotizado", presupuesto: 3800000, cobrado: 0, contacto: "Martín Igoa", telefono: "2914002211", hitos: [] },
    ],
  });

  console.log("✅ identidad + plantilla + mobiliario + 3 eventos");
  process.exit(0);
}
main();
