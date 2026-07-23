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
  shotsReales?: { titulo: string; url: string; href?: string }[];
  /** El proceso del negocio, paso a paso, tal como lo lleva el sistema. */
  proceso?: string[];
  /** Capturas del ADMIN real (con datos difuminados por privacidad). */
  shotsAdmin?: { titulo: string; url: string }[];
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
    shotsAdmin: [
      { titulo: "Dashboard", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1784830893/cauce/sistema/casos/motos-fernandez/admin/tspablp2tjuzhhg8h2lk.png" },
      { titulo: "CRM / Leads", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1784830900/cauce/sistema/casos/motos-fernandez/admin/hf3gzwjewwe7kdtphmqv.png" },
      { titulo: "Pedidos", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1784830907/cauce/sistema/casos/motos-fernandez/admin/igawld0rorgbkgtidtny.png" },
      { titulo: "Finanzas", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1784830911/cauce/sistema/casos/motos-fernandez/admin/sznj900vvmtpgxwok2j1.png" },
      { titulo: "Outreach", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1784830916/cauce/sistema/casos/motos-fernandez/admin/l0n5tkwqfumlgxzzsj5y.png" },
      { titulo: "Asistente IA", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1784830921/cauce/sistema/casos/motos-fernandez/admin/ybzayepnoau2ixvurzjo.png" },
    ],
    proceso: [
      "El cliente llega por la web: catálogo con financiación simulada, quiz de qué moto le conviene y consulta directa por WhatsApp — todo cae al CRM.",
      "La venta se arma en el sistema: pagos combinados, permuta si trae usada, cuotas propias si financia, y el boleto sale en PDF listo para firmar.",
      "Si financió, Tesorería sigue las cuotas: vencimientos, avisos automáticos y reclamo con copia al garante si se atrasa.",
      "El taller trabaja con turnos online: orden de trabajo con estados, presupuesto aprobado por WhatsApp y aviso de 'lista para retirar'.",
      "A los 6 meses el sistema le recuerda el service al cliente, solo — y el ciclo vuelve a empezar.",
    ],
    shotsReales: [
      { titulo: "Su web viva — home", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1784816438/cauce/sistema/casos/motos-fernandez/yzjmjkqv59igf7eoyuks.png", href: "https://motosfernandez.com.ar" },
      { titulo: "Catálogo de motos online", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1784816448/cauce/sistema/casos/motos-fernandez/yne4wxdiqp1nxsm5wkxu.png", href: "https://motosfernandez.com.ar/catalogo" },
      { titulo: "Tienda de accesorios", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1784816457/cauce/sistema/casos/motos-fernandez/uv9wfdewlwgjpdmhrxda.png", href: "https://motosfernandez.com.ar/tienda" },
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
    shotsAdmin: [
      { titulo: "Dashboard", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1784830941/cauce/sistema/casos/vespa-bahia/admin/dpitxghle0kmb2nzk00p.png" },
      { titulo: "Tareas pendientes", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1784830946/cauce/sistema/casos/vespa-bahia/admin/ymnbcg6h6bhydbuuyh9f.png" },
      { titulo: "Pedidos", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1784830952/cauce/sistema/casos/vespa-bahia/admin/jcdgz0ja1cryh4vbkptu.png" },
      { titulo: "Finanzas", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1784830957/cauce/sistema/casos/vespa-bahia/admin/b7cjeh5hdxqcztskgh1y.png" },
      { titulo: "Facturación (ARCA)", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1784830963/cauce/sistema/casos/vespa-bahia/admin/aapygdmgdonxvxdmxbuy.png" },
      { titulo: "CRM / Leads", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1784830968/cauce/sistema/casos/vespa-bahia/admin/w0bpklwq6mha1ljptbfv.png" },
      { titulo: "Test Rides", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1784830973/cauce/sistema/casos/vespa-bahia/admin/jugkpxitnuvjw7np5snc.png" },
    ],
    proceso: [
      "El catálogo público muestra modelos 0KM y usadas; cada unidad física vive en el sistema con su chasis único.",
      "La venta genera la orden de compra: pagos combinados, permutas y financiación propia, con boleto numerado en PDF.",
      "La tienda online vende cascos, ropa y repuestos con su stock; los pedidos entran al mismo panel.",
      "El taller oficial atiende con turnos online: orden de trabajo → presupuesto → entrega, todo documentado.",
      "Cada cliente queda en el CRM con su historial: compras, services y consultas en una sola ficha.",
    ],
    shotsReales: [
      { titulo: "Su web viva — home", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1784816467/cauce/sistema/casos/vespa-bahia/njd1mvh6jme6u2mdijxv.png", href: "https://vespabahia.com.ar" },
      { titulo: "Catálogo de modelos", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1784816479/cauce/sistema/casos/vespa-bahia/kpcwuloet7dofde6nndw.png", href: "https://vespabahia.com.ar/modelos" },
      { titulo: "Tienda online oficial", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1784816492/cauce/sistema/casos/vespa-bahia/h4q2xybhjmqf4s8cakdm.png", href: "https://vespabahia.com.ar/tienda" },
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
    proceso: [
      "El piloto entra a la web, elige su número (el sistema le avisa cuáles están tomados) y completa sus datos.",
      "Paga la inscripción con MercadoPago; el comprobante le llega al mail al instante, sin nadie en el medio.",
      "El día de la carrera, el sensor en la pista marca partida y llegada: el tiempo se asocia solo al piloto en pista.",
      "Penalizaciones y descalificaciones se cargan al momento, y el resultado se publica en vivo.",
      "Entre eventos, el club publica sus salidas y noticias — con el asistente IA que las redacta.",
    ],
    shotsReales: [
      { titulo: "Su web viva — home", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1784815977/cauce/sistema/casos/vespa-club/lubeo0r4dfvaijamcc1n.png", href: "https://www.vespaclubbahiablanca.com.ar" },
      { titulo: "Inscripción a la Gymkhana", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1784816068/cauce/sistema/casos/vespa-club/pcevemhneiaaoksffd3k.png", href: "https://www.vespaclubbahiablanca.com.ar/gymkhana" },
      { titulo: "Noticias del club", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1784816013/cauce/sistema/casos/vespa-club/ek6xfz5nh4tpcnhkgngk.png", href: "https://www.vespaclubbahiablanca.com.ar/noticias" },
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
    shotsAdmin: [
      { titulo: "Dashboard", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1784830993/cauce/sistema/casos/zatiori-espejos/admin/dn2yzs9aatickp8l9wiw.png" },
      { titulo: "Pedidos", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1784830999/cauce/sistema/casos/zatiori-espejos/admin/dqmbeip0wtibdtzqvqr0.png" },
      { titulo: "Fábrica", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1784831004/cauce/sistema/casos/zatiori-espejos/admin/vzp2iuwau5fhvbtx3uvo.png" },
      { titulo: "Catálogo", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1784831009/cauce/sistema/casos/zatiori-espejos/admin/u6c40eoifgowfwsnxsu7.png" },
      { titulo: "Clientes", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1784831015/cauce/sistema/casos/zatiori-espejos/admin/gwx24xbppnmrxlymccvv.png" },
      { titulo: "Proveedores", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1784831020/cauce/sistema/casos/zatiori-espejos/admin/pyl5fsmahsoaztaw9fva.png" },
      { titulo: "Instagram", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1784831025/cauce/sistema/casos/zatiori-espejos/admin/dvncnya2lhcfki59nkwh.png" },
      { titulo: "Reseñas", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1784831030/cauce/sistema/casos/zatiori-espejos/admin/g8uxckpzs6hhzqd16vw0.png" },
    ],
    proceso: [
      "El cliente diseña su espejo en la web: madera, pátina, tallado y medidas — el precio se calcula solo.",
      "El pedido cae al panel con aviso por mail y sale el presupuesto en PDF numerado.",
      "Con la seña, pasa a la cola de fábrica: prioridades, responsable y fotos de producción.",
      "Terminado, se entrega y el saldo queda saldado en el sistema — o pasa directo al catálogo si es para stock.",
      "Al cliente le llega un link único para dejar su reseña con fotos, que aparece en la web al aprobarse.",
    ],
    shotsReales: [
      { titulo: "Su web viva — home", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1784816504/cauce/sistema/casos/zatiori-espejos/mlmisqslqzqwarwcijrf.png", href: "https://zatiori.vercel.app" },
      { titulo: "Catálogo de espejos", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1784816514/cauce/sistema/casos/zatiori-espejos/pncsrcqznpxpqdg85pyc.png", href: "https://zatiori.vercel.app/catalogo" },
    ],
  },
  {
    slug: "la-base",
    nombre: "La Base — Escuela de Ski & Snowboard",
    rubro: "Escuela de ski y snowboard · Cerro Catedral, Bariloche",
    logo: null,
    webUrl: "https://la-base-vespa-bahia.vercel.app/es",
    resumen:
      "Una escuela de montaña con más de 40 instructores, funcionando en 3 idiomas y 4 monedas: las reservas entran solas desde la web con disponibilidad real de instructores, y si no se pagan a tiempo, el cupo se libera automático.",
    resultados: [
      "Las reservas entran solas en 3 idiomas (español, inglés y portugués): el cliente elige clase, fecha e instructor libre, y si no paga a tiempo el cupo se libera automático.",
      "La caja cierra todos los días en 4 monedas (pesos, dólares, reales y euros) con cotizaciones historizadas, y el contador se baja todo en un CSV con un clic.",
      "Cada instructor entra con su usuario, ve su agenda y bloquea sus días; la escuela liquida las horas trabajadas sin planillas.",
      "El check-in es con QR: el cliente muestra el código, recepción ve al toque si debe plata y lo marca presente.",
    ],
    modulos: [
      { nombre: "Reservas online", detalle: "Wizard de 3 pasos con disponibilidad real de instructores y precio automático del tarifario." },
      { nombre: "Caja multimoneda", detalle: "Apertura y cierre diario en ARS/USD/BRL/EUR con cotizaciones historizadas." },
      { nombre: "Instructores", detalle: "Perfiles públicos, agenda propia, bolsa de postulantes y liquidaciones por horas." },
      { nombre: "CRM y lista de espera", detalle: "Toda consulta, reserva y postulación cae al CRM; espera por día cuando no hay cupo." },
      { nombre: "Parte de nieve en vivo", detalle: "El estado del cerro desde la fuente oficial del Catedral, con respaldo manual." },
    ],
    shotsSlug: "escuelaolas",
    shotsAdmin: [
      { titulo: "Dashboard", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1784831056/cauce/sistema/casos/la-base/admin/fiewjdvoxl1bfztwrgf1.png" },
      { titulo: "Hoy", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1784831063/cauce/sistema/casos/la-base/admin/ukwcygmoujia8qwdwtj3.png" },
      { titulo: "Calendario", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1784831074/cauce/sistema/casos/la-base/admin/iltxhuxdtugvcgs0zyo2.png" },
      { titulo: "Reservas", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1784831084/cauce/sistema/casos/la-base/admin/yyagkmiuwy1a1igzx5jo.png" },
      { titulo: "Check-in", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1784831090/cauce/sistema/casos/la-base/admin/dzcupl9nexntal4cn0xm.png" },
      { titulo: "Caja", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1784831098/cauce/sistema/casos/la-base/admin/reykfwzczqjzdb2svoai.png" },
      { titulo: "Lista de espera", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1784831106/cauce/sistema/casos/la-base/admin/rfo9hllpwoh9oqtdr4zr.png" },
      { titulo: "Rental", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1784831114/cauce/sistema/casos/la-base/admin/pj3tstqcyvkqji7892hr.png" },
      { titulo: "Instructores", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1784831123/cauce/sistema/casos/la-base/admin/mbo6w8qqyujsteoyafbs.png" },
      { titulo: "Bolsa", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1784831132/cauce/sistema/casos/la-base/admin/xyxsqkbipozsuguuz5yf.png" },
      { titulo: "Leads", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1784831140/cauce/sistema/casos/la-base/admin/tnuxl6jgh7nwamirdhmx.png" },
      { titulo: "Tarifas", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1784831147/cauce/sistema/casos/la-base/admin/qkjdnsdsjvfldzw4fl62.png" },
    ],
    shotsReales: [
      { titulo: "Su web viva — home", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1784829436/cauce/sistema/casos/la-base/fjzkktlzeavbx3hddfh1.png", href: "https://la-base-vespa-bahia.vercel.app/es" },
      { titulo: "Reservas online en 3 pasos", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1784829441/cauce/sistema/casos/la-base/coivsepyrcm7rt5klihe.png", href: "https://la-base-vespa-bahia.vercel.app/es/reservas" },
      { titulo: "Tarifas de la temporada", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1784829447/cauce/sistema/casos/la-base/avc5nizvgcwpy6t27xil.png", href: "https://la-base-vespa-bahia.vercel.app/es/tarifas" },
      { titulo: "Parte de nieve en vivo", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1784829453/cauce/sistema/casos/la-base/zajni0djpn7knam8psbi.png", href: "https://la-base-vespa-bahia.vercel.app/es/parte-de-nieve" },
    ],
    proceso: [
      "El cliente llega a la web en su idioma (se detecta solo) y ve las tarifas y el parte de nieve en vivo del cerro.",
      "Reserva en 3 pasos: clase, fecha y horario — el sistema le muestra solo los instructores realmente libres.",
      "La reserva queda pendiente de pago con su código; si no se paga a tiempo, el cupo se libera solo y avisa al de la lista de espera.",
      "El día de la clase, check-in con QR en recepción: saldo a la vista y presente marcado.",
      "Después de esquiar deja su reseña verificada con el código de la clase, que alimenta el perfil del instructor.",
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
    proceso: [
      "El anunciante consulta desde la web (que muestra la disponibilidad real de cada pantalla) o por WhatsApp.",
      "Se le asigna su lugar: pantalla, cantidad de spots y abono mensual — la ocupación se actualiza sola.",
      "Su spot rota en pantalla; el sistema sabe cuántos lugares quedan libres en cada punto del circuito.",
      "Del 1 al 5 de cada mes, el aviso de cobro sale armado por WhatsApp con el total de cada cliente.",
      "Cada pago entra a la caja diaria; el margen del negocio (contra proveedores y costos) se ve en el panel.",
    ],
  },
];

export function getCasoReal(slug: string): CasoReal | undefined {
  return CASOS_REALES.find((c) => c.slug === slug);
}
