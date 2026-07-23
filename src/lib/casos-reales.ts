/**
 * CASOS REALES — las marcas que ya trabajan con Cauce, con su sistema a la vista.
 * Fuente: los destilados de ejemplos/*.md y los tenants reales (capturas en settings.shots).
 */

export type CasoReal = {
  slug: string;
  nombre: string;
  rubro: string;
  /** Logo en /public (null = tile con inicial). */
  logo: string | null;
  /** Fondo oscuro para logos claros. */
  logoOscuro?: boolean;
  webUrl?: string;
  resumen: string;
  /** Lo que su sistema les resolvió, en criollo y con hechos. */
  resultados: string[];
  /** Qué tiene su sistema adentro. */
  modulos: { nombre: string; detalle: string }[];
  /** Tenant del que salen las capturas del sistema (settings.shots). */
  shotsSlug: string;
  /** Capturas de SU web real en producción (prioridad sobre las del tenant). */
  shotsReales?: { titulo: string; url: string }[];
};

export const CASOS_REALES: CasoReal[] = [
  {
    slug: "motos-fernandez",
    nombre: "Motos Fernández",
    rubro: "Concesionaria multimarca y taller · Bahía Blanca · desde 1985",
    logo: "/casos/motos-fernandez-logo.png",
    webUrl: "https://motosfernandez.com.ar",
    resumen:
      "No es un catálogo lindo: es la concesionaria entera adentro de un sistema. Vender, cobrar cuotas, gestionar el taller, publicar en redes y hacer post-venta — todo desde un panel.",
    resultados: [
      "El recordatorio de service a los 6 meses sale solo por WhatsApp: es el mensaje que más clientes recupera.",
      "Cada venta se arma con pagos combinados (efectivo, transferencia, dólares, cheque), permutas y cuotas propias, con su boleto en PDF.",
      "Publica en Instagram y arma campañas de Meta Ads desde el mismo panel, sin salir del sistema.",
      "Los clientes se cargan con una foto del DNI: el sistema lee los datos solo.",
    ],
    modulos: [
      { nombre: "Catálogo y stock", detalle: "0KM y usadas con trazabilidad de origen: stock propio, parte de pago o consignación." },
      { nombre: "Ventas y financiación", detalle: "Orden de compra completa, cuotas propias con vencimientos y avisos de mora." },
      { nombre: "Taller", detalle: "Turnos online → órdenes de trabajo → presupuestos, con estados y PDF." },
      { nombre: "CRM y leads", detalle: "Toda consulta de todos los canales cae al sistema con su seguimiento." },
      { nombre: "Marketing", detalle: "Instagram programado, Meta Ads y Mercado Libre desde el panel." },
      { nombre: "Post-venta automática", detalle: "Service a los 6 meses y encuesta de satisfacción a los 10 días." },
    ],
    shotsSlug: "bahiamotos",
    shotsReales: [
      { titulo: "Su web viva — home", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1784815882/cauce/sistema/casos/motos-fernandez/zltj0lvbycwgqmzjv9mg.png" },
      { titulo: "Catálogo de motos online", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1784815889/cauce/sistema/casos/motos-fernandez/vv3b6z4vsidou8zb0c3z.png" },
      { titulo: "Tienda de accesorios", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1784815896/cauce/sistema/casos/motos-fernandez/tz4c0yq6z8m1jgfgz2au.png" },
    ],
  },
  {
    slug: "vespa-bahia",
    nombre: "Vespa Bahía",
    rubro: "Concesionario oficial Vespa · Piaggio · Aprilia · Bahía Blanca",
    logo: null,
    webUrl: "https://vespabahia.com.ar",
    resumen:
      "El concesionario oficial digitalizado de punta a punta: cada moto física es una unidad con su chasis en el sistema, cada venta un boleto con sus pagos, y la tienda online vende sola.",
    resultados: [
      "Stock real por unidad: cada moto con su chasis único, separada del catálogo. Nunca más vender lo que no está.",
      "Boleto de compra-venta con pagos combinados, permutas múltiples y financiación propia en cuotas.",
      "Tienda online de cascos, ropa y repuestos, más el club de marca con sus socios.",
      "Taller oficial con turnos online, órdenes de trabajo y presupuestos imprimibles.",
    ],
    modulos: [
      { nombre: "Catálogo y unidades", detalle: "Modelos por un lado, unidades físicas con chasis por el otro." },
      { nombre: "Ventas y consignación", detalle: "Órdenes de compra y mandatos de venta numerados con checklist documental." },
      { nombre: "Tienda online", detalle: "Accesorios, indumentaria y repuestos con carrito y pagos." },
      { nombre: "Taller oficial", detalle: "Turnos, OTs y presupuestos con estados y PDF." },
      { nombre: "Tesorería", detalle: "Cuotas propias con garante y marcado de atraso automático." },
      { nombre: "CRM", detalle: "Leads de compra, turnos, test rides y campañas, todos en un lugar." },
    ],
    shotsSlug: "vespabahia",
    shotsReales: [
      { titulo: "Su web viva — home", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1784815909/cauce/sistema/casos/vespa-bahia/djuzc0pduawepbpavhwq.png" },
      { titulo: "Catálogo de modelos", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1784815969/cauce/sistema/casos/vespa-bahia/j3brf6w77klvcjmv1ly6.png" },
      { titulo: "Tienda online oficial", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1784815926/cauce/sistema/casos/vespa-bahia/jlvngqoiojqg6k4kfokm.png" },
    ],
  },
  {
    slug: "vespa-club",
    nombre: "Vespa Club Bahía Blanca",
    rubro: "Club vespista · noticias, salidas y la Gymkhana",
    logo: null,
    webUrl: "https://www.vespaclubbahiablanca.com.ar",
    resumen:
      "La casa digital del club, con su joya: la Gymkhana — el campeonato de destreza vespista — se corre entera con el sistema. Los pilotos se inscriben y pagan online, y el cronometraje lo hace un sensor en la pista que manda los tiempos directo a la web, en vivo.",
    resultados: [
      "Inscripción a la Gymkhana 100% online: cada piloto elige su número (con chequeo en vivo de los tomados), paga con MercadoPago y el comprobante le llega al mail al instante. Cero planilla.",
      "Cronometraje de carrera de verdad: un sensor Arduino en la pista manda partida y llegada directo al sistema, con penalizaciones y descalificaciones, y el resultado se ve en vivo.",
      "Para publicar una noticia, el admin le cuenta la salida al asistente con IA y la nota sale redactada y publicada — título, bajada y categoría incluidos.",
      "El club sabe quién lo visita: visitas por día y desde qué ciudades y países, sin depender de Google.",
    ],
    modulos: [
      { nombre: "Gymkhana: inscripción con pago", detalle: "Número elegido por el piloto, MercadoPago y comprobante automático por email." },
      { nombre: "Cronometraje con sensor", detalle: "Arduino en pista + web: tiempos, penalizaciones y resultados en vivo." },
      { nombre: "Noticias y salidas", detalle: "Rodadas y novedades con galerías de fotos y reordenado drag & drop." },
      { nombre: "Asistente IA del club", detalle: "Redacta y publica las noticias directamente en el sistema." },
      { nombre: "Analítica propia", detalle: "Visitas diarias y origen geográfico en el panel del club." },
    ],
    shotsSlug: "clubpiston",
    shotsReales: [
      { titulo: "Su web viva — home", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1784815977/cauce/sistema/casos/vespa-club/lubeo0r4dfvaijamcc1n.png" },
      { titulo: "Inscripción a la Gymkhana", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1784816068/cauce/sistema/casos/vespa-club/pcevemhneiaaoksffd3k.png" },
      { titulo: "Noticias del club", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1784816013/cauce/sistema/casos/vespa-club/ek6xfz5nh4tpcnhkgngk.png" },
    ],
  },
  {
    slug: "zatiori-espejos",
    nombre: "Zatiori — Almacén de Espejos",
    rubro: "Espejos artesanales con marcos de madera · Bahía Blanca",
    logo: null,
    webUrl: "https://zatiori.vercel.app",
    resumen:
      "Espejos únicos hechos a mano, con un sistema a la altura: el cliente diseña su espejo a medida en la web y el pedido cae armado al panel, la fábrica tiene su propia cola de trabajo, e Instagram se publica solo.",
    resultados: [
      "El cliente arma su espejo a medida en la web — madera, pátina, tallado, medidas — y el presupuesto cae solo al panel como pedido, con aviso por mail. Antes era ida y vuelta infinita por WhatsApp.",
      "Del presupuesto a la entrega, cada espejo pasa por 6 estados con su seña y su saldo, y la fábrica tiene su cola con prioridades y orden de fabricación en PDF.",
      "Instagram se publica solo: la publicación queda programada y sale todos los días sin tocar el teléfono.",
      "Las reseñas se piden con un link único por cliente: deja estrellas, texto y fotos, se aprueba y aparece en la web.",
    ],
    modulos: [
      { nombre: "Configurador a medida", detalle: "El cliente diseña su espejo online y genera un pedido real con precio calculado." },
      { nombre: "Pedidos y presupuestos", detalle: "Pipeline de 6 estados con señas, saldos y PDF numerado." },
      { nombre: "Fábrica", detalle: "Cola de fabricación con prioridades, fotos de producción y pase directo a catálogo." },
      { nombre: "CRM de clientes", detalle: "Cada cliente con su origen (web, IG, local) y su historial de contactos." },
      { nombre: "Instagram automático", detalle: "Publicaciones programadas que salen solas todos los días." },
      { nombre: "Analítica propia", detalle: "Visitas, clics a WhatsApp y conversiones medidas sin Google." },
    ],
    shotsSlug: "zatiori",
    shotsReales: [
      { titulo: "Su web viva — home", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1784816025/cauce/sistema/casos/zatiori-espejos/hao3zylo2e3tzfq4u78g.png" },
      { titulo: "Catálogo de espejos", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1784816033/cauce/sistema/casos/zatiori-espejos/ndj7bmnp2z5rwcaejqcg.png" },
    ],
  },
  {
    slug: "ave-fenix",
    nombre: "Ave Fénix Publicidad",
    rubro: "Circuito de pantallas LED · Bahía Blanca y la región",
    logo: "/avefenix/logo.png",
    logoOscuro: true,
    webUrl: "https://www.avefenixleds.com.ar",
    resumen:
      "Manejaban 11 pantallas, 36 anunciantes y toda la plata en un Excel. Hoy la disponibilidad de cada pantalla, los cobros del mes y la caja viven en su sistema — y la web muestra los lugares libres en vivo.",
    resultados: [
      "Chau Excel: pantallas, anunciantes, cobros y caja en un solo lugar, desde el celular.",
      "Cada pantalla muestra sus 30 espacios y cuántos quedan libres — también en la web pública, en vivo.",
      "Del 1 al 5 de cada mes, el aviso de cobro de cada cliente sale armado por WhatsApp con su monto.",
      "El libro de caja del año entero migrado al sistema, con saldo real y proveedores con día de pago.",
    ],
    modulos: [
      { nombre: "Pantallas LED", detalle: "Disponibilidad por pantalla, contratos por anunciante y facturación por punto." },
      { nombre: "Anunciantes", detalle: "Cada cliente con sus pantallas, su abono total y su cobro a un clic." },
      { nombre: "Finanzas", detalle: "Caja diaria, proveedores con día de pago y el margen del negocio a la vista." },
      { nombre: "CRM", detalle: "Los 36 anunciantes importados desde su Excel en un día." },
      { nombre: "Web con disponibilidad", detalle: "Su misma estética, pero conectada al sistema: muestra lugares libres reales." },
    ],
    shotsSlug: "avefenix",
  },
];

export function getCasoReal(slug: string): CasoReal | undefined {
  return CASOS_REALES.find((c) => c.slug === slug);
}
