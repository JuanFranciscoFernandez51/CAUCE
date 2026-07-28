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
  /** Documentos reales del sistema, descargables (con datos difuminados). */
  documentos?: { titulo: string; url: string }[];
  /** Automatizaciones: lo que pasa solo, como flujo encadenado. */
  automatizaciones?: { titulo: string; flujo: string[] }[];
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
    documentos: [
      { titulo: "Mandato de venta (PDF real)", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1785261796/cauce/sistema/casos/motos-fernandez/documentos/vozn33wfccqjjjywotco.png" },
      { titulo: "Boleto / orden de compra", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1785261797/cauce/sistema/casos/motos-fernandez/documentos/q6vsizlwla8evnvcj1ff.png" },
      { titulo: "Orden de trabajo del taller", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1785261798/cauce/sistema/casos/motos-fernandez/documentos/ipzvwzo4ho5emgtijd9f.png" },
    ],
    automatizaciones: [
      {
        titulo: "Entra una moto usada",
        flujo: [
          "Se carga el mandato de venta y el documento se descarga listo para firmar",
          "Queda en stock con su trazabilidad: propia, consignación o parte de pago",
          "Se publica en Instagram con un solo botón",
          "Y en Mercado Libre igual: un clic y está publicada",
        ],
      },
      {
        titulo: "Se concreta una venta",
        flujo: [
          "El boleto sale en PDF con permutas, pagos combinados y cuotas propias",
          "El cliente queda en el CRM con toda su historia",
          "Los vencimientos de cuotas y avisos de mora se controlan solos",
        ],
      },
      {
        titulo: "Después de la venta",
        flujo: [
          "A los 6 meses, el recordatorio de service sale solo por WhatsApp",
          "A los 10 días, encuesta de satisfacción automática",
          "Todo queda registrado en la ficha del cliente",
        ],
      },
      {
        titulo: "Entra una consulta",
        flujo: [
          "De la web, el catálogo o las campañas cae como lead al CRM",
          "Se responde por WhatsApp con un clic",
          "Nada queda perdido en el teléfono de nadie",
        ],
      },
    ],
    shotsSlug: "bahiamotos",
    shotsAdmin: [
      { titulo: "Dashboard", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1785161802/cauce/sistema/casos/motos-fernandez/admin-full/ixvlghlwc8igfh3mcxub.png" },
      { titulo: "Stock de motos", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1785161808/cauce/sistema/casos/motos-fernandez/admin-full/b4agcbcqwyy6tf5cjyxu.png" },
      { titulo: "Mandatos de venta", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1785161816/cauce/sistema/casos/motos-fernandez/admin-full/cwoqckr2fiuhhurpwj2u.png" },
      { titulo: "Cargar mandato (documento descargable)", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1785161820/cauce/sistema/casos/motos-fernandez/admin-full/mwt7rvtkdqjrxywmnrjv.png" },
      { titulo: "Órdenes de compra (boleto)", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1785161826/cauce/sistema/casos/motos-fernandez/admin-full/btthxnwbr6i6ccyglldw.png" },
      { titulo: "Presupuestos", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1785161831/cauce/sistema/casos/motos-fernandez/admin-full/khemr7iwv5db6ab4itsg.png" },
      { titulo: "Financiación propia", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1785161836/cauce/sistema/casos/motos-fernandez/admin-full/itffpqebnjkf6ikqwkpw.png" },
      { titulo: "Tesorería", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1785161841/cauce/sistema/casos/motos-fernandez/admin-full/bcqx0qqjv6wscxmedqqc.png" },
      { titulo: "Cuotas y vencimientos", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1785161849/cauce/sistema/casos/motos-fernandez/admin-full/le9p23ofnxu1gokakvrd.png" },
      { titulo: "Taller — órdenes de trabajo", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1785161854/cauce/sistema/casos/motos-fernandez/admin-full/npfaq7hjnywtucys5x04.png" },
      { titulo: "Turnos del taller", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1785161859/cauce/sistema/casos/motos-fernandez/admin-full/jlyfk8g9wdfoedpaz3v0.png" },
      { titulo: "Calendario", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1785161864/cauce/sistema/casos/motos-fernandez/admin-full/mirmtk5rj3pt6duazdnk.png" },
      { titulo: "Modelos 0KM", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1785161869/cauce/sistema/casos/motos-fernandez/admin-full/yyijp840srfbehireg0c.png" },
      { titulo: "Productos de la tienda", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1785161875/cauce/sistema/casos/motos-fernandez/admin-full/io0wvel07rjpzbvpprut.png" },
      { titulo: "Pedidos de la tienda", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1785161881/cauce/sistema/casos/motos-fernandez/admin-full/bfglx6bilvpn7d30ay6z.png" },
      { titulo: "Cupones de descuento", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1785161886/cauce/sistema/casos/motos-fernandez/admin-full/tzfmvnscnjqhuuveupv7.png" },
      { titulo: "Promociones", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1785161891/cauce/sistema/casos/motos-fernandez/admin-full/abib5auvb7apuxpdxmj1.png" },
      { titulo: "CRM / Leads", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1785161897/cauce/sistema/casos/motos-fernandez/admin-full/rhcih8o3461wbbczrm28.png" },
      { titulo: "Clientes", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1785161906/cauce/sistema/casos/motos-fernandez/admin-full/gfcq1ka7qmdw96pe5f9t.png" },
      { titulo: "Outreach — avisos por WhatsApp", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1785161911/cauce/sistema/casos/motos-fernandez/admin-full/mhnag8gqjfcqrawazmv6.png" },
      { titulo: "Instagram — publicar con un botón", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1785161916/cauce/sistema/casos/motos-fernandez/admin-full/spv4yuasztpnih7rbo80.png" },
      { titulo: "Calendario de publicaciones", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1785161921/cauce/sistema/casos/motos-fernandez/admin-full/b8poghbbr8oxpmoxr8fs.png" },
      { titulo: "Meta Ads desde el panel", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1785161928/cauce/sistema/casos/motos-fernandez/admin-full/ljbcjfpoyx7ywsvwhxgy.png" },
      { titulo: "Mercado Libre — publicar con un botón", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1785161933/cauce/sistema/casos/motos-fernandez/admin-full/mu1ss0qyyoiic332keg5.png" },
      { titulo: "Noticias / blog", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1785161938/cauce/sistema/casos/motos-fernandez/admin-full/xrdiwlbljgiishwbkcy3.png" },
      { titulo: "Newsletter", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1785161942/cauce/sistema/casos/motos-fernandez/admin-full/exmvwiub5vs1gsi75k6c.png" },
      { titulo: "Testimonios", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1785161946/cauce/sistema/casos/motos-fernandez/admin-full/tlneq4bbqzufu4hnbbg1.png" },
      { titulo: "Finanzas", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1785161951/cauce/sistema/casos/motos-fernandez/admin-full/wtjjzy2uaumkcihbc0cr.png" },
      { titulo: "Finanzas — libro de movimientos", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1785161956/cauce/sistema/casos/motos-fernandez/admin-full/woegzorrr0cguxcxyrfq.png" },
      { titulo: "Finanzas — matriz anual", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1785161961/cauce/sistema/casos/motos-fernandez/admin-full/fgbqq90kb4menahskivh.png" },
      { titulo: "Finanzas — cuentas y cheques", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1785161967/cauce/sistema/casos/motos-fernandez/admin-full/yxadjmvnw9tundnsvmom.png" },
      { titulo: "Finanzas — costos fijos", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1785161971/cauce/sistema/casos/motos-fernandez/admin-full/vjdhsbzec6u3ps9aiy12.png" },
      { titulo: "Para el contador", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1785161976/cauce/sistema/casos/motos-fernandez/admin-full/mxggzm7toszkeul541rj.png" },
      { titulo: "Facturación (ARCA)", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1785161981/cauce/sistema/casos/motos-fernandez/admin-full/amuc6ymplqn94anedjfr.png" },
      { titulo: "Proveedores", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1785161986/cauce/sistema/casos/motos-fernandez/admin-full/o3lbppk5ycfxues34alf.png" },
      { titulo: "Sistema — procesos automáticos", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1785161993/cauce/sistema/casos/motos-fernandez/admin-full/codw5qqjnsecvhh11pb8.png" },
      { titulo: "Asistente IA", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1785161998/cauce/sistema/casos/motos-fernandez/admin-full/fq4u8g4nlz8swmcrfrnh.png" },
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
    automatizaciones: [
      {
        titulo: "Se concreta una venta",
        flujo: [
          "La factura oficial (ARCA) se emite desde el mismo sistema, con CAE y QR",
          "El movimiento cae a Finanzas: el resultado del mes se actualiza solo",
          "El cliente queda en el CRM con su compra",
        ],
      },
      {
        titulo: "Piden un test ride en la web",
        flujo: [
          "El interesado elige la moto y el horario",
          "Cae como lead caliente en el panel",
          "Se confirma por WhatsApp con un clic",
        ],
      },
      {
        titulo: "Compran en la tienda online",
        flujo: [
          "Pago online y pedido directo al panel",
          "Confirmación por email automática",
          "El stock se descuenta solo, por unidad física",
        ],
      },
    ],
    shotsSlug: "vespabahia",
    shotsAdmin: [
      { titulo: "Dashboard", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1785162015/cauce/sistema/casos/vespa-bahia/admin-full/splcyzh8icklxy8fw1cl.png" },
      { titulo: "Tareas pendientes", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1785162021/cauce/sistema/casos/vespa-bahia/admin-full/pmftktno150a1n0wj3b2.png" },
      { titulo: "Stock por unidad física", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1785162028/cauce/sistema/casos/vespa-bahia/admin-full/lzoyvxllf7qleofywcpk.png" },
      { titulo: "Vendidas", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1785162043/cauce/sistema/casos/vespa-bahia/admin-full/rqqiwipy0e2dhi1dxxd6.png" },
      { titulo: "Cargar stock desde factura", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1785162049/cauce/sistema/casos/vespa-bahia/admin-full/byw2kjmpym4jguqegph8.png" },
      { titulo: "Mandatos de venta", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1785162054/cauce/sistema/casos/vespa-bahia/admin-full/fkdisvpidygxryel9pdj.png" },
      { titulo: "Órdenes de compra (boleto)", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1785162060/cauce/sistema/casos/vespa-bahia/admin-full/c91lr8rlmeuvumxssrjn.png" },
      { titulo: "Presupuestos", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1785162064/cauce/sistema/casos/vespa-bahia/admin-full/ozoyds7u346gmzqchwhl.png" },
      { titulo: "Taller — órdenes de trabajo", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1785162069/cauce/sistema/casos/vespa-bahia/admin-full/tkfk9pyiivzmmfb0eezp.png" },
      { titulo: "Turnos del taller", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1785162074/cauce/sistema/casos/vespa-bahia/admin-full/ceh8mh4wsq7qgxb5riha.png" },
      { titulo: "Test rides agendados desde la web", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1785162079/cauce/sistema/casos/vespa-bahia/admin-full/fguewzz9jtbodfiomxgh.png" },
      { titulo: "Calendario", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1785162084/cauce/sistema/casos/vespa-bahia/admin-full/jkxlbafoqi9orzjyxqh6.png" },
      { titulo: "Modelos", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1785162090/cauce/sistema/casos/vespa-bahia/admin-full/voqq6uwcpii8fan97vkv.png" },
      { titulo: "Productos de la tienda", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1785162095/cauce/sistema/casos/vespa-bahia/admin-full/tlglgobs0cjipmyl8cov.png" },
      { titulo: "Pedidos de la tienda", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1785162102/cauce/sistema/casos/vespa-bahia/admin-full/pgixlcvahyqxwpiltwa8.png" },
      { titulo: "Cupones", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1785162106/cauce/sistema/casos/vespa-bahia/admin-full/xh922rxjtnp1g68hzsdm.png" },
      { titulo: "Promociones", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1785162111/cauce/sistema/casos/vespa-bahia/admin-full/rg0g9mkm3jxb7roplxzb.png" },
      { titulo: "Hot Sale", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1785162116/cauce/sistema/casos/vespa-bahia/admin-full/xggmyiqabro1uazpmelj.png" },
      { titulo: "CRM / Leads", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1785162121/cauce/sistema/casos/vespa-bahia/admin-full/ykb3uduqzu6tfyfzoayx.png" },
      { titulo: "Clientes", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1785162126/cauce/sistema/casos/vespa-bahia/admin-full/w9hvvuqsyvmc1w4x6khg.png" },
      { titulo: "Finanzas — resumen general", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1785162131/cauce/sistema/casos/vespa-bahia/admin-full/jgch9mjgng45hbltycy4.png" },
      { titulo: "Finanzas — libro de movimientos", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1785162137/cauce/sistema/casos/vespa-bahia/admin-full/tes1gudhluuo7ewnd5ix.png" },
      { titulo: "Finanzas — matriz anual", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1785162143/cauce/sistema/casos/vespa-bahia/admin-full/iyuxhedvcrbrfkudjz4z.png" },
      { titulo: "Finanzas — cartera", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1785162148/cauce/sistema/casos/vespa-bahia/admin-full/yf44wb3kxchs3ep4aruu.png" },
      { titulo: "Finanzas — costos fijos", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1785162153/cauce/sistema/casos/vespa-bahia/admin-full/xuspfkupqxgstzejflxv.png" },
      { titulo: "Facturación (ARCA)", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1785162158/cauce/sistema/casos/vespa-bahia/admin-full/wsgn9ito9uxchh43wa3t.png" },
      { titulo: "Tesorería", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1785162163/cauce/sistema/casos/vespa-bahia/admin-full/k2yl1ahtwlq14jufq97r.png" },
      { titulo: "Códigos QR", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1785162167/cauce/sistema/casos/vespa-bahia/admin-full/hrlhn3f4bg1o4ghtfuj3.png" },
      { titulo: "Noticias", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1785162172/cauce/sistema/casos/vespa-bahia/admin-full/sqkrlq3kpzs3ellcspkg.png" },
      { titulo: "Proveedores", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1785162176/cauce/sistema/casos/vespa-bahia/admin-full/xudm9xuuzz1drz7bhhqv.png" },
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
    automatizaciones: [
      {
        titulo: "Día de Gymkhana",
        flujo: [
          "El cronómetro con sensor toma los tiempos solo, sin planilleros",
          "El ranking se actualiza en vivo",
          "Inscripción y acreditación desde la web, sin filas",
        ],
      },
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
    automatizaciones: [
      {
        titulo: "El cliente diseña su espejo en la web",
        flujo: [
          "El configurador calcula el precio según medidas y opciones",
          "Genera el pedido y el presupuesto PDF numerado",
          "Aviso automático por email al taller",
        ],
      },
      {
        titulo: "Se señala el pedido",
        flujo: [
          "Pasa a la cola de fábrica con su prioridad",
          "Fotos de avance en cada etapa",
          "Terminado → publicado en el catálogo con un clic",
        ],
      },
      {
        titulo: "Se entrega",
        flujo: [
          "El cliente recibe un link único para dejar su reseña con fotos",
          "Se aprueba y aparece en la web",
          "Las publicaciones de Instagram programadas salen solas, todos los días",
        ],
      },
    ],
    shotsSlug: "zatiori",
    shotsAdmin: [
      { titulo: "Dashboard", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1785162193/cauce/sistema/casos/zatiori-espejos/admin-full/wcgka9wkeaaolxu0og9f.png" },
      { titulo: "Pedidos — pipeline de 6 estados", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1785162198/cauce/sistema/casos/zatiori-espejos/admin-full/tqg6uwgweahgufjd3qhz.png" },
      { titulo: "Cargar pedido a medida", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1785162203/cauce/sistema/casos/zatiori-espejos/admin-full/aqrqylmdee0d1tor8zud.png" },
      { titulo: "Cola de fábrica", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1785162209/cauce/sistema/casos/zatiori-espejos/admin-full/ytugiyd9fxzphogxs6gs.png" },
      { titulo: "Catálogo", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1785162216/cauce/sistema/casos/zatiori-espejos/admin-full/gqe36wddatzcx0uehjdf.png" },
      { titulo: "Publicar espejo", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1785162221/cauce/sistema/casos/zatiori-espejos/admin-full/lbvff0pqbdajcqwswji9.png" },
      { titulo: "Clientes", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1785162227/cauce/sistema/casos/zatiori-espejos/admin-full/eyrdhga9xfxjzu2jdchw.png" },
      { titulo: "Proveedores", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1785162232/cauce/sistema/casos/zatiori-espejos/admin-full/jnfw3gct8pkjhl2vh2nj.png" },
      { titulo: "Instagram automático", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1785162237/cauce/sistema/casos/zatiori-espejos/admin-full/eqpgv6y1uiqvmtza8iis.png" },
      { titulo: "Reseñas verificadas", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1785162242/cauce/sistema/casos/zatiori-espejos/admin-full/z8mvnwnyn4ojeqpgls7f.png" },
      { titulo: "Configuración", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1785162247/cauce/sistema/casos/zatiori-espejos/admin-full/r3ce6vfxdcqloh5s4f7z.png" },
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
    automatizaciones: [
      {
        titulo: "Reservan una clase desde la web",
        flujo: [
          "El wizard muestra solo instructores realmente libres (sin doble reserva)",
          "Si no se paga a tiempo, el cupo se libera solo",
          "Pagada → QR de check-in al alumno",
        ],
      },
      {
        titulo: "Llega el alumno",
        flujo: [
          "Recepción escanea el QR: presente marcado y saldo a la vista",
          "El parte de 'Hoy' se arma solo con todas las clases del día",
          "La caja registra en 4 monedas con la cotización del día",
        ],
      },
      {
        titulo: "Un día se llena",
        flujo: [
          "La demanda no se pierde: entra a la lista de espera",
          "Se libera un cupo → se llama en orden",
          "Los postulantes de 'Trabajá con nosotros' pasan a instructores con un clic",
        ],
      },
    ],
    shotsSlug: "escuelaolas",
    shotsAdmin: [
      { titulo: "Dashboard", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1785162265/cauce/sistema/casos/la-base/admin-full/vrbmssexogis2ug9vl6j.png" },
      { titulo: "Hoy — el parte del día", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1785162272/cauce/sistema/casos/la-base/admin-full/wptgltrtdbomac6xvh84.png" },
      { titulo: "Calendario del mes", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1785162281/cauce/sistema/casos/la-base/admin-full/vfsjkm62i3rbiq7f0ro3.png" },
      { titulo: "Reservas", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1785162291/cauce/sistema/casos/la-base/admin-full/lk0f2mk7gtuncvvq5jfg.png" },
      { titulo: "Cargar reserva", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1785162298/cauce/sistema/casos/la-base/admin-full/kkknstjzoarnaw8updgx.png" },
      { titulo: "Check-in con QR", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1785162304/cauce/sistema/casos/la-base/admin-full/a4re5rgzymsv1tt43dtg.png" },
      { titulo: "Caja en 4 monedas", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1785162312/cauce/sistema/casos/la-base/admin-full/arpjgot7xmvrqhfazqos.png" },
      { titulo: "Lista de espera", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1785162320/cauce/sistema/casos/la-base/admin-full/astmxa9dq37ir8qaduwm.png" },
      { titulo: "Rental de equipos", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1785162329/cauce/sistema/casos/la-base/admin-full/f6taq1t4el2wjcnwjfe7.png" },
      { titulo: "Instructores", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1785162337/cauce/sistema/casos/la-base/admin-full/ruadjbhrucnprrnzrewz.png" },
      { titulo: "Mi agenda (vista del instructor)", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1785162344/cauce/sistema/casos/la-base/admin-full/k80pu0w2drhs0tweeuz5.png" },
      { titulo: "Liquidaciones de instructores", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1785162352/cauce/sistema/casos/la-base/admin-full/glkcitbfxibgrsxasywd.png" },
      { titulo: "Bolsa de trabajo", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1785162361/cauce/sistema/casos/la-base/admin-full/yb0yqnk8cjao9y4n10mi.png" },
      { titulo: "Leads", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1785162369/cauce/sistema/casos/la-base/admin-full/wui6dcsq7nvhwvups0jy.png" },
      { titulo: "Tarifas de temporada", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1785162376/cauce/sistema/casos/la-base/admin-full/k27y6441lmlikcoy4lsu.png" },
      { titulo: "Temporada", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1785162384/cauce/sistema/casos/la-base/admin-full/o0qaa9lyudzk9rxxpvnm.png" },
      { titulo: "Noticias", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1785162391/cauce/sistema/casos/la-base/admin-full/am7dptbr6t6zty66ki7a.png" },
      { titulo: "Auditoría — quién hizo qué", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1785162401/cauce/sistema/casos/la-base/admin-full/jdxs10w6odbtq67ldn75.png" },
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
    automatizaciones: [
      {
        titulo: "Se firma un contrato de pantalla",
        flujo: [
          "El cliente queda cargado con sus espacios y su abono",
          "Del 1 al 5 de cada mes, el aviso de cobro sale solo por WhatsApp",
          "El pago cae al libro de Finanzas y la disponibilidad se actualiza en la web",
        ],
      },
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
