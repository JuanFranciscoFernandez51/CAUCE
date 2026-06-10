# DEFINITION OF DONE — Cauce v2

Nada se reporta "listo" si no cumple TODO:

- [ ] **Modo claro y oscuro** funcionando (toggle visible, persiste, cubre el 100% de la pantalla)
- [ ] **Responsive** verificado: 375px / tablet / desktop
- [ ] **Estados completos:** vacío (sin datos), cargando, error, éxito — todos diseñados
- [ ] **Design tokens de Cauce** aplicados (cero estilos ad-hoc, cero pantallas "crudas")
  - *Nota temporal:* los tokens definitivos del brand están DIFERIDOS por decisión de Francisco (2026-06-10).
    Mientras tanto rige el set neutro de `globals.css` (variables CSS centralizadas). Cuando lleguen los
    tokens del v1, se pegan en `globals.css` y toda la app los toma — ninguna pantalla usa colores ad-hoc.
- [ ] **Datos reales** de la DB (cero lorem ipsum, cero hardcodeo)
- [ ] **Todo botón/acción funciona** (nada decorativo muerto)
- [ ] Build verde, typecheck limpio, consola sin errores
- [ ] **Evidencia visual:** screenshot en claro Y oscuro, desktop y mobile

"Compila" NO es "terminado".
