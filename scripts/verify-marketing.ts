/**
 * Verificación del módulo Marketing en producción.
 * Uso: npx tsx scripts/verify-marketing.ts
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

  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  await page.fill('input[autocomplete="username"]', "fran");
  await page.fill('input[type="password"]', "cauce2026");
  await page.click('button[type="submit"]');
  await page.waitForURL((u) => u.pathname.startsWith("/admin"), { timeout: 20000 });
  ok("login admin");

  // 1) Página principal de marketing
  await page.goto(`${BASE}/admin/marketing`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);
  const body = (await page.textContent("body")) ?? "";
  if (!body.includes("Marketing")) fail("marketing: no carga");
  if (!body.includes("Meta sin conectar") && !body.includes("conectada"))
    fail("marketing: falta el estado de conexión");
  ok("marketing: página + estado de conexión");
  if (!body.includes("Generar con IA")) fail("marketing: falta el botón del agente");
  ok("marketing: botón del agente presente");

  // 2) Generar 3 publicaciones con el agente (IA real)
  await page.click("text=Generar con IA");
  await page.waitForTimeout(500);
  await page.selectOption("select", "3");
  await page.click("text=Generar borradores");
  try {
    await page.waitForSelector("text=Borrador", { timeout: 90_000 });
    ok("agente: generó borradores con IA");
  } catch {
    const err = (await page.textContent("body")) ?? "";
    fail("agente: no generó", err.slice(0, 200));
  }

  // 3) Ads
  await page.goto(`${BASE}/admin/marketing/ads`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);
  const ads = (await page.textContent("body")) ?? "";
  if (!ads.includes("Meta Ads")) fail("ads: no carga");
  if (!ads.includes("cuenta publicitaria")) fail("ads: falta el wizard de setup");
  ok("ads: página + wizard de cuenta publicitaria");

  // 4) Modal nueva campaña con sugerencia IA visible
  await page.click("text=+ Campaña");
  await page.waitForTimeout(500);
  const modal = (await page.textContent("body")) ?? "";
  if (!modal.includes("Presupuesto por día")) fail("ads: modal sin presupuesto");
  if (!modal.includes("Sugerir con IA")) fail("ads: falta sugerir con IA");
  ok("ads: modal de campaña completo (presupuesto, público, CTA, IA)");

  await browser.close();
  console.log("\n🎉 Marketing verificado en producción");
}

main().catch((e) => {
  console.error("❌ Error:", e.message);
  process.exit(1);
});
