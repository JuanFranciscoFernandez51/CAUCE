/**
 * Smoke test contra una URL en vivo (producción o preview).
 * Caza 404s/500s de RUNTIME que el build no detecta (como el del middleware→proxy).
 * Uso: npx tsx scripts/smoke.ts            (contra producción)
 *      BASE=https://otra-url.vercel.app npx tsx scripts/smoke.ts
 */
const BASE = process.env.BASE ?? "https://cauce-arg.vercel.app";

// Rutas públicas que SIEMPRE deben dar 200 si el deploy está sano.
const ROUTES = [
  "/",
  "/precios",
  "/casos",
  "/intake",
  "/login",
  "/registro",
  "/api/health",
  "/sitio/marenco-propiedades",
  "/sitio/marenco-propiedades/propiedades",
  "/agendar/lume-studio",
];

async function check(path: string): Promise<{ path: string; status: number; ok: boolean }> {
  try {
    const res = await fetch(`${BASE}${path}`, { redirect: "manual" });
    // 200 OK o 3xx (redirect de auth) cuentan como vivo; 404/500 fallan.
    const ok = res.status < 400;
    return { path, status: res.status, ok };
  } catch {
    return { path, status: 0, ok: false };
  }
}

async function main() {
  console.log(`🔍 Smoke test → ${BASE}\n`);
  const results = await Promise.all(ROUTES.map(check));
  let failed = 0;
  for (const r of results) {
    const mark = r.ok ? "✅" : "❌";
    if (!r.ok) failed++;
    console.log(`  ${mark} ${String(r.status).padEnd(3)} ${r.path}`);
  }
  // health debe responder ok:true
  try {
    const h = await (await fetch(`${BASE}/api/health`)).json();
    console.log(`\n  health: db=${h.db} n8n=${h.n8n} ia=${h.ia}`);
    if (!h.ok) failed++;
  } catch {
    console.log("\n  ❌ /api/health no respondió JSON");
    failed++;
  }
  if (failed > 0) {
    console.error(`\n❌ ${failed} fallo(s). El deploy NO está sano.`);
    process.exit(1);
  }
  console.log(`\n✅ Todo verde (${results.length} rutas).`);
}

main();
