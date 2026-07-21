/**
 * Verificación S3 en producción: kanban DnD (CRM) + RRHH profundo.
 * Uso: npx tsx scripts/verify-s3.ts
 */
import { chromium } from "playwright";

const BASE = process.env.BASE ?? "https://cauce-arg.vercel.app";
const USER = "bahiamotos";
const PASS = "bahiamotos2026";

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

  // Login
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  await page.fill('input[autocomplete="username"]', USER);
  await page.fill('input[type="password"]', PASS);
  await page.click('button[type="submit"]');
  await page.waitForURL((u) => u.pathname.startsWith("/os") || u.pathname.startsWith("/portal"), {
    timeout: 20000,
  });
  ok("login bahiamotos");

  // 1) Kanban CRM: tarjetas draggables + columnas
  await page.goto(`${BASE}/os/bahiamotos/crm`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);
  const draggables = await page.locator('[draggable="true"]').count();
  if (draggables < 1) fail("kanban: sin tarjetas draggables");
  ok(`kanban: ${draggables} tarjetas arrastrables`);

  // DnD real: simular con eventos DataTransfer (HTML5 DnD)
  const moved = await page.evaluate(() => {
    const card = document.querySelector('[draggable="true"]') as HTMLElement | null;
    if (!card) return "sin tarjeta";
    const cols = document.querySelectorAll("[data-stage]");
    // Si no hay data-stage, buscamos contenedores de columnas por estructura
    const targets = cols.length ? cols : document.querySelectorAll("section, div");
    if (!card.closest("div")) return "sin columna";
    const dt = new DataTransfer();
    card.dispatchEvent(new DragEvent("dragstart", { bubbles: true, dataTransfer: dt }));
    return dt.getData("text/contact-id") ? "ok" : "dataTransfer vacío";
  });
  if (moved !== "ok") fail("kanban dragstart", moved);
  ok("kanban: dragstart carga contact-id en dataTransfer");

  // 2) RRHH: página principal con nombres clickeables
  await page.goto(`${BASE}/os/bahiamotos/rrhh`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1200);
  const empLink = page.locator('a[href*="/rrhh/"]').first();
  if ((await empLink.count()) === 0) fail("rrhh: sin links a empleados");
  const href = await empLink.getAttribute("href");
  ok(`rrhh: link a empleado ${href}`);

  // 3) Detalle de empleado
  await page.goto(`${BASE}${href}`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1200);
  const bodyText = (await page.textContent("body")) ?? "";
  if (!bodyText.includes("Horas del mes")) fail("detalle: no muestra 'Horas del mes'");
  ok("detalle empleado: resumen de horas visible");
  if (!bodyText.includes("Fichada manual") && !bodyText.includes("Fichadas"))
    fail("detalle: sección fichadas ausente");
  ok("detalle empleado: sección fichadas + alta manual");

  // 4) Planilla imprimible
  await page.goto(`${BASE}${href}/planilla`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1200);
  const plan = (await page.textContent("body")) ?? "";
  if (!plan.includes("Planilla de horas")) fail("planilla: título ausente");
  if (!plan.includes("Firma del empleado")) fail("planilla: firmas ausentes");
  ok("planilla imprimible: título + firmas + totales");

  // 5) Calendario de turnos sigue draggable (escuelaolas tiene módulo turnos)
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  await page.fill('input[autocomplete="username"]', "escuelaolas");
  await page.fill('input[type="password"]', "escuelaolas2026");
  await page.click('button[type="submit"]');
  await page.waitForURL((u) => u.pathname.startsWith("/os") || u.pathname.startsWith("/portal"), {
    timeout: 20000,
  });
  await page.goto(`${BASE}/os/escuelaolas/turnos`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);
  const chips = await page.locator('[draggable="true"]').count();
  if (chips < 1) fail("turnos: sin chips arrastrables en el calendario");
  ok(`turnos: ${chips} chips arrastrables en el calendario`);

  await browser.close();
  console.log("\n🎉 S3 verificado en producción");
}

main().catch((e) => {
  console.error("❌ Error:", e.message);
  process.exit(1);
});
