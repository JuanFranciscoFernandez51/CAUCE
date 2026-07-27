import { chromium, BrowserContext } from "playwright";
import { execFileSync } from "child_process";
import { readFileSync, mkdirSync, writeFileSync } from "fs";
import path from "path";

/**
 * Graba los video-anuncios de Cauce navegando los sistemas reales.
 * Cada clip dura EXACTO lo que dura su frase de voz en off; después se
 * concatena video + audio con ffmpeg. Datos difuminados con blur.
 */

const SCRATCH =
  "/private/tmp/claude-501/-Users-juanfri-Documents-CLAUDE-CODE-WEB-NUEVA-MOTOS-FERNANDEZ/e2daaa89-dbe3-496d-88e6-e463232ff2e2/scratchpad";
const FFMPEG = path.join(SCRATCH, "ffmpeg");
const VO = path.join(SCRATCH, "videos/vo");
const OUT = path.join(SCRATCH, "videos");
const CLIPS = path.join(OUT, "clips");
mkdirSync(CLIPS, { recursive: true });

const BLUR_CSS = `
  main td, main tbody tr, main ul > li, main ol > li,
  main [class*="tabular"], td, tbody tr { filter: blur(6px) !important; }
  h1, h2, h3, h4, th, thead *, nav *, aside *, label, button, summary,
  [role="tablist"] * { filter: none !important; }
  ::-webkit-scrollbar { display: none !important; }
`;

const BLUR_JS = `
(() => {
  const money = /\\$\\s?[\\d.,]{2,}|[\\d.]{4,}\\s?(ARS|USD|us\\$|u\\$s)/i;
  const contacto = /\\b\\d{2,4}[\\s-]?\\d{6,8}\\b|@[a-z0-9.-]+\\.[a-z]{2,}|wa\\.me/i;
  const walker = document.createTreeWalker(document.querySelector('main') || document.body, NodeFilter.SHOW_TEXT);
  const objetivos = new Set();
  while (walker.nextNode()) {
    const t = walker.currentNode.textContent || '';
    if (money.test(t) || contacto.test(t)) {
      const el = walker.currentNode.parentElement;
      if (el && !['H1','H2','H3','H4','TH','NAV','BUTTON','LABEL'].includes(el.tagName)) objetivos.add(el);
    }
  }
  for (const el of objetivos) el.style.setProperty('filter', 'blur(6px)', 'important');
})()
`;

const LOGO_B64 = readFileSync("/Users/juanfri/Desktop/CAUCE FABLE/logos-cauce/logo1.png").toString("base64");

const ENDCARD = `data:text/html;base64,${Buffer.from(
  `<!doctype html><html><body style="margin:0;height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:28px;background:radial-gradient(ellipse at 50% 30%, #0e2a33 0%, #06141a 70%);font-family:-apple-system,sans-serif">
  <img src="data:image/png;base64,${LOGO_B64}" style="width:320px;max-width:60vw" />
  <div style="color:#e8f6f8;font-size:34px;font-weight:700;letter-spacing:.5px">Software 100% a tu medida</div>
  <div style="color:#59c3d4;font-size:26px;font-weight:600">cauceapp.com.ar</div>
  </body></html>`
).toString("base64")}`;

type Escena = {
  url: string; // "endcard" o URL absoluta
  dur: number; // segundos exactos (== duración del segmento de VO que cubre)
  caption?: string;
  sitio?: "mf" | "vespa" | "zatiori" | "labase";
};

const LOGINS = {
  mf: { url: "https://www.motosfernandez.com.ar/admin/login", user: "Fran", pass: "Albo2003." },
  vespa: { url: "https://www.vespabahia.com.ar/admin", user: "cauce", pass: "cauce123" },
  zatiori: { url: "https://zatiori.vercel.app/login", user: "admin@zatiori.com", pass: "zatiori2026" },
  labase: { url: "https://la-base-vespa-bahia.vercel.app/admin", user: "admin", pass: "labase2026" },
} as const;

// Video A — "Chau Excel" (Motos Fernández), VO a1..a7 = 49.79 s
const VIDEO_A: { nombre: string; vo: string[]; escenas: Escena[] } = {
  nombre: "cauce-anuncio-chau-excel",
  vo: ["a1", "a2", "a3", "a4", "a5", "a6", "a7"],
  escenas: [
    { url: "https://www.motosfernandez.com.ar/admin", dur: 8.18, sitio: "mf", caption: "Un negocio real, con Cauce" },
    { url: "https://www.motosfernandez.com.ar/admin/stock-motos", dur: 4.03, sitio: "mf", caption: "Stock siempre al día" },
    { url: "https://www.motosfernandez.com.ar/admin/mandatos/nuevo", dur: 6.79, sitio: "mf", caption: "Mandato → documento listo para firmar" },
    { url: "https://www.motosfernandez.com.ar/admin/meta", dur: 4.0, sitio: "mf", caption: "Instagram con un botón" },
    { url: "https://www.motosfernandez.com.ar/admin/ml", dur: 3.63, sitio: "mf", caption: "Mercado Libre con un botón" },
    { url: "https://www.motosfernandez.com.ar/admin/outreach", dur: 6.91, sitio: "mf", caption: "Avisos por WhatsApp, solos" },
    { url: "https://www.motosfernandez.com.ar/admin/finanzas", dur: 7.25, sitio: "mf", caption: "Finanzas que se arman solas" },
    { url: "endcard", dur: 9.0 },
  ],
};

// Video B — "Tres negocios" (La Base + Zatiori + Vespa), VO b1..b6 = 40.29 s
const VIDEO_B: { nombre: string; vo: string[]; escenas: Escena[] } = {
  nombre: "cauce-anuncio-tres-negocios",
  vo: ["b1", "b2", "b3", "b4", "b5", "b6"],
  escenas: [
    { url: "https://la-base-vespa-bahia.vercel.app/admin/calendario", dur: 5.0, sitio: "labase", caption: "Escuela de esquí · Bariloche" },
    { url: "https://la-base-vespa-bahia.vercel.app/admin/reservas", dur: 3.86, sitio: "labase", caption: "Reservas que entran solas" },
    { url: "https://la-base-vespa-bahia.vercel.app/admin/checkin", dur: 4.54, sitio: "labase", caption: "Check-in con QR" },
    { url: "https://zatiori.vercel.app/panel/pedidos", dur: 4.0, sitio: "zatiori", caption: "Fábrica de espejos" },
    { url: "https://zatiori.vercel.app/panel/fabrica", dur: 3.92, sitio: "zatiori", caption: "De la web al taller" },
    { url: "https://zatiori.vercel.app/panel/instagram", dur: 3.77, sitio: "zatiori", caption: "Instagram automático" },
    { url: "https://www.vespabahia.com.ar/admin/facturacion", dur: 5.02, sitio: "vespa", caption: "Factura ARCA desde el sistema" },
    { url: "endcard", dur: 10.18 },
  ],
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
    recordVideo: { dir: CLIPS, size: { width: 1280, height: 720 } },
    ...(esc.sitio ? { storageState: states[esc.sitio] } : {}),
  });
  // blur presente DESDE el primer paint: el estilo se inyecta apenas existe <head>
  if (esc.url !== "endcard") {
    await ctx.addInitScript(
      `new MutationObserver((_, obs) => {
        if (document.head && !document.getElementById('privblur')) {
          const s = document.createElement('style');
          s.id = 'privblur';
          s.textContent = ${JSON.stringify(BLUR_CSS)};
          document.head.appendChild(s);
          obs.disconnect();
        }
      }).observe(document, { childList: true, subtree: true });`
    );
  }
  const p = await ctx.newPage();
  const url = esc.url === "endcard" ? ENDCARD : esc.url;
  await p.goto(url, { waitUntil: esc.url === "endcard" ? "load" : "networkidle", timeout: 40000 }).catch(() => {});
  await p.waitForTimeout(1200);
  if (esc.url !== "endcard") {
    await p.addStyleTag({ content: BLUR_CSS }).catch(() => {});
    await p.evaluate(BLUR_JS).catch(() => {});
    if (esc.caption) {
      await p
        .evaluate((cap) => {
          const d = document.createElement("div");
          d.textContent = cap;
          d.style.cssText =
            "position:fixed;left:24px;bottom:24px;z-index:99999;background:rgba(6,20,26,.88);color:#e8f6f8;padding:10px 18px;border-radius:10px;font:600 17px -apple-system,sans-serif;border:1px solid rgba(89,195,212,.5);filter:none!important";
          document.body.appendChild(d);
        }, esc.caption)
        .catch(() => {});
    }
  }
  // colchón post-blur: garantiza que la ventana recortada arranque con blur aplicado
  if (esc.url !== "endcard") await p.waitForTimeout(1500);
  // scroll suave durante la escena (deja 1s quieto al final)
  const scrollMs = Math.max(0, (esc.dur - 1) * 1000);
  if (esc.url !== "endcard" && scrollMs > 800) {
    await p
      .evaluate((ms) => {
        const total = Math.min(
          Math.max(document.body.scrollHeight - window.innerHeight, 0),
          600
        );
        const t0 = performance.now();
        return new Promise<void>((fin) => {
          function paso(t: number) {
            const f = Math.min((t - t0) / ms, 1);
            window.scrollTo(0, total * f);
            if (f < 1) requestAnimationFrame(paso);
            else fin();
          }
          requestAnimationFrame(paso);
        });
      }, scrollMs)
      .catch(() => {});
    await p.waitForTimeout(1000);
  } else {
    await p.waitForTimeout(esc.dur * 1000);
  }
  const video = p.video();
  await ctx.close();
  const raw = await video!.path();
  // remux para tener duración confiable (el webm de Playwright viene sin metadata)
  const tmp = path.join(CLIPS, `${pref}-${idx}.mkv`);
  execFileSync(FFMPEG, ["-y", "-i", raw, "-c", "copy", tmp]);
  let rawDur = 0;
  try {
    execFileSync(FFMPEG, ["-i", tmp], { stdio: ["ignore", "pipe", "pipe"] });
  } catch (e) {
    const m = /Duration: (\d+):(\d+):([\d.]+)/.exec(String((e as { stderr?: unknown }).stderr));
    if (m) rawDur = Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]);
  }
  // recorte exacto: los últimos dur segundos, con búsqueda de salida (frame-accurate);
  // si el clip quedó corto, congela el último frame hasta completar
  const start = Math.max(0, rawDur - esc.dur - 0.1);
  const clip = path.join(CLIPS, `${pref}-${idx}.mp4`);
  execFileSync(FFMPEG, [
    "-y", "-i", tmp, "-ss", `${start}`,
    "-vf", `scale=1280:720,fps=30,tpad=stop_mode=clone:stop_duration=5`,
    "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-pix_fmt", "yuv420p",
    "-t", `${esc.dur}`, "-an", clip,
  ]);
  return clip;
}

async function armarVideo(def: typeof VIDEO_A, states: Record<string, string>, browser: import("playwright").Browser) {
  console.log("== video:", def.nombre);
  const clips: string[] = [];
  for (let i = 0; i < def.escenas.length; i++) {
    clips.push(await grabarEscena(browser, def.escenas[i], states, i, def.nombre));
    console.log("  🎬 escena", i + 1, "/", def.escenas.length);
  }
  // concat video
  const lista = path.join(CLIPS, `${def.nombre}-lista.txt`);
  writeFileSync(lista, clips.map((c) => `file '${c}'`).join("\n"));
  const soloVideo = path.join(CLIPS, `${def.nombre}-mudo.mp4`);
  execFileSync(FFMPEG, ["-y", "-f", "concat", "-safe", "0", "-i", lista, "-c", "copy", soloVideo]);
  // concat audio VO
  const listaVo = path.join(CLIPS, `${def.nombre}-vo.txt`);
  writeFileSync(listaVo, def.vo.map((v) => `file '${path.join(VO, v + ".mp3")}'`).join("\n"));
  const audio = path.join(CLIPS, `${def.nombre}-vo.m4a`);
  execFileSync(FFMPEG, ["-y", "-f", "concat", "-safe", "0", "-i", listaVo, "-c:a", "aac", "-b:a", "160k", audio]);
  // mux final
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
  await armarVideo(VIDEO_B, states, browser);
  await browser.close();
}
main();
