/** Verificación: vista Anunciantes + apartado Proveedores de Ave Fénix. */
import { chromium } from "playwright";

const BASE = process.env.BASE ?? "https://cauce-arg.vercel.app";

function ok(l: string) {
  console.log(`  ✅ ${l}`);
}
function fail(l: string, e?: string): never {
  console.log(`  ❌ ${l}${e ? ` — ${e}` : ""}`);
  process.exit(1);
}

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  await page.fill('input[autocomplete="username"]', "avefenix");
  await page.fill('input[type="password"]', "avefenix2026");
  await page.click('button[type="submit"]');
  await page.waitForURL((u) => u.pathname.startsWith("/os") || u.pathname.startsWith("/portal"), {
    timeout: 20000,
  });
  ok("login avefenix");

  // Vista Anunciantes
  await page.goto(`${BASE}/os/avefenix/pantallas/clientes`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);
  const anun = (await page.textContent("body")) ?? "";
  if (!anun.includes("Anunciantes")) fail("anunciantes: no carga");
  if (!anun.includes("Cimes") && !anun.includes("Basani")) fail("anunciantes: faltan clientes");
  if (!anun.includes("Facturación mensual")) fail("anunciantes: faltan stats");
  if (!anun.includes("Ficha")) fail("anunciantes: falta link a ficha CRM");
  ok("anunciantes: listado con pantallas, totales y fichas");

  // Proveedores
  await page.goto(`${BASE}/os/avefenix/caja/proveedores`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);
  const prov = (await page.textContent("body")) ?? "";
  if (!prov.includes("Proveedores")) fail("proveedores: no carga");
  if (!prov.includes("EDES")) fail("proveedores: faltan los del libro diario");
  if (!prov.includes("Gasto mensual")) fail("proveedores: faltan stats");
  if (!prov.includes("Se paga el")) fail("proveedores: falta día de pago");
  ok("proveedores: 12 reales con montos y días de pago");

  // Link desde Finanzas
  await page.goto(`${BASE}/os/avefenix/caja`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1200);
  const caja = (await page.textContent("body")) ?? "";
  if (!caja.includes("Proveedores")) fail("caja: falta el link a Proveedores");
  ok("finanzas: link a Proveedores visible");

  await browser.close();
  console.log("\n🎉 Anunciantes + Proveedores OK en producción");
}

main().catch((e) => {
  console.error("❌ Error:", e.message);
  process.exit(1);
});
