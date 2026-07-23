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
