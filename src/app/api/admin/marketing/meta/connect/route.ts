import { NextResponse } from "next/server";
import { guard } from "../../../_utils";
import { META_API_VERSION } from "@/lib/marketing/meta";

/**
 * Redirige al diálogo OAuth de Meta.
 * Scopes orgánicos por default; ?withAds=1 suma los de Marketing API
 * (pedirlos sin tener la app aprobada rebota "Invalid Scopes" — por eso van separados).
 */
const SCOPES_ORGANICO = [
  "pages_show_list",
  "pages_read_engagement",
  "pages_manage_posts",
  "instagram_basic",
  "instagram_content_publish",
  "business_management",
];
const SCOPES_ADS = ["ads_management", "ads_read", "pages_manage_ads"];

export async function GET(req: Request) {
  const g = await guard();
  if (g) return g;
  const appId = process.env.META_APP_ID;
  if (!appId) {
    return NextResponse.json(
      { error: "Falta META_APP_ID en las variables de entorno" },
      { status: 503 }
    );
  }
  const url = new URL(req.url);
  const withAds = url.searchParams.get("withAds") === "1";
  const base = process.env.META_REDIRECT_BASE ?? "https://cauce-arg.vercel.app";
  const redirectUri = `${base}/api/admin/marketing/meta/callback`;

  const scopes = withAds ? [...SCOPES_ORGANICO, ...SCOPES_ADS] : SCOPES_ORGANICO;
  const dialog = new URL(`https://www.facebook.com/${META_API_VERSION}/dialog/oauth`);
  dialog.searchParams.set("client_id", appId);
  dialog.searchParams.set("redirect_uri", redirectUri);
  dialog.searchParams.set("scope", scopes.join(","));
  dialog.searchParams.set("response_type", "code");
  dialog.searchParams.set("auth_type", "rerequest");
  return NextResponse.redirect(dialog);
}
