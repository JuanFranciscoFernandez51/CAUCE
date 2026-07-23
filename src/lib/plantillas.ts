/**
 * PLANTILLAS GUARDADAS — el arsenal de Cauce.
 * Cada plantilla es una sección/feature probada en un proyecto real, lista para
 * aplicar a proyectos nuevos. "En el OS" = ya existe como módulo de Cauce OS;
 * "Para portar" = vive en el repo de origen y se porta a pedido.
 */

export type Plantilla = {
  key: string;
  nombre: string;
  categoria: "finanzas" | "ventas" | "operaciones" | "clientes" | "marketing" | "eventos" | "web";
  origen: string; // proyecto real donde funciona
  queHace: string;
  incluye: string[];
  estado: "en-el-os" | "para-portar";
  /** Dónde vive el código de referencia. */
  rutaOrigen?: string;
};

export const PLANTILLAS: Plantilla[] = [
  // ── FINANZAS ──
  {
    key: "finanzas-completa",
    nombre: "Finanzas completa (LA base de finanzas)",
    categoria: "finanzas",
    origen: "Vespa Bahía",
    queHace:
      "La carpeta de finanzas estándar: no solo libro de caja — posición patrimonial completa. Es EL formato para todo panel de finanzas nuevo.",
    incluye: [
      "Libro diario editable estilo planilla (click en cualquier celda)",
      "Resumen mensual por categoría con margen % + export Excel para el contador",
      "Dashboard anual: matriz 12 meses con acumulado y gráfico",
      "Cuentas ARS/USD con saldo calculado + cuenta excluible del resultado",
      "Cheques y cuentas a cobrar/pagar con cierre de círculo a caja",
      "Costos fijos con punto de equilibrio",
      "Importar extracto bancario con IA (preview editable)",
      "Transferencias de dos patas, con cambio de divisa",
    ],
    estado: "para-portar",
    rutaOrigen: "VESPA BAHIA/WEB NUEVA VESPA BAHIA/vespa-bahia → src/app/admin/(dashboard)/finanzas",
  },
  {
    key: "facturacion-arca",
    nombre: "Facturación ARCA (WSFE)",
    categoria: "finanzas",
    origen: "Vespa Bahía / Motos Fernández",
    queHace:
      "Factura electrónica oficial desde el mismo sistema donde se carga la venta: CAE, PDF con QR de ARCA, sin tipear dos veces.",
    incluye: [
      "Emisión WSFE con CAE",
      "PDF de factura con QR oficial",
      "Numeración por punto de venta",
      "Gotcha resuelto: TLS SECLEVEL=1 para el WS de ARCA",
    ],
    estado: "para-portar",
    rutaOrigen: "Facturador WSFE validado (falta emisión real de CAE en prod)",
  },
  {
    key: "caja-multimoneda",
    nombre: "Caja multimoneda",
    categoria: "finanzas",
    origen: "La Base (Bariloche)",
    queHace:
      "Apertura y cierre diario en varias monedas (ARS/USD/BRL/EUR) con cotizaciones historizadas y diferencias por moneda.",
    incluye: ["Cotizaciones editables con historial", "Equivalente ARS por pago", "Cierre con diferencias", "Export CSV para el contador"],
    estado: "para-portar",
    rutaOrigen: "LA BASE/la-base → admin/caja + modelos Payment/ExchangeRate/CashRegister",
  },
  // ── VENTAS ──
  {
    key: "ventas-boleto",
    nombre: "Ventas con boleto, permutas y cuotas",
    categoria: "ventas",
    origen: "Motos Fernández / Vespa Bahía",
    queHace:
      "La venta grande de punta a punta: pagos combinados (efectivo+transferencia+USD+cheque), permutas múltiples, financiación propia y boleto en PDF.",
    incluye: ["Orden de compra numerada", "Pagos combinados", "Permutas", "Cuotas propias con vencimientos y mora", "Boleto PDF"],
    estado: "en-el-os",
    rutaOrigen: "Cauce OS → módulo Ventas (versión completa en MF/Vespa)",
  },
  {
    key: "configurador-a-medida",
    nombre: "Configurador de producto a medida",
    categoria: "ventas",
    origen: "Zatiori Espejos",
    queHace:
      "El cliente diseña su producto en la web (opciones con precio adicional, medidas libres) y genera un pedido real con precio calculado.",
    incluye: ["Opciones con precio", "Medidas con rango", "Pedido + aviso por mail", "Presupuesto PDF numerado"],
    estado: "para-portar",
    rutaOrigen: "zatiori/CLAUDE CODE ZATIORIO → configurador + pedidos",
  },
  {
    key: "catalogo-tienda",
    nombre: "Catálogo + tienda online",
    categoria: "ventas",
    origen: "Vespa Bahía / Motos Fernández",
    queHace:
      "Catálogo público de productos con stock real y tienda con carrito. En Vespa: stock por unidad física (chasis único) separado del modelo.",
    incluye: ["Catálogo con filtros", "Stock por unidad o por talle", "Carrito", "Checkout MercadoPago (donde aplica)"],
    estado: "en-el-os",
    rutaOrigen: "Cauce OS → módulo Catálogo (versión tienda completa en Vespa)",
  },
  // ── OPERACIONES ──
  {
    key: "taller-ots",
    nombre: "Taller / órdenes de trabajo",
    categoria: "operaciones",
    origen: "Motos Fernández / Vespa Bahía",
    queHace: "Ingreso → diagnóstico → presupuesto → listo → entregado, con fotos, saldo y OT imprimible.",
    incluye: ["Estados con avance en la lista", "Presupuesto → OT en 1 clic", "Aviso 'listo para retirar' por WhatsApp", "OT PDF con marca"],
    estado: "en-el-os",
    rutaOrigen: "Cauce OS → módulo Taller",
  },
  {
    key: "cola-fabrica",
    nombre: "Cola de fábrica / producción",
    categoria: "operaciones",
    origen: "Zatiori Espejos",
    queHace: "Órdenes de fabricación con prioridad, responsable, fotos de producción y pase directo a catálogo.",
    incluye: ["Prioridades", "Orden de fabricación PDF", "Fotos de avance", "Fabricado → publicado en 1 clic"],
    estado: "para-portar",
    rutaOrigen: "zatiori → panel/fabrica",
  },
  {
    key: "reservas-disponibilidad",
    nombre: "Reservas con disponibilidad real por recurso",
    categoria: "operaciones",
    origen: "La Base (Bariloche)",
    queHace:
      "Wizard de reserva que muestra solo los recursos (instructores/canchas/boxes) realmente libres, con anti-doble-reserva y cupos que se liberan solos si no se paga.",
    incluye: ["Chequeo de solapamiento por recurso", "Regla de expiración con cron", "Lista de espera", "Check-in con QR"],
    estado: "para-portar",
    rutaOrigen: "LA BASE → BookingWizard + api/instructores-disponibles + cron liberar-cupos",
  },
  {
    key: "pantallas-disponibilidad",
    nombre: "Inventario de espacios con disponibilidad (pantallas, cocheras, boxes)",
    categoria: "operaciones",
    origen: "Ave Fénix Publicidad",
    queHace: "Espacios con capacidad fija (30 spots por pantalla), contratos por cliente, ocupación en vivo también en la web pública.",
    incluye: ["Barra de ocupación por espacio", "Capacidad validada", "Aviso de cobro mensual 1-5", "Disponibilidad pública en vivo"],
    estado: "en-el-os",
    rutaOrigen: "Cauce OS → módulo Pantallas",
  },
  // ── CLIENTES ──
  {
    key: "postventa-automatica",
    nombre: "Post-venta automática (service + encuesta)",
    categoria: "clientes",
    origen: "Motos Fernández",
    queHace: "A los N meses de la compra, el aviso de service sale solo por WhatsApp; a los 10 días, encuesta de satisfacción. El mensaje que más plata recupera.",
    incluye: ["Recordatorio de service", "Encuesta NPS", "Todo registrado en la ficha del cliente"],
    estado: "en-el-os",
    rutaOrigen: "Cauce OS → proceso 'Recordatorio de service' (versión completa en MF)",
  },
  {
    key: "resenas-verificadas",
    nombre: "Reseñas verificadas por código",
    categoria: "clientes",
    origen: "Zatiori / La Base",
    queHace: "Solo puede opinar quien realmente compró/tomó la clase, con un link único. Se aprueban y aparecen en la web.",
    incluye: ["Link único por cliente/reserva", "Estrellas + texto + fotos", "Moderación", "Publicación en la web"],
    estado: "para-portar",
    rutaOrigen: "zatiori → resena/[token] · la-base → resenas por código",
  },
  {
    key: "bolsa-postulantes",
    nombre: "Bolsa de postulantes → contratación 1-clic",
    categoria: "clientes",
    origen: "La Base (Bariloche)",
    queHace: "Formulario público 'Trabajá con nosotros' que alimenta un pipeline; el postulante se convierte en empleado/recurso con un clic.",
    incluye: ["Form público", "Pipeline NUEVO→CONTRATADO", "Alta de recurso automática"],
    estado: "para-portar",
    rutaOrigen: "LA BASE → api/postulantes + admin/bolsa",
  },
  {
    key: "ocr-documentos",
    nombre: "Carga por foto (OCR de DNI, títulos, facturas)",
    categoria: "clientes",
    origen: "Motos Fernández / Vespa Bahía",
    queHace: "Sacás una foto al DNI o a la factura del proveedor y la IA carga los datos sola — clientes sin tipear, precios sin calcular.",
    incluye: ["OCR de DNI/cédula", "Escaneo de facturas con precios sugeridos", "Preview editable antes de guardar"],
    estado: "para-portar",
    rutaOrigen: "MF → captura asistida · Vespa → escaneo-documentos.ts",
  },
  // ── MARKETING ──
  {
    key: "publicador-ig-ads",
    nombre: "Publicador de Instagram + Meta Ads desde el panel",
    categoria: "marketing",
    origen: "Motos Fernández / Zatiori / Cauce",
    queHace: "Publicaciones programadas que salen solas (cron + Meta API) y campañas de Meta Ads armadas desde el propio sistema.",
    incluye: ["Feed programado", "Publicación automática vía API", "Armador de campañas con público y presupuesto", "Captions con IA"],
    estado: "en-el-os",
    rutaOrigen: "Cauce → admin/marketing (por tenant: portar conexión)",
  },
  {
    key: "analitica-propia",
    nombre: "Analítica propia (sin Google)",
    categoria: "marketing",
    origen: "Zatiori / Vespa Club",
    queHace: "Visitas, clics a WhatsApp/IG y conversiones medidas por el propio sistema, con ciudades y países en el dashboard.",
    incluye: ["Pageviews propios", "Clics a WhatsApp/IG", "Top ciudades/países", "Sin cookies de terceros"],
    estado: "para-portar",
    rutaOrigen: "zatiori → EventoWeb · vespa-club → modelo Visit",
  },
  // ── EVENTOS ──
  {
    key: "cronometro-gymkhana",
    nombre: "Cronómetro de competencia (Gymkhana)",
    categoria: "eventos",
    origen: "Vespa Club Bahía Blanca",
    queHace:
      "Cronometraje de carrera real: sensor Arduino en pista manda partida/llegada a la web, con penalizaciones, descalificaciones y resultados en vivo para proyectar.",
    incluye: ["Endpoint para sensor físico (Arduino + token)", "Asociación automática piloto en pista", "Penalizaciones y DSQ", "Ranking público en vivo"],
    estado: "en-el-os",
    rutaOrigen: "Cauce OS → módulo Eventos (sensor físico: vespa-club → api/gymkhana/sensor)",
  },
  {
    key: "inscripcion-paga",
    nombre: "Inscripción a eventos con pago online",
    categoria: "eventos",
    origen: "Vespa Club Bahía Blanca",
    queHace: "El participante elige su número (con chequeo en vivo), se inscribe, paga con MercadoPago y el comprobante le llega solo por mail.",
    incluye: ["Elección de número en vivo", "MercadoPago + webhook", "Comprobante por email", "Reservas con TTL de 30 min"],
    estado: "para-portar",
    rutaOrigen: "vespa-club → /gymkhana + webhook MP",
  },
  // ── WEB ──
  {
    key: "web-multiidioma",
    nombre: "Web multi-idioma liviana",
    categoria: "web",
    origen: "La Base (es/en/pt)",
    queHace: "Sitio en varios idiomas sin librerías pesadas: detección por navegador, diccionarios simples y SEO internacional (hreflang) automático.",
    incluye: ["Detección de idioma", "Diccionarios TS", "hreflang/SEO", "Ideal turismo y export"],
    estado: "para-portar",
    rutaOrigen: "LA BASE → lib/i18n.ts + middleware",
  },
  {
    key: "dato-externo-fallback",
    nombre: "Widget de dato externo con respaldo manual",
    categoria: "web",
    origen: "La Base (parte de nieve del Catedral)",
    queHace: "Un dato de una API de terceros (clima, cotización, estado del cerro) cacheado, que si se cae usa valores cargados a mano en el admin.",
    incluye: ["Cache 30 min", "Fallback editable", "Fuente oficial citada"],
    estado: "para-portar",
    rutaOrigen: "LA BASE → lib/parte-nieve.ts",
  },
  {
    key: "web-disponibilidad-viva",
    nombre: "Web conectada al sistema (disponibilidad en vivo)",
    categoria: "web",
    origen: "Ave Fénix",
    queHace: "La web pública no es un folleto: muestra datos vivos del sistema (lugares libres, stock, turnos disponibles).",
    incluye: ["Datos del OS en la web", "Se actualiza solo", "Urgencia real ('quedan 3 lugares')"],
    estado: "en-el-os",
    rutaOrigen: "Cauce OS → template dooh + sitio por tenant",
  },
];

export const CATEGORIA_LABELS: Record<Plantilla["categoria"], string> = {
  finanzas: "💸 Finanzas",
  ventas: "🤝 Ventas",
  operaciones: "⚙️ Operaciones",
  clientes: "👥 Clientes",
  marketing: "📣 Marketing",
  eventos: "⏱️ Eventos",
  web: "🌐 Web",
};

// ── SECCIONES GUARDADAS, UNA POR UNA ─────────────────────────────────────
// Cada pantalla real capturada de los sistemas que ya funcionan, con qué es.
// La referencia visual del estándar: "algo así de bien hecho, de una".

export type SeccionGuardada = {
  sistema: string;
  titulo: string;
  url: string; // captura real (datos sensibles difuminados)
  queEs: string;
};

export const SECCIONES_GUARDADAS: SeccionGuardada[] = [
  // ── Motos Fernández ──
  { sistema: "Motos Fernández", titulo: "Dashboard", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1784830893/cauce/sistema/casos/motos-fernandez/admin/tspablp2tjuzhhg8h2lk.png", queEs: "El pulso del negocio al abrir: ventas, leads, tareas del día y accesos directos a lo que quema." },
  { sistema: "Motos Fernández", titulo: "CRM / Leads", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1784830900/cauce/sistema/casos/motos-fernandez/admin/hf3gzwjewwe7kdtphmqv.png", queEs: "Todos los interesados de todos los canales (web, WhatsApp, IG, mostrador) en una lista con estado y seguimiento." },
  { sistema: "Motos Fernández", titulo: "Pedidos", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1784830907/cauce/sistema/casos/motos-fernandez/admin/igawld0rorgbkgtidtny.png", queEs: "Los pedidos de la tienda online con su estado, pago y envío — de la compra al despacho." },
  { sistema: "Motos Fernández", titulo: "Finanzas", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1784830911/cauce/sistema/casos/motos-fernandez/admin/sznj900vvmtpgxwok2j1.png", queEs: "La carpeta de finanzas de la concesionaria: libro, resultados y posición — hermana del formato Vespa." },
  { sistema: "Motos Fernández", titulo: "Outreach", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1784830916/cauce/sistema/casos/motos-fernandez/admin/l0n5tkwqfumlgxzzsj5y.png", queEs: "La bandeja de 'para hoy': recordatorios de service, seguimientos y avisos con el WhatsApp armado a un clic." },
  { sistema: "Motos Fernández", titulo: "Asistente IA", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1784830921/cauce/sistema/casos/motos-fernandez/admin/ybzayepnoau2ixvurzjo.png", queEs: "Chat con IA adentro del panel que opera el sistema: consulta datos, redacta y ejecuta acciones del negocio." },
  // ── Vespa Bahía ──
  { sistema: "Vespa Bahía", titulo: "Dashboard", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1784830941/cauce/sistema/casos/vespa-bahia/admin/dpitxghle0kmb2nzk00p.png", queEs: "Panel de control del concesionario oficial: stock, ventas del mes y lo pendiente, en una pantalla." },
  { sistema: "Vespa Bahía", titulo: "Tareas pendientes", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1784830946/cauce/sistema/casos/vespa-bahia/admin/ymnbcg6h6bhydbuuyh9f.png", queEs: "El checklist operativo del negocio: nada queda en la cabeza de nadie, todo con responsable y estado." },
  { sistema: "Vespa Bahía", titulo: "Pedidos", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1784830952/cauce/sistema/casos/vespa-bahia/admin/jcdgz0ja1cryh4vbkptu.png", queEs: "Pedidos de la tienda online (cascos, ropa, repuestos) con pago y estado de entrega." },
  { sistema: "Vespa Bahía", titulo: "Finanzas", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1784830957/cauce/sistema/casos/vespa-bahia/admin/b7cjeh5hdxqcztskgh1y.png", queEs: "LA carpeta de finanzas: posición total, libro editable, mensual con margen, matriz anual, cartera y costos fijos. El formato base de Cauce." },
  { sistema: "Vespa Bahía", titulo: "Facturación (ARCA)", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1784830963/cauce/sistema/casos/vespa-bahia/admin/aapygdmgdonxvxdmxbuy.png", queEs: "Factura electrónica oficial (WSFE, CAE, QR de ARCA) emitida desde el mismo sistema donde se cargó la venta." },
  { sistema: "Vespa Bahía", titulo: "CRM / Leads", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1784830968/cauce/sistema/casos/vespa-bahia/admin/w0bpklwq6mha1ljptbfv.png", queEs: "Leads de compra, turnos, test rides y campañas — todos los canales en una sola bandeja." },
  { sistema: "Vespa Bahía", titulo: "Test Rides", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1784830973/cauce/sistema/casos/vespa-bahia/admin/jugkpxitnuvjw7np5snc.png", queEs: "Pruebas de manejo agendadas desde la web: el interesado elige moto y horario, y cae como lead caliente." },
  // ── Zatiori ──
  { sistema: "Zatiori", titulo: "Dashboard", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1784830993/cauce/sistema/casos/zatiori-espejos/admin/dn2yzs9aatickp8l9wiw.png", queEs: "El taller artesanal en números: pedidos por estado, visitas de la web y clics a WhatsApp — analítica propia sin Google." },
  { sistema: "Zatiori", titulo: "Pedidos", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1784830999/cauce/sistema/casos/zatiori-espejos/admin/dqmbeip0wtibdtzqvqr0.png", queEs: "Pipeline de 6 estados del presupuesto a la entrega, con seña, saldo y PDF numerado por pedido." },
  { sistema: "Zatiori", titulo: "Fábrica", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1784831004/cauce/sistema/casos/zatiori-espejos/admin/vzp2iuwau5fhvbtx3uvo.png", queEs: "La cola de producción: prioridades, responsable, fotos de avance y orden de fabricación imprimible." },
  { sistema: "Zatiori", titulo: "Catálogo", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1784831009/cauce/sistema/casos/zatiori-espejos/admin/u6c40eoifgowfwsnxsu7.png", queEs: "Cada espejo con fotos, medidas y estado (disponible/reservado/vendido); publicado en la web con un toggle." },
  { sistema: "Zatiori", titulo: "Clientes", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1784831015/cauce/sistema/casos/zatiori-espejos/admin/gwx24xbppnmrxlymccvv.png", queEs: "CRM con origen de cada cliente (web, IG, local, referido) e historial de llamadas y visitas." },
  { sistema: "Zatiori", titulo: "Proveedores", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1784831020/cauce/sistema/casos/zatiori-espejos/admin/pyl5fsmahsoaztaw9fva.png", queEs: "Proveedores por rubro (madera, espejo, insumos, herrajes) con sus datos y condiciones a mano." },
  { sistema: "Zatiori", titulo: "Instagram", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1784831025/cauce/sistema/casos/zatiori-espejos/admin/dvncnya2lhcfki59nkwh.png", queEs: "Publicaciones programadas que salen solas todos los días vía API de Meta — el feed corre sin tocar el teléfono." },
  { sistema: "Zatiori", titulo: "Reseñas", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1784831030/cauce/sistema/casos/zatiori-espejos/admin/g8uxckpzs6hhzqd16vw0.png", queEs: "Reseñas pedidas con link único por cliente: estrellas, texto y fotos; se aprueban y aparecen en la web." },
  // ── La Base ──
  { sistema: "La Base", titulo: "Dashboard", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1784831056/cauce/sistema/casos/la-base/admin/fiewjdvoxl1bfztwrgf1.png", queEs: "Plata y ocupación de un vistazo: ingresos de hoy/semana/temporada, por cobrar, ranking de instructores y conversión de leads." },
  { sistema: "La Base", titulo: "Hoy", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1784831063/cauce/sistema/casos/la-base/admin/ukwcygmoujia8qwdwtj3.png", queEs: "El parte del día: todas las clases de hoy con su instructor, estado de pago y presente." },
  { sistema: "La Base", titulo: "Calendario", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1784831074/cauce/sistema/casos/la-base/admin/iltxhuxdtugvcgs0zyo2.png", queEs: "El mes entero de reservas por día, con densidad de ocupación a simple vista." },
  { sistema: "La Base", titulo: "Reservas", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1784831084/cauce/sistema/casos/la-base/admin/yyagkmiuwy1a1igzx5jo.png", queEs: "Todas las reservas con código, estado de pago y vencimiento — las impagas se liberan solas." },
  { sistema: "La Base", titulo: "Check-in", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1784831090/cauce/sistema/casos/la-base/admin/dzcupl9nexntal4cn0xm.png", queEs: "Recepción escanea el QR de la reserva: saldo a la vista y presente marcado en un segundo." },
  { sistema: "La Base", titulo: "Caja", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1784831098/cauce/sistema/casos/la-base/admin/reykfwzczqjzdb2svoai.png", queEs: "Caja en 4 monedas (ARS/USD/BRL/EUR) con apertura, cierre, cotizaciones historizadas y diferencias." },
  { sistema: "La Base", titulo: "Lista de espera", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1784831106/cauce/sistema/casos/la-base/admin/rfo9hllpwoh9oqtdr4zr.png", queEs: "Cuando un día está lleno, la demanda no se pierde: cola por fecha lista para llamar si se libera un cupo." },
  { sistema: "La Base", titulo: "Rental", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1784831114/cauce/sistema/casos/la-base/admin/pj3tstqcyvkqji7892hr.png", queEs: "Pre-órdenes de alquiler de equipos asociadas a la reserva, listas para cobrar en el local." },
  { sistema: "La Base", titulo: "Instructores", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1784831123/cauce/sistema/casos/la-base/admin/mbo6w8qqyujsteoyafbs.png", queEs: "Los 40+ instructores con perfil público, idiomas y su propia agenda: cada uno bloquea sus días con su usuario." },
  { sistema: "La Base", titulo: "Bolsa", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1784831132/cauce/sistema/casos/la-base/admin/xyxsqkbipozsuguuz5yf.png", queEs: "Postulantes del 'Trabajá con nosotros' en pipeline; un clic y el postulante queda contratado como instructor." },
  { sistema: "La Base", titulo: "Leads", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1784831140/cauce/sistema/casos/la-base/admin/tnuxl6jgh7nwamirdhmx.png", queEs: "Consultas y reservas convertidas en leads con estado — el embudo comercial de la escuela." },
  { sistema: "La Base", titulo: "Tarifas", url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1784831147/cauce/sistema/casos/la-base/admin/qkjdnsdsjvfldzw4fl62.png", queEs: "El tarifario de la temporada editable desde el panel: cambia acá y cambia en la web al instante." },
];
