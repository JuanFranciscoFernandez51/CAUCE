# Infraestructura de Cauce — manual operativo

**El modelo: UNA infraestructura (tuya), muchos clientes adentro.** Así funcionan
Tienda Nube, Shopify y todo SaaS. El cliente paga la mensualidad justamente porque
la infraestructura, los backups y la seguridad son problema nuestro, no de él.

## Las cuentas (todas a nombre de Cauce, con 2FA activado)

| Servicio | Qué aloja | Plan | Costo aprox. |
|---|---|---|---|
| Vercel | La app entera + dominios de todos los clientes | Pro | USD 20/mes |
| Neon | La base de datos (separación por cliente en el código) | Launch/Scale | USD 19-69/mes |
| GitHub | El código | Free alcanza | 0 |
| Cloudinary | Fotos/archivos (carpeta por cliente: `cauce/<slug>/`) | Free → Plus | 0-89/mes |
| Resend | Emails transaccionales | Free → Pro | 0-20/mes |
| Anthropic | IA (asistentes, agente marketing) | Por uso | variable |

Con 50 clientes a USD 40/mes (USD 2.000/mes de ingreso), la infra total ronda
USD 60-150/mes. **No** se crean cuentas por cliente: 50 Vercels serían 50 lugares
donde algo se rompe y 50 facturas.

## Dominio propio de Cauce: cauceapp.com.ar (comprado jul 2026)

1. Vercel → proyecto CAUCE → Settings → Domains → Add: `cauceapp.com.ar` y `www.cauceapp.com.ar`.
2. En nic.ar (delegación DNS): registro A de la raíz a la IP que indica Vercel y CNAME `www` → `cname.vercel-dns.com`.
3. Cuando esté activo: agregar `https://www.cauceapp.com.ar/api/admin/marketing/meta/callback` a los
   URI válidos de OAuth en la app de Meta y actualizar `META_REDIRECT_BASE` en Vercel.
   (Hasta entonces, la conexión de Meta sigue usando cauce-arg.vercel.app y funciona igual.)

## Paso a paso: dominio propio para un cliente

El sistema ya resuelve el tenant según el dominio (proxy → tenant-by-host).
Conectar un dominio es un trámite, no desarrollo:

1. **Comprar el dominio** (nic.ar para .com.ar, o el cliente lo compra y te da acceso al DNS).
2. En **Vercel → proyecto CAUCE → Settings → Domains → Add**: agregar `www.dominiodelcliente.com.ar` y la raíz.
3. En el **DNS del dominio**: crear el registro que Vercel te indica (CNAME `www` → `cname.vercel-dns.com`, y A de la raíz → la IP que muestre Vercel).
4. En el **admin de Cauce → ficha del cliente**: cargar el dominio en la configuración del tenant (campo dominio/host) para que el proxy lo mapee a su slug.
5. Esperar la propagación (minutos a horas). Vercel emite el certificado SSL solo — seguridad HTTPS automática, sin hacer nada.
6. Verificar: entrar al dominio → tiene que mostrar el sitio del cliente; `/login` → su OS.

## Backups (ya funcionando)

- **Neon**: restauración punto-en-el-tiempo (PITR) incluida — ante un desastre se restaura la base a "hace 5 minutos".
- **Backup propio**: cron semanal (lunes) que exporta TODAS las tablas a JSON en Cloudinary (`/api/cron/backup`). Se puede pasar a diario cambiando una línea de `vercel.json`.
- **Código**: cada versión queda en GitHub; Vercel permite volver a cualquier deploy anterior en 1 clic (Deployments → Promote).

## Seguridad — checklist por cliente nuevo

- [ ] Contraseña fuerte y única para su usuario del OS (no `slug2026` en clientes reales).
- [ ] El cliente accede SOLO por su usuario del OS — jamás a Vercel/GitHub/Neon.
- [ ] Sus datos quedan aislados por `clientId` en cada consulta (ya es así en todo el código).
- [ ] Fotos en su carpeta de Cloudinary.
- [ ] Dominio bajo control nuestro o con acceso al DNS documentado.

## Seguridad — checklist de la cuenta madre (una sola vez)

- [ ] 2FA en Vercel, GitHub, Google, Cloudinary, Neon.
- [ ] Cambiar la clave admin `fran/cauce2026` (sigue siendo la del repo!).
- [ ] `CRON_SECRET` seteado en Vercel (protege los crons).
- [ ] `ENCRYPTION_KEY` y `DATABASE_URL` solo en Vercel, nunca compartidas.

## Cuándo NO usar el modelo único: plan "Dedicado"

Si un cliente grande exige su propia base/servidor (compliance, paranoia, tamaño):

1. Es un **plan premium** — mínimo el doble de mensualidad, porque duplica el mantenimiento.
2. Se clona el proyecto a un Vercel + Neon **aparte pero dentro de nuestras organizaciones**.
3. Nunca en cuentas del cliente: si nos saca el acceso, pierde soporte, actualizaciones y backups — y nosotros el cliente.
4. Su tenant se migra con el backup JSON (export → import en la base nueva).

## Cuándo escalar la infra única

- **+20 clientes activos**: pasar backup a diario, revisar plan de Neon.
- **+50 clientes o 1 cliente muy pesado**: considerar un segundo proyecto Vercel/Neon
  y repartir tenants (el código es el mismo repo, cambia la DATABASE_URL).
- **Señales de alerta**: funciones que superan tiempos en Vercel, base cerca del límite
  de almacenamiento, factura de Cloudinary creciendo — todas se ven en los dashboards.
