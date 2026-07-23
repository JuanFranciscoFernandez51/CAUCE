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
  /** Tenant del que salen las capturas reales (settings.shots). */
  shotsSlug: string;
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
  },
  {
    slug: "vespa-club",
    nombre: "Vespa Club Bahía Blanca",
    rubro: "Club de marca · comunidad, eventos y encuentros",
    logo: null,
    webUrl: "https://vespaclubbahiablanca.com.ar",
    resumen:
      "La comunidad Vespa de Bahía con su casa digital: los socios se anotan solos a cada encuentro, las inscripciones caen al sistema y el día del evento todo está organizado de antemano.",
    resultados: [
      "Inscripciones online a los eventos: cada socio se anota solo y la lista se arma sin planillas.",
      "El padrón de socios vive en el sistema, no en el WhatsApp de un dirigente.",
      "Cada encuentro con su ficha: asistentes, recorrido y comunicación en un solo lugar.",
    ],
    modulos: [
      { nombre: "Eventos", detalle: "Encuentros con inscripción online y lista de participantes." },
      { nombre: "Socios", detalle: "El padrón del club ordenado, con historial de participación." },
      { nombre: "Web del club", detalle: "La cara pública: próximas fechas, fotos y cómo sumarse." },
    ],
    shotsSlug: "clubpiston",
  },
  {
    slug: "zatiori-espejos",
    nombre: "Zatiori Espejos",
    rubro: "Fábrica y venta de espejos a medida",
    logo: null,
    resumen:
      "Espejos a medida con presencia digital propia: catálogo de trabajos, consultas que entran ordenadas y presupuestos que no se pierden en el chat.",
    resultados: [
      "Las consultas de la web y las redes caen en una sola lista, con su seguimiento.",
      "Cada pedido a medida con sus medidas, su precio y su estado — nada queda en un papelito.",
    ],
    modulos: [
      { nombre: "Web y catálogo", detalle: "Los trabajos a la vista para que el cliente llegue decidido." },
      { nombre: "Consultas y presupuestos", detalle: "Cada pedido con sus medidas y su seguimiento." },
    ],
    shotsSlug: "zatiori",
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
