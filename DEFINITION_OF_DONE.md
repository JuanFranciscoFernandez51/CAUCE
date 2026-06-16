# DEFINITION OF DONE — Cauce v2

Nada se reporta "listo" si no cumple TODO:

- [ ] **Modo claro y oscuro** funcionando (toggle visible, persiste, cubre el 100% de la pantalla)
- [ ] **Responsive** verificado: 375px / tablet / desktop
- [ ] **Estados completos:** vacío (sin datos), cargando, error, éxito — todos diseñados
- [ ] **Design tokens de Cauce** aplicados (cero estilos ad-hoc, cero pantallas "crudas")
  - Brand **"Corriente"** aplicado el 10/06 desde `Cauce - Design Tokens.html`: ink/surface/blue/cyan,
    Space Grotesk (display) + IBM Plex Sans/Mono, radios 8/14/22px, dark-first. Todo vive en
    `globals.css` — ninguna pantalla usa colores ad-hoc; no salirse de estos tokens.
- [ ] **Datos reales** de la DB (cero lorem ipsum, cero hardcodeo)
- [ ] **Todo botón/acción funciona** (nada decorativo muerto)
- [ ] Build verde, typecheck limpio, consola sin errores
- [ ] **Evidencia visual:** screenshot en claro Y oscuro, desktop y mobile

"Compila" NO es "terminado".

---

## Vara de profundidad — el estándar "ejemplo"

Toda entrega de software a un cliente (su Cauce OS) apunta al nivel de los dos negocios
de referencia en [`ejemplos/`](ejemplos/README.md) — **Motos Fernández** y **Vespa Bahía**,
ERPs completos hechos a medida. No es "una web + un CRM con listas": es la operación del
negocio adentro del sistema. Antes de reportar una entrega como terminada, pasala por los
**12 principios** de [`ejemplos/README.md`](ejemplos/README.md). Los no-negociables mínimos:

- [ ] **Profundidad de ERP**, no de web: la operación real del negocio está adentro (venta/cobranza/post-venta/stock/CRM según el rubro), no solo listados.
- [ ] **Fuente única de verdad** por acción crítica (un helper que dispara toda la cascada).
- [ ] **Numeración humana** (OC-0001…) en todo lo que el cliente nombra; nunca cuids a la vista.
- [ ] **Edición inline en las listas** + quick-create en el flujo (cero clicks perdidos).
- [ ] **Su marca**: el OS se ve hecho para ESE negocio (nombre, colores, campos propios).
- [ ] **Automatizaciones visibles y vivas** dentro del software, no solo en n8n.
- [ ] **Post-venta / recontacto automático** cuando el rubro lo permita (la venta no termina en la entrega).
- [ ] **IA según riesgo**: escribe directo para lo inocuo; propuesta+confirmación para lo que gasta plata o es irreversible.
- [ ] **Robustez de producción**: lazy-init de SDKs, fallbacks, rate-limit, secretos cifrados, feature flags por integración.

> Regla madre: **superar expectativas siempre.** Si no le ahorra horas reales al cliente desde el día uno, no está terminado.
