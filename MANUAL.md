# MANUAL DE USO — Cauce v2

*Para Francisco. Español directo, cero vueltas.*

---

## 0. Arrancar

```bash
cd "/Users/juanfri/Desktop/CAUCE FABLE/cauce"
npm run dev          # la app en http://localhost:3000
```

La DB es **Neon** (ya configurada en `.env`). Si Neon no responde, hay un Postgres local de emergencia: `npm run db:dev` en otra terminal y descomentá la línea local de `DATABASE_URL` en `.env`.

**Usuarios:**

| Quién | Usuario | Contraseña | Entra a |
|---|---|---|---|
| Vos (admin) | `fran` | `cauce2026` ⚠️ cambiala | `/admin` |
| Vespa Bahía (cliente demo) | `vespa` | `vespa2026` | `/portal` y `/os/vespabahia` |
| Los 10 clientes demo | `slug del negocio` | `slug2026` (ej: `pizzeriadonvito` / `pizzeriadonvito2026`) | `/portal` |

El login es por **usuario** (no email): `/login`. Después del login cada rol va solo a su superficie.

---

## 1. Cómo entra un cliente (las dos puertas)

### Puerta 1 — "Sé lo que necesito" → `/intake`
Wizard de 5 pasos (negocio → dolor → volumen y apps → urgencia y presupuesto → contacto). Al enviar:
1. Se crea el **Lead** (fuente INTAKE).
2. El **agente de Diagnóstico** (Claude) lo matchea contra el recetario completo y genera un **Blueprint** borrador (nivel N1-N4, recetas, flujo, pack y precios sugeridos).
3. Aparece en `/admin/leads` ya calificado con score, y en el **Pipeline** en la columna Diagnóstico.

### Puerta 2 — "No sé qué automatizar" → `/consultoria`
La puerta de los mejores clientes. Si cargás `NEXT_PUBLIC_CAL_URL` en `.env` aparece tu Cal.com embebido; si no, el formulario propio crea Lead + Consultoría agendada.

**Tu flujo:** `/admin/consultorias` → abrís la consulta → hacés la videollamada → volcás todo en "Notas de la llamada" → **"Generar roadmap"** → la IA arma el roadmap por fases con recetas y precios → "Marcar como enviado" → si avanza, **"Convertir en proyecto"** (cae en el pipeline en Aprobación).

### Puerta 3 (autoservicio) — `/registro`
El Starter se vende solo: el negocio se registra, queda como cliente ONBOARDING con suscripción activa, y le aparece el checklist en su portal (conectar canal → cargar contenido → esperar tu activación).

---

## 2. El admin (`/admin`) — tu centro de operaciones

- **Dashboard**: MRR, clientes activos, leads del mes, margen estimado (MRR − costos variables), churn, mensajes del mes, salud de automatizaciones, y qué necesita atención.
- **Pipeline** (`/admin/pipeline`): kanban drag&drop con los 7 estados: Lead → Diagnóstico → Aprobación → Build → QA → Onboarding → Activo. Arrastrás la card y queda.
- **Leads** (`/admin/leads`): el detalle muestra el intake legible y los blueprints. Botones:
  - **Correr diagnóstico**: re-corre la IA.
  - **Aprobar blueprint**: convierte el lead en **cliente**, crea sus **automatizaciones en TEST** (nunca nacen activas) y mueve el proyecto a Build. Te lleva al cliente creado.
- **Clientes** (`/admin/clientes/[id]`): todo lo del cliente en una pantalla:
  - *Automatizaciones*: editás la config (las variables de la receta), y los botones del ciclo: **Provisionar en n8n** (cuando cargues las credenciales) → **Correr QA** (checks automáticos con ✓/✗) → **Activar** / **Pausar**.
  - *Cauce OS*: prendés/apagás módulos (CRM, Turnos, Catálogo, RRHH, Caja), editás su branding (colores, logo) y abrís su sistema.
  - *Credenciales*: tokens del cliente **cifrados AES-256-GCM** — se guardan y jamás se vuelven a mostrar.
  - *Uso*: mensajes del mes vs tope del pack (fair use).
  - *Reportes*: "Generar reporte del mes" arma el reporte con datos reales; el cliente lo ve en su portal.
  - *Acceso al portal*: le creás usuario y contraseña.
- **Recetario** (`/admin/recetario`): las 20 recetas seed por área y nivel. CRUD completo. El campo `n8nTemplateId` es el que conecta cada receta con su workflow plantilla cuando tengas n8n.
- **Pricing** (`/admin/pricing`): TODO el pricing del sitio sale de acá (dólar, IVA, packs con setup/mensual/fair use/features, precio por módulo de Cauce OS, precio del roadmap). Guardás y el sitio público ya muestra lo nuevo.

---

## 3. El portal del cliente (`/portal`)

Lo que ve cada cliente al loguearse:
- **Inicio**: sus automatizaciones con estado y salud, checklist de onboarding (si es Starter nuevo), barra de fair use (al 80% le avisa, al 100% le ofrece pasarse a Pro), stats del mes.
- **Contenido del bot**: edita sus FAQs, horarios, datos y tono — eso alimenta la config del bot.
- **Canal**: conecta su WhatsApp/IG (tokens cifrados). V1: vos activás desde el admin en 1 click.
- **Uso / Reportes / Facturación**: su consumo, sus reportes mensuales, su suscripción y facturas (MP llega en F8).
- **Pedir más**: cualquier pedido nuevo te cae como Lead.

---

## 4. Cauce OS (`/os/[slug]`) — el software propio de cada cliente

Multi-tenant real: **una sola codebase**, cada cliente ve SU sistema con su marca (colores del branding que definís en el admin), solo sus módulos, y sus campos custom.

- **CRM**: pipeline de contactos (nuevo → contactado → interesado → cliente → perdido), buscador, tareas, historial de turnos por contacto. Los contactos que crea el bot llegan marcados "Vino del bot 🤖".
- **Turnos**: agenda de hoy + próximos 7 días, alta de turno con huecos libres calculados de la disponibilidad, confirmación/cancelación, configuración de disponibilidad semanal (franjas mañana/tarde).
- **La sinergia** (el diferencial): hay 3 webhooks listos para que el bot/n8n escriba directo en el sistema del cliente:
  - `GET /api/hooks/[slug]/slots?date=2026-06-15` → huecos libres del día
  - `POST /api/hooks/[slug]/book` → el bot agenda un turno (cae en el módulo Turnos como Pendiente)
  - `POST /api/hooks/[slug]/lead` → el bot carga un lead al CRM del cliente
  - Seguridad: header `x-cauce-secret` con el valor de `CAUCE_WEBHOOK_SECRET` (está en `.env`).

Probalo con Vespa: `/os/vespabahia` (logueado como `vespa` o como `fran`).

---

## 5. El ciclo de delivery completo (resumen)

```
Lead (intake/consultoría/registro)
  → Diagnóstico IA → Blueprint (nivel, recetas, precios)
  → Vos aprobás → Cliente + automatizaciones en TEST + proyecto a Build
  → Config de variables → Provisionar en n8n (pendiente de credenciales)
  → QA automático → Activar → el cliente lo ve vivo en su portal
  → Uso trackeado (fair use) → Reporte mensual
```

**Qué está esperando credenciales** (todo lo demás funciona ya):
- `N8N_URL` + `N8N_API_KEY` → habilita Provisionar/Activar real (hoy las automatizaciones quedan en TEST, listas).
- `WHATSAPP_*` → el canal real del Starter.
- `NEXT_PUBLIC_CAL_URL` → booking real de consultoría.
- Mercado Pago → F8, diferido a propósito.

---

## 6. Deploy a producción (cuando digas)

1. Repo a GitHub → import en Vercel.
2. Variables de entorno en Vercel: las de `.env` (la `DATABASE_URL` de Neon ya es la de producción).
3. `TENANT_BASE_DOMAIN=cauce.app` (o el dominio que elijas) habilita `cliente.cauce.app` → su Cauce OS.
4. El `postinstall` ya corre `prisma generate` solo.
