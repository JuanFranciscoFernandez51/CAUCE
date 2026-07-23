/**
 * Captura las webs REALES de los clientes (páginas públicas) para las fichas de casos.
 * Sube a Cloudinary y deja las URLs listas para pegar en casos-reales.ts.
 * Uso: npx tsx --env-file=.env scripts/capturar-webs-reales.ts
 */
import { chromium } from "playwright";
import { uploadToTenant } from "../src/lib/storage";

const SITIOS: { slug: string; base: string; paginas: { path: string; titulo: string }[] }[] = [
  {
    slug: "motos-fernandez",
    base: "https://motosfernandez.com.ar",
    paginas: [
      { path: "/", titulo: "Su web viva — home" },
      { path: "/catalogo", titulo: "Catálogo de motos online" },
      { path: "/usadas", titulo: "Usadas y consignación" },
      { path: "/tienda", titulo: "Tienda de accesorios" },
      { path: "/taller", titulo: "Turnos de taller online" },
      { path: "/turnos", titulo: "Turnos online" },
    ],
  },
  {
    slug: "vespa-bahia",
    base: "https://vespabahia.com.ar",
    paginas: [
      { path: "/", titulo: "Su web viva — home" },
      { path: "/catalogo", titulo: "Catálogo Vespa · Piaggio · Aprilia" },
      { path: "/usadas", titulo: "Usadas seleccionadas" },
      { path: "/tienda", titulo: "Tienda online oficial" },
      { path: "/taller", titulo: "Servicio oficial — turnos" },
      { path: "/turnos", titulo: "Turnos online" },
    ],
  },
];

async function main() {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1.5 });

  for (const sitio of SITIOS) {
    console.log(`\n== ${sitio.slug} (${sitio.base})`);
    const urls: { titulo: string; url: string }[] = [];
    for (const pag of sitio.paginas) {
      if (urls.length >= 4) break; // 4 capturas por marca alcanza
      const p = await ctx.newPage();
      try {
        const res = await p.goto(`${sitio.base}${pag.path}`, { waitUntil: "networkidle", timeout: 30000 });
        if (!res || res.status() >= 400) {
          console.log(`  — ${pag.path} (${res?.status() ?? "sin respuesta"})`);
          await p.close();
          continue;
        }
        await p.waitForTimeout(1500);
        const buffer = await p.screenshot();
        const up = await uploadToTenant({
          slug: "sistema",
          scope: ["casos", sitio.slug],
          buffer,
          originalName: `${pag.titulo}.png`,
        });
        urls.push({ titulo: pag.titulo, url: up.url });
        console.log(`  ✅ ${pag.path} → ${up.url}`);
      } catch (e) {
        console.log(`  — ${pag.path} falló (${e instanceof Error ? e.message.slice(0, 60) : "?"})`);
      }
      await p.close().catch(() => {});
    }
    console.log(`  JSON ${sitio.slug}:`, JSON.stringify(urls));
  }
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
