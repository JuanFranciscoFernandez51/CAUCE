# PEDIDOS.md — criterios de aceptación vivos

Cada pedido de Francisco se anota como criterio verificable. Estados: ⏳ pendiente · ✅ hecho · 🔍 verificado.

## Pedidos de la sesión 2026-06-10 (arranque del rebuild)

| # | Pedido | Estado | Notas |
|---|---|---|---|
| 1 | Crear la empresa completa del kit en carpeta nueva | ✅ | F0→F6 construidas; build verde; F7 (módulos restantes OS) y F8 (MP) diferidas según el kit |
| 2 | **Design tokens diferidos** — "los design tokens dejalos para más tarde" | ✅ | Set neutro centralizado en `globals.css`; cuando Fran pegue los tokens del v1 se reemplazan ahí y toda la app los toma |
| 3 | Empresa funcional, "que no le erre", lista para rendir al 100% | 🔍 | Verificado: build + typecheck verdes, login en las 3 superficies, 31 screenshots en `evidencia/` |
| 4 | Preview corriendo | ✅ | `npm run dev` → http://localhost:3000 (el panel de preview de Claude.app está roto en esta instalación — binario `disclaimer` faltante) |
| 5 | Manual de uso | ✅ | `MANUAL.md` |
| 6 | 20 mejoras aplicables, iniciar las posibles | ✅ | `MEJORAS.md` — 10 implementadas hoy |
| 7 | 10 leads de complejidad variada con resolución completa | ✅ | `npm run demo` (idempotente): N1→N4, 6 áreas, blueprints, todos aprobados, 27 automatizaciones en TEST con config, QA corrido, usuarios de portal, suscripciones, uso del mes y reportes. 3 con roadmap de consultoría. 4 con Cauce OS activo (módulos + branding) |
| 8 | Lo que traba n8n/WhatsApp dejarlo para después | ✅ | Automatizaciones quedan en TEST listas para provisionar; proyectos en QA con nota |

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
