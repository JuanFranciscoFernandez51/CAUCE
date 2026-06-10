# Cauce v2

Agencia productizada de **automatización con IA para negocios** (Bahía Blanca, opera remoto).
Promesa: *"Cualquier empresa, cualquier proceso, resuelto con mínimos clicks."*

## Arranque rápido (desarrollo)

```bash
npm install
npm run db:dev      # terminal 1: Postgres embebido (puerto 5433)
npm run db:push     # primera vez: aplica el schema
npm run db:seed     # primera vez: recetas, pricing, usuarios
npm run dev         # terminal 2: la app en http://localhost:3000
```

**Usuarios del seed:** admin `fran` / `cauce2026` · cliente demo `vespa` / `vespa2026` (¡cambialas!).

## Las tres superficies

| Superficie | Ruta | Qué es |
|---|---|---|
| Sitio público | `/` | Landing, doble puerta (intake `/intake` + consultoría `/consultoria`), precios, casos |
| Portal cliente | `/portal` | Sus automatizaciones, contenido del bot, canal, uso, reportes, facturación |
| Admin (Fran) | `/admin` | Pipeline kanban, leads+diagnóstico IA, clientes, recetario, consultorías+roadmap IA, pricing |
| Cauce OS | `/os/[slug]` | El software propio de cada cliente (multi-tenant): CRM + Turnos (+ stock/RRHH/caja en F7) |

## Producción

1. Crear proyecto **nuevo** en Neon → `DATABASE_URL` en Vercel (no usar la DB del v1).
2. Variables: `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `ENCRYPTION_KEY` (hex 32 bytes), `ANTHROPIC_API_KEY`, `CAUCE_WEBHOOK_SECRET`.
3. Opcionales por feature: `N8N_URL`+`N8N_API_KEY` (motor), `NEXT_PUBLIC_CAL_URL` (booking), `WHATSAPP_*` (canal), `TENANT_BASE_DOMAIN` (subdominios `cliente.cauce.app`).
4. `npx prisma db push && npm run db:seed` contra Neon la primera vez.

## Documentos de trabajo

- `DEFINITION_OF_DONE.md` — el estándar de calidad de toda pantalla.
- `PEDIDOS.md` — criterios de aceptación vivos + decisiones tomadas + credenciales pendientes.

## Seguridad (no negociable)

- Credenciales de clientes cifradas **AES-256-GCM** (`src/lib/crypto.ts`), jamás en claro.
- Toda automatización nace en `TEST`, jamás directo a `ACTIVE`.
- Multi-tenant: toda query de módulos OS scopeada por `clientId`; un cliente jamás ve datos de otro.
- Rate-limit + zod en endpoints públicos; APIs devuelven JSON 401 (no redirect).
- Mercado Pago: **diferido (F8)** — modelos `Subscription`/`Invoice` listos, sin integración.
