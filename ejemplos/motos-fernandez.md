# Motos Fernández — Destilado de referencia (estándar de entrega Cauce)

> Análisis profundo del código completo de **Motos Fernández** (concesionaria/taller de motos en Bahía Blanca), un desarrollo hecho con IA sobre Next.js + Prisma + Postgres. Documento pensado como **vara de medir**: a qué nivel de completitud tiene que llegar un proyecto de Cauce para que el cliente sienta que "le resolvieron el negocio entero", no que le hicieron una web.
>
> Fuente: `motos-fernandez-codigo-para-llm.md` (415 archivos, ~83k líneas). Las rutas citadas existen en ese dump.

---

## 1. Qué es el negocio y qué resuelve

**Rubro:** concesionaria multimarca (Honda, Yamaha, Suzuki, Kawasaki, CF Moto, Segway, BMW, KTM, Vespa, etc.) de motocicletas, cuatriciclos, UTVs y motos de agua, con **taller de servicio técnico**, **tienda online de accesorios/repuestos**, **financiación propia** y **venta de usadas en consignación**. Fundada en 1985, en Brown 1052, Bahía Blanca.

**A quién atiende:** comprador final de motos 0KM y usadas, cliente de taller (services), comprador de accesorios online, y dueños de motos que las dejan en consignación.

**Qué problemas operativos resuelve el sistema (esto es lo clave):** no es un catálogo lindo, es el **ERP completo de la concesionaria**. Resuelve:

- **Catálogo y stock** de vehículos con trazabilidad de origen (stock propio, parte de pago, mandato, unidad vendida).
- **Venta de motos de punta a punta**: Orden de Compra (`OrdenCompra`/`VentaMoto`) con pagos combinables (efectivo + transferencia + dólares + cheque), permutas múltiples, financiación propia con cuotas, y generación de PDF.
- **Consignación de usadas** (mandatos de venta) con checklist documental (título, prenda, VTV, 2da llave...).
- **Taller**: turnos online → órdenes de trabajo → presupuestos, con estados y PDF.
- **Tesorería**: financiaciones propias, cuotas, recordatorios de vencimiento y mora con aviso al garante.
- **CRM/Leads** alimentado automáticamente desde todos los canales + **CRM operativo** de clientes (ficha con historial, documentos digitales).
- **Marketing**: publicación orgánica programada a IG/FB, **campañas pagas de Meta Ads** desde el panel, publicación en Mercado Libre, newsletter, cupones, promociones, testimonios, blog.
- **Post-venta automático**: recordatorio de service a los 6 meses + encuesta NPS a los 10 días, despachado por WhatsApp.
- **Captura de datos asistida por IA**: OCR de DNI/cédula/título para crear clientes y motos sin tipear.

El "ahorro de tiempo real" está en que **todo el trabajo administrativo de una concesionaria vive acá**: vender, facturar (PDF), cobrar cuotas, gestionar el taller, publicar en redes/ML, perseguir leads y hacer post-venta — automatizando lo repetitivo.

---

## 2. Stack técnico

| Capa | Tecnología | Versión |
|---|---|---|
| Framework | Next.js (App Router, server components) | **16.2.1** |
| Runtime UI | React | 19.2.4 |
| ORM / DB | Prisma + PostgreSQL (Neon) | Prisma 6.19 |
| Auth | NextAuth v4 (Credentials + JWT) | 4.24 |
| Hosting | Vercel (deploy + crons + headers de seguridad) | — |
| Estilos | Tailwind CSS v4 + shadcn + Radix UI | TW 4 |
| Pagos | MercadoPago | sdk 2.12 |
| Fotos/Videos | Cloudinary (loader custom + upload firmado) | 2.9 |
| IA | Anthropic Claude API (`@anthropic-ai/sdk`) | 0.80 |
| Email | Resend (`@react-email/components`) | 6.9 |
| Redes orgánico+pago | Meta Graph API + Marketing API (IG/FB) **v25.0** | — |
| Marketplace | Mercado Libre API (OAuth + webhooks) | — |
| Backups | Google Sheets API (`googleapis`) | 171 |
| PDF | `@react-pdf/renderer` (mandato, OC, OT, presupuesto) | 4.5 |
| Otros | bcryptjs, zod 4, date-fns, recharts, dnd-kit (drag&drop), xlsx, heic2any, sonner (toasts) | — |

Detalles de stack que delatan madurez:
- `package.json` → `build: "prisma generate && next build"` y `postinstall: "prisma generate"` (evita el error clásico de Prisma client en Vercel).
- `next.config.ts` → **loader de imágenes custom** (`src/lib/cloudinary-loader.ts`) para no pagar el optimizador de Vercel, redirects 301 para no romper bookmarks viejos, y **headers de seguridad** (HSTS, X-Frame-Options DENY, nosniff, Permissions-Policy).
- `src/middleware.ts` → protege `/admin` (redirect a login) y `/api/admin` (devuelve **JSON 401**, no redirect), con whitelist de endpoints que tienen su propia auth Bearer (crons, callbacks OAuth, webhooks).

---

## 3. Mapa de la web pública

Todas en `src/app/(public)/`. Layout único con navbar sticky, **chatbot IA flotante**, **WhatsApp flotante**, promo-bar, popup de bienvenida, cookie banner y barra inferior mobile.

| Ruta | Qué muestra / qué puede hacer el visitante |
|---|---|
| `/` (`page.tsx`) | Home: hero, grilla de modelos destacados, marcas (marquee), CTAs, financiación, testimonios. |
| `/catalogo` + `/catalogo/[slug]` | Catálogo de vehículos con filtros (marca, categoría, condición); ficha con galería, specs, colores con hex, calculadora de cuotas, OpenGraph dinámico por modelo (`opengraph-image.tsx`). |
| `/0km` y `/disponibles` | Landings dedicadas a 0KM y a usadas en stock. |
| `/tienda` + `/tienda/[slug]` | E-commerce de accesorios: filtros, ficha con talles, add-to-cart. |
| `/carrito` + `/checkout` (+ `/exito`, `/fallo`, `/pendiente`) | Carrito con contexto, checkout con **cupones**, envío o retiro, pago **MercadoPago**, tracking de conversión post-compra. |
| `/favoritos` | Wishlist (provider con localStorage). |
| `/comparador` | **Comparador de modelos** lado a lado (provider propio). |
| `/recomendador` | **Quiz que recomienda 3 motos con IA** según uso/experiencia/presupuesto; captura lead al final. |
| `/financiacion` | **Simulador de cuotas** con planes reales (coeficiente, anticipo). |
| `/servicio-tecnico` | Info de taller + **formulario de turno online** con calendario y días bloqueados. |
| `/consigna` | Captación de usadas en consignación. |
| `/contacto` / `/ubicacion` / `/nosotros` / `/envios` | Institucionales; contacto crea lead + manda email. |
| `/noticias` + `/noticias/[slug]` | Blog con editor HTML. |
| `/privacidad` `/terminos` `/eliminacion-de-datos` `/gracias` | Legales (requeridas por Meta para Ads). |
| SEO global | `sitemap.ts`, `robots.ts`, Schema.org `MotorcycleDealer` con horarios y geo, OpenGraph, Meta Pixel + Google Analytics, eventos de conversión (CAPI server-side). |

**Funcionalidades públicas destacadas:** chatbot IA con acceso al catálogo real, recomendador IA, comparador, wishlist, simulador de cuotas con planes administrables, popup de bienvenida que regala cupón 10% a cambio de email/teléfono (→ lead), y tracking dual cliente+servidor (Pixel + Conversions API).

---

## 4. Mapa del back administrativo

Todo en `src/app/admin/(dashboard)/`, sidebar agrupada (`src/components/admin/admin-sidebar.tsx`). Inventario completo de pantallas:

**General**
- **Dashboard** (`/admin`): pedidos hoy, turnos pendientes, leads nuevos, ventas del mes (agregadas). Stats vía `/api/admin/dashboard` y `/api/admin/analytics`.
- **Pedidos** (online de la tienda): lista, detalle, estados, export, tracking.
- **CRM / Leads**: lista con temperatura/etapa/origen, ficha con interacciones y recordatorios, export CSV.

**Operaciones**
- **Mandatos de venta** (consignación): alta con checklist documental, estados, PDF de mandato.
- **Órdenes de compra** (venta de motos): alta con cliente, moto, **pagos combinables** (`pagos-editor.tsx`), **permutas múltiples** (`oc-permuta-row.tsx`), financiación, balance (`oc-balance-card.tsx`), drawer, PDF.
- **Stock motos**: vista administrativa paralela al catálogo con chasis/motor/patente, pestañas (0KM / usadas / vendidas / archivadas), edición de stock.
- **Clientes**: ficha completa, documentos digitales (Cloudinary), quick-create/quick-edit modales, resumen de historial.
- **Proveedores**: contactos múltiples, cuentas bancarias múltiples, lista de precios (todo en JSON).

**Catálogo**
- **Catálogo de motos** (0KM / Usadas): **lista con edición inline** (precio, etiqueta, activo, destacado), buscador, tabs, drag&drop de orden, modal de fotos, quick-create. Form de modelo con +50 campos de specs.
- **Productos de tienda**: lista con edición inline (precio, stock, oferta, activo), stock por talle.

**Taller**
- **Órdenes de trabajo**: estados (ingresada→entregada), items (repuestos + mano de obra), PDF de OT.
- **Presupuestos**: cotizador que se convierte en OT; PDF de presupuesto.
- **Turnos**: calendario, confirmación, bloqueo de días, crear OT/cliente desde un turno.
- **Tipos de servicio**: catálogo con precio base y duración.

**Tesorería**
- **Resumen** + **Financiaciones**: alta manual o automática desde OC, tabla de cuotas con marcar pagada, estados (activa/atrasada/completada).

**Integraciones / Marketing**
- **Mercado Libre**: publicar/pausar/despublicar, tipos de listing (free/silver/gold), refresh status, bulk publish, webhook.
- **Instagram + FB (orgánico)**: publicación manual + **calendario de posts programados** (cancelar/crear), bulk publish, clear errors.
- **Meta Ads (pago)**: wizard rápido + editor jerárquico Campaign→AdSet→Ad, play/pause, tabla comparativa de creativos (CTR/CPC), sugerencia de copy por IA.
- **Newsletter** (export CSV), **Noticias** (editor HTML + fotos inline), **Testimonios**, **Cupones** (% + monto máx/mín, usos, categorías), **Promociones** (banners), **Planes de financiación** (web).
- **Outreach**: cola de mensajes a clientes (NPS + service + cuotas) con botón "Abrir WhatsApp" precargado.

**IA / Sistema**
- **Asistente IA** (`/admin/asistente`) + **asistente flotante** en todo el panel: chat con tools que leen la DB y proponen crear cliente/proveedor/modelo desde una foto.
- **Sistema**: estado de crons/jobs (`JobLog`), backups, invalidar cache.
- **Usuarios** (solo admin): alta con rol y permisos por sección.
- **Configuración**: datos del negocio, horarios, flags de pago/envío/retiro.

**Features transversales destacadas:** edición inline en todas las listas (`inline-cell.tsx`, `inline-estado-select.tsx`), modales quick-create para no perder el flujo, drag&drop de orden, confirmación de borrado, upload de fotos con cropper y soporte HEIC, y filtros + búsqueda en cada listado.

---

## 5. Modelo de datos (Prisma — resumido)

`prisma/schema.prisma`. ~40 modelos. Núcleo:

**Auth y config**
- `User` — login por `email` usado como username; `role` (`admin`/`usuario`); `permisos String[]` (secciones); `activo`.
- `SiteConfig` (singleton), `Configuracion` (key/value), `MLConfig`, `MetaConfig` (tokens encriptados, ad account, pixel, business id).

**Catálogo**
- `Modelo` — el modelo más rico (~80 campos): datos públicos + specs (`specs Json`), specs eléctricas, atributos ML, `colores ModeloColor[]`, `fotos String[]`, etiqueta, `tipoTenencia` (EN_LOCAL/EN_DOMICILIO), venta (`vendida`, `fechaVenta`), archivado, **datos internos** (chasis/motor/patente/cliente), `origen` (trazabilidad), relación **`modeloOrigen`/`unidadesVendidas`** (clon de 0KM al vender), refs a ML (`mlListingId`...) y Meta (`igPostId`...), flags de marketing.
- `ModeloColor` (nombre + hex + foto), `Categoria`, `Producto` (stock, talles, `stockPorTalle Json`), `Proveedor` (contactos/cuentas/lista de precios en JSON).

**E-commerce**
- `Pedido` + `PedidoItem`; enums `EstadoPedido`, `EstadoPago`, `TipoEntrega`; campos MercadoPago (`mpPaymentId`, `mpPreferenceId`, `mpStatus`), cupón, tracking.

**CRM**
- `Lead` + `LeadInteraction` + `LeadReminder`; enums `OrigenLead` (WEB, POPUP_BIENVENIDA, RECOMENDADOR, META_ADS, WHATSAPP, ML...), `TemperaturaLead`, `EtapaLead`.
- `Cliente` (CRM operativo) — DNI/CUIT, contacto, dirección, `documentos Json`, relaciones a mandatos/OCs/financiaciones/OTs/turnos/outreach.

**Operaciones de venta**
- `MandatoVenta` (consignación, numerado MV-####, checklist documental, comisión, tenencia).
- `OrdenCompra` (`@@map("VentaMoto")`, OC-####) — snapshot de la moto, `formaPago`, seña/saldo, permuta legacy + relaciones modernas.
- `OCPago` — pagos combinables (efectivo/transferencia/tarjeta/MP/cheque/dólares), cada uno con su moneda.
- `OCPermuta` — N motos en parte de pago, con checklist de accesorios y link a moto en stock + mandato auto-generado.

**Taller**
- `OrdenTrabajo` (OT-####, items JSON, económico, estados), `Presupuesto` (PRE-####, se convierte en OT), `TipoServicio`, `Turno` (+ `DiaBloqueado`).

**Tesorería**
- `FinanciacionOC` (FIN-####, capital/entrega/cuotas, garante) + `CuotaFinanciacion` (vencimiento, estado, comprobante).

**Marketing / integraciones**
- `ScheduledPost` (posts programados IG/FB, status, locking optimista, retries).
- `AdCampaign` → `AdCampaignAdSet` → `AdCampaignAd` (jerarquía Meta Ads, budget en centavos, audiencia Json validada con Zod, insights cacheados).
- `MetaApiLog` (log de cada call a Meta con token redactado, retención 30 días).
- `Promocion`, `Cupon`, `Noticia`, `Testimonio`, `NewsletterSubscriber`, `PlanFinanciacion`.

**Operativo automático**
- `OutreachTarea` (SERVICE_POSTVENTA / NPS / CUOTA_PROXIMA / CUOTA_VENCIDA) con snapshot de teléfono y mensaje exacto.
- `JobLog` (cada corrida de cron graba ok/mensaje/duración/metadata).
- `Visita` y `Conversion` (analytics propios).

Patrones de schema notables: numeración autoincremental humana (`numero Int @@unique @default(autoincrement())` → MV-0001/OC-0001/OT-0001/FIN-0001), **snapshots** de datos críticos por si se borra el origen, JSON para estructuras flexibles (specs, contactos, items), e índices pensados (`@@index([estado, fechaProgramada])` etc.).

---

## 6. Automatizaciones e integraciones

Mapa documentado en la cabecera del propio dump. Para cada una: disparador → qué hace → servicio.

### Crons de Vercel (`vercel.json`)
Todos validan `Authorization: Bearer ${CRON_SECRET}`.

| Endpoint | Frecuencia | Qué hace |
|---|---|---|
| `/api/cron/publish-scheduled` | cada 5 min | Publica posts programados a IG + FB cuando llega su hora. |
| `/api/cron/sync-ad-insights` | cada 6 h | Cachea métricas de Meta Ads (reach/clicks/ctr/cpc/spend). |
| `/api/admin/backup` | lun 6am | Backup semanal de la DB. |
| `/api/admin/backup-sheets` | diario 7am | Backup a Google Sheets. |
| `/api/admin/jobs/verificar-publicaciones` | lun | Verifica estado de publicaciones. |
| `/api/admin/jobs/generar-outreach` | diario | Genera tareas de NPS + service post-venta. |
| `/api/admin/jobs/cuotas-recordatorio` | diario | Genera recordatorios de cuotas próximas/vencidas. |

**Patrón de cron seguro** (`publish-scheduled/route.ts`): auth Bearer + feature flag + **optimistic locking** (`lockedAt`/`lockedBy` con `updateMany` que devuelve count, recupera zombies a los 10 min) + **batch chico** (5 por corrida, para no superar `maxDuration=60`) + reintentos (`retryCount`/`MAX_RETRIES=3`). Idempotencia garantizada.

### Pagos (MercadoPago)
`/api/webhooks/mercadopago` → al aprobarse el pago, marca el pedido `PAGO_CONFIRMADO`, manda **email de confirmación al cliente** (`sendOrderConfirmation`) + **notificación interna** (`notifyNewOrder`), y siempre responde 200 para que MP no reintente. Lazy-init del SDK (`getPaymentApi`).

### Email (Resend)
`src/lib/email.ts` — lazy init (si falta `RESEND_API_KEY` no rompe, devuelve `skipped`). Templates HTML con color de marca: confirmación de pedido, aviso de nuevo contacto, aviso de turno nuevo.

### Publicación orgánica IG+FB (Meta Graph API v25)
`src/lib/meta/publication.ts` — carrusel a IG + cross-post a FB, Reels/video. Detalle aprendido a fuerza de bug: **no pedir `error_message` al container de IG** porque rompe toda la publicación. Disparado por el cron de calendario o manualmente.

### Meta Ads (Marketing API)
`src/lib/meta/ads.ts` — crea Campaign→AdSet→Ad→Creative. Toda campaña arranca **DRAFT/pausada**; activar requiere doble confirmación del admin. Fallback si Meta rechaza por IG no vinculado. Insights cacheados por cron.

### Mercado Libre
`src/lib/ml/` — OAuth con refresh automático de token (expira cada 6h), publicar/pausar/despublicar, webhook (`/api/admin/ml/webhook`). **Al vender una moto se pausa el listing** (no se llama la API de ML dentro de la transacción; el cron lo despublica).

### Venta / stock (fuente única de verdad)
`src/lib/venta-moto-helpers.ts` — `marcarModeloComoVendido`: marca `vendida=true`/`activo=false`, estampa **cartel VENDIDO** vía Cloudinary (`sold-overlay.ts`, reversible y sin pérdida), sincroniza el mandato y pausa ML. Para 0KM **clona la unidad vendida** dejando el modelo padre en stock.

### Outreach post-venta (WhatsApp asistido)
`generar-outreach` (NPS a los 10 días, service a los 180) + `cuotas-recordatorio` (3 días antes / vencidas) crean `OutreachTarea` con el mensaje exacto desde templates (`OUTREACH_TEMPLATES` en `constants.ts`). El admin las despacha con un click que abre `wa.me` precargado. Idempotente con ventanas de fecha para no duplicar ni perder.

### Backups
DB → JSON y → Google Sheets (`googleapis`), ambos con su cron y registro en `JobLog`.

### Seguridad de tokens
`src/lib/crypto/tokens.ts` — tokens de Meta/ML encriptados con **AES-256-GCM** antes de persistir (prefijo `enc:v1:`, clave maestra en env). Lectura transparente de valores legacy en texto plano.

### Analytics propios
`/api/visita`, `/api/public/track`, `/api/public/conversion` graban `Visita`/`Conversion` (página, referrer, device, ciudad). Más Meta Pixel + Conversions API server-side (`/api/meta/capi`) y Google Analytics.

---

## 7. IA en el producto (Anthropic Claude)

Cinco usos reales, mezcla de cara al cliente e interno:

1. **Chatbot público** (`/api/chat/route.ts`, modelo `claude-sonnet-4-5`): asistente con **6 tools que leen el catálogo real** (`buscar_modelos`, `ver_modelo`, `buscar_productos`, `ver_categorias_tienda`, `ver_planes_financiacion`, `ver_promociones`). System prompt con datos del negocio, instrucción de no inventar, mostrar fotos en markdown solo si la tool las devuelve, y derivar a WhatsApp para cerrar. Streaming NDJSON. Rate-limit por IP.

2. **Asistente del admin con tools de escritura controlada** (`/api/admin/chat/route.ts`): **agentic loop** con tools de lectura (`get_stats`, `get_pedidos`, `get_leads`, `get_ventas_resumen`...) y tools de **propuesta** (`proponer_crear_cliente/proveedor/modelo`) que **NO escriben en la DB**: devuelven un `__preview__` que el frontend muestra para que el admin confirme. Acepta imágenes (foto de DNI/factura/remito) y extrae los datos. Regla dura: nunca crear directo, nunca inventar.

3. **OCR de documentos con Claude Vision** (`/api/admin/ocr/route.ts`): DNI, cédula verde, cédula azul, título del automotor. Prompts por tipo, salida JSON pura, `null` en lo que no se lee (mejor que inventar). Alimenta la creación de clientes y motos.

4. **Recomendador de motos** (`/api/recomendador/route.ts`, `claude-sonnet`): recibe el perfil del quiz + catálogo compacto, devuelve **3 modelos en JSON** con razonamiento, priorizando marcas de primera línea. Tiene **fallback** si no hay API key (elige 3 al azar de primera marca) — nunca falla de cara al usuario.

5. **Generación de contenido interno**: copy de avisos para Meta Ads (`suggest-caption`), specs técnicas automáticas de modelos (`scripts/completar-specs-ia*.cjs`, idempotente, rate-limit, system prompt que **nunca inventa** y omite lo dudoso), y descripciones de productos (`scripts/generar-descripciones.mjs`).

Patrones IA de oro: tools de **propuesta-con-confirmación** en vez de escritura directa, **siempre con instrucción explícita de no inventar**, fallbacks sin API key, y rate-limiting.

---

## 8. Sistema de diseño

**Identidad:** premium, "violeta noche + plata fría". Definido en `src/lib/constants.ts` (`BRAND_COLORS`) y `src/app/globals.css`.

**Paleta**
- Primario: Violeta Fernández `#6B4F7A` (variantes claro `#8B6F9A`, eléctrico `#9B59B6`).
- Premium v3: violeta deep `#3D2649`, noche `#2A1A36`, royal `#5A3F6E`, casi-negro `#0E0B12`, onyx `#15121A`.
- Plata fría como acento (reemplaza el dorado): `#C8C8D0`, claro `#E5E5EB`, soft `#F0F0F4`.
- Neutros: negro motor `#1A1A1A`, gris carbón `#4E4B48`, plata `#AAA9A9`, perla `#F8F5FA`, mist `#EFEAF2`.
- Theming con variables CSS en **oklch** (light + dark mode vía `next-themes`), tokens de sombras premium multinivel, gradientes y bordes de marca.

**Tipografía**
- Headings: **Montserrat** (`--font-heading`, weights 500-900).
- Body: **Poppins** (`--font-body`).
- Display: **Bebas Neue** (local, `--font-display`).

**UI:** componentes shadcn/Radix en `src/components/ui/` (button, dialog, sheet, tabs, select, popover, tooltip, table, switch, etc.), animaciones premium (`fadeInUp`, marquee de marcas), responsive con barra inferior mobile, watermark, gold/silver dividers, page-hero reutilizable. Emails con el mismo color de marca.

---

## 9. Roles, usuarios y permisos

- **Auth:** NextAuth v4, CredentialsProvider, estrategia **JWT**. Login por **username** (campo `email` reutilizado, no necesariamente email real). Password con **bcrypt**. Usuario `activo=false` no puede loguear pero queda en historial (`src/lib/auth.ts`).
- **Dos roles:** `admin` (acceso total + gestión de usuarios) y `usuario` (acceso restringido por `permisos String[]`).
- **Permisos por sección:** `src/lib/secciones.ts` define ~28 secciones (`SECCIONES_ADMIN`) agrupadas (OPERACIONES, CATÁLOGO, TALLER, TESORERÍA, MARKETING, INTEGRACIONES, SISTEMA). Un `usuario` solo ve/accede a las secciones de su lista; los `admin` ven todo.
- **Doble enforcement:** server-side con helpers `requireAdmin()` / `requireFullAdmin()` / `requireSection(seccion)` (`src/lib/admin-auth.ts`), y client-side filtrando la sidebar con `tieneAcceso()`. La sidebar (`admin-sidebar.tsx`) esconde grupos enteros si no hay items visibles.
- **Detalle fino:** `META` (orgánico, gratis) y `META_ADS` (gasta plata real) son permisos separados a propósito — solo quien está autorizado a gastar presupuesto puede crear/activar campañas.
- **Creación de usuarios:** desde `/admin/usuarios` (solo admin), eligiendo rol y secciones permitidas. Tipos extendidos en `src/types/next-auth.d.ts`.

---

## 10. Patrones de ORO para replicar (lo accionable)

Esto es lo que hace que el desarrollo "supere expectativas". Cada punto es copiable a un proyecto de Cauce:

1. **El sistema ES el ERP del negocio, no la web.** El catálogo público es la punta del iceberg; abajo está venta + cobranza + taller + CRM + marketing. **Regla Cauce:** mapear el flujo de plata y de trabajo del cliente y digitalizarlo entero, no solo la vidriera.

2. **Una sola "fuente de verdad" para acciones críticas.** Vender una moto pasa SIEMPRE por `venta-moto-helpers.ts` (marca vendida + cartel + sincroniza mandato + pausa ML + clona unidad 0KM). Evita estados inconsistentes. **Copiar:** centralizar toda transición de estado importante en un helper único, nunca duplicar la lógica en cada endpoint.

3. **Numeración humana autoincremental** (OC-0001, MV-0001, OT-0001, FIN-0001) con `formatNumero(prefix, n)`. El cliente habla con esos números. Barato y se nota.

4. **Snapshots de datos al momento del hecho.** La OC guarda `motoDescripcion`/chasis/motor aunque después se borre el modelo. Las tareas de outreach guardan el teléfono usado. **Copiar:** nunca depender de joins para datos que ya ocurrieron.

5. **Edición inline en todas las listas** (`inline-cell.tsx`): precio, stock, estado, activo se editan sin entrar al detalle (Enter guarda, Esc cancela, spinner de pending). Ahorra cientos de clicks por día. Es la preferencia #1 de Francisco y acá está bien resuelta.

6. **Quick-create modales en el flujo.** Crear cliente/moto/proveedor sin abandonar la pantalla donde estabas (`*-quick-create-modal.tsx`, `nueva-moto-quick-modal.tsx`). El admin nunca pierde el contexto.

7. **IA con "propuesta + confirmación", no escritura directa.** El asistente del admin propone (`__preview__`) y el humano confirma. Más OCR de documentos para no tipear. **Copiar:** IA que acelera carga de datos sin riesgo de basura en la DB, siempre con "nunca inventes".

8. **Crons idempotentes con locking optimista + feature flags + batch chico + JobLog.** El patrón de `publish-scheduled` es oro: corre dos veces y no duplica, recupera zombies, no timeoutea, y cada corrida queda auditada en `JobLog` visible desde el panel. **Copiar tal cual** para cualquier tarea programada.

9. **Post-venta automatizado que genera recompra y reseñas.** Service a los 6 meses + NPS a los 10 días + pedido de reseña en Google, despachado por WhatsApp con un click. Es retención y reputación en piloto automático. Bajísimo costo, altísimo valor percibido.

10. **CRM alimentado desde TODOS los canales automáticamente.** Cada formulario, popup, quiz, compra, turno y campaña crea/actualiza un `Lead` con su `origen` etiquetado. El dueño ve de dónde viene cada oportunidad sin cargar nada a mano.

11. **Cobranza con recordatorios automáticos y aviso al garante.** Financiación propia + cuotas + recordatorio 3 días antes + aviso de mora que menciona al garante. Resuelve un dolor real de las PyMEs que financian.

12. **Pagos combinables y multimoneda de verdad.** Una OC puede mezclar efectivo + transferencia + dólares + cheque + permuta + financiación, cada renglón con su moneda. Refleja cómo se vende realmente en Argentina, no un checkout idealizado.

13. **Integraciones de marketing donde está la plata.** Publicar a IG/FB programado, Meta Ads pagas desde el panel (con doble confirmación porque gasta), y Mercado Libre. El negocio no sale de su panel para vender en todos lados.

14. **Robustez "no rompas la producción":** lazy-init de todos los SDKs (build no falla sin API key), fallbacks (recomendador sin IA, email skipped), tokens encriptados AES-256-GCM, `MetaApiLog` con token redactado, rate-limiting por IP, headers de seguridad, y feature flags por integración.

15. **Performance y costo controlados:** loader de imágenes custom de Cloudinary (LCP mobile + no se paga el optimizador de Vercel), `unstable_cache` con tags invalidables desde el admin, cartel VENDIDO como transformación reversible (cero re-uploads).

16. **Detalles "argentinos" que el cliente nota:** formato de precio ARS/USD, WhatsApp con mensajes pre-armados por contexto (modelo/producto/turno) y normalización de teléfonos, timezone AR consistente (DB en UTC), español rioplatense en todo.

17. **Scripts de operación batch idempotentes con `--dry-run`** (carga masiva desde Excel, fotos con matcheo fuzzy, migraciones, backfills). El negocio puede cargar 150 motos de una sin tocar la UI, y siempre se puede simular antes de aplicar.

18. **Documentación operativa interna:** el proyecto incluye un "mapa de automatizaciones" y un brief técnico por fases con principios no-negociables (idempotencia, borrador por defecto, honest logging). **Copiar:** entregar el sistema con su mapa, no solo el código.

---

### Resumen para Cauce
Lo que eleva esto de "web linda" a "me cambiaste el negocio" es la **profundidad operativa** (venta + cobranza + taller + CRM + marketing en un panel), la **automatización idempotente y auditable** (crons, outreach, integraciones), la **IA usada con criterio** (acelera carga, nunca inventa, siempre confirma) y la **terminación profesional** (numeración humana, multimoneda, encriptación, fallbacks, performance). Un proyecto Cauce alcanza este estándar cuando digitaliza el flujo completo del negocio, automatiza lo repetitivo de forma segura, y cuida los detalles que el dueño toca todos los días.
