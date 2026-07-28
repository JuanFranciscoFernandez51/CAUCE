/**
 * Verificación del seed de Ri Cars contra la DB (Neon):
 * tenant + user + 74 vehículos con fotos + operaciones + consultas + finanzas.
 * Uso: npx tsx --env-file=.env scripts/verify-ricars.ts
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

function check(nombre: string, ok: boolean, detalle: string) {
  console.log(`${ok ? "✅" : "❌"} ${nombre}: ${detalle}`);
  if (!ok) process.exitCode = 1;
}

async function main() {
  const tenant = await db.client.findUnique({ where: { slug: "ricars" } });
  check("Tenant", Boolean(tenant), tenant ? `${tenant.name} (${tenant.id})` : "NO EXISTE");
  if (!tenant) return;

  const settings = tenant.settings as { template?: string } | null;
  check("Template", settings?.template === "concesionaria", String(settings?.template));
  check(
    "Módulos",
    ["crm", "caja", "sitio"].every((m) => tenant.modules.includes(m)),
    tenant.modules.join(", ")
  );

  const user = await db.user.findFirst({ where: { clientId: tenant.id, username: "ricars" } });
  check("User admin", Boolean(user), user ? `${user.username} (osRole ${user.osRole})` : "NO EXISTE");

  const vehiculos = await db.conceVehiculo.findMany({ where: { clientId: tenant.id } });
  check("Vehículos", vehiculos.length === 74, `${vehiculos.length} (esperados 74)`);

  const totalFotos = vehiculos.reduce(
    (s, v) => s + (Array.isArray(v.fotos) ? v.fotos.length : 0),
    0
  );
  check("Fotos Cloudinary", totalFotos >= 1000, `${totalFotos} fotos en carruseles`);

  const sinFotos = vehiculos.filter((v) => !Array.isArray(v.fotos) || v.fotos.length === 0);
  check("Todos con fotos", sinFotos.length === 0, `${sinFotos.length} sin fotos`);

  const placeholders = vehiculos.filter((v) => v.precio != null && v.precio < 2000);
  check("Sin precios placeholder", placeholders.length === 0, `${placeholders.length} sospechosos`);
  const consultar = vehiculos.filter((v) => v.precio == null).length;
  console.log(`   ↳ ${consultar} vehículos en "Consultar precio" (placeholders limpiados)`);

  const cond0km = vehiculos.filter((v) => v.condicion === "0km").length;
  console.log(`   ↳ ${cond0km} 0KM · ${vehiculos.length - cond0km} usados`);

  const operaciones = await db.conceOperacion.findMany({ where: { clientId: tenant.id } });
  const mandatos = operaciones.filter((o) => o.tipo === "MANDATO").length;
  const boletos = operaciones.filter((o) => o.tipo === "BOLETO").length;
  check("Operaciones", operaciones.length === 12, `${operaciones.length} (${mandatos} mandatos + ${boletos} boletos)`);

  const consultas = await db.conceConsulta.count({ where: { clientId: tenant.id } });
  check("Consultas", consultas === 8, String(consultas));

  const contactos = await db.contact.count({ where: { clientId: tenant.id } });
  check("Contactos CRM", contactos >= 8, String(contactos));

  const cuentas = await db.account.findMany({ where: { clientId: tenant.id }, orderBy: { orden: "asc" } });
  check("Cuentas Finanzas", cuentas.length === 3, cuentas.map((c) => `${c.name} (${c.currency}: ${c.balance.toLocaleString("es-AR")})`).join(" · "));

  const movs = await db.cashMovement.count({ where: { clientId: tenant.id } });
  check("Movimientos caja", movs >= 8, String(movs));

  const pubs = await db.concePublicacion.findMany({ where: { clientId: tenant.id } });
  check("Publicaciones", pubs.length === 3, pubs.map((p) => `${p.canal}:${p.estado}`).join(", "));

  const procesos = await db.proceso.count({ where: { clientId: tenant.id } });
  check("Procesos", procesos > 0, String(procesos));

  // El lead de Ricars del CRM de Cauce NO debe estar vinculado por el seed.
  const leadsVinculados = await db.lead.count({ where: { clientId: tenant.id } });
  check("Sin leads creados/vinculados por el seed", leadsVinculados === 0, String(leadsVinculados));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
