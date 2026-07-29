import { chromium, BrowserContext, Page } from "playwright";
import { execFileSync } from "child_process";
import { mkdirSync, writeFileSync } from "fs";
import path from "path";

/**
 * Video del sistema de Ri Cars para mandarle al cliente.
 * Escenas sincronizadas con la voz real (cortes por transcripción Whisper),
 * captura frame a frame a 30fps con scroll suavizado (fluido, sin tirones).
 */

const SCRATCH =
  "/private/tmp/claude-501/-Users-juanfri-Documents-CLAUDE-CODE-WEB-NUEVA-MOTOS-FERNANDEZ/e2daaa89-dbe3-496d-88e6-e463232ff2e2/scratchpad";
const FFMPEG = path.join(SCRATCH, "ffmpeg");
const OUT = path.join(SCRATCH, "videos");
const CLIPS = path.join(OUT, "clips-ricars");
const INTRO = path.join(OUT, "intro.mp4");
const OUTRO_SRC = "/Users/juanfri/Desktop/anuncios-cauce/Cauce - Outro.mp4";
const VOZ =
  "/Users/juanfri/Desktop/anuncios-cauce/ElevenLabs_2026-07-29T17_17_40_Melisa_pvc_sp100_s50_sb75_se0_b_m2.mp3";
mkdirSync(CLIPS, { recursive: true });

const B = "https://cauce-arg.vercel.app";
const OS = `${B}/os/ricars`;

const BASE_CSS = `::-webkit-scrollbar { display: none !important; }`;
// Difumina plata, teléfonos y nombres de clientes; deja ver el funcionamiento.
const BLUR_JS = `
(() => {
  const money = /\\$\\s?[\\d.,]{4,}|US\\$\\s?[\\d.,]{3,}/;
  const contacto = /\\b\\d{2,4}[\\s-]?\\d{6,8}\\b|@[a-z0-9.-]+\\.[a-z]{2,}/i;
  const nombre = /^[A-Z\\u00c1\\u00c9\\u00cd\\u00d3\\u00da\\u00d1][a-z\\u00e1\\u00e9\\u00ed\\u00f3\\u00fa\\u00f1]+( [A-Z\\u00c1\\u00c9\\u00cd\\u00d3\\u00da\\u00d1][a-z\\u00e1\\u00e9\\u00ed\\u00f3\\u00fa\\u00f1]+){1,3}$/;
  const marcas = /honda|toyota|ford|chevrolet|volkswagen|fiat|renault|peugeot|nissan|audi|bmw|jeep|citroen|kia|hyundai|ram|amarok|hilux|ranger|kicks|strada/i;
  const raiz = document.querySelector('main') || document.body;
  const w = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT);
  const objetivos = new Set();
  while (w.nextNode()) {
    const t = (w.currentNode.textContent || '').trim();
    const el = w.currentNode.parentElement;
    if (!el || el.closest('nav,aside,button,th,h1,h2,h3')) continue;
    if (marcas.test(t)) continue;
    if (money.test(t) || contacto.test(t) || (t.length < 40 && nombre.test(t))) objetivos.add(el);
  }
  for (const el of objetivos) el.style.setProperty('filter', 'blur(5px)', 'important');
})()
`;

type Paso = { at: number; hacer: (p: Page) => Promise<void> };
type Escena = { url: string; dur: number; caption: string; pasos?: Paso[]; quieta?: boolean; paneo?: number; sinBlur?: boolean };

const campo = (p: Page, i: number) => p.locator("input:visible").nth(i);
/** Escribe de a pedazos entre frames: se ve tipear sin frenar la captura. */
function tipear(i: number, texto: string, desde: number, hasta: number, n = 4): Paso[] {
  const paso = (texto.length / n) | 0;
  return Array.from({ length: n }, (_, k) => ({
    at: desde + ((hasta - desde) * k) / n,
    hacer: async (p: Page) => {
      await campo(p, i).fill(texto.slice(0, k === n - 1 ? texto.length : paso * (k + 1)), { timeout: 3000 });
    },
  }));
}
const clic = (at: number, sel: string): Paso => ({
  at,
  hacer: async (p: Page) => { await p.locator(sel).first().click({ timeout: 3000 }); },
});

// Cortes reales de la voz (transcripción) → duración de cada escena.
const T = [0, 10.16, 19.0, 34.32, 44.12, 52.92, 64.16, 75.28, 83.5, 93.8, 104.2, 138.1, 145.2, 151.4, 157.5, 176.8, 196.6, 228.0];
const FIN = 246.2;
const dur = (i: number) => Number(((T[i + 1] ?? FIN) - T[i]).toFixed(2));

const M = "cms58nlsi002t8zna8195bjha";
const BOL = "cms58nm6n00358znastqehrpz";

const ESCENAS: Escena[] = [
  { url: OS, dur: dur(0), caption: "Ri Cars Automotores — su sistema" },
  { url: OS, dur: dur(1), caption: "Qué miran y de dónde vienen las consultas" },
  {
    url: `${OS}/stock`, dur: dur(2), caption: "Se busca y se edita en la misma lista",
    // Busca una unidad y abre la edición del precio ahí mismo (sin guardar).
    pasos: [
      ...tipear(0, "hilux", 0.06, 0.26),
      { at: 0.3, hacer: async (p) => { await campo(p, 0).press("Enter"); } },
      // abre la edición del precio en la misma fila y sale sin guardar
      clic(0.52, "tbody tr:first-child button:has-text('✎')"),
      { at: 0.78, hacer: async (p) => { await p.keyboard.press("Escape"); } },
    ],
  },
  {
    url: `${OS}/mandatos/nuevo`, dur: dur(3), caption: "Se carga el mandato: cliente y unidad",
    quieta: true,
    pasos: [
      ...tipear(0, "Martín Aguirre", 0.04, 0.26),
      ...tipear(1, "27.845.112", 0.28, 0.4, 3),
      ...tipear(2, "2914 55-8890", 0.42, 0.54, 3),
      // el vehículo se elige del propio stock, no se recarga a mano
      { at: 0.6, hacer: async (p) => { await p.locator("select:visible").first().selectOption({ index: 2 }, { timeout: 3000 }); } },
      { at: 0.8, hacer: async (p) => { await p.evaluate("window.scrollBy({top:420,behavior:'smooth'})"); } },
    ],
  },
  { url: `${OS}/mandatos/${M}/imprimir`, dur: dur(4), caption: "Y el mandato sale listo para firmar" },
  { url: `${OS}/stock`, dur: dur(5), caption: "El vehículo entra solo al stock, sin publicar" },
  {
    url: `${OS}/boletos/nuevo`, dur: dur(6), caption: "Boleto: pagos y las permutas que hagan falta",
    quieta: true,
    pasos: [
      ...tipear(0, "Cecilia Ramos", 0.04, 0.22),
      ...tipear(6, "Volkswagen", 0.26, 0.38, 3),
      ...tipear(7, "Amarok Highline", 0.4, 0.54),
      clic(0.62, "button:has-text('Agregar permuta')"),
      { at: 0.72, hacer: async (p) => { await p.evaluate("window.scrollBy({top:520,behavior:'smooth'})"); } },
      clic(0.86, "button:has-text('Agregar permuta')"),
    ],
  },
  { url: `${OS}/boletos/${BOL}/imprimir`, dur: dur(7), caption: "El boleto de compraventa" },
  {
    url: `${OS}/financiaciones`, dur: dur(8), caption: "La financiación con su plan de cuotas",
    pasos: [clic(0.3, "a[href*='/financiaciones/']"), { at: 0.62, hacer: async (p) => { await p.evaluate("window.scrollBy({top:460,behavior:'smooth'})"); } }],
  },
  {
    url: `${OS}/clientes`, dur: dur(9), caption: "Y se entra a la ficha del cliente",
    pasos: [...tipear(0, "luciana", 0.06, 0.26), clic(0.42, "a[href*='/clientes/']")],
  },
  {
    url: `${OS}/publicar`, dur: dur(10), caption: "Un auto, un botón, publicado en los tres lados",
    pasos: [
      clic(0.12, "button:has-text('Lista')"),
      { at: 0.34, hacer: async (p) => { await p.evaluate("window.scrollBy({top:600,behavior:'smooth'})"); } },
      clic(0.52, "button:has-text('Grilla')"),
      clic(0.68, "button:has-text('Copiar texto')"),
      { at: 0.84, hacer: async (p) => { await p.evaluate("window.scrollBy({top:500,behavior:'smooth'})"); } },
    ],
  },
  { url: `${OS}/proveedores`, dur: dur(11), caption: "Proveedores — el CBU se copia con un clic" },
  { url: `${OS}/caja`, dur: dur(12), caption: "Las ventas caen solas a Finanzas" },
  { url: OS, dur: dur(13), caption: "Funcionando con sus autos de verdad" },
  { url: `${OS}/procesos`, dur: dur(14), caption: "Avisos que salen solos" },
  { url: `${OS}/caja/movimientos`, dur: dur(15), caption: "Finanzas 100% editables" },
  { url: `${B}/sitio/ricars`, dur: dur(16), caption: "Su web — cada visita le enseña a Meta", paneo: 5200, sinBlur: true },
];
const OUTRO_DUR = Number((FIN - T[17]).toFixed(2)); // el cierre suena sobre la outro

async function main() {
  const browser = await chromium.launch();
  // login una vez
  const ctxLogin = await browser.newContext({ viewport: { width: 1440, height: 810 } });
  const pl = await ctxLogin.newPage();
  await pl.goto(`${B}/login`, { waitUntil: "networkidle", timeout: 40000 });
  await pl.locator("input:not([type=password])").first().fill("ricars");
  await pl.locator("input[type=password]").fill("RiCars.2026");
  await pl.locator("button[type=submit]").first().click();
  await pl.waitForTimeout(5000);
  const estado = path.join(CLIPS, "state.json");
  await ctxLogin.storageState({ path: estado });
  await ctxLogin.close();
  console.log("🔑 login ok");

  const SOLO = process.env.SOLO ? process.env.SOLO.split(",").map(Number) : null;
  const clips: string[] = [INTRO];
  for (let i = 0; i < ESCENAS.length; i++) {
    const e = ESCENAS[i];
    if (SOLO && !SOLO.includes(i)) { clips.push(path.join(CLIPS, `e${i}.mp4`)); continue; }
    const ctx: BrowserContext = await browser.newContext({
      viewport: { width: 1440, height: 810 },
      deviceScaleFactor: 1,
      storageState: estado,
    });
    const p = await ctx.newPage();
    await p.goto(e.url, { waitUntil: "networkidle", timeout: 40000 }).catch(() => {});
    await p.waitForTimeout(1500);
    await p.addStyleTag({ content: BASE_CSS }).catch(() => {});
    if (!e.sinBlur) await p.evaluate(BLUR_JS).catch(() => {});
    await p
      .evaluate((cap) => {
        const d = document.createElement("div");
        d.textContent = cap;
        d.style.cssText =
          "position:fixed;left:24px;bottom:24px;z-index:99999;background:rgba(10,10,10,.92);color:#fff;padding:10px 18px;border-radius:10px;font:600 17px -apple-system,sans-serif;border:1px solid rgba(209,142,0,.55);filter:none!important";
        document.body.appendChild(d);
      }, e.caption)
      .catch(() => {});
    await p.waitForTimeout(300);

    const FPS = 30;
    const frames = Math.max(2, Math.round(e.dur * FPS));
    const dir = path.join(CLIPS, `e${i}`);
    mkdirSync(dir, { recursive: true });
    const tope = e.paneo ?? 900;
    const total = e.quieta ? 0 : await p
      .evaluate((max) => Math.min(Math.max(document.body.scrollHeight - window.innerHeight, 0), max), tope)
      .catch(() => 0);
    // Recorrido: baja suave hasta el 55%, se queda, y vuelve un poco —
    // así nunca termina la escena mirando el pie vacío de la página.
    const easeIO = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    const pos = (f: number) => {
      const t = f / Math.max(frames - 1, 1);
      if (e.paneo) return easeIO(Math.min(t / 0.94, 1));
      if (t <= 0.55) return easeIO(t / 0.55);
      if (t <= 0.8) return 1;
      return 1 - 0.55 * easeIO((t - 0.8) / 0.2);
    };
    const pendientes = [...(e.pasos ?? [])].sort((a, b) => a.at - b.at);
    for (let f = 0; f < frames; f++) {
      const t = f / Math.max(frames - 1, 1);
      while (pendientes.length && pendientes[0].at <= t) {
        const paso = pendientes.shift()!;
        await paso.hacer(p).catch((err) => console.log(`   ⚠︎ paso ${paso.at} — ${String(err).slice(0, 60)}`));
      }
      if (total > 0 && !e.quieta) {
        await p.evaluate((y) => window.scrollTo(0, y), Math.round(total * pos(f))).catch(() => {});
      }
      await p.screenshot({ path: path.join(dir, `f${String(f).padStart(4, "0")}.jpeg`), quality: 85, type: "jpeg" });
    }
    await ctx.close();
    const clip = path.join(CLIPS, `e${i}.mp4`);
    execFileSync(FFMPEG, [
      "-y", "-framerate", `${FPS}`, "-i", path.join(dir, "f%04d.jpeg"),
      "-vf", "scale=1440:810,fps=30",
      "-c:v", "libx264", "-preset", "veryfast", "-crf", "21", "-pix_fmt", "yuv420p",
      "-t", `${e.dur}`, "-an", clip,
    ]);
    clips.push(clip);
    console.log(`🎬 ${i + 1}/${ESCENAS.length} — ${e.caption}`);
  }
  await browser.close();

  // outro extendida al largo del cierre hablado
  const outro = path.join(CLIPS, "outro.mp4");
  execFileSync(FFMPEG, [
    "-y", "-i", OUTRO_SRC,
    "-vf", `scale=1440:810,fps=30,format=yuv420p,tpad=stop_mode=clone:stop_duration=12`,
    "-c:v", "libx264", "-preset", "veryfast", "-crf", "21", "-pix_fmt", "yuv420p",
    "-t", `${OUTRO_DUR}`, "-an", outro,
  ]);
  clips.push(outro);

  const lista = path.join(CLIPS, "lista.txt");
  writeFileSync(lista, clips.map((c) => `file '${c}'`).join("\n"));
  const mudo = path.join(CLIPS, "mudo.mp4");
  // Recodificado (no "-c copy"): la intro viene con otro perfil y, pegada tal cual,
  // muchos reproductores se quedan mostrando solo el primer clip.
  execFileSync(FFMPEG, [
    "-y", "-f", "concat", "-safe", "0", "-i", lista,
    "-vf", "scale=1440:810,fps=30,format=yuv420p",
    "-c:v", "libx264", "-preset", "veryfast", "-crf", "21", "-an", mudo,
  ]);
  const audio = path.join(CLIPS, "vo.m4a");
  // 3.5 s de silencio (la intro) + la voz
  execFileSync(FFMPEG, ["-y", "-i", VOZ, "-af", "adelay=3500:all=1", "-c:a", "aac", "-b:a", "160k", audio]);
  const final = path.join(OUT, "ricars-sistema.mp4");
  execFileSync(FFMPEG, ["-y", "-i", mudo, "-i", audio, "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "copy", "-movflags", "+faststart", "-shortest", final]);
  console.log("✅", final);
}
main();
