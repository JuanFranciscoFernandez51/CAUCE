import { chromium, BrowserContext } from "playwright";
import { execFileSync } from "child_process";
import { readFileSync, mkdirSync, writeFileSync } from "fs";
import path from "path";

/**
 * Ensambla los videos finales:
 * - A "Chau Excel": intro Cauce + 8 escenas MF sincronizadas a la voz REAL de
 *   Fran (ElevenLabs, cortes por transcripción Whisper) + outro oficial.
 * - LB "La Base completo": intro + web frontal (3 escenas) + sistema (12) +
 *   outro, con voz temporal (se reemplaza cuando Fran grabe la suya).
 */

const SCRATCH =
  "/private/tmp/claude-501/-Users-juanfri-Documents-CLAUDE-CODE-WEB-NUEVA-MOTOS-FERNANDEZ/e2daaa89-dbe3-496d-88e6-e463232ff2e2/scratchpad";
const FFMPEG = path.join(SCRATCH, "ffmpeg");
const VO = path.join(SCRATCH, "videos/vo");
const OUT = path.join(SCRATCH, "videos");
const CLIPS = path.join(OUT, "clips-finales");
const INTRO = path.join(OUT, "intro.mp4"); // 3.5 s
const OUTRO_SRC = "/Users/juanfri/Desktop/anuncios-cauce/Cauce - Outro.mp4"; // 9.0 s
const VOZ_FRAN =
  "/Users/juanfri/Desktop/anuncios-cauce/ElevenLabs_2026-07-27T15_31_34_Agustín - Relaxed, Warm and Approachable_pvc_sp87_s50_sb75_se0_b_m2.mp3";
mkdirSync(CLIPS, { recursive: true });

const BASE_CSS = `::-webkit-scrollbar { display: none !important; }
  [class*="cookie" i], [id*="cookie" i] { display: none !important; }`;

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
      const prev = el.closest('td') ? null : el.previousElementSibling;
      if (prev && (prev.textContent || '').trim().length < 45 && !marcas.test(prev.textContent || '')) objetivos.add(prev);
    }
    if (t.length < 40 && nombre.test(t) && !marcas.test(t)) objetivos.add(el);
  }
  for (const el of objetivos) el.style.setProperty('filter', 'blur(6px)', 'important');
})()
`;

// Escena de documento: el mandato real (membrete nítido, datos difuminados)
const MANDATO_B64 = readFileSync(path.join(SCRATCH, "mandato-privado.png")).toString("base64");
const DOCPDF = `data:text/html;base64,${Buffer.from(
  `<!doctype html><html><body style="margin:0;background:#161D2B;display:flex;justify-content:center;padding:36px 0">
  <img src="data:image/png;base64,${MANDATO_B64}" style="width:640px;border-radius:6px;box-shadow:0 12px 60px rgba(0,0,0,.6)"/>
  </body></html>`
).toString("base64")}`;

type Escena = { url: string; dur: number; caption?: string; sitio?: "mf" | "labase" };

const LOGINS = {
  mf: { url: "https://www.motosfernandez.com.ar/admin/login", user: "Fran", pass: "Albo2003." },
  labase: { url: "https://la-base-vespa-bahia.vercel.app/admin", user: "admin", pass: "labase2026" },
} as const;

// A: cortes exactos de la voz de Fran (transcripción Whisper del MP3, 65.65 s)
const MF = "https://www.motosfernandez.com.ar";
const ESCENAS_A: Escena[] = [
  { url: `${MF}/admin`, dur: 12.52, sitio: "mf", caption: "Motos Fernández · Bahía Blanca — su sistema real" },
  { url: `${MF}/admin/stock-motos`, dur: 7.62, sitio: "mf", caption: "Stock que siempre cierra" },
  { url: `${MF}/admin/mandatos/nuevo`, dur: 4.82, sitio: "mf", caption: "Mandato de venta en 2 minutos" },
  { url: "docpdf", dur: 6.84, caption: "El documento sale solo — PDF real del sistema" },
  { url: `${MF}/admin/meta`, dur: 3.9, sitio: "mf", caption: "Instagram con un botón" },
  { url: `${MF}/admin/ml`, dur: 1.94, sitio: "mf", caption: "Mercado Libre con otro" },
  { url: `${MF}/admin/outreach`, dur: 9.5, sitio: "mf", caption: "Avisos por WhatsApp, solos" },
  { url: `${MF}/admin/finanzas`, dur: 8.96, sitio: "mf", caption: "Finanzas que se arman solas" },
];
const OUTRO_A = 9.55; // 65.65 - 56.10: la frase final suena sobre la outro

// LB: voz temporal c1..c16 (se regraba con la voz de Fran cuando esté)
const LB = "https://la-base-vespa-bahia.vercel.app";
const ESCENAS_LB: Escena[] = [
  { url: `${LB}/es`, dur: 10.42, caption: "La Base · Cerro Catedral — su web real" },
  { url: `${LB}/es/reservas`, dur: 7.82, caption: "Reservas online, 24 hs" },
  { url: `${LB}/es/instructores`, dur: 4.66, caption: "Perfil de cada instructor" },
  { url: `${LB}/admin`, dur: 9.6, sitio: "labase", caption: "El negocio en números" },
  { url: `${LB}/admin/hoy`, dur: 7.13, sitio: "labase", caption: "El parte del día, solo" },
  { url: `${LB}/admin/calendario`, dur: 3.91, sitio: "labase", caption: "Ocupación del mes" },
  { url: `${LB}/admin/reservas`, dur: 8.42, sitio: "labase", caption: "Señas y vencimientos automáticos" },
  { url: `${LB}/admin/checkin`, dur: 7.39, sitio: "labase", caption: "Check-in con QR" },
  { url: `${LB}/admin/caja`, dur: 7.99, sitio: "labase", caption: "Caja en 4 monedas" },
  { url: `${LB}/admin/espera`, dur: 8.21, sitio: "labase", caption: "La demanda no se pierde" },
  { url: `${LB}/admin/rental`, dur: 5.23, sitio: "labase", caption: "Rental asociado a la reserva" },
  { url: `${LB}/admin/instructores`, dur: 7.08, sitio: "labase", caption: "Cada instructor, su agenda" },
  { url: `${LB}/admin/liquidaciones`, dur: 4.7, sitio: "labase", caption: "Liquidaciones automáticas" },
  { url: `${LB}/admin/bolsa`, dur: 6.58, sitio: "labase", caption: "Bolsa de trabajo → instructor en 1 clic" },
  { url: `${LB}/admin/tarifas`, dur: 5.09, sitio: "labase", caption: "Tarifas en vivo" },
];
const OUTRO_LB = 10.3; // c16 suena sobre la outro

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
  const esPagina = esc.url !== "docpdf";
  const url = esc.url === "docpdf" ? DOCPDF : esc.url;
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
  const FPS = 8;
  const frames = Math.max(2, Math.round(esc.dur * FPS));
  const dir = path.join(CLIPS, `${pref}-${idx}-frames`);
  mkdirSync(dir, { recursive: true });
  const scrollTotal = await p
    .evaluate(() => Math.min(Math.max(document.body.scrollHeight - window.innerHeight, 0), 900))
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

/** Re-encodea la outro al formato de los clips, extendida a `dur` con freeze del último frame. */
function outroClip(dur: number, nombre: string): string {
  const out = path.join(CLIPS, nombre);
  execFileSync(FFMPEG, [
    "-y", "-i", OUTRO_SRC,
    "-vf", `scale=1280:720,fps=30,format=yuv420p,tpad=stop_mode=clone:stop_duration=3`,
    "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-pix_fmt", "yuv420p",
    "-t", `${dur}`, "-an", out,
  ]);
  return out;
}

function armar(nombre: string, clips: string[], audioArgs: string[], salida: string) {
  const lista = path.join(CLIPS, `${nombre}-lista.txt`);
  writeFileSync(lista, clips.map((c) => `file '${c}'`).join("\n"));
  const mudo = path.join(CLIPS, `${nombre}-mudo.mp4`);
  execFileSync(FFMPEG, ["-y", "-f", "concat", "-safe", "0", "-i", lista, "-c", "copy", mudo]);
  const audio = path.join(CLIPS, `${nombre}-audio.m4a`);
  // 3.5 s de silencio (la intro) + la voz
  execFileSync(FFMPEG, ["-y", ...audioArgs, "-af", "adelay=3500:all=1", "-c:a", "aac", "-b:a", "160k", audio]);
  execFileSync(FFMPEG, ["-y", "-i", mudo, "-i", audio, "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "copy", "-shortest", salida]);
  console.log("  ✅", salida);
}

async function main() {
  const browser = await chromium.launch();
  console.log("logins...");
  const states: Record<string, string> = {};
  for (const s of ["mf", "labase"] as const) {
    states[s] = await login(s, browser);
    console.log("  🔑", s);
  }

  // ── VIDEO A ──
  console.log("== A: chau-excel (voz Fran)");
  const clipsA: string[] = [INTRO];
  for (let i = 0; i < ESCENAS_A.length; i++) {
    clipsA.push(await grabarEscena(browser, ESCENAS_A[i], states, i, "A"));
    console.log("  🎬 A", i + 1, "/", ESCENAS_A.length);
  }
  clipsA.push(outroClip(OUTRO_A, "outro-A.mp4"));
  armar("A", clipsA, ["-i", VOZ_FRAN], path.join(OUT, "cauce-anuncio-chau-excel-FINAL.mp4"));

  // ── VIDEO LB ──
  console.log("== LB: la-base (voz temporal)");
  const clipsLB: string[] = [INTRO];
  for (let i = 0; i < ESCENAS_LB.length; i++) {
    clipsLB.push(await grabarEscena(browser, ESCENAS_LB[i], states, i, "LB"));
    console.log("  🎬 LB", i + 1, "/", ESCENAS_LB.length);
  }
  clipsLB.push(outroClip(OUTRO_LB, "outro-LB.mp4"));
  // concat de la voz temporal c1..c16
  const listaVo = path.join(CLIPS, "LB-vo.txt");
  writeFileSync(
    listaVo,
    Array.from({ length: 16 }, (_, i) => `file '${path.join(VO, `c${i + 1}.mp3`)}'`).join("\n")
  );
  const voLB = path.join(CLIPS, "LB-vo.mp3");
  execFileSync(FFMPEG, ["-y", "-f", "concat", "-safe", "0", "-i", listaVo, "-c:a", "libmp3lame", "-q:a", "3", voLB]);
  armar("LB", clipsLB, ["-i", voLB], path.join(OUT, "cauce-video-la-base.mp4"));

  await browser.close();
}
main();
