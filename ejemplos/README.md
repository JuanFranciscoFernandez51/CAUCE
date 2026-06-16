# Ejemplos de referencia — el estándar de entrega de Cauce

Dos negocios reales de Francisco, desarrollados enteros con IA, con front público + back administrativo de nivel ERP. **Son la vara**: cuando Cauce entrega un software a un cliente, tiene que apuntar a este nivel de completitud — algo que ahorra tiempo de verdad al negocio y al cliente, no un CRM con listas.

| Ejemplo | Qué brilla | Destilado |
|---|---|---|
| **Motos Fernández** | Back-office profundo: roles/permisos por sección, crons idempotentes con JobLog auditable, outreach post-venta por WhatsApp (NPS/service), Meta Ads + Mercado Libre desde el panel, backups a Sheets, tokens AES-256-GCM, IA con patrón "propuesta + confirmación". | [motos-fernandez.md](motos-fernandez.md) |
| **Vespa Bahía** | E-commerce + motor de campaña (Hot Sale on-the-fly), captación (test ride, QR físicos, popup, recovery de carrito), stock físico unitario por chasis, doble pixel Meta CAPI, IA que escribe directo en la DB. | [vespa-bahia.md](vespa-bahia.md) |

> El estándar Cauce ideal es la **unión de los dos**: la captación + Hot Sale + stock unitario de Vespa, sobre la base operativa de roles + crons + outreach + integraciones + backups de Motos.

---

## El estándar en 12 principios (esto es lo accionable)

Cada entrega de Cauce — el Cauce OS del cliente — debería cumplir lo más posible de esto. Marcá contra esta lista en el `DEFINITION_OF_DONE`.

### 1. Es un ERP, no una web
El catálogo/landing es la punta del iceberg. Abajo vive la operación completa del negocio: venta + cobranza + post-venta + stock + CRM + marketing, todo en un panel. **La profundidad es lo que cambia el negocio.** Si la entrega es "una web linda + un CRM con listas", no alcanza.

### 2. Fuente única de verdad por acción crítica
Cada acción importante (vender, cobrar, dar de baja, facturar) pasa SIEMPRE por un helper único (`venta-moto-helpers.ts`, `oc-helpers.ts`, `financiacion-helpers.ts`). Nunca se duplica la lógica de estado. Una venta dispara en cascada todo lo que tiene que pasar (marcar vendido, cartel, sincronizar canales, clonar unidad, pausar publicación).

### 3. Separar el "tipo" de la "unidad"
Modelo/catálogo (lo que se muestra) ≠ unidad física en stock (con identificador único tipo chasis). Se sincronizan al vender. Para Cauce: un producto del catálogo vs. el ítem individual de inventario.

### 4. Numeración humana autoincremental
OC-0001, MV-0001, OT-0001, FIN-0001. El cliente y el negocio hablan con esos números. Nada de exponer cuids al usuario final.

### 5. Snapshots al momento del hecho
La orden guarda la descripción/precio del producto **aunque después se borre o cambie el modelo**. El registro histórico no se rompe nunca. Inmutabilidad de lo que ya pasó.

### 6. Edición inline en TODAS las listas + quick-create en el flujo
`inline-cell.tsx`: editar precio/stock/estado desde la lista sin entrar al detalle. Modales de creación rápida en medio del flujo (crear cliente mientras cargás una venta). **Cero clicks perdidos** — es la preferencia #1 de Francisco.

### 7. IA en dos modos, según el riesgo
- **Escribe directo** (Vespa): el asistente consulta y modifica la DB real con tools, siempre con "no inventes nada".
- **Propuesta + confirmación** (Motos): la IA devuelve un `__preview__` que el humano confirma antes de ejecutar. **Obligatorio para todo lo que gasta plata o es irreversible.**
- **OCR con Claude Vision**: cargar DNI/factura/título sin tipear, con "null en lo dudoso".

### 8. CRM auto-alimentado desde todos los canales, con `origen` etiquetado
Cada lead entra marcado con su fuente (popup, quiz, compra, turno, Meta Ads, ML, WhatsApp, test ride). Dedup por email/teléfono. Al re-contactar, no se pisa la temperatura más alta ya alcanzada.

### 9. Post-venta automático que genera recompra
Service a los X meses + NPS a los 10 días + pedido de reseña en Google, despachado por WhatsApp con un click. **La venta no termina en la entrega.**

### 10. Crons idempotentes y auditables
Locking optimista + feature flag + batch chico + `JobLog` con resultado de cada corrida. El patrón `publish-scheduled` de Motos es replicable tal cual. Donde se puede, evitar el cron: estados derivados al listar (Vespa marca atraso de cuotas sin job).

### 11. Pagos reales argentinos: combinables y multimoneda
Efectivo + transferencia + dólares + cheque + permuta + financiación propia, **cada renglón con su moneda**. Recálculo de precios SIEMPRE server-side en el checkout (nunca confiar en el frontend). Webhook de MP idempotente.

### 12. Robustez de producción (no rompas lo que cobra)
Lazy-init de SDKs (build no falla sin API key), fallbacks claros (recomendador sin IA, email skipped), rate-limiting, tokens AES-256-GCM, logs con token redactado, headers de seguridad, feature flags por integración, decisiones de costo conscientes (loader de Cloudinary propio, PDFs como HTML imprimible).

---

## Joyas concretas para robar (ideas, no solo principios)

- **Cartel "VENDIDO" como transformación de Cloudinary en la URL** — reversible, sin re-upload, idempotente.
- **Clon automático de unidad 0KM al vender** — el modelo padre queda en stock, se crea el clon vendido con su chasis.
- **Hot Sale calculado 100% on-the-fly** — nunca toca el precio en DB; infla+descuenta en memoria, reversible con un switch, se inyecta hasta en el email de recovery y el turno del taller.
- **QR físico con shortlink y redirect 307 (temporal a propósito)** — podés cambiar el destino de un acrílico ya impreso.
- **Doble pixel Meta CAPI server-side** — al pixel propio y al de la marca, en paralelo.
- **Permutas con trazabilidad total** — una orden toma N usados en parte de pago, cada uno con checklist, y auto-genera el mandato para revenderlos.
- **Recovery de carrito abandonado por email** + **test ride como lead-magnet**.

---

## Cómo se usa esto en Cauce

1. **Al diagnosticar un lead**: mirá si su rubro se parece a Motos o Vespa y arrancá el blueprint desde el módulo/feature equivalente, no desde cero.
2. **Al construir el Cauce OS del cliente**: la entrega tiene que oler a "software hecho para este negocio" — su marca, sus números humanos, sus automatizaciones adentro, su post-venta. Pasá la entrega por los 12 principios.
3. **Como recetario**: muchas de estas features (post-venta, recovery, Hot Sale, OCR de carga, CRM multicanal) son recetas nuevas candidatas para el catálogo de Cauce.

> Regla madre de Francisco: **superar expectativas siempre.** Si la entrega no le ahorra horas reales al cliente desde el día uno, todavía no está terminada.
