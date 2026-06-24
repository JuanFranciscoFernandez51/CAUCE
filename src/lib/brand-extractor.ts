import { z } from "zod";
import { getAnthropic, aiAvailable, MODEL_AGENT } from "./anthropic";

/**
 * Extractor de marca: dado el link de la web o el Instagram de un negocio,
 * intenta deducir sus colores, logo, nombre y estilo visual para pre-cargar
 * el branding del tenant. NUNCA aplica el cambio: solo propone.
 *
 * Estrategia web: fetch del HTML (timeout corto, UA de browser) + parseo simple
 * (regex) de theme-color, og:image, favicons/apple-touch-icon y title/og:site_name.
 * La mejor imagen disponible se le pasa a Claude Vision para que estime colores
 * y estilo. Instagram es best-effort: suele bloquear (login/429), y si falla
 * devolvemos { ok:false } con gracia, sin romper nada.
 */

export type BrandResult = {
  ok: boolean;
  primary?: string | null;
  accent?: string | null;
  logoUrl?: string | null;
  estilo?: string | null;
  nombre?: string | null;
  fuente?: "web" | "instagram";
  notas?: string;
  motivo?: string;
};

const FETCH_TIMEOUT_MS = 7000;
const BROWSER_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

const hex = z
  .string()
  .trim()
  .regex(/^#[0-9a-fA-F]{6}$/, "hex inválido");

// Claude devuelve hex válido, null, o algo que descartamos con gracia.
const visionSchema = z.object({
  primary: hex.nullable().catch(null),
  accent: hex.nullable().catch(null),
  estilo: z.string().trim().max(300).nullable().catch(null),
  nombre: z.string().trim().max(200).nullable().catch(null),
});

/** Fetch con timeout que nunca cuelga; devuelve null ante cualquier fallo. */
async function fetchText(url: string): Promise<string | null> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      redirect: "follow",
      headers: {
        "User-Agent": BROWSER_UA,
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "es-AR,es;q=0.9,en;q=0.8",
      },
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

/** Normaliza una URL de entrada (le agrega https:// si falta). */
function normalizeUrl(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;
  try {
    const withProto = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    return new URL(withProto).toString();
  } catch {
    return null;
  }
}

/** Resuelve una URL (posiblemente relativa) contra la base. */
function absolutize(href: string, base: string): string | null {
  try {
    return new URL(href, base).toString();
  } catch {
    return null;
  }
}

function attr(tag: string, name: string): string | null {
  const re = new RegExp(`${name}\\s*=\\s*["']([^"']+)["']`, "i");
  const m = tag.match(re);
  return m ? m[1] : null;
}

type ParsedHtml = {
  themeColor: string | null;
  ogImage: string | null;
  icons: { url: string; size: number }[];
  title: string | null;
  siteName: string | null;
};

function parseHtml(html: string, base: string): ParsedHtml {
  const out: ParsedHtml = {
    themeColor: null,
    ogImage: null,
    icons: [],
    title: null,
    siteName: null,
  };

  // <meta ...>
  const metas = html.match(/<meta\b[^>]*>/gi) ?? [];
  for (const tag of metas) {
    const name = (attr(tag, "name") ?? "").toLowerCase();
    const prop = (attr(tag, "property") ?? "").toLowerCase();
    const content = attr(tag, "content");
    if (!content) continue;
    if (name === "theme-color" && !out.themeColor) {
      const c = content.trim();
      if (/^#[0-9a-fA-F]{3,8}$/.test(c)) out.themeColor = c;
    }
    if ((prop === "og:image" || prop === "og:image:url") && !out.ogImage) {
      out.ogImage = absolutize(content, base);
    }
    if (prop === "og:site_name" && !out.siteName) {
      out.siteName = content.trim();
    }
  }

  // <link rel="icon" | "apple-touch-icon" | "shortcut icon">
  const links = html.match(/<link\b[^>]*>/gi) ?? [];
  for (const tag of links) {
    const rel = (attr(tag, "rel") ?? "").toLowerCase();
    if (!/icon/.test(rel)) continue;
    const href = attr(tag, "href");
    if (!href) continue;
    const abs = absolutize(href, base);
    if (!abs) continue;
    const sizes = attr(tag, "sizes") ?? "";
    const sizeMatch = sizes.match(/(\d+)x(\d+)/i);
    let size = sizeMatch ? Number(sizeMatch[1]) : 0;
    // apple-touch-icon suele ser grande y de buena calidad
    if (/apple-touch-icon/.test(rel) && size === 0) size = 180;
    out.icons.push({ url: abs, size });
  }

  // <title>
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch) out.title = titleMatch[1].trim();

  return out;
}

/** Elige la mejor imagen para mandar a Vision: og:image, si no el icon más grande. */
function bestImage(p: ParsedHtml): string | null {
  if (p.ogImage) return p.ogImage;
  if (p.icons.length === 0) return null;
  const sorted = [...p.icons].sort((a, b) => b.size - a.size);
  return sorted[0].url;
}

/** Descarga una imagen y la devuelve como base64 + media type, o null. */
async function fetchImageAsBase64(
  url: string
): Promise<{ data: string; mediaType: string } | null> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      redirect: "follow",
      headers: { "User-Agent": BROWSER_UA },
    });
    if (!res.ok) return null;
    const ct = (res.headers.get("content-type") ?? "").toLowerCase();
    const allowed: Record<string, string> = {
      "image/jpeg": "image/jpeg",
      "image/jpg": "image/jpeg",
      "image/png": "image/png",
      "image/gif": "image/gif",
      "image/webp": "image/webp",
    };
    // SVG e ICO no los soporta Vision: los salteamos.
    let mediaType = allowed[ct.split(";")[0].trim()];
    if (!mediaType) {
      // Inferir por extensión si el content-type no ayuda.
      if (/\.png(\?|$)/i.test(url)) mediaType = "image/png";
      else if (/\.(jpg|jpeg)(\?|$)/i.test(url)) mediaType = "image/jpeg";
      else if (/\.webp(\?|$)/i.test(url)) mediaType = "image/webp";
      else return null;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.byteLength === 0 || buf.byteLength > 4_500_000) return null; // límite sano
    return { data: buf.toString("base64"), mediaType };
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

/** Le pide a Claude Vision que estime colores, estilo y nombre desde una imagen. */
async function analizarConVision(
  img: { data: string; mediaType: string }
): Promise<z.infer<typeof visionSchema> | null> {
  try {
    const anthropic = getAnthropic();
    const msg = await anthropic.messages.create({
      model: MODEL_AGENT,
      max_tokens: 400,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: img.mediaType as
                  | "image/jpeg"
                  | "image/png"
                  | "image/gif"
                  | "image/webp",
                data: img.data,
              },
            },
            {
              type: "text",
              text:
                "Mirá el logo/captura de esta marca. Devolvé SOLO JSON, sin texto extra ni markdown: " +
                '{ "primary": "#RRGGBB", "accent": "#RRGGBB", "estilo": "breve descripción del estilo visual (moderno/clásico/colorido/minimalista...)", "nombre": "nombre de la marca si se ve" }. ' +
                "Si no podés determinar un color, usá null. Si no ves el nombre, usá null.",
            },
          ],
        },
      ],
    });
    const text = msg.content
      .map((b) => (b.type === "text" ? b.text : ""))
      .join("")
      .trim();
    // Por las dudas: aislar el primer bloque JSON.
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    const parsed = visionSchema.safeParse(JSON.parse(jsonMatch[0]));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

async function extraerDeWeb(webUrl: string): Promise<BrandResult> {
  const url = normalizeUrl(webUrl);
  if (!url) {
    return { ok: false, fuente: "web", motivo: "La URL de la web no es válida." };
  }

  const html = await fetchText(url);
  if (!html) {
    return {
      ok: false,
      fuente: "web",
      motivo: "No pude acceder a la web (no respondió, dio error o tardó demasiado).",
    };
  }

  const parsed = parseHtml(html, url);
  const nombreWeb = parsed.siteName ?? parsed.title ?? null;
  const logoUrl = bestImage(parsed);

  // Sin IA igual devolvemos lo que sacamos del HTML (theme-color, nombre, logo).
  if (!aiAvailable()) {
    const hasAnything = parsed.themeColor || nombreWeb || logoUrl;
    return {
      ok: Boolean(hasAnything),
      primary: parsed.themeColor ?? null,
      accent: null,
      logoUrl,
      estilo: null,
      nombre: nombreWeb,
      fuente: "web",
      motivo: hasAnything
        ? undefined
        : "No encontré colores ni logo en la web, y la IA no está disponible.",
      notas: "IA no disponible: colores/estilo no analizados, solo metadatos de la web.",
    };
  }

  // Con IA: bajamos la mejor imagen y la analizamos con Vision.
  let vision: z.infer<typeof visionSchema> | null = null;
  let notaImg: string | undefined;
  if (logoUrl) {
    const img = await fetchImageAsBase64(logoUrl);
    if (img) {
      vision = await analizarConVision(img);
    } else {
      notaImg =
        "Encontré una imagen pero no la pude analizar (formato no soportado, ej. SVG/ICO, o no se descargó).";
    }
  } else {
    notaImg = "No encontré logo ni og:image en la web.";
  }

  // theme-color del HTML tiene prioridad como primario si Vision no lo dio.
  const primary = vision?.primary ?? parsed.themeColor ?? null;
  const accent = vision?.accent ?? null;
  const nombre = vision?.nombre ?? nombreWeb;

  const ok = Boolean(primary || accent || logoUrl || nombre);
  return {
    ok,
    primary,
    accent,
    logoUrl,
    estilo: vision?.estilo ?? null,
    nombre,
    fuente: "web",
    motivo: ok ? undefined : "No pude deducir colores ni logo de la web.",
    notas: notaImg,
  };
}

/** Extrae el handle de IG de un input flexible (@nombre, url completa, etc.). */
function igHandle(input: string): string | null {
  let s = input.trim();
  if (!s) return null;
  s = s.replace(/^@/, "");
  const m = s.match(/instagram\.com\/([A-Za-z0-9_.]+)/i);
  if (m) return m[1];
  // Si vino solo el handle.
  if (/^[A-Za-z0-9_.]+$/.test(s)) return s;
  return null;
}

async function extraerDeInstagram(igInput: string): Promise<BrandResult> {
  const handle = igHandle(igInput);
  if (!handle) {
    return { ok: false, fuente: "instagram", motivo: "No pude leer el usuario de Instagram." };
  }
  const url = `https://www.instagram.com/${handle}/`;
  const html = await fetchText(url);
  if (!html) {
    return {
      ok: false,
      fuente: "instagram",
      motivo:
        "Instagram no me dejó acceder al perfil (suele pedir login o bloquear pedidos automáticos). Probá con la web del negocio.",
    };
  }

  const parsed = parseHtml(html, url);
  const logoUrl = parsed.ogImage; // foto de perfil pública
  const nombreIg = parsed.siteName ?? parsed.title ?? handle;

  if (!logoUrl) {
    return {
      ok: false,
      fuente: "instagram",
      motivo:
        "No encontré la foto de perfil pública de Instagram (probablemente bloqueado o privado).",
    };
  }

  if (!aiAvailable()) {
    return {
      ok: true,
      primary: null,
      accent: null,
      logoUrl,
      estilo: null,
      nombre: nombreIg,
      fuente: "instagram",
      notas: "IA no disponible: traje la foto de perfil pero no analicé colores/estilo.",
    };
  }

  const img = await fetchImageAsBase64(logoUrl);
  const vision = img ? await analizarConVision(img) : null;

  return {
    ok: true,
    primary: vision?.primary ?? null,
    accent: vision?.accent ?? null,
    logoUrl,
    estilo: vision?.estilo ?? null,
    nombre: vision?.nombre ?? nombreIg,
    fuente: "instagram",
    notas: img
      ? undefined
      : "Traje la foto de perfil pero no la pude analizar (formato no soportado).",
  };
}

/**
 * Punto de entrada. Prioriza la web (más confiable que IG, que suele bloquear).
 * Si la web no da nada usable, cae a Instagram. Nunca tira: ante todo fallo
 * devuelve { ok:false, motivo }.
 */
export async function extraerMarca(opts: {
  web?: string | null;
  instagram?: string | null;
}): Promise<BrandResult> {
  const web = opts.web?.trim() || "";
  const instagram = opts.instagram?.trim() || "";

  if (!web && !instagram) {
    return {
      ok: false,
      motivo: "No hay web ni Instagram cargados para este negocio.",
    };
  }

  if (web) {
    const r = await extraerDeWeb(web);
    if (r.ok) return r;
    // La web falló: si hay IG, lo intentamos como respaldo.
    if (instagram) {
      const ig = await extraerDeInstagram(instagram);
      if (ig.ok) return ig;
      return {
        ...r,
        notas: [r.motivo, ig.motivo].filter(Boolean).join(" · "),
      };
    }
    return r;
  }

  return extraerDeInstagram(instagram);
}
