/**
 * Evidencia visual (Definition of Done): screenshots claro/oscuro, desktop/mobile
 * de las pantallas clave, logueado como admin y como cliente.
 * Uso: npx tsx scripts/evidence.ts  (requiere npm run dev corriendo)
 */
import { chromium, type BrowserContext } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = "http://localhost:3000";
const OUT = "evidencia";

const DESKTOP = { width: 1280, height: 800 };
const MOBILE = { width: 375, height: 812 };

async function login(ctx: BrowserContext, username: string, password: string) {
  const page = await ctx.newPage();
  await page.goto(`${BASE}/login`);
  await page.fill('input[autocomplete="username"]', username);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(admin|portal|go)/, { timeout: 20000 });
  await page.close();
}

async function snap(ctx: BrowserContext, path: string, name: string, dark: boolean) {
  const page = await ctx.newPage();
  await page.emulateMedia({ colorScheme: dark ? "dark" : "light" });
  await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
  // next-themes con defaultTheme system sigue prefers-color-scheme emulado
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${OUT}/${name}${dark ? "-dark" : ""}.png`, fullPage: false });
  await page.close();
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();

  // ── Público (desktop claro/oscuro + mobile) ──
  const pub = await browser.newContext({ viewport: DESKTOP });
  for (const dark of [false, true]) {
    await snap(pub, "/", `01-landing`, dark);
    await snap(pub, "/precios", `02-precios`, dark);
    await snap(pub, "/intake", `03-intake`, dark);
    await snap(pub, "/consultoria", `04-consultoria`, dark);
  }
  await pub.close();
  const pubMobile = await browser.newContext({ viewport: MOBILE });
  await snap(pubMobile, "/", "05-landing-mobile", false);
  await snap(pubMobile, "/precios", "06-precios-mobile", true);
  await pubMobile.close();

  // ── Admin (fran) ──
  const admin = await browser.newContext({ viewport: DESKTOP });
  await login(admin, "fran", "cauce2026");
  for (const dark of [false, true]) {
    await snap(admin, "/admin", "10-admin-dashboard", dark);
    await snap(admin, "/admin/pipeline", "11-admin-pipeline", dark);
  }
  await snap(admin, "/admin/leads", "12-admin-leads", false);
  // detalle del primer lead con blueprint (clínica dental si existe)
  await snap(admin, "/admin/clientes", "13-admin-clientes", false);
  await snap(admin, "/admin/recetario", "14-admin-recetario", true);
  await snap(admin, "/admin/consultorias", "15-admin-consultorias", false);
  await snap(admin, "/admin/pricing", "16-admin-pricing", false);
  const adminMobile = await browser.newContext({ viewport: MOBILE });
  await login(adminMobile, "fran", "cauce2026");
  await snap(adminMobile, "/admin", "17-admin-mobile", false);
  await admin.close();
  await adminMobile.close();

  // ── Portal (vespa) ──
  const portal = await browser.newContext({ viewport: DESKTOP });
  await login(portal, "vespa", "vespa2026");
  for (const dark of [false, true]) {
    await snap(portal, "/portal", "20-portal", dark);
  }
  await snap(portal, "/portal/contenido", "21-portal-contenido", false);
  await snap(portal, "/portal/uso", "22-portal-uso", true);

  // ── Cauce OS (tenant Vespa) ──
  for (const dark of [false, true]) {
    await snap(portal, "/os/vespabahia", "30-os-home", dark);
    await snap(portal, "/os/vespabahia/crm", "31-os-crm", dark);
    await snap(portal, "/os/vespabahia/turnos", "32-os-turnos", dark);
  }
  await portal.close();
  const osMobile = await browser.newContext({ viewport: MOBILE });
  await login(osMobile, "vespa", "vespa2026");
  await snap(osMobile, "/os/vespabahia/turnos", "33-os-turnos-mobile", false);
  await osMobile.close();

  await browser.close();
  console.log(`✅ Evidencia en ./${OUT}/`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
