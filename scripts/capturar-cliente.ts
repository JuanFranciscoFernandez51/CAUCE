/**
 * Captura screenshots reales del sitio público + el Cauce OS ya armado de un cliente,
 * los sube a Cloudinary y los guarda en Client.settings.shots para que la
 * presentación PDF los muestre ("Así quedó, ya armado").
 *
 * Uso: npx tsx scripts/capturar-cliente.ts <slug> [<slug> ...]
 *      (sin args → captura los 5 de demo). Requiere `npm run dev` corriendo.
 */
import { chromium, type BrowserContext } from "playwright";
import { PrismaClient } from "@prisma/client";
import { uploadToTenant } from "../src/lib/storage";

const db = new PrismaClient();
const BASE = process.env.BASE ?? "http://localhost:3000";
const DEFAULT = ["vespabahia", "bahiamotos", "escuelaolas", "clubpiston"];

type Shot = { titulo: string; grupo: "web" | "sistema"; url: string };

async function login(ctx: BrowserContext) {
  const p = await ctx.newPage();
  await p.goto(`${BASE}/login`);
  await p.fill('input[autocomplete="username"]', "fran");
  await p.fill('input[type="password"]', "cauce2026");
  await p.click('button[type="submit"]');
  await p.waitForURL(/admin/, { timeout: 20000 });
  await p.close();
}

async function shot(ctx: BrowserContext, slug: string, path: string, titulo: string, grupo: "web" | "sistema"): Promise<Shot | null> {
  const p = await ctx.newPage();
  try {
    await p.addInitScript(`window.localStorage.setItem("theme","light")`);
    const res = await p.goto(`${BASE}${path}`, { waitUntil: "networkidle", timeout: 25000 });
    if (!res || res.status() >= 400) { await p.close(); return null; }
    await p.waitForTimeout(900);
    const buffer = await p.screenshot(); // viewport (parece pantalla real)
    await p.close();
    const up = await uploadToTenant({ slug, scope: ["presentacion"], buffer, originalName: `${titulo}.png` });
    return { titulo, grupo, url: up.url };
  } catch {
    await p.close().catch(() => {});
    return null;
  }
}

async function capturarTenant(ctx: BrowserContext, slug: string) {
  const c = await db.client.findUnique({ where: { slug } });
  if (!c) { console.log("— no existe", slug); return; }
  const mods = (c.modules as string[]) ?? [];
  const shots: (Shot | null)[] = [];

  // ── Web pública ──
  shots.push(await shot(ctx, slug, `/sitio/${slug}`, "Tu página web", "web"));
  if (mods.includes("sitio")) shots.push(await shot(ctx, slug, `/sitio/${slug}/propiedades`, "Tu catálogo online", "web"));
  if (mods.includes("turnos")) shots.push(await shot(ctx, slug, `/agendar/${slug}`, "Reserva de turnos online", "web"));
  if (mods.includes("eventos")) shots.push(await shot(ctx, slug, `/evento/${slug}`, "Ranking en vivo del evento", "web"));

  // ── Cauce OS (sistema) ──
  shots.push(await shot(ctx, slug, `/os/${slug}`, "Tu panel de control", "sistema"));
  if (mods.includes("crm")) shots.push(await shot(ctx, slug, `/os/${slug}/crm`, "Tu CRM de clientes", "sistema"));
  if (mods.includes("proyectos")) shots.push(await shot(ctx, slug, `/os/${slug}/proyectos`, "Tus proyectos", "sistema"));
  else if (mods.includes("turnos")) shots.push(await shot(ctx, slug, `/os/${slug}/turnos`, "Tu agenda", "sistema"));
  else if (mods.includes("caja")) shots.push(await shot(ctx, slug, `/os/${slug}/caja`, "Tus finanzas", "sistema"));
  if (mods.includes("ventas")) shots.push(await shot(ctx, slug, `/os/${slug}/ventas`, "Tus ventas y saldos", "sistema"));
  if (mods.includes("taller")) shots.push(await shot(ctx, slug, `/os/${slug}/taller`, "Tu taller", "sistema"));
  shots.push(await shot(ctx, slug, `/os/${slug}/hoy`, "Tu día armado", "sistema"));

  const ok = shots.filter((s): s is Shot => s !== null);
  const settings = (c.settings as Record<string, unknown> | null) ?? {};
  await db.client.update({ where: { id: c.id }, data: { settings: { ...settings, shots: ok } } });
  console.log(`✅ ${slug.padEnd(28)} ${ok.length} capturas (${ok.filter((s) => s.grupo === "web").length} web · ${ok.filter((s) => s.grupo === "sistema").length} sistema)`);
}

async function main() {
  const slugs = process.argv.slice(2).length ? process.argv.slice(2) : DEFAULT;
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 820 } });
  await login(ctx);
  for (const slug of slugs) await capturarTenant(ctx, slug);
  await browser.close();
  await db.$disconnect();
  console.log("\n🌊 Capturas listas. La presentación de cada cliente ya las muestra.");
}

main().catch((e) => { console.error(e); process.exit(1); });
