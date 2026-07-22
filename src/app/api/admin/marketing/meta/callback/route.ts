import { NextResponse } from "next/server";
import { guard } from "../../../_utils";
import { META_API_VERSION, saveMktConfig } from "@/lib/marketing/meta";

const GRAPH = `https://graph.facebook.com/${META_API_VERSION}`;

async function get(path: string, params: Record<string, string>) {
  const url = new URL(`${GRAPH}${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url);
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok || json.error) {
    const err = json.error as { message?: string } | undefined;
    throw new Error(err?.message ?? `Meta devolvió ${res.status} en ${path}`);
  }
  return json;
}

/**
 * Callback OAuth: code → user token → long-lived → page token → IG business.
 * Llega como navegación del navegador del admin (con sesión).
 */
export async function GET(req: Request) {
  const g = await guard();
  if (g) return g;

  const url = new URL(req.url);
  const backTo = new URL("/admin/marketing", url.origin);
  const code = url.searchParams.get("code");
  const fbError = url.searchParams.get("error_description") ?? url.searchParams.get("error");
  if (!code) {
    backTo.searchParams.set("meta_error", fbError ?? "Meta no devolvió el código");
    return NextResponse.redirect(backTo);
  }

  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  if (!appId || !appSecret) {
    backTo.searchParams.set("meta_error", "Faltan META_APP_ID / META_APP_SECRET");
    return NextResponse.redirect(backTo);
  }
  const base = process.env.META_REDIRECT_BASE ?? "https://cauce-arg.vercel.app";
  const redirectUri = `${base}/api/admin/marketing/meta/callback`;

  try {
    // 1. code → short-lived token
    const shortTok = (await get("/oauth/access_token", {
      client_id: appId,
      client_secret: appSecret,
      code,
      redirect_uri: redirectUri,
    })) as { access_token: string };

    // 2. → long-lived (~60 días)
    const longTok = (await get("/oauth/access_token", {
      grant_type: "fb_exchange_token",
      client_id: appId,
      client_secret: appSecret,
      fb_exchange_token: shortTok.access_token,
    })) as { access_token: string; expires_in?: number };
    const userToken = longTok.access_token;

    // 3. Usuario + página (con fallback vía Business Manager)
    const me = (await get("/me", { fields: "id,name", access_token: userToken })) as {
      id: string;
      name: string;
    };
    type Page = { id: string; name: string; access_token?: string };
    let pages =
      ((await get("/me/accounts", { access_token: userToken })) as { data?: Page[] }).data ?? [];
    if (pages.length === 0) {
      const bizs =
        ((await get("/me/businesses", { access_token: userToken })) as { data?: { id: string }[] })
          .data ?? [];
      for (const b of bizs) {
        for (const edge of ["owned_pages", "client_pages"]) {
          try {
            const r = (await get(`/${b.id}/${edge}`, {
              access_token: userToken,
              fields: "id,name,access_token",
            })) as { data?: Page[] };
            pages.push(...(r.data ?? []));
          } catch {
            // edge puede no existir según permisos
          }
        }
      }
      pages = pages.filter((p, i, arr) => arr.findIndex((x) => x.id === p.id) === i);
    }
    const page = pages[0];
    if (!page?.access_token) {
      // Diagnóstico: qué permisos otorgó realmente este login y qué vio Meta.
      let detalle = "";
      try {
        const dbg = (await get("/debug_token", {
          input_token: userToken,
          access_token: `${appId}|${appSecret}`,
        })) as { data?: { scopes?: string[] } };
        const scopes = dbg.data?.scopes ?? [];
        const bizs =
          (
            (await get("/me/businesses", { access_token: userToken, fields: "id,name" })) as {
              data?: { id: string; name: string }[];
            }
          ).data ?? [];
        // Qué páginas viven dentro de cada negocio (aunque la app no tenga acceso).
        const enNegocios: string[] = [];
        for (const b of bizs) {
          for (const edge of ["owned_pages", "client_pages"]) {
            try {
              const r = (await get(`/${b.id}/${edge}`, {
                access_token: userToken,
                fields: "id,name",
              })) as { data?: { id: string; name: string }[] };
              for (const p of r.data ?? []) enNegocios.push(`${p.name} (${edge})`);
            } catch {
              enNegocios.push(`${b.name}/${edge}: sin acceso`);
            }
          }
        }
        detalle = ` [permisos otorgados: ${scopes.join(", ") || "ninguno"} · páginas visibles: ${pages.length} · negocios: ${bizs.map((b) => b.name).join(", ") || "0"} · páginas en negocios: ${enNegocios.join(" | ") || "ninguna"}]`;
      } catch (dbgErr) {
        detalle = ` [diagnóstico falló: ${dbgErr instanceof Error ? dbgErr.message : "?"}]`;
      }
      throw new Error(`No se encontró ninguna página de Facebook con token.${detalle}`);
    }

    // 4. IG Business vinculada a la página
    const igInfo = (await get(`/${page.id}`, {
      fields: "instagram_business_account{id,username}",
      access_token: page.access_token,
    })) as { instagram_business_account?: { id: string; username: string } };

    // 5. Scopes reales aprobados
    let scope = "";
    let expiresAt: Date | null = null;
    try {
      const dbg = (await get("/debug_token", {
        input_token: userToken,
        access_token: `${appId}|${appSecret}`,
      })) as { data?: { scopes?: string[]; data_access_expires_at?: number } };
      scope = (dbg.data?.scopes ?? []).join(",");
      if (dbg.data?.data_access_expires_at) {
        expiresAt = new Date(dbg.data.data_access_expires_at * 1000);
      }
    } catch {
      // best-effort
    }

    await saveMktConfig({
      userId: me.id,
      userName: me.name,
      pageId: page.id,
      pageName: page.name,
      pageAccessToken: page.access_token,
      igUserId: igInfo.instagram_business_account?.id ?? null,
      igUsername: igInfo.instagram_business_account?.username ?? null,
      expiresAt,
      scope,
    });

    backTo.searchParams.set("meta_ok", "1");
    return NextResponse.redirect(backTo);
  } catch (e) {
    backTo.searchParams.set("meta_error", e instanceof Error ? e.message : "Error conectando");
    return NextResponse.redirect(backTo);
  }
}
