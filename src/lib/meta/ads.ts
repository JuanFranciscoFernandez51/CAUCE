import { db } from "@/lib/db";

/**
 * Meta Ads para Cauce, multi-tenant.
 *
 * La lógica viene del módulo de Motos Fernández, que está probado, pero acá
 * cada negocio tiene SU cuenta publicitaria: nada de una cuenta compartida.
 * Todas las funciones reciben el tenant y trabajan con su propia config.
 */

const GRAPH = "https://graph.facebook.com";

export const OBJETIVOS = [
  "OUTCOME_TRAFFIC",
  "OUTCOME_ENGAGEMENT",
  "OUTCOME_LEADS",
  "OUTCOME_SALES",
  "OUTCOME_AWARENESS",
] as const;
export type Objetivo = (typeof OBJETIVOS)[number];

export const OBJETIVO_LABEL: Record<Objetivo, string> = {
  OUTCOME_TRAFFIC: "Llevar gente a la web",
  OUTCOME_ENGAGEMENT: "Que interactúen con la publicación",
  OUTCOME_LEADS: "Conseguir consultas",
  OUTCOME_SALES: "Vender",
  OUTCOME_AWARENESS: "Que conozcan la marca",
};

export const ESTADOS = ["ACTIVE", "PAUSED", "ARCHIVED"] as const;
export type EstadoCampania = (typeof ESTADOS)[number];

export const CTAS = [
  { key: "SHOP_NOW", label: "Comprar ahora" },
  { key: "LEARN_MORE", label: "Más información" },
  { key: "WHATSAPP_MESSAGE", label: "Enviar WhatsApp" },
  { key: "ORDER_NOW", label: "Pedir ahora" },
  { key: "GET_QUOTE", label: "Pedir presupuesto" },
] as const;

export type MetaCuenta = {
  apiVersion: string;
  adAccountId: string;
  token: string;
  pageId: string | null;
  igUserId: string | null;
  pixelId: string | null;
};

/** La cuenta de Meta del negocio, o null si todavía no la conectó. */
export async function cuentaDe(clientId: string): Promise<MetaCuenta | null> {
  const cfg = await db.mktConfig.findFirst({ where: { clientId } });
  if (!cfg?.adAccountId) return null;
  // El System User no expira: es el que conviene para automatizar. Si no está,
  // se cae al token de la página, que sirve mientras esté vigente.
  const token = cfg.adsSystemUserToken ?? cfg.pageAccessToken;
  if (!token) return null;
  return {
    apiVersion: cfg.apiVersion || "v25.0",
    adAccountId: cfg.adAccountId,
    token: descifrar(token),
    pageId: cfg.pageId,
    igUserId: cfg.igUserId,
    pixelId: cfg.pixelId,
  };
}

/** Los tokens se guardan cifrados; acá se resuelve el formato legacy también. */
function descifrar(valor: string): string {
  if (!valor.startsWith("enc:v1:")) return valor;
  try {
    const { descifrarToken } = require("@/lib/crypto-tokens") as { descifrarToken: (v: string) => string };
    return descifrarToken(valor);
  } catch {
    return valor;
  }
}

async function graph<T>(
  cuenta: MetaCuenta,
  ruta: string,
  init?: { method?: string; body?: Record<string, unknown> }
): Promise<T> {
  const url = `${GRAPH}/${cuenta.apiVersion}/${ruta}`;
  const r = await fetch(url, {
    method: init?.method ?? "GET",
    headers: { Authorization: `Bearer ${cuenta.token}`, "Content-Type": "application/json" },
    ...(init?.body ? { body: JSON.stringify(init.body) } : {}),
  });
  const data = (await r.json().catch(() => null)) as { error?: { message?: string } } | null;
  if (!r.ok) throw new Error(data?.error?.message ?? `Meta respondió ${r.status}`);
  return data as T;
}

export type Campania = {
  id: string;
  name: string;
  status: EstadoCampania;
  objective: Objetivo;
  gastado: number;
  impresiones: number;
  clics: number;
  resultados: number;
};

/** Campañas del negocio con lo que gastaron y lo que trajeron. */
export async function listarCampanias(clientId: string): Promise<Campania[]> {
  const cuenta = await cuentaDe(clientId);
  if (!cuenta) return [];
  const res = await graph<{ data?: Array<Record<string, unknown>> }>(
    cuenta,
    `${cuenta.adAccountId}/campaigns?fields=id,name,status,objective,insights{spend,impressions,clicks,actions}&limit=50`
  ).catch(() => null);

  return (res?.data ?? []).map((c) => {
    const ins = ((c.insights as { data?: Array<Record<string, unknown>> } | undefined)?.data ?? [])[0] ?? {};
    const acciones = (ins.actions as Array<{ action_type: string; value: string }> | undefined) ?? [];
    const relevante = acciones.find((a) => /purchase|lead|link_click/.test(a.action_type));
    return {
      id: String(c.id),
      name: String(c.name ?? ""),
      status: (c.status as EstadoCampania) ?? "PAUSED",
      objective: (c.objective as Objetivo) ?? "OUTCOME_TRAFFIC",
      gastado: Number(ins.spend ?? 0),
      impresiones: Number(ins.impressions ?? 0),
      clics: Number(ins.clicks ?? 0),
      resultados: Number(relevante?.value ?? 0),
    };
  });
}

/** Prende o pausa una campaña sin salir del panel. */
export async function cambiarEstado(clientId: string, campaniaId: string, estado: EstadoCampania): Promise<void> {
  const cuenta = await cuentaDe(clientId);
  if (!cuenta) throw new Error("El negocio todavía no conectó su cuenta de Meta");
  await graph(cuenta, campaniaId, { method: "POST", body: { status: estado } });
}

export type NuevaCampania = {
  nombre: string;
  objetivo: Objetivo;
  presupuestoDiario: number; // en pesos
  intereses?: string[];
  edad?: { min: number; max: number };
  ubicaciones?: string[]; // claves de ciudad de Meta
};

/**
 * Crea la campaña pausada. Nunca se activa sola: la enciende el dueño desde
 * el panel cuando revisó el texto y el presupuesto.
 */
export async function crearCampania(clientId: string, datos: NuevaCampania): Promise<{ id: string }> {
  const cuenta = await cuentaDe(clientId);
  if (!cuenta) throw new Error("El negocio todavía no conectó su cuenta de Meta");
  return graph<{ id: string }>(cuenta, `${cuenta.adAccountId}/campaigns`, {
    method: "POST",
    body: {
      name: datos.nombre,
      objective: datos.objetivo,
      status: "PAUSED",
      special_ad_categories: [],
      daily_budget: Math.round(datos.presupuestoDiario * 100), // Meta lo pide en centavos
    },
  });
}

/** Busca intereses para armar el público (autocompletado del wizard). */
export async function buscarIntereses(clientId: string, texto: string): Promise<{ id: string; name: string; audiencia: number }[]> {
  const cuenta = await cuentaDe(clientId);
  if (!cuenta || !texto.trim()) return [];
  const res = await graph<{ data?: Array<Record<string, unknown>> }>(
    cuenta,
    `search?type=adinterest&q=${encodeURIComponent(texto)}&limit=15`
  ).catch(() => null);
  return (res?.data ?? []).map((i) => ({
    id: String(i.id),
    name: String(i.name ?? ""),
    audiencia: Number(i.audience_size_lower_bound ?? 0),
  }));
}
