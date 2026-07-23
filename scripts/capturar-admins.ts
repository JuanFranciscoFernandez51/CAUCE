/**
 * Captura los ADMINS reales de los clientes con MODO PRIVACIDAD (blur de datos).
 * Credenciales por env SITES_JSON (nunca en el repo):
 *   SITES_JSON='[{"slug":"...","login":"url","user":"...","pass":"...","paginas":[{"path":"/admin","titulo":"..."}]}]'
 * Uso: SITES_JSON='...' npx tsx --env-file=.env scripts/capturar-admins.ts
 */
import { chromium, type Page } from "playwright";
import { uploadToTenant } from "../src/lib/storage";

type Sitio = {
  slug: string;
  login: string;
  user: string;
  pass: string;
  paginas: { path: string; titulo: string }[];
};

const BLUR = `
  main td, main li, main tbody, main [class*="tabular"],
  main p:not(:has(*)), main span.font-medium, main span.font-semibold,
  table td, tbody tr, [class*="card"] p
  { filter: blur(5px) !important; }
  h1, h2, h3, th, nav *, aside * { filter: none !important; }
`;

async function login(p: Page, sitio: Sitio): Promise<boolean> {
  await p.goto(sitio.login, { waitUntil: "domcontentloaded", timeout: 35000 });
  await p.waitForTimeout(1500);
  const userInput = p.locator('input[type="text"], input[type="email"], input[name*="user" i], input[autocomplete="username"]').first();
  const passInput = p.locator('input[type="password"]').first();
  if ((await passInput.count()) === 0) return false;
  await userInput.fill(sitio.user);
  await passInput.fill(sitio.pass);
  await p.locator('button[type="submit"]').first().click();
  await p.waitForTimeout(4000);
  return !p.url().includes("login");
}

async function main() {
  const sitios: Sitio[] = JSON.parse(process.env.SITES_JSON ?? "[]");
  if (sitios.length === 0) throw new Error("Falta SITES_JSON");
  const browser = await chromium.launch();

  for (const sitio of sitios) {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1.5 });
    const p = await ctx.newPage();
    console.log(`\n== ${sitio.slug}`);
    try {
      const ok = await login(p, sitio);
      if (!ok) {
        console.log("  ✗ login falló");
        await ctx.close();
        continue;
      }
      console.log("  ✓ login");
      const base = new URL(sitio.login).origin;
      let subidas = 0;
      for (const pag of sitio.paginas) {
        if (subidas >= 4) break;
        try {
          const res = await p.goto(`${base}${pag.path}`, { waitUntil: "networkidle", timeout: 30000 });
          if (!res || res.status() >= 400 || p.url().includes("login")) {
            console.log(`  — ${pag.path} (${res?.status() ?? "?"})`);
            continue;
          }
          await p.waitForTimeout(1800);
          await p.addStyleTag({ content: BLUR }).catch(() => {});
          await p.waitForTimeout(400);
          const up = await uploadToTenant({
            slug: "sistema",
            scope: ["casos", sitio.slug, "admin"],
            buffer: await p.screenshot(),
            originalName: `${pag.titulo}.png`,
          });
          subidas++;
          console.log(`  ✅ ${pag.path} → ${up.url}`);
        } catch {
          console.log(`  — ${pag.path} falló`);
        }
      }
    } catch (e) {
      console.log("  ✗ error:", e instanceof Error ? e.message.slice(0, 80) : "?");
    }
    await ctx.close();
  }
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
