import { chromium, BrowserContext } from "playwright";
import { execFileSync } from "child_process";
import { readFileSync, mkdirSync, writeFileSync } from "fs";
import path from "path";

/**
 * Graba los video-anuncios de Cauce navegando los sistemas reales (v2).
 * - Blur selectivo: se ve el funcionamiento (marca/modelo/km, estados, fechas);
 *   se tapan plata, chasis, patentes, DNI, nombres y contactos de clientes.
 * - Escena de documento: el PDF real del mandato (membrete nítido, cuerpo borroso).
 * - Cierre con la marca REAL de Cauce (isologo del sitio).
 * Captura frame a frame (8fps): duración exacta = duración de la frase de VO.
 */

const SCRATCH =
  "/private/tmp/claude-501/-Users-juanfri-Documents-CLAUDE-CODE-WEB-NUEVA-MOTOS-FERNANDEZ/e2daaa89-dbe3-496d-88e6-e463232ff2e2/scratchpad";
const FFMPEG = path.join(SCRATCH, "ffmpeg");
const VO = path.join(SCRATCH, "videos/vo");
const OUT = path.join(SCRATCH, "videos");
const CLIPS = path.join(OUT, "clips");
mkdirSync(CLIPS, { recursive: true });

// mínimo CSS: solo esconder scrollbars
const BASE_CSS = `::-webkit-scrollbar { display: none !important; }`;

// Blur selectivo v2: plata, contactos, DNI, patentes, chasis y nombres de personas.
// Marcas/modelos de motos quedan visibles (lista blanca).
const BLUR_JS = `
(() => {
  const money = /\\$\\s?[\\d.,]{2,}|[\\d.]{4,}\\s?(ARS|USD|us\\$|u\\$s)/i;
  const contacto = /\\b\\d{2,4}[\\s-]?\\d{6,8}\\b|@[a-z0-9.-]+\\.[a-z]{2,}|wa\\.me|\\b\\d{7,8}\\b/i;
  const patente = /\\b[A-Z]{2}\\s?\\d{3}\\s?[A-Z]{2}\\b|\\b[A-Z]{3}[- ]?\\d{3}\\b/;
  const chasis = /\\b(?=[A-Z0-9]{5,17}\\b)(?=[A-Z0-9]*\\d)(?=[A-Z0-9]*[A-Z])[A-Z0-9]+\\b/;
  const nombre = /^[A-Z\\u00c1\\u00c9\\u00cd\\u00d3\\u00da\\u00d1][a-z\\u00e1\\u00e9\\u00ed\\u00f3\\u00fa\\u00f1]+( [A-Z\\u00c1\\u00c9\\u00cd\\u00d3\\u00da\\u00d1][a-z\\u00e1\\u00e9\\u00ed\\u00f3\\u00fa\\u00f1]+){1,3}$/;
  const marcas = /honda|yamaha|suzuki|zanella|motomel|corven|gilera|keller|vespa|piaggio|benelli|bajaj|rouser|ktm|kawasaki|guerrero|mondial|beta|brava|okinoi|siam|hero|royal|enfield|triax|skua|wave|titan|tornado|xr\\b|ybr|fz\\b|smash|expert|energy|primavera|sprint|gts|gtv/i;
  const raiz = document.querySelector('main') || document.body;
  const walker = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT);
  const objetivos = new Set();
  const prohibidos = ['H1','H2','H3','H4','TH','NAV','BUTTON','LABEL'];
  while (walker.nextNode()) {
    const t = (walker.currentNode.textContent || '').trim();
    const el = walker.currentNode.parentElement;
    if (!el || prohibidos.includes(el.tagName) || el.closest('nav,aside,button,th')) continue;
    if ((money.test(t) || contacto.test(t) || patente.test(t) || chasis.test(t)) && !marcas.test(t)) {
      objetivos.add(el);
      // en tablas cada celda se evalua sola; el 'hermano anterior' es solo para cards
      const prev = el.closest('td') ? null : el.previousElementSibling;
      if (prev && (prev.textContent || '').trim().length < 45 && !marcas.test(prev.textContent || '')) objetivos.add(prev);
    }
    // nombre de persona (2-4 palabras capitalizadas) que NO sea una moto
    if (t.length < 40 && nombre.test(t) && !marcas.test(t)) objetivos.add(el);
  }
  for (const el of objetivos) el.style.setProperty('filter', 'blur(6px)', 'important');
})()
`;

// ── Marca real de Cauce: el isologo del sitio (cauce-mark.tsx) ──
const CAUCE_SVG = `<svg viewBox="0 0 48 48" fill="none" width="120" height="120" xmlns="http://www.w3.org/2000/svg">
  <rect width="48" height="48" rx="12" fill="#121A28" stroke="#2A3B55" stroke-width="1"/>
  <path d="M11 16 C22 16 23 24 37 24" stroke="#2E6BFF" stroke-width="3" stroke-linecap="round" fill="none"/>
  <path d="M11 24 C22 24 23 24 37 24" stroke="#5E8CFF" stroke-width="3" stroke-linecap="round" fill="none"/>
  <path d="M11 32 C22 32 23 24 37 24" stroke="#9DB6FF" stroke-width="3" stroke-linecap="round" fill="none"/>
  <circle cx="37" cy="24" r="4" fill="#7FE8FF"/>
</svg>`;

const ENDCARD = `data:text/html;base64,${Buffer.from(
  `<!doctype html><html><body style="margin:0;height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:26px;background:radial-gradient(ellipse at 50% 30%, #182337 0%, #0B1220 70%);font-family:-apple-system,'Helvetica Neue',sans-serif">
  <div style="display:flex;align-items:center;gap:20px">${CAUCE_SVG}<span style="color:#F4F7FC;font-size:76px;font-weight:800;letter-spacing:-2px">Cauce</span></div>
  <div style="color:#DDE7F5;font-size:30px;font-weight:600;margin-top:6px">Software hecho 100% a la medida de tu negocio</div>
  <div style="color:#7FE8FF;font-size:26px;font-weight:700">cauceapp.com.ar</div>
  </body></html>`
).toString("base64")}`;

// Escena de documento: el mandato real (membrete nítido, datos difuminados)
const MANDATO_B64 = readFileSync(path.join(SCRATCH, "mandato-privado.png")).toString("base64");
const DOCPDF = `data:text/html;base64,${Buffer.from(
  `<!doctype html><html><body style="margin:0;background:#0B1220;display:flex;justify-content:center;padding:36px 0">
  <img src="data:image/png;base64,${MANDATO_B64}" style="width:640px;border-radius:6px;box-shadow:0 12px 60px rgba(0,0,0,.6)"/>
  </body></html>`
).toString("base64")}`;

type Escena = {
  url: string; // "endcard" | "docpdf" | URL absoluta
  dur: number;
  caption?: string;
  sitio?: "mf" | "vespa" | "zatiori" | "labase";
};

const LOGINS = {
  mf: { url: "https://www.motosfernandez.com.ar/admin/login", user: "Fran", pass: "Albo2003." },
  vespa: { url: "https://www.vespabahia.com.ar/admin", user: "cauce", pass: "cauce123" },
  zatiori: { url: "https://zatiori.vercel.app/login", user: "admin@zatiori.com", pass: "zatiori2026" },
  labase: { url: "https://la-base-vespa-bahia.vercel.app/admin", user: "admin", pass: "labase2026" },
} as const;

// Video A — "Chau Excel" (Motos Fernández) · VO a1..a9 = 73.6 s
const VIDEO_A = {
  nombre: "cauce-anuncio-chau-excel",
  vo: ["a1", "a2", "a3", "a4", "a5", "a6", "a7", "a8", "a9"],
  escenas: [
    { url: "https://www.motosfernandez.com.ar/admin", dur: 13.1, sitio: "mf", caption: "Motos Fernández · Bahía Blanca — su sistema real" },
    { url: "https://www.motosfernandez.com.ar/admin/stock-motos", dur: 9.24, sitio: "mf", caption: "Stock que siempre cierra" },
    { url: "https://www.motosfernandez.com.ar/admin/mandatos/nuevo", dur: 6.12, sitio: "mf", caption: "Mandato de venta en 2 minutos" },
    { url: "docpdf", dur: 7.82, caption: "El documento sale solo — PDF real del sistema" },
    { url: "https://www.motosfernandez.com.ar/admin/meta", dur: 4.7, sitio: "mf", caption: "Instagram con un botón" },
    { url: "https://www.motosfernandez.com.ar/admin/ml", dur: 2.78, sitio: "mf", caption: "Mercado Libre con otro" },
    { url: "https://www.motosfernandez.com.ar/admin/outreach", dur: 9.48, sitio: "mf", caption: "Avisos por WhatsApp, solos" },
    { url: "https://www.motosfernandez.com.ar/admin/finanzas", dur: 10.99, sitio: "mf", caption: "Finanzas que se arman solas" },
    { url: "endcard", dur: 9.34 },
  ] as Escena[],
};

// Video B — "Tres negocios" · VO b1..b6 = 44.5 s
const VIDEO_B = {
  nombre: "cauce-anuncio-tres-negocios",
  vo: ["b1", "b2", "b3", "b4", "b5", "b6"],
  escenas: [
    { url: "https://la-base-vespa-bahia.vercel.app/admin/calendario", dur: 8.35, sitio: "labase", caption: "Escuela de esquí · Bariloche" },
    { url: "https://la-base-vespa-bahia.vercel.app/admin/checkin", dur: 6.94, sitio: "labase", caption: "Check-in con QR" },
    { url: "https://zatiori.vercel.app/panel/pedidos", dur: 8.42, sitio: "zatiori", caption: "Fábrica de espejos — de la web al taller" },
    { url: "https://zatiori.vercel.app/panel/instagram", dur: 5.33, sitio: "zatiori", caption: "Instagram automático" },
    { url: "https://www.vespabahia.com.ar/admin/facturacion", dur: 5.38, sitio: "vespa", caption: "Factura ARCA desde el sistema" },
    { url: "endcard", dur: 10.08 },
  ] as Escena[],
};

async function login(sitio: keyof typeof LOGINS, browser: import("playwright").Browser): Promise<string> {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const p = await ctx.newPage();
  const cfg = LOGINS[sitio];
  await p.goto(cfg.url, { waitUntil: "domcontentloaded", timeout: 35000 });
  await p.waitForTimeout(2500);
  const pass = p.locator('input[type="password"]').first();
  if ((await pass.count()) > 0) {
    await p
      .locator('input[type="text"], input[type="email"], input[name*="user" i], input[autocomplete="username"]')
      .first()
      .fill(cfg.user);
    await pass.fill(cfg.pass);
    await pass.press("Enter");
    await p.waitForTimeout(6000);
  }
  const state = path.join(CLIPS, `state-${sitio}.json`);
  await ctx.storageState({ path: state });
  await ctx.close();
  return state;
}

async function grabarEscena(
  browser: import("playwright").Browser,
  esc: Escena,
  states: Record<string, string>,
  idx: number,
  pref: string
): Promise<string> {
  const ctx: BrowserContext = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1,
    ...(esc.sitio ? { storageState: states[esc.sitio] } : {}),
  });
  const p = await ctx.newPage();
  const esPagina = esc.url !== "endcard" && esc.url !== "docpdf";
  const url = esc.url === "endcard" ? ENDCARD : esc.url === "docpdf" ? DOCPDF : esc.url;
  await p.goto(url, { waitUntil: esPagina ? "networkidle" : "load", timeout: 40000 }).catch(() => {});
  await p.waitForTimeout(1500);
  if (esPagina) {
    await p.addStyleTag({ content: BASE_CSS }).catch(() => {});
    await p.evaluate(BLUR_JS).catch(() => {});
  }
  if (esc.caption) {
    await p
      .evaluate((cap) => {
        const d = document.createElement("div");
        d.textContent = cap;
        d.style.cssText =
          "position:fixed;left:24px;bottom:24px;z-index:99999;background:rgba(11,18,32,.9);color:#F4F7FC;padding:10px 18px;border-radius:10px;font:600 17px -apple-system,sans-serif;border:1px solid rgba(127,232,255,.4);filter:none!important";
        document.body.appendChild(d);
      }, esc.caption)
      .catch(() => {});
  }
  await p.waitForTimeout(300);
  // captura frame a frame: scroll progresivo, duración EXACTA garantizada
  const FPS = 8;
  const frames = Math.max(2, Math.round(esc.dur * FPS));
  const dir = path.join(CLIPS, `${pref}-${idx}-frames`);
  mkdirSync(dir, { recursive: true });
  const scrollTotal =
    esc.url === "endcard"
      ? 0
      : await p
          .evaluate(() => Math.min(Math.max(document.body.scrollHeight - window.innerHeight, 0), 700))
          .catch(() => 0);
  const framesScroll = Math.round(frames * 0.8);
  for (let f = 0; f < frames; f++) {
    if (scrollTotal > 0) {
      const avance = Math.min(f / framesScroll, 1);
      await p.evaluate((y) => window.scrollTo(0, y), Math.round(scrollTotal * avance)).catch(() => {});
      await p.waitForTimeout(30);
    }
    await p.screenshot({ path: path.join(dir, `f${String(f).padStart(4, "0")}.jpeg`), quality: 85, type: "jpeg" });
  }
  await ctx.close();
  const clip = path.join(CLIPS, `${pref}-${idx}.mp4`);
  execFileSync(FFMPEG, [
    "-y", "-framerate", `${FPS}`, "-i", path.join(dir, "f%04d.jpeg"),
    "-vf", "scale=1280:720,fps=30",
    "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-pix_fmt", "yuv420p",
    "-t", `${esc.dur}`, "-an", clip,
  ]);
  return clip;
}

async function armarVideo(
  def: typeof VIDEO_A,
  states: Record<string, string>,
  browser: import("playwright").Browser
) {
  console.log("== video:", def.nombre);
  const clips: string[] = [];
  for (let i = 0; i < def.escenas.length; i++) {
    clips.push(await grabarEscena(browser, def.escenas[i], states, i, def.nombre));
    console.log("  🎬 escena", i + 1, "/", def.escenas.length);
  }
  const lista = path.join(CLIPS, `${def.nombre}-lista.txt`);
  writeFileSync(lista, clips.map((c) => `file '${c}'`).join("\n"));
  const soloVideo = path.join(CLIPS, `${def.nombre}-mudo.mp4`);
  execFileSync(FFMPEG, ["-y", "-f", "concat", "-safe", "0", "-i", lista, "-c", "copy", soloVideo]);
  const listaVo = path.join(CLIPS, `${def.nombre}-vo.txt`);
  writeFileSync(listaVo, def.vo.map((v) => `file '${path.join(VO, v + ".mp3")}'`).join("\n"));
  const audio = path.join(CLIPS, `${def.nombre}-vo.m4a`);
  execFileSync(FFMPEG, ["-y", "-f", "concat", "-safe", "0", "-i", listaVo, "-c:a", "aac", "-b:a", "160k", audio]);
  const final = path.join(OUT, `${def.nombre}.mp4`);
  execFileSync(FFMPEG, ["-y", "-i", soloVideo, "-i", audio, "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "copy", "-shortest", final]);
  console.log("  ✅", final);
}

async function main() {
  const browser = await chromium.launch();
  console.log("logins...");
  const states: Record<string, string> = {};
  for (const s of ["mf", "vespa", "zatiori", "labase"] as const) {
    states[s] = await login(s, browser);
    console.log("  🔑", s);
  }
  await armarVideo(VIDEO_A, states, browser);
  await armarVideo(VIDEO_B as typeof VIDEO_A, states, browser);
  await browser.close();
}
main();
