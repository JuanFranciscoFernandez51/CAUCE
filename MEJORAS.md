# MEJORAS — Cauce v2

*20 mejoras aplicables, priorizadas. Estado: ✅ hecha ya (10/06) · 🔜 lista para hacer · 🔑 espera credenciales/decisión de Fran.*

## Hechas ya (implementadas hoy)

1. ✅ **Datos demo en Cauce OS de Vespa** — contactos y turnos de muestra (incluido uno creado "por el bot") para que el CRM y Turnos se vean vivos y la sinergia sea demostrable.
2. ✅ **Health check** — `GET /api/health` (ping a DB + estado de integraciones) para monitoreo y para Vercel.
3. ✅ **SEO base** — `robots.txt` + `sitemap.xml` generados (preferencia tuya de SEO en toda web pública).
4. ✅ **Página 404 propia** — con tokens y CTA a las dos puertas (antes era la cruda de Next).
5. ✅ **WhatsApp flotante** en el sitio público (esquina inferior, como en tus otras webs) — número configurable por env `NEXT_PUBLIC_WHATSAPP`.
6. ✅ **Ícono/branding mínimo** — favicon SVG de Cauce (onda de río) + OpenGraph metadata.
7. ✅ **Badge de leads nuevos en el admin** — el sidebar muestra cuántos leads NEW hay sin revisar.
8. ✅ **Margen real en dashboard** — al generar el reporte mensual, el costo variable estimado del cliente (`costEstUsd`) se actualiza desde el uso real → el dashboard muestra margen MRR vs costo de verdad.
9. ✅ **`npm run demo`** — el script end-to-end de los 10 leads queda como comando repetible (idempotente).
10. ✅ **Fallback curado del diagnóstico** — si la API de Anthropic falla (sin créditos/caída), el flujo de intake NUNCA pierde el lead y el sistema degrada con claridad.

## Para la próxima iteración (sin bloqueos)

11. 🔜 **Cambio de contraseña desde la UI** (admin y portal) — hoy se cambia por seed/DB.
12. 🔜 **Export CSV** de leads, clientes y contactos del CRM (un click desde cada tabla).
13. 🔜 **Módulos F7 de Cauce OS** — Catálogo & Stock → RRHH (entradas/salidas por web) → Caja & Reportes. Los modelos de datos ya existen; falta la UI (los del plan F7 del kit).
14. 🔜 **Multi-usuario por tenant con roles** (dueño/empleado) en Cauce OS — hoy es 1 usuario por cliente.
15. 🔜 **Chat IA flotante en el admin** (como tus otros admins: Claude con tools sobre la DB para consultar "¿cuánto MRR tengo?" o crear leads a mano). Necesita créditos de API.
16. 🔜 **Tests e2e de los flujos críticos** (Playwright): intake→blueprint, registro→portal, scoping multi-tenant (que un tenant jamás vea a otro — hoy garantizado por código y revisado, pero sin test automático).
17. 🔜 **Auditoría/activity log** — quién tocó qué (cliente, automatización, pricing) con timestamp.

## Esperan algo tuyo

18. 🔑 **Créditos en la API de Anthropic** — las DOS keys (la nueva de Cauce y la del bot de Vespa) están sin saldo. Con créditos: diagnóstico y roadmaps 100% IA (el código ya está; los 10 demos usaron el fallback curado), y el chat del punto 15.
19. 🔑 **n8n (URL + API key) + plantillas de tus 2 softwares de ejemplo** — habilita Provisionar/Activar real. Tus automatizaciones existentes se importan como workflows plantilla y se referencian con `n8nTemplateId` en el recetario.
20. 🔑 **Deploy a Vercel + dominio** (`cauce.app` o el que elijas) con `TENANT_BASE_DOMAIN` → cada cliente Scale entra por `sucliente.cauce.app`. Después: WhatsApp Cloud API (canal Starter), Cal.com (booking), Mercado Pago (F8) y Resend (emails).
