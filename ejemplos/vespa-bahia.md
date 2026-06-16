# Vespa Bahía — Destilado de referencia (estándar de entrega Cauce)

> Análisis profundo del código completo de **Vespa Bahía** (concesionario oficial Vespa · Piaggio · Aprilia en Bahía Blanca), un desarrollo hecho con IA sobre Next.js 16 + Prisma + Postgres (Neon). Documento pensado como **vara de medir** para Cauce: a qué nivel de completitud tiene que llegar un proyecto para que el cliente sienta que "le digitalizaron el negocio entero".
>
> Fuente: `VespaBahia-Codebase-LLM.md` (~330 archivos, ~51k líneas). Las rutas citadas existen en ese dump.
>
> Tiene un **destilado hermano**: `motos-fernandez.md` (otra concesionaria del mismo autor). La sección 11 marca el diferencial entre ambos para no duplicar esfuerzo.

---

## 1. Qué es el negocio y qué resuelve

**Rubro:** concesionario **oficial monomarca-grupo** Vespa / Piaggio / Aprilia (las tres del grupo Piaggio), en Caseros 1478, Bahía Blanca. Razón social `Juan Francisco Fernandez Di Scipio`, CUIT 20-44881535-9, Responsable Inscripto. Vende motos 0KM y usadas, repuestos/indumentaria/accesorios online, servicio técnico oficial, y opera un club de marca (Vespa Club Bahía Blanca).

**A quién atiende:** comprador de scooter 0KM, comprador de usadas, cliente de tienda online (cascos, ropa, accesorios, repuestos), cliente de taller, y dueños que dejan su moto en consignación.

**Qué problemas operativos resuelve (lo clave):** igual que su hermano Motos Fernández, **no es un catálogo lindo, es el ERP de la concesionaria**. Resuelve, en un solo panel:

- **Catálogo público** de modelos (0KM + usados) con trazabilidad de origen (`OrigenModelo`: STOCK_PROPIO / PARTE_DE_PAGO / MANDATO).
- **Stock físico real** desacoplado del catálogo: `MotoUnidad` (cada fila = UNA moto con chasis único), separado de `Modelo` (el "tipo"). Esto es un diferencial fuerte: el catálogo es el "tipo de producto", el stock son las unidades concretas.
- **Venta de motos de punta a punta**: `OrdenCompra` (boleto compra-venta) con pagos combinables (`OCPago`: efectivo + transferencia + cheque + dólares...), permutas múltiples (`OCPermuta`) y financiación propia en cuotas (`FinanciacionOC` + `CuotaFinanciacion`).
- **Consignación de usadas** (`MandatoVenta`, numerado MV-####, con checklist documental).
- **Taller**: turnos online → órdenes de trabajo (`OrdenTrabajo`) → presupuestos (`Presupuesto`), con estados y PDF imprimible.
- **Tesorería**: financiaciones propias con cuotas, garante, y marcado de atraso automático.
- **CRM/Leads** alimentado automáticamente desde TODOS los canales (compra, turno, test ride, contacto, popup, pre-Hot-Sale).
- **E-commerce** con carrito, checkout MercadoPago, cupones, **recovery de carrito abandonado por email**.
- **Hot Sale** como motor de campaña temporizada (precios calculados on-the-fly, pre-registro, email blast, countdown).
- **Test Rides** como producto de captación (anotarse a probar una moto → lead tibio).
- **QR Shortlinks** inmutables para acrílicos físicos (la URL del acrílico no cambia, el destino sí).
- **IA**: chatbot público con tools sobre la DB real, asistente admin con tools de escritura, y OCR de DNI/facturas con Claude Vision para cargar stock sin tipear.

El "ahorro de tiempo real" está en que **vender, cobrar cuotas, gestionar el taller, perseguir leads, cargar stock desde una factura y correr una campaña relámpago viven todos acá dentro**, automatizando lo repetitivo.

---

## 2. Stack técnico

| Capa | Tecnología | Versión |
|---|---|---|
| Framework | Next.js (App Router + Turbopack, server components) | **16.2.0** |
| Runtime UI | React | 19.2.4 |
| ORM / DB | Prisma + PostgreSQL (Neon, **sa-east-1**) | Prisma 6.19 |
| Auth | NextAuth v4 (Credentials + JWT) | 4.24 |
| Hosting | Vercel (deploy + crons + headers de seguridad) | — |
| Estilos | Tailwind CSS v4 + shadcn (`base-nova`) + Radix UI | TW 4 |
| Pagos | MercadoPago | sdk 2.12 |
| Fotos/Videos | Cloudinary (`unoptimized`, upload firmado directo desde admin) | 2.9 |
| IA | Anthropic Claude API (`@anthropic-ai/sdk`) | 0.80 |
| Email | Resend (`@react-email/components`) | 6.9 |
| QR | `qrcode` (genera PNG/SVG server-side) | 1.5 |
| Tracking | Meta Pixel + Conversions API (CAPI, **doble pixel**) | Graph v21 |
| Tablas/charts | recharts | 3.8 |
| Carga masiva | xlsx | 0.18 |
| Otros | bcryptjs, zod 4, date-fns, lucide, sonner (toasts), cmdk, next-themes | — |

Detalles de stack que delatan madurez:
- `package.json` → `build: "prisma generate && next build"` (evita el error clásico de Prisma client en Vercel). Seed con `tsx prisma/seed.ts`.
- `next.config.ts` → **`images.unoptimized: true`** sirviendo directo desde `res.cloudinary.com/dgtlyzyra` (no se paga el optimizador de Vercel), y **headers de seguridad** (HSTS, X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy con cámara/micro/geo deshabilitados).
- `src/middleware.ts` → protege `/admin/(?!login)` (redirect a login con `callbackUrl`) y `/api/admin` (devuelve **JSON 401**, no redirect). Patrón correcto para no romper fetches del frontend.
- **Decisión de costo consciente:** los PDF NO usan `@react-pdf/renderer` — se generan como **HTML A4 imprimible** (`src/lib/pdf-html.ts`) servido por endpoints que abren con `window.print()`. Razón documentada en el header del dump: límite de 250MB/función en Vercel. Trade-off lúcido.
- `prisma.ts` con singleton global (evita agotar conexiones en dev/hot-reload).

---

## 3. Mapa de la web pública

Todas en `src/app/(public)/`. Layout único (`(public)/layout.tsx`) con header sticky, footer, **chatbot IA flotante** (`public-chat.tsx`), **WhatsApp flotante con pulse** (`whatsapp-button.tsx`), marquee-bar, **welcome popup que regala 10% a cambio de email/teléfono** (`welcome-popup.tsx` → crea lead), barra Hot Sale (`hot-sale-bar.tsx`) y page-tracker.

| Ruta | Qué muestra / qué puede hacer el visitante |
|---|---|
| `/` (`page.tsx`) | Home: hero premium (o **hero Hot Sale** si está prendido), modelos destacados, productos, promociones activas, noticias recientes. `force-dynamic`. |
| `/modelos` + `/modelos/[slug]` | Catálogo de motos; ficha con galería (`modelo-gallery.tsx`), **selector de color con hex** (`modelo-color-section.tsx`), specs, financiación, badge Hot Sale, compartir por WhatsApp, OpenGraph dinámico. |
| `/aprilia` | Landing dedicada Aprilia. Modelos con `soloEnAprilia=true` aparecen SOLO acá, no en `/modelos`. |
| `/tienda` + `/tienda/[slug]` | E-commerce: filtros por categoría, ficha con galería (`product-gallery.tsx`), **tabla de talles** (`size-chart.tsx`), stock por talle, add-to-cart, precio Hot Sale. |
| `/carrito` + `/checkout` + `/tienda/resultado` | Carrito (context provider), checkout con MercadoPago, página de resultado (success/failure/pending). |
| `/servicio-tecnico` | Info de taller + **formulario de turno con calendario** (`turno-form.tsx`); banner de descuento si hay Hot Sale en servicios. |
| `/test-ride/[slug]` | **Anotarse a probar una moto** (`test-ride-form.tsx`): solo nombre + WhatsApp + términos (baja fricción para exposiciones) → crea TestRide + lead. |
| `/hot-sale` | Landing de la campaña con countdown; en pre-fase muestra teaser + form de pre-registro. |
| `/vespa-club` | Página del club de marca (beneficios socios). |
| `/noticias` + `/noticias/[slug]` | Blog con contenido HTML (`noticia-content.tsx`), cards con **video al hover**. |
| `/contacto` `/nosotros` `/envios` | Institucionales; contacto crea `ContactForm` + lead. |
| `/privacidad` `/terminos` | Legales (requeridas por Meta para Ads). |
| `/m/[codigo]` | **QR Shortlink**: route.ts (no page) que hace redirect 307 al modelo/URL configurado e incrementa `scans` fire-and-forget. |
| SEO global | `sitemap.ts` dinámico, `opengraph-image.tsx`, Meta Pixel + GA + CAPI server-side, eventos de conversión. |

**Funcionalidades públicas destacadas:** chatbot IA con catálogo real, welcome-popup que captura lead con cupón, test ride como lead-magnet, Hot Sale con pre-registro y countdown, QR físicos editables, y tracking dual cliente+servidor (Pixel + Conversions API a **dos pixels** — el propio y el general de Vespa Argentina).

---

## 4. Mapa del back administrativo

Todo en `src/app/admin/(dashboard)/`. Sidebar agrupada y colapsable (`admin-sidebar.tsx`) con **asistente IA flotante** (`ai-chat.tsx`) en todo el panel. Inventario completo:

**General**
- **Dashboard** (`/admin`): pedidos hoy, turnos pendientes, leads nuevos (semana), ventas del mes (agregadas), **cantidad y valor de stock de motos**, motos vendidas en el mes, pedidos recientes, leads sin contactar, recordatorios próximos/vencidos. Embebe `analytics-panel.tsx` y `meta-ads-panel.tsx`.
- **Pedidos** (`/admin/pedidos`): lista + detalle con cambio de estado (dispara email al cliente), tracking, export CSV (`/api/admin/export/pedidos`).

**Operaciones**
- **Mandatos de venta** (consignación): alta con checklist documental (título, prenda, VTV, 2da llave...), filtros, PDF de mandato. Numerado MV-####.
- **Órdenes de compra** (venta de motos): alta (`oc-form.tsx`) con cliente, moto, **pagos combinables** (`pagos-editor.tsx`), permutas, financiación, balance; cambio rápido de estado (`/[id]/estado`), drawer, PDF. Numerado OC-####.
- **Clientes** (CRM operativo): ficha completa (`cliente-form.tsx`), **documentos digitales** (`cliente-documentos.tsx`, Cloudinary), resumen de historial (`cliente-resumen.tsx`), quick-create modal (`cliente-quick-create-modal.tsx`), selector reusable (`cliente-selector.tsx`).
- **Proveedores**: contactos múltiples, **cuentas bancarias múltiples con botón "copiar CBU"** (`copiar-cuenta-button.tsx`), lista de precios (todo en JSON).
- **Stock motos** (`/admin/stock-motos`): lista con tabs/estados, alta manual, y **carga masiva desde factura** (`cargar-factura/`) con OCR; media por unidad (`moto-unidad-medios.tsx`), documentos digitales.

**Catálogo**
- **Modelos** (0KM / Usadas): **lista con edición inline** (`modelos-list.tsx` + `inline-cell.tsx`), form rico (`modelo-form.tsx`) con **autocompletado de specs por IA**, colores con hex, fotos, financiación.
- **Productos de tienda**: lista con edición inline (`productos-table.tsx`: precio, oferta, stock, activo), stock por talle, form (`producto-form.tsx`).

**Taller**
- **Órdenes de trabajo** (`/admin/taller`): items (repuestos + mano de obra en JSON), estados (INGRESADA→ENTREGADA), económico, PDF. Numerado OT-####.
- **Presupuestos**: cotizador (`presupuesto-form.tsx`) que se convierte en OT; PDF. Numerado PRE-####.
- **Calendario** + **Turnos**: vista calendario (`calendario-client.tsx`), gestión de turnos, **bloqueo de días** (`/api/admin/turnos/bloqueados`).
- **Tipos de servicio**: catálogo con precio base y duración (`tipos-servicio-list.tsx`).

**Tesorería**
- **Resumen** + **Financiaciones**: alta manual o automática desde OC, tabla de cuotas con marcar pagada (`cuotas-table.tsx`), garante, estados (activa/atrasada/completada).

**CRM / Marketing**
- **CRM / Leads**: lista con temperatura/etapa/origen (`crm/page.tsx`), ficha con interacciones y recordatorios (`crm/[id]`), alta manual, **import de leads** (`/api/admin/leads/import`), export CSV.
- **Test Rides**: lista con estados (PENDIENTE/HECHO/NO_VINO/CANCELADO), follow-up.
- **Noticias**: editor HTML con fotos inline (`noticia-form.tsx`).
- **Cupones**: % + monto máx/mín + usos máximos.
- **Promociones**: banners con botones múltiples (JSON), ventana de fechas.
- **QR Shortlinks** (`qr-admin.tsx`): crear código, vincular a modelo o URL custom, ver scans, descargar PNG/SVG.
- **Hot Sale** (`hot-sale-admin.tsx`): master switch, fechas, % inflación/descuento/cuotas, bonificaciones de motos, descuento de servicios, overrides por producto/modelo, **email blast a pre-registrados**, stats.

**Sistema**
- **Configuración**: datos del negocio, flags.
- **Login** (`/admin/login`): username/password.

**Features transversales destacadas:** edición inline en listas (`inline-cell.tsx` con Enter=guardar / Esc=cancelar), quick-create modales (cliente), botones de borrado con confirmación (`delete-row-button.tsx`), upload de medios con firma directa a Cloudinary (`media-uploader.tsx`, `image-upload-field.tsx`), filtros + búsqueda con `sinAcentos()`, y badges de estado con paletas centralizadas (`ESTADO_*_STYLES` en `admin-helpers.ts`).

---

## 5. Modelo de datos (Prisma — resumido)

`prisma/schema.prisma`, ~35 modelos. Núcleo:

**Auth y config**
- `User` — login por `email`; `role` (`admin` default); `hashedPassword` (bcrypt). **No hay sistema de permisos por sección** — todo usuario logueado es admin (diferencia notable vs Motos Fernández).
- `Configuracion` (key/value singleton-ish).

**Catálogo (el "tipo")**
- `Modelo` (~50 campos): datos públicos + `specs Json` + `financiacion Json` + atributos ML/enriquecidos (transmisión, frenos, potenciaHp, capacidadTanque...), `colores ModeloColor[]`, `fotos String[]`, `esUsado` + anio/kilometros/observacion, `etiqueta` (DISPONIBLE/ULTIMA_UNIDAD/RESERVADA...), `soloEnAprilia`, venta interna (`vendida`/`fechaVenta`), **datos internos admin** (chasis/motor/patente/notasInternas), **trazabilidad** (`origen OrigenModelo`, `proveedorId`, `clienteEntregaId`).
- `ModeloColor` (nombre + hex + foto). `enum Marca { VESPA, PIAGGIO, APRILIA }`. `enum CategoriaVehiculo { MOTOCICLETA, CUATRICICLO, UTV, MOTO_DE_AGUA }`.

**Stock físico (la "unidad")**
- `MotoUnidad` — **modelo estrella conceptual**: cada fila es UNA moto real con `chasis @unique` (clave dura para deduplicar al importar). `condicion` (CERO_KM/USADA), `estado EstadoUnidad` (EN_STOCK/RESERVADA/VENDIDA/PERMUTADA/CONSIGNADA/BAJA), `modeloCatalogoId` opcional (para tomar precio de lista), proveedor, `precioCompra`/`precioVenta`, `lugar` físico, comprador, documentación física, `fotos`, `documentos Json`. Numerado autoincremental + índices ricos.

**E-commerce**
- `Pedido` + `PedidoItem`; enums `TipoEntrega`, `EstadoPedido`, `EstadoPago`; campos MercadoPago (`mpPaymentId`/`mpPreferenceId`/`mpStatus`), tracking, número humano autoincremental.
- `Producto` (codigo interno del Excel, precio/precioOferta, `stockPorTalle Json`, `talles String[]`, `motoCompatible`), `Categoria`.
- `CarritoAbandonado` (email único, items JSON, `recuperado`, `emailEnviado`) — base del cron de recovery.

**CRM**
- `Lead` + `LeadInteraction` + `LeadReminder`; enums `OrigenLead` (WEB, WHATSAPP, INSTAGRAM, SIMPA, TELEFONO, PRESENCIAL, **HOT_SALE**, **TEST_RIDE**), `TemperaturaLead`, `EtapaLead`. Campo `hotSaleNotificado`.
- `TestRide` (numerado, nombre+telefono obligatorios, resto opcional, `aceptoTerminos`, audit IP/UA, `leadId @unique`, `followupEnviado`).
- `ContactForm`.

**Operaciones de venta**
- `Cliente` (CRM operativo) — DNI @unique/CUIT, contacto, dirección, `documentos Json`, relaciones a mandatos/OCs/financiaciones/OTs/motos compradas/entregadas.
- `Proveedor` (contactos/cuentas/lista de precios en JSON).
- `MandatoVenta` (MV-####, checklist documental, comisión % o monto, link a Modelo y a OC).
- `OrdenCompra` (`OC-####`, **snapshot de la moto** motoDescripcion/chasis/motor, `formaPago`, sena/saldo, cuotas, link a `MotoUnidad`, `estado EstadoOC` BORRADOR default).
- `OCPago` (combinables: efectivo/transferencia/tarjeta/mp/cheque/deposito/dolares).
- `OCPermuta` (N motos en parte de pago, link a `Modelo` recibido en stock).

**Taller**
- `TipoServicio`, `OrdenTrabajo` (OT-####, items JSON, económico subtotal/descuento/total/pagado/saldo, snapshot moto del cliente), `Presupuesto` (PRE-####, se convierte en OT), `Turno` (+ `DiaBloqueado`).

**Tesorería**
- `FinanciacionOC` (FIN-####, montoTotal/entrega/cuotas, `diaVencimiento`, garante en campos plain, `origen` MANUAL/OC_AUTOMATICA) + `CuotaFinanciacion` (`@@unique([financiacionId, numero])`, estado, comprobante).

**Marketing**
- `HotSale` (singleton activo, fechas, inflacionTienda %, descuentoTransferencia %, cuotasSinInteres, bonificaciones de motos, descuento de servicios, branding/color, stats denormalizadas) + `HotSaleProducto` / `HotSaleModelo` (overrides por ítem). `Promocion`, `Cupon`, `Noticia`.
- `QrShortlink` (codigo @unique inmutable, modeloId o urlCustom, `scans`, `ultimoScan`).

**Analytics propios**
- `Visita` (pagina, referrer, device, browser, ip hasheada, ciudad) y `Conversion` (evento, valor, detalle, fuente, ip).

Patrones de schema notables: **numeración humana autoincremental** (`numero Int @unique @default(autoincrement())` → MV/OC/OT/PRE/FIN-0001 con `formatNumero(prefix, n)`), **snapshots** de datos críticos (la OC guarda la descripción de la moto), `chasis @unique` como clave de deduplicación, JSON para estructuras flexibles (specs, items, documentos, cuentas bancarias), y la **separación Modelo (catálogo/tipo) vs MotoUnidad (stock/unidad)** que es el corazón del modelo.

---

## 6. Automatizaciones e integraciones

Para cada una: disparador → qué hace → servicio.

### Crons de Vercel (`vercel.json`)
Validan `Authorization: Bearer ${CRON_SECRET}`.

| Endpoint | Frecuencia | Qué hace |
|---|---|---|
| `/api/cron/cart-recovery` | diario 14:00 UTC | Manda email de recovery a `CarritoAbandonado` con >4hs de inactividad y `emailEnviado=false`. Si hay Hot Sale live, cambia subject + banner naranja. Marca `emailEnviado` para no repetir (idempotente). Batch de 100. |

> Nota: el set de crons es **mucho más chico** que en Motos Fernández (allá había 7). Acá la automatización pesada vive en el flujo transaccional (webhooks, server actions) más que en jobs programados.

### Pagos (MercadoPago)
- **Creación de preferencia** en `/api/checkout`: valida stock (incluido **stock por talle**), **recalcula precios server-side respetando Hot Sale** (no confía en el frontend), crea `Pedido`, **descuenta stock**, marca carrito abandonado como recuperado, crea/actualiza lead, manda email de confirmación (todo fire-and-forget para no bloquear), y crea la preferencia MP con `back_urls` https completas y `notification_url`. Lazy-import del SDK (`await import("mercadopago")`).
- **Webhook** `/api/webhooks/mercadopago`: al `approved` → marca pedido `PAGO_CONFIRMADO`, **agrega/actualiza el cliente al CRM como CLIENTE/VENDIDO** con interacción de compra, y dispara **Purchase a Meta CAPI**. Al `rejected`/`cancelled` → **devuelve stock**. Siempre responde 200 (excepto faltante de paymentId).

### Email (Resend)
`src/lib/email.ts` — **lazy init** (`getResend()` devuelve null si falta key, no rompe). Templates HTML con color de marca celeste `#7ECAD6`. Cubre: confirmación de pedido, **actualización de estado de pedido con tracking** (5 estados con título/mensaje/color por estado), confirmación de turno, **aviso de arranque de Hot Sale** (gradiente con el color de la campaña), y confirmación de test ride (con checklist "vení con registro físico").

### Meta Conversions API (CAPI) — server-side
`src/lib/meta-conversions.ts` — **envía a hasta DOS pixels en paralelo** (propio + el general de Vespa Argentina). Hashea email/teléfono/nombre/ciudad con SHA-256 (normalizados) como exige Meta. Eventos: Lead, Purchase, Contact, Schedule, InitiateCheckout, AddToCart, CompleteRegistration. Silencioso si no hay token. Complementa el Pixel cliente (`pixel-events.ts`) que además guarda cada conversión en la DB propia (`/api/public/conversion`) con la fuente detectada del referrer.

### CRM automático (`src/lib/create-lead.ts`)
`createOrUpdateLead()` — **dedup por email o por últimos 8 dígitos del teléfono**, y si el lead ya existe **sube la temperatura solo si la nueva es de mayor prioridad** (tabla de prioridades PERDIDO<FRIO<NUEVO<TIBIO<CALIENTE<CLIENTE), agrega interacción, y dispara el evento a Meta CAPI. Disparado desde checkout, contacto, turnos, test ride, popups.

### Sincronización Stock ↔ Venta (fuente única de verdad)
- `src/lib/oc-helpers.ts` — `sincronizarUnidadConOC()`: mapea estado de la OC → estado de la `MotoUnidad` vinculada (CONCRETADA→VENDIDA + setea comprador y fechaVenta; CANCELADA/BORRADOR→EN_STOCK + limpia). `liberarUnidad()` al borrar. Toda la lógica vive en un solo helper, llamado desde createOC/updateOC/cambio rápido de estado/deleteOC.
- `src/lib/financiacion-helpers.ts` — `crearFinanciacionDesdeOC()` **idempotente** (si ya existe no duplica): si la OC tiene cuotas+valorCuota arma la planilla con vencimientos calculados (`calcularVencimientoCuota`, día del mes configurable). `actualizarEstadosVencidos()` marca cuotas ATRASADA y propaga a la financiación — se llama antes de listar para mantener estados al día sin cron.

### Carga de stock por OCR (`/api/admin/stock-motos/crear-desde-escaneo`)
Recibe las motos extraídas de una factura por Claude Vision y crea N `MotoUnidad`: **dedup por chasis**, **match al catálogo con tabla de alias** (`MODELO_ALIAS` para nombres que vienen distintos en la factura) para tomar el precio de lista, **crea el proveedor si no existe**, estado inicial EN_STOCK. Todo idempotente.

### QR Shortlinks (`/m/[codigo]`)
Redirect 307 (no 308 a propósito: temporary, para poder cambiar el destino del acrílico físico ya impreso) + incremento de `scans` fire-and-forget.

### Turnos con calendario (`/api/public/turnos`)
GET calcula fechas disponibles de los próximos 30 días excluyendo **fines de semana, feriados nacionales 2026 hardcodeados, `DiaBloqueado` y días con 2+ turnos**. POST crea el turno + lead, y **si hay Hot Sale en servicios anota "🔥 HOT SALE - APLICAR X% OFF" en el comentario** para que el taller lo cobre con descuento.

### Hot Sale (`src/lib/hot-sale.ts`)
- `getHotSale()` cacheado con `React.cache` (una sola query por request aunque lo usen varios componentes). Calcula status `off|pre|live|ended` desde las fechas.
- **El precio en DB nunca se toca**: durante el evento se calcula on-the-fly `precioInflado = base*(1+inflacion%)`, `oferta = inflado*(1-descuento%)`. Regla anti-margen: ignora `precioOferta` previa para no acumular descuentos.
- Email blast a leads `origen=HOT_SALE, hotSaleNotificado=false` (`/api/admin/hot-sale/email-blast`).

### Backups
**No hay** backup automático a Sheets/JSON (a diferencia de Motos Fernández). Confía en el backup de Neon.

---

## 7. IA en el producto (Anthropic Claude)

Modelo usado en todo: **`claude-sonnet-4-20250514`**. Cuatro usos reales:

1. **Chatbot público** (`/api/public/ai-chat`): agentic loop (máx 5 iteraciones) con **4 tools que leen la DB real**: `buscar_productos`, `buscar_motos`, `info_negocio`, `consultar_disponibilidad` (devuelve stock por talle). System prompt en español argentino, conciso, **"NO inventes información"**, derivar a WhatsApp para cerrar. Toma los últimos 10 mensajes de historial. Fallback de error que siempre da el WhatsApp.

2. **Asistente del admin con tools de ESCRITURA DIRECTA** (`/api/admin/ai-chat`): agentic loop (máx 10 iteraciones) con ~20 tools que **leen y escriben la DB**: `crear_producto`, `actualizar_producto`, `crear_modelo`, `actualizar_modelo`, `crear_noticia`, `actualizar_noticia`, `agregar_foto_*`, `ver_estadisticas`, `diagnosticar_problemas`, `listar_*`, y un set completo de operación de **Hot Sale en tiempo real** (`hot_sale_estado/actualizar/descuento_categoria/excluir_producto/email_blast/email_blast_send`). Acepta imágenes (capturas con precios). System prompt con **reglas finas de lectura de precios argentinos** ("5.810.000 = 5.8 millones, NO 5810"; verificar rangos de mercado; nunca redondear; confirmar antes de cambiar). El email blast exige `confirmar:true`. Diferencia clave vs Motos: acá la IA **escribe directo** (con instrucción de pedir confirmación en lo riesgoso), no usa el patrón "propuesta + preview".

3. **OCR de DNI y facturas de moto** (`src/lib/escaneo-documentos.ts`, Claude Vision): tool `registrar_documento` con `tool_choice` forzado. Detecta tipo (dni / factura_moto / desconocido). De la factura extrae **un array de motos** (una factura puede traer varias unidades con su chasis/motor). Respeta mayúsculas en chasis, convierte precios AR a entero, fechas YYYY-MM-DD, **null en lo dudoso ("no inventes")**. Soporta imagen y PDF. Alimenta la carga de stock sin tipear.

4. **Autocompletado de specs de modelos por IA** (`/api/admin/modelos/autocompletar-specs`): tool `registrar_specs` forzado, devuelve 8-14 pares clave/valor con unidades. System prompt experto en Vespa/Piaggio/Aprilia AR con regla dura **"SOLO incluí datos de los que estés seguro; mejor pocos correctos que muchos inventados; NUNCA inventes"**. El usuario revisa antes de guardar.

Patrones IA de oro: tools sobre la **DB real** (no alucina catálogo), **system prompts que repiten "no inventes"** en los cuatro usos, OCR con `null` en lo incierto, confirmación obligatoria para acciones que gastan (email blast), y reglas explícitas de lectura de números argentinos.

---

## 8. Sistema de diseño

**Identidad:** fresca, premium-celeste, fiel a la marca Vespa. Definido en `src/lib/constants.ts` (`BRAND_COLORS`) y `src/app/globals.css`.

**Paleta** (hex reales)
- Primario **celeste Vespa `#7ECAD6`** (claro `#A8DDE5`, oscuro `#5BB5C2`, bg `#E8F6F8`).
- Acentos de marca Piaggio: verde `#6DCDB1`, sky `#40B4E5`, amarillo `#FFD100`, magenta `#D7006D`, rojo `#C2002F`, púrpura `#32006E`.
- Neutros: negro `#1A1A1A`, gris claro `#F6F9F9`, gris medio `#BBBCBC`, gris oscuro `#333333`.
- Hot Sale: naranja chillón `#FF6B00` (configurable por campaña).
- Theming con variables CSS en **oklch** (primary = `oklch(0.76 0.08 195)`), light mode (no se observa dark mode activo pese a tener `next-themes`).

**Tipografía**
- `--font-sans` (sistema/Geist) para body y headings.
- `--font-display` con **itálica + letter-spacing negativo** (`.font-display`), la personalidad "Vespa".

**UI premium (globals.css):** `.card-premium` (lift + shadow tinted celeste + ring), `.glass-card` (translúcida con blur), `.hero-bg-premium` (radial gradient celeste), `.honeycomb-bg` (patrón de puntos), `.grain` (textura SVG fractalNoise inline), `.text-gradient-vespa`, `.eyebrow`, `.underline-animated` (subrayado que crece al revelarse), `.reveal`/`.reveal-scale` (scroll reveal), `.trail-divider` (curva signature), `.whatsapp-pulse`. Componentes shadcn base-nova en `src/components/ui/` (27 archivos: button, dialog, sheet, tabs, select, popover, tooltip, table, switch, scroll-area, etc.). PDFs y emails reusan el celeste `#5BB5C2`/`#7ECAD6`.

---

## 9. Roles, usuarios y permisos

- **Auth:** NextAuth v4, CredentialsProvider, estrategia **JWT** (`src/lib/auth.ts`). Login por email/password, `compare` con bcrypt. El `role` viaja en el token y la session.
- **Un solo rol efectivo:** `User.role` default `"admin"`. `requireAdmin()` (`src/lib/admin-auth.ts`) solo chequea `session.user.role === "admin"`. **No hay permisos granulares por sección** ni gestión de usuarios desde el panel — es un sistema de un dueño / equipo chico de confianza.
- **Enforcement:** middleware protege `/admin` (redirect) y `/api/admin` (JSON 401). Los endpoints admin además llaman `requireAdmin()`. Tipos extendidos en `src/types/next-auth.d.ts`.

> Esto es deliberadamente más simple que Motos Fernández (que tiene roles + `permisos String[]` por sección + alta de usuarios). Para una PyME de un solo operador alcanza; para un equipo con vendedores/taller separados, faltaría.

---

## 10. Patrones de ORO para replicar (lo accionable)

Lo que hace que el desarrollo "supere expectativas". Cada punto es copiable a un proyecto de Cauce:

1. **El sistema ES el ERP del negocio, no la web.** Catálogo es la punta; abajo está venta + cobranza + taller + CRM + stock físico + marketing. **Regla Cauce:** digitalizar el flujo de plata y de trabajo completo, no solo la vidriera.

2. **Separar el "tipo" de la "unidad".** `Modelo` (catálogo público, el tipo "Vespa GTS 300") vs `MotoUnidad` (la moto física con chasis único). El catálogo muestra modelos; el stock cuenta unidades reales; al vender se sincronizan. **Copiar** en cualquier negocio donde el producto tiene número de serie/lote/chasis (vehículos, electrodomésticos, instrumentos).

3. **`chasis @unique` como clave de deduplicación.** Importar la misma factura dos veces no duplica stock. **Regla:** toda carga masiva debe tener una clave natural única y ser idempotente.

4. **Una sola fuente de verdad para acciones críticas.** Toda transición de estado de venta pasa por `oc-helpers.ts`; toda financiación por `financiacion-helpers.ts`. Nunca se duplica la lógica en cada endpoint → cero estados inconsistentes.

5. **Numeración humana autoincremental** (OC-0001, MV-0001, OT-0001, PRE-0001, FIN-0001) con `formatNumero(prefix, n)`. El cliente y el dueño hablan con esos números. Barato y se nota.

6. **Snapshots de datos al momento del hecho.** La OC guarda `motoDescripcion`/chasis/motor aunque después se borre el modelo. **Nunca depender de joins para datos que ya ocurrieron.**

7. **Edición inline en todas las listas** (`inline-cell.tsx`): precio, stock, oferta, activo se editan sin entrar al detalle. Es la preferencia #1 del cliente y está bien resuelta. Ahorra cientos de clicks/día.

8. **OCR con Claude Vision para cargar sin tipear.** Foto de la factura del proveedor → N motos creadas en stock con chasis/motor/precio, matcheadas al catálogo, con el proveedor auto-creado. Foto del DNI → cliente. **Copiar:** IA que acelera la carga de datos pesada, siempre con "null en lo dudoso, nunca inventes".

9. **IA con tools sobre la DB real, tanto público como interno.** El chatbot no alucina catálogo: consulta Prisma. El asistente admin opera el negocio (incluido el Hot Sale en vivo) por chat. **Siempre** con "no inventes" y confirmación para lo que gasta plata.

10. **CRM alimentado desde TODOS los canales automáticamente**, con **dedup inteligente y upgrade de temperatura**. Compra, turno, test ride, contacto, popup, pre-Hot-Sale → todos crean/actualizan un `Lead` con su `origen` etiquetado, sin duplicar y sin pisar una temperatura más alta. El dueño ve de dónde viene cada oportunidad sin cargar nada.

11. **Recálculo de precios server-side en el checkout.** Nunca se confía en el precio que manda el frontend: el servidor recalcula respetando Hot Sale. **Regla de seguridad copiable a cualquier e-commerce.**

12. **Pagos combinables y multimoneda de verdad.** Una OC mezcla efectivo + transferencia + dólares + cheque + permuta + financiación (`OCPago` por renglón). Refleja cómo se vende en Argentina.

13. **Cobranza propia con cuotas, garante y atraso automático.** `actualizarEstadosVencidos()` marca cuotas atrasadas al listar (sin necesidad de cron). Financiación auto-generada desde la OC, idempotente.

14. **Motor de campaña relámpago (Hot Sale) sin tocar precios en DB.** Inflación + descuento on-the-fly, overrides por producto/categoría/modelo, pre-registro con lead, countdown, email blast, banner que se inyecta hasta en el recovery de carrito. Una palanca de marketing completa, reversible con un switch.

15. **Recovery de carrito abandonado por email.** `CarritoAbandonado` + cron diario + marca de recuperado en el checkout. Recupera ventas que se caían solas. Bajísimo costo.

16. **QR físicos editables (shortlinks inmutables).** La URL del acrílico (`/m/vxl`) nunca cambia; el destino se edita desde el panel. Redirect 307 (no permanente) a propósito + contador de scans. **Patrón de oro para marketing offline→online.**

17. **Test Ride como lead-magnet de baja fricción.** Solo nombre + WhatsApp + términos → lead tibio + email con checklist. Pensado para captar en exposiciones sin formularios largos.

18. **Robustez "no rompas producción":** lazy-init/lazy-import de SDKs (MP, Resend, Anthropic) → el build no falla sin API key; email skipped si no hay key; rate-limiting por IP en endpoints públicos; ip hasheada con salt en analytics; headers de seguridad; CAPI silencioso sin token. Todo lo de cara al cliente tiene fallback.

19. **Performance y costo controlados:** Cloudinary `unoptimized` (no se paga el optimizador de Vercel), `React.cache` en getHotSale, PDFs como HTML imprimible en vez de librería pesada de 250MB+, fire-and-forget (`.catch()`) para no bloquear la respuesta al cliente con email/lead/tracking.

20. **Detalles "argentinos" que el cliente nota:** `normalizarParaWhatsApp()` que saca el 15 y arma el 549, WhatsApp con mensajes pre-armados por contexto (`WA_MESSAGES`), formato ARS/USD, `sinAcentos()` para búsqueda, feriados nacionales en el calendario de turnos, T&C legales por documento (mandato/OC/OT/presupuesto).

---

## 11. Diferencial vs Motos Fernández

Mismo autor, mismo stack base, dos negocios. Para Cauce conviene tener claro qué módulo vino de cada uno.

### Lo que tiene Vespa Bahía y Motos Fernández NO (lo diferencial de Vespa)
- **Hot Sale completo**: motor de campaña temporizada (pre/live/ended), precios on-the-fly sin tocar DB, overrides por producto/categoría/modelo, countdown, pre-registro con lead, email blast, banner inyectado en home/recovery/turnos. **Es el módulo estrella propio de Vespa.**
- **Separación explícita Modelo (catálogo) vs `MotoUnidad` (stock físico con chasis único)** como dos tablas distintas con sincronización. Motos Fernández mezcla más el concepto en `Modelo`.
- **Recovery de carrito abandonado** (`CarritoAbandonado` + cron diario + email con/sin Hot Sale).
- **Test Rides** como entidad y lead-magnet propio.
- **QR Shortlinks** para acrílicos físicos editables, con PNG/SVG y contador de scans.
- **Doble pixel Meta** (propio + el general de Vespa Argentina) en el mismo CAPI.
- **OCR de facturas multi-moto** (una factura → array de unidades creadas con dedup por chasis y match por alias). Motos tiene OCR de DNI/título pero el flujo multi-unidad desde factura es de Vespa.

### Lo que tiene Motos Fernández y Vespa NO (faltantes de Vespa)
- **Roles + permisos por sección** (`permisos String[]`, ~28 secciones, alta de usuarios desde el panel, `requireSection`). Vespa es mono-rol admin. **Para un equipo grande, copiar el modelo de Motos.**
- **Marketing donde está la plata, automatizado**: publicación orgánica programada a IG/FB, **Meta Ads pagas desde el panel** (wizard + jerarquía Campaign/AdSet/Ad con doble confirmación), y **Mercado Libre** (OAuth + publicar/pausar + webhook). Vespa solo trackea, no publica/pauta desde el panel.
- **Crons idempotentes con locking optimista + JobLog auditable**: Motos tiene 7 crons (outreach post-venta, NPS, recordatorio de cuotas, backups, sync de insights) con patrón de locking/retries/JobLog. Vespa tiene **un solo cron** (cart-recovery) sin JobLog.
- **Outreach post-venta automatizado** (service a 6 meses + NPS a 10 días por WhatsApp con un click). Vespa no tiene piloto automático de post-venta/retención.
- **Backups automáticos** (DB → JSON y → Google Sheets). Vespa confía en Neon.
- **Encriptación AES-256-GCM de tokens** de integraciones y `MetaApiLog` con token redactado. Vespa no maneja tokens de larga vida (no tiene ML ni Ads en panel), así que no le hace falta.
- **PDFs con `@react-pdf/renderer`**: Motos usa la librería; Vespa eligió HTML imprimible por el límite de Vercel. Dos enfoques válidos — Vespa es más liviano, Motos más "documento real".
- **IA con propuesta + confirmación (`__preview__`)**: Motos propone y el humano confirma en el frontend; Vespa **escribe directo** desde el chat (con instrucción de confirmar lo riesgoso). El patrón de Motos es más seguro para datos críticos.

### Síntesis para Cauce
Vespa Bahía brilla en **e-commerce + motor de marketing temporizado (Hot Sale) + captación (test ride, QR, popup, recovery) + manejo de stock físico unitario + IA operativa que escribe**. Motos Fernández brilla en **profundidad operativa de back-office (roles, crons auditables, outreach, integraciones de pauta/marketplace, backups, seguridad de tokens)**. El estándar de entrega "redondo" de Cauce sería **la unión de ambos**: el stock unitario + Hot Sale + recovery + test rides + QR de Vespa, sobre la base de roles + crons idempotentes con JobLog + outreach + integraciones de marketing + backups + tokens encriptados de Motos. Cada proyecto toma del menú según el negocio, pero el techo de calidad está marcado por la suma de los dos.
