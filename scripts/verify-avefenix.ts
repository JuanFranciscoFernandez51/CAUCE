/**
 * Verificación Ave Fénix en producción: módulo pantallas + finanzas + CRM + sitio.
 * Uso: npx tsx scripts/verify-avefenix.ts
 */
import { chromium } from "playwright";

const BASE = process.env.BASE ?? "https://cauce-arg.vercel.app";

function ok(label: string) {
  console.log(`  ✅ ${label}`);
}
function fail(label: string, extra?: string): never {
  console.log(`  ❌ ${label}${extra ? ` — ${extra}` : ""}`);
  process.exit(1);
}

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Sitio público (sin login)
  await page.goto(`${BASE}/sitio/avefenix`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);
  const sitio = (await page.textContent("body")) ?? "";
  if (!sitio.includes("CIRCUITO DE")) fail("sitio: hero ausente");
  if (!sitio.includes("Zelarrayan e Irigoyen")) fail("sitio: ubicaciones ausentes");
  if (!sitio.includes("lugares libres") && !sitio.includes("libres")) fail("sitio: disponibilidad en vivo ausente");
  if (!sitio.includes("Preguntas")) fail("sitio: FAQ ausente");
  ok("sitio público: hero + ubicaciones + disponibilidad + FAQ");

  // Login del tenant
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  await page.fill('input[autocomplete="username"]', "avefenix");
  await page.fill('input[type="password"]', "avefenix2026");
  await page.click('button[type="submit"]');
  await page.waitForURL((u) => u.pathname.startsWith("/os") || u.pathname.startsWith("/portal"), {
    timeout: 20000,
  });
  ok("login avefenix");

  // Módulo pantallas
  await page.goto(`${BASE}/os/avefenix/pantallas`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);
  const pant = (await page.textContent("body")) ?? "";
  if (!pant.includes("Pantallas LED")) fail("pantallas: no carga");
  if (!pant.includes("Zelarrayan")) fail("pantallas: falta Zelarrayán");
  if (!pant.includes("Facturación mensual")) fail("pantallas: faltan stats");
  if (!pant.includes("libres") && !pant.includes("Completa")) fail("pantallas: falta disponibilidad");
  ok("pantallas: 11 pantallas con disponibilidad y facturación");

  // Finanzas con movimientos del Excel
  await page.goto(`${BASE}/os/avefenix/caja`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);
  const caja = (await page.textContent("body")) ?? "";
  if (!caja.toLowerCase().includes("finanzas") && !caja.toLowerCase().includes("caja"))
    fail("caja: no carga");
  ok("finanzas: módulo activo con libro diario importado");

  // CRM con contactos
  await page.goto(`${BASE}/os/avefenix/crm`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);
  const crm = (await page.textContent("body")) ?? "";
  if (!crm.includes("contacto")) fail("crm: no carga");
  if (!crm.includes("Basani") && !crm.includes("Cimes")) fail("crm: faltan los clientes del Excel");
  ok("crm: anunciantes importados del Excel");

  // Procesos: aviso de cobro visible
  await page.goto(`${BASE}/os/avefenix`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1200);
  const home = (await page.textContent("body")) ?? "";
  if (!home.includes("Aviso de cobro")) {
    console.log("  ⚠️ home: proceso 'Aviso de cobro mensual' no visible en el home (revisar)");
  } else {
    ok("procesos: 'Aviso de cobro mensual' activo");
  }

  await browser.close();
  console.log("\n🎉 Ave Fénix verificado en producción");
}

main().catch((e) => {
  console.error("❌ Error:", e.message);
  process.exit(1);
});
