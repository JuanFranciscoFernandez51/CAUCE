# PEDIDOS.md — criterios de aceptación vivos

Cada pedido de Francisco se anota como criterio verificable. Estados: ⏳ pendiente · ✅ hecho · 🔍 verificado.

## Pedidos de la sesión 2026-06-10 (arranque del rebuild)

| # | Pedido | Estado | Notas |
|---|---|---|---|
| 1 | Crear la empresa completa del kit en carpeta nueva | ⏳ | En curso, fases F0→F6 |
| 2 | **Design tokens diferidos** — "los design tokens dejalos para más tarde" | ✅ | Set neutro centralizado en `globals.css`; cuando Fran pegue los tokens del v1 se reemplazan ahí y toda la app los toma |
| 3 | Empresa funcional, "que no le erre", lista para rendir al 100% | ⏳ | Verificación end-to-end al cierre |

## Decisiones técnicas tomadas en autonomía (revisar)

| # | Decisión | Motivo |
|---|---|---|
| D1 | **Postgres embebido para desarrollo** (`npm run db:dev`, puerto 5433) | No hay Postgres/Docker/brew en la máquina y el checklist pide DB nueva. El schema es 100% Postgres: para producción solo cambia `DATABASE_URL` en `.env` por la URL de Neon (proyecto NUEVO para v2, no la DB del v1). |
| D2 | **ANTHROPIC_API_KEY reutilizada** del bot de Vespa (checklist: "la misma que ya usás sirve") | Copiada a `.env` local. |
| D3 | **Prisma 6** (no 7) | Misma versión que tus otros proyectos; API estable. |
| D4 | **NextAuth v4 con credentials + username** | Según preferencias de stack. |
| D5 | UI con primitivas propias sobre Tailwind (sin shadcn CLI) | Menos dependencias; tokens centralizados para el re-skin posterior. |
| D6 | Booking de consultoría: embed de Cal.com si `NEXT_PUBLIC_CAL_URL` está seteada; si no, formulario propio que crea el lead+consulta | F2 funciona sin esperar credenciales. |
| D7 | Roadmap de consultoría: **gratis por defecto** (`roadmapPriceUsd=0` en PricingConfig, editable en admin) | Decisión configurable que el kit deja abierta. |

## Credenciales que faltan (cada una habilita features, nada se rompe sin ellas)

| Credencial | Habilita | Dónde va |
|---|---|---|
| `DATABASE_URL` de Neon (proyecto nuevo) | Producción / deploy | `.env` / Vercel |
| Cuenta Cal.com | Booking real de consultoría (F2) | `NEXT_PUBLIC_CAL_URL` |
| WhatsApp Cloud API (app Meta + número de prueba) | Starter autoservicio conectado (F4) | `WHATSAPP_*` |
| URL + API key de n8n (workspace/carpeta "v2") | Motor de ejecución real (F5) | `N8N_URL`, `N8N_API_KEY` |
| Mercado Pago | **F8 diferida** (arquitectura lista, sin implementar) | — |
