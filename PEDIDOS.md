# PEDIDOS.md — criterios de aceptación vivos

Cada pedido de Francisco se anota como criterio verificable. Estados: ⏳ pendiente · ✅ hecho · 🔍 verificado.

## Pedidos de la sesión 2026-06-10 (arranque del rebuild)

| # | Pedido | Estado | Notas |
|---|---|---|---|
| 1 | Crear la empresa completa del kit en carpeta nueva | ✅ | F0→F6 construidas; build verde; F7 (módulos restantes OS) y F8 (MP) diferidas según el kit |
| 2 | **Design tokens del brand "Corriente" APLICADOS** (10/06, pedido de Fran: "no te salgas de eso") | 🔍 | Tomados de `Cauce - Design Tokens.html`: ink/surface/line, blue #2E6BFF, cyan #7FE8FF, Space Grotesk + IBM Plex Sans/Mono, radios 8/14/22, dark-first (modo claro sobre --fog). Evidencia regenerada con el brand |
| 3 | Empresa funcional, "que no le erre", lista para rendir al 100% | 🔍 | Verificado: build + typecheck verdes, login en las 3 superficies, 31 screenshots en `evidencia/` |
| 4 | Preview corriendo | ✅ | Local `npm run dev`. **PRODUCCIÓN LIVE: https://cauce-arg.vercel.app** (cuenta Vercel `vespa-bahia`, repo `JuanFranciscoFernandez51/CAUCE`, auto-deploy en cada push) |
| 4b | **Deploy a Vercel** (18/06) | ✅ | Bug clave resuelto: Next 16 deprecó `middleware.ts` → renombrado a `proxy.ts` (el middleware deprecado rompía el routing en Vercel = 404 en todo). Framework Preset Next.js. Env cargadas en Production. Cloudinary `dgtlyzyra` activo. 38 workflows n8n re-provisionados al dominio real. Login/admin/hooks verificados en prod |
| 5 | Manual de uso | ✅ | `MANUAL.md` |
| 6 | 20 mejoras aplicables, iniciar las posibles | ✅ | `MEJORAS.md` — 10 implementadas hoy |
| 7 | 10 leads de complejidad variada con resolución completa | ✅ | `npm run demo` (idempotente): N1→N4, 6 áreas, blueprints, todos aprobados, 27 automatizaciones en TEST con config, QA corrido, usuarios de portal, suscripciones, uso del mes y reportes. 3 con roadmap de consultoría. 4 con Cauce OS activo (módulos + branding) |
| 8 | Lo que traba n8n/WhatsApp dejarlo para después | ✅ | Automatizaciones quedan en TEST listas para provisionar; proyectos en QA con nota |

## Entrega n8n + softwares a medida (12/06, pedido de Fran)

| Qué | Estado |
|---|---|
| n8n de Railway conectado y **limpiado** (5 workflows viejos borrados con su OK) | ✅ |
| **20 workflows plantilla** (uno por receta del recetario) con triggers reales, lógica en Code, integración real a los hooks de Cauce OS y pasos de canal marcados "(pendiente credencial Meta/MP/AFIP)" | ✅ `scripts/n8n-templates.ts` |
| **28 instancias por cliente** clonadas con sus variables, QA pasado, ACTIVAS en n8n | ✅ `scripts/provision-all.ts` |
| **Software a medida para los 10 clientes**: módulos por rubro, branding propio, campos custom de su operación (CUIT/obra social/patente/talle/etc.), disponibilidad y datos de muestra | ✅ `scripts/os-a-medida.ts` |
| Sinergia bot→OS **verificada end-to-end**: hook `slots` devolvió huecos reales y `book` agendó un turno que apareció en la agenda de la peluquería (capturas 44-48 en `evidencia/`) | ✅ |
| Pipeline: 10 proyectos en **Activo**, clientes en ACTIVE, dashboard con MRR completo | ✅ |

Notas: (1) los hooks de los workflows apuntan a `NEXT_PUBLIC_APP_URL` (localhost) — al deployar a Vercel hay que re-provisionar (borrar workflowId y correr `provision-all`) para que apunten al dominio real; (2) los nodos "(pendiente credencial)" se reemplazan por los conectores reales (Meta/MP/Sheets) en el onboarding de cada cliente; (3) contratos de hooks: `lead {nombre, telefono, consulta}` · `book {nombre, telefono, fecha, hora, servicio}`.

⚠️ **Importante:** las DOS API keys de Anthropic (CAUCE-NUEVO y la del bot de Vespa) están **sin créditos** ("credit balance too low"). Los 10 blueprints/roadmaps de la demo salieron del **fallback curado** del script (calidad cuidada a mano). Con créditos cargados, todo lead nuevo se diagnostica con IA real automáticamente — el código ya está y se probó el camino de error.

## Decisiones técnicas tomadas en autonomía (revisar)

| # | Decisión | Motivo |
|---|---|---|
| D1 | ~~Postgres embebido para desarrollo~~ → **Neon conectado** (2026-06-10): Fran pasó la URL del proyecto nuevo (sa-east-1); schema aplicado + seed corrido. El Postgres embebido queda como fallback comentado en `.env` (`npm run db:dev`). | Checklist cumplido: DB nueva, el v1 no se toca. |
| D2 | ~~API key del bot de Vespa~~ → **API key nueva "CAUCE-NUEVO"** (2026-06-10) cargada en `.env`. | Key dedicada para Cauce v2. |
| D3 | **Prisma 6** (no 7) | Misma versión que tus otros proyectos; API estable. |
| D4 | **NextAuth v4 con credentials + username** | Según preferencias de stack. |
| D5 | UI con primitivas propias sobre Tailwind (sin shadcn CLI) | Menos dependencias; tokens centralizados para el re-skin posterior. |
| D6 | Booking de consultoría: embed de Cal.com si `NEXT_PUBLIC_CAL_URL` está seteada; si no, formulario propio que crea el lead+consulta | F2 funciona sin esperar credenciales. |
| D7 | Roadmap de consultoría: **gratis por defecto** (`roadmapPriceUsd=0` en PricingConfig, editable en admin) | Decisión configurable que el kit deja abierta. |

## Para después (lo trae Fran al cierre)

- Fran tiene **dos softwares ya armados con varias automatizaciones creadas** para tomar de ejemplo → revisarlos al terminar el build (posibles recetas reales + plantillas n8n para el recetario).

## Credenciales que faltan (cada una habilita features, nada se rompe sin ellas)

| Credencial | Habilita | Dónde va |
|---|---|---|
| ~~`DATABASE_URL` de Neon~~ ✅ recibida 2026-06-10 | Producción / deploy | `.env` (falta cargarla en Vercel al deployar) |
| Cuenta Cal.com | Booking real de consultoría (F2) | `NEXT_PUBLIC_CAL_URL` |
| WhatsApp Cloud API (app Meta + número de prueba) | Starter autoservicio conectado (F4) | `WHATSAPP_*` |
| URL + API key de n8n (workspace/carpeta "v2") | Motor de ejecución real (F5) | `N8N_URL`, `N8N_API_KEY` |
| Mercado Pago | **F8 diferida** (arquitectura lista, sin implementar) | — |
