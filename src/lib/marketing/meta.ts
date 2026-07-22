import { db } from "@/lib/db";
import { encrypt, decrypt } from "@/lib/crypto";

/**
 * Cliente de Meta Graph API para el marketing de Cauce.
 * Config única (MktConfig id="default"), token de página cifrado en DB.
 */

export const META_API_VERSION = process.env.META_API_VERSION ?? "v25.0";
const GRAPH = "https://graph.facebook.com";

export type MktConfigView = {
  connected: boolean;
  pageId: string | null;
  pageName: string | null;
  igUserId: string | null;
  igUsername: string | null;
  expiresAt: Date | null;
  scope: string | null;
  adAccountId: string | null;
  adsReady: boolean;
  apiVersion: string;
};

export async function getMktConfig() {
  return db.mktConfig.findUnique({ where: { id: "default" } });
}

export async function getMktConfigView(): Promise<MktConfigView> {
  const c = await getMktConfig();
  const scopes = (c?.scope ?? "").split(",").map((s) => s.trim());
  return {
    connected: Boolean(c?.pageAccessToken && c?.igUserId),
    pageId: c?.pageId ?? null,
    pageName: c?.pageName ?? null,
    igUserId: c?.igUserId ?? null,
    igUsername: c?.igUsername ?? null,
    expiresAt: c?.expiresAt ?? null,
    scope: c?.scope ?? null,
    adAccountId: c?.adAccountId ?? null,
    adsReady:
      Boolean(c?.adAccountId) &&
      scopes.includes("ads_management") &&
      scopes.includes("ads_read"),
    apiVersion: c?.apiVersion ?? META_API_VERSION,
  };
}

/** Token de página descifrado, o null si no hay conexión. */
export async function getPageToken(): Promise<string | null> {
  const c = await getMktConfig();
  if (!c?.pageAccessToken) return null;
  try {
    return decrypt(c.pageAccessToken);
  } catch {
    return null; // rotó ENCRYPTION_KEY → hay que reconectar
  }
}

export async function saveMktConfig(data: {
  userId?: string;
  userName?: string;
  pageId?: string;
  pageName?: string;
  pageAccessToken?: string; // en claro; se cifra acá
  igUserId?: string | null;
  igUsername?: string | null;
  expiresAt?: Date | null;
  scope?: string;
  adAccountId?: string;
  businessId?: string | null;
}) {
  const { pageAccessToken, ...rest } = data;
  const payload = {
    ...rest,
    ...(pageAccessToken ? { pageAccessToken: encrypt(pageAccessToken) } : {}),
  };
  return db.mktConfig.upsert({
    where: { id: "default" },
    create: { id: "default", ...payload },
    update: payload,
  });
}

// ── Llamadas Graph ────────────────────────────────────────────────────────

export class MetaError extends Error {
  code?: number;
  subcode?: number;
  constructor(message: string, code?: number, subcode?: number) {
    super(message);
    this.code = code;
    this.subcode = subcode;
  }
}

async function call(
  method: "GET" | "POST" | "DELETE",
  path: string,
  params: Record<string, unknown>,
  token: string
): Promise<Record<string, unknown>> {
  const version = (await getMktConfig())?.apiVersion ?? META_API_VERSION;
  const url = new URL(`${GRAPH}/${version}${path}`);
  let init: RequestInit;
  if (method === "GET" || method === "DELETE") {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    }
    url.searchParams.set("access_token", token);
    init = { method };
  } else {
    const body: Record<string, unknown> = { ...params, access_token: token };
    init = {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    };
  }
  const res = await fetch(url, init);
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok || json.error) {
    const err = (json.error ?? {}) as {
      message?: string;
      code?: number;
      error_subcode?: number;
    };
    throw new MetaError(
      interpretarError(err.code, err.error_subcode, err.message),
      err.code,
      err.error_subcode
    );
  }
  return json;
}

export const graphGet = (path: string, params: Record<string, unknown>, token: string) =>
  call("GET", path, params, token);
export const graphPost = (path: string, params: Record<string, unknown>, token: string) =>
  call("POST", path, params, token);

/** Traduce los errores frecuentes de Meta a castellano accionable. */
function interpretarError(code?: number, subcode?: number, raw?: string): string {
  if (code === 190) return "El token de Meta venció — reconectá la cuenta desde Marketing.";
  if (code === 100 && subcode === 2207052)
    return "Instagram rechazó la imagen (tiene que ser JPG público, relación 4:5 a 1.91:1).";
  if (code === 100 && subcode === 1487194)
    return "La cuenta de Instagram no está vinculada a la cuenta publicitaria.";
  if (code === 100 && subcode === 1487390)
    return "La app de Meta está en modo desarrollo — hay que pasarla a Live (App Review).";
  if (code === 100 && subcode === 463) return "Media inválida: formato o relación de aspecto.";
  if (code === 100 && subcode === 33)
    return "Instagram descartó la foto al subirla (¿URL pública? ¿JPG? ¿aspecto 4:5–1.91:1?).";
  return raw ?? "Error de Meta desconocido";
}

/**
 * Espera a que un container de media IG esté listo.
 * GOTCHA: los únicos fields válidos son status_code y status — pedir otro rompe.
 */
export async function waitForContainer(
  creationId: string,
  token: string,
  timeoutMs = 60_000
): Promise<void> {
  const start = Date.now();
  for (;;) {
    const r = (await graphGet(`/${creationId}`, { fields: "status_code,status" }, token)) as {
      status_code?: string;
      status?: string;
    };
    if (r.status_code === "FINISHED") return;
    if (r.status_code === "ERROR") {
      throw new MetaError(`Instagram rechazó la media: ${r.status ?? "sin detalle"}`);
    }
    if (Date.now() - start > timeoutMs) {
      throw new MetaError("Timeout esperando que Instagram procese la media");
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
}

/** Fuerza JPG 4:5 con padding via transformación Cloudinary (IG no recorta). */
export function igFriendly(url: string): string {
  if (!url.includes("/upload/")) return url;
  return url.replace("/upload/", "/upload/f_jpg,q_auto:good,w_1080,h_1350,c_pad,b_rgb:0b1220/");
}
