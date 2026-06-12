/**
 * Evidencia de la entrega n8n + softwares a medida (12/06).
 * Uso: npx tsx scripts/evidence-delivery.ts (requiere npm run dev)
 */
import { chromium, type BrowserContext } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = "http://localhost:3000";
const OUT = "evidencia";

async function login(ctx: BrowserContext, username: string, password: string) {
  const page = await ctx.newPage();
  await page.goto(`${BASE}/login`);
  await page.fill('input[autocomplete="username"]', username);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(admin|portal|go)/, { timeout: 20000 });
  await page.close();
}

async function snap(ctx: BrowserContext, path: string, name: string, dark = true) {
  const page = await ctx.newPage();
  await page.addInitScript(`window.localStorage.setItem("theme", "${dark ? "dark" : "light"}")`);
  await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT}/${name}.png` });
  await page.close();
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();

  const admin = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  await login(admin, "fran", "cauce2026");
  await snap(admin, "/admin", "40-admin-dashboard-todo-activo");
  await snap(admin, "/admin/pipeline", "41-pipeline-todo-activo");
  await snap(admin, "/admin/clientes", "42-clientes-activos");
  // detalle de un cliente con automatizaciones ACTIVAS vinculadas a n8n
  const page = await admin.newPage();
  await page.addInitScript(`window.localStorage.setItem("theme", "dark")`);
  await page.goto(`${BASE}/admin/clientes`, { waitUntil: "networkidle" });
  await page.click('text=Clínica Dental Iriarte');
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${OUT}/43-cliente-clinica-automs-activas.png`, fullPage: true });
  await page.close();
  await admin.close();

  // softwares a medida (admin puede entrar a todos los OS)
  const os = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  await login(os, "fran", "cauce2026");
  await snap(os, "/os/peluquerialucas/turnos", "44-os-peluqueria-turno-del-bot");
  await snap(os, "/os/tallerfuneshnos/crm/nuevo", "45-os-taller-campos-custom");
  await snap(os, "/os/clinicadentaliriarte/turnos/nuevo", "46-os-clinica-turno-campos-custom", false);
  await snap(os, "/os/distribuidoracarusomayorista", "47-os-distribuidora-home");
  await snap(os, "/os/hotelcostamedanos/crm", "48-os-hotel-crm");
  await os.close();

  await browser.close();
  console.log("✅ evidencia de delivery lista");
}

main().catch((e) => { console.error(e); process.exit(1); });
