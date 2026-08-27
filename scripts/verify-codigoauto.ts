/**
 * Verificación de Código Auto (template vidrios) con Playwright.
 * Uso: BASE=http://localhost:3620 npx tsx scripts/verify-codigoauto.ts <dirCapturas>
 * Login codigoauto → dashboard, stock, nueva orden (crea una de prueba con su
 * boleto), facturación, y el home público en desktop + mobile.
 */
import { chromium } from "playwright";
import fs from "node:fs";

const BASE = process.env.BASE ?? "http://localhost:3620";
const OUT = process.argv[2] ?? "/tmp/codigoauto-shots";
const CON_ORDEN = process.env.SIN_ORDEN !== "1";

/** Scrollea toda la página para disparar los reveals antes del fullPage. */
async function scrollFull(page: import("playwright").Page) {
  await page.evaluate(async () => {
    await new Promise<void>((res) => {
      let y = 0;
      const t = setInterval(() => {
        y += 480;
        window.scrollTo(0, y);
        if (y >= document.body.scrollHeight) {
          clearInterval(t);
          res();
        }
      }, 110);
    });
  });
  await page.waitForTimeout(800);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(400);
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 860 } });
  const p = await ctx.newPage();
  const errores: string[] = [];
  p.on("pageerror", (e) => errores.push(`pageerror: ${e.message}`));

  // Login del cliente
  await p.goto(`${BASE}/login`);
  await p.fill('input[autocomplete="username"]', "codigoauto");
  await p.fill('input[type="password"]', "CodigoAuto.2026");
  await p.click('button[type="submit"]');
  await p.waitForURL(/\/(os|admin)/, { timeout: 25000 });
  console.log("login →", p.url());

  // Dashboard
  await p.goto(`${BASE}/os/codigoauto`, { waitUntil: "networkidle" });
  await p.waitForTimeout(600);
  await p.screenshot({ path: `${OUT}/01-dashboard.png`, fullPage: false });

  // Stock
  await p.goto(`${BASE}/os/codigoauto/productos`, { waitUntil: "networkidle" });
  await p.waitForTimeout(400);
  await p.screenshot({ path: `${OUT}/02-stock.png` });

  // Nueva orden: la creamos de verdad por la UI
  if (CON_ORDEN) {
  await p.goto(`${BASE}/os/codigoauto/ordenes/nueva`, { waitUntil: "networkidle" });
  await p.fill('input[placeholder^="Nombre *"]', "Juan Pérez (prueba)");
  await p.fill('input[placeholder="Teléfono"]', "2915551234");
  await p.fill('input[placeholder^="Marca"]', "VW");
  await p.fill('input[placeholder^="Modelo"]', "Gol Trend");
  await p.fill('input[placeholder="Patente"]', "AB123CD");
  // Ítem desde el buscador del stock
  await p.fill('input[placeholder^="🔎"]', "gol");
  await p.waitForTimeout(400);
  await p.locator("button", { hasText: "Parabrisas VW Gol" }).first().click();
  await p.fill('label:has-text("Seña") input', "50000");
  await p.screenshot({ path: `${OUT}/03-orden-form.png` });
  const [boleto] = await Promise.all([
    ctx.waitForEvent("page", { timeout: 20000 }),
    p.click('button:has-text("Guardar y ver el boleto")'),
  ]);
  await boleto.waitForLoadState("networkidle");
  await boleto.waitForTimeout(500);
  await boleto.screenshot({ path: `${OUT}/04-boleto.png`, fullPage: true });
  await boleto.close();
  }

  // Lista de órdenes
  await p.goto(`${BASE}/os/codigoauto/ordenes`, { waitUntil: "networkidle" });
  await p.waitForTimeout(400);
  await p.screenshot({ path: `${OUT}/05-ordenes.png` });

  // Facturación
  await p.goto(`${BASE}/os/codigoauto/facturacion`, { waitUntil: "networkidle" });
  await p.waitForTimeout(400);
  await p.screenshot({ path: `${OUT}/06-facturacion.png` });

  // Proveedores y tareas: solo que respondan
  for (const ruta of ["proveedores", "tareas", "turnos", "taller", "crm", "caja"]) {
    const res = await p.goto(`${BASE}/os/codigoauto/${ruta}`, { waitUntil: "domcontentloaded" });
    console.log(ruta, "→", res?.status());
  }

  // Web pública desktop
  await p.goto(`${BASE}/sitio/codigoauto`, { waitUntil: "networkidle" });
  await p.waitForTimeout(900);
  await scrollFull(p);
  await p.screenshot({ path: `${OUT}/07-home-desktop.png`, fullPage: true });
  // Sin WhatsApp cargado no debe haber botón flotante
  const waCount = await p.locator('a[aria-label="WhatsApp"]').count();
  console.log("botones whatsapp visibles (debe ser 0):", waCount);

  // Mobile
  const mob = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const pm = await mob.newPage();
  await pm.goto(`${BASE}/sitio/codigoauto`, { waitUntil: "networkidle" });
  await pm.waitForTimeout(900);
  await scrollFull(pm);
  await pm.screenshot({ path: `${OUT}/08-home-mobile.png`, fullPage: true });
  await mob.close();

  console.log("errores JS:", errores.length ? errores : "ninguno");
  await browser.close();
  console.log("capturas en", OUT);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
