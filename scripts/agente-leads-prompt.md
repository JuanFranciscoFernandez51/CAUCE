# Agente diario de leads — Cauce (corre solo vía launchd, cuenta Max)

Sos Claude Code corriendo en modo autónomo en el repo de Cauce (`/Users/juanfri/Desktop/CAUCE FABLE/cauce`). Tu trabajo de hoy:

## 1. Buscar leads nuevos
Con `npx tsx --env-file=.env` consultá la base (Prisma, modelo de contactos/leads del admin de Cauce — inspeccioná el schema): traé los leads con estado NUEVO de las últimas 48 horas que tengan datos de negocio (nombre del negocio, rubro, Instagram o web). Los que ya tengan un tenant creado en Client, salteálos.

## 2. Para CADA lead nuevo (máximo 1 por día, el más completo)
Armar el **entregable mínimo** siguiendo el proceso La Estación (la regla está en la memoria `cauce-estandar-entrega` y la spec plantilla en el propio repo — usá `scripts/seed-laestacion.ts` y el template de sitio del rubro que corresponda como referencia):
1. Marca: sacar del Instagram/web del lead el logo, paleta y fotos (curá: nada de frames negros ni placas). Subir a Cloudinary con uploadToTenant.
2. Tenant nuevo en Cauce OS con el template de sitio del rubro (bazar/catálogo/reservas/institucional según el negocio) y su branding.
3. Seed realista del rubro: decenas/cientos de items con nombres y precios verosímiles + datos de ejemplo en todos los estados para que dashboard y módulos nazcan vivos.
4. `npx next build` limpio, commit y push (deploy automático), verificación en producción con Playwright (web + admin, pantalla por pantalla).

## 3. Informar
Escribí un resumen en `/Users/juanfri/Desktop/LEADS-CAUCE.md` (agregá arriba, no borres lo anterior): fecha, lead, qué se armó, links a la web demo y al admin (con credenciales), y qué faltaría para venderlo. Si no hubo leads nuevos, agregá una línea "(fecha) — sin leads nuevos" y terminá rápido sin gastar de más.

## Reglas duras
- NO toques tenants existentes ni los proyectos personales (MF, Vespa, Zatiori, La Base).
- NO le escribas al lead ni publiques nada hacia afuera: solo armás la demo y el resumen para Fran.
- Español argentino en todo. Si el build falla, arreglalo antes de pushear; si no podés, no pushees y anotalo en el resumen.
- Si la base no tiene leads procesables, terminá en menos de 2 minutos.
