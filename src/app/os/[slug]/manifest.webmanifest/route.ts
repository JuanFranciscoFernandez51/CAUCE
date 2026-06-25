import { getTenantBySlug, tenantBranding } from "@/lib/tenant";

/**
 * Manifest dinámico por tenant: cada cliente instala SU app, con SU nombre,
 * SU color y SU logo. Scopeado a /os/<slug> para que la PWA sea independiente
 * por tenant. Sin librerías: route handler nativo de Next 16.
 */
export const dynamic = "force-dynamic";

/** ¿Es una URL absoluta de Cloudinary que sirve como ícono? */
function isCloudinaryUrl(url: string): boolean {
  return /^https:\/\/res\.cloudinary\.com\//.test(url);
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) {
    return new Response("Not found", { status: 404 });
  }

  const branding = tenantBranding(tenant);
  const base = `/os/${slug}`;

  // Íconos: si el tenant tiene logo en Cloudinary lo usamos (sirve para todos
  // los tamaños porque Cloudinary entrega cualquier resolución). Si no, el
  // ícono por defecto de Cauce (/icon.svg, vectorial → cualquier tamaño).
  const icons = isCloudinaryUrl(branding.logo)
    ? [
        {
          src: branding.logo,
          sizes: "192x192",
          type: "image/png",
          purpose: "any",
        },
        {
          src: branding.logo,
          sizes: "512x512",
          type: "image/png",
          purpose: "any",
        },
        {
          src: branding.logo,
          sizes: "512x512",
          type: "image/png",
          purpose: "maskable",
        },
      ]
    : [
        {
          src: "/icon.svg",
          sizes: "any",
          type: "image/svg+xml",
          purpose: "any",
        },
        {
          src: "/icon.svg",
          sizes: "any",
          type: "image/svg+xml",
          purpose: "maskable",
        },
      ];

  const manifest = {
    name: branding.displayName,
    short_name: branding.displayName,
    description: `Sistema de gestión de ${branding.displayName} — Powered by Cauce.`,
    lang: "es-AR",
    dir: "ltr",
    start_url: base,
    scope: base,
    display: "standalone",
    orientation: "portrait",
    theme_color: branding.primary,
    background_color: branding.primary,
    icons,
  };

  return new Response(JSON.stringify(manifest), {
    status: 200,
    headers: {
      "Content-Type": "application/manifest+json; charset=utf-8",
      // Cache corto: si el cliente cambia su branding, se refleja pronto.
      "Cache-Control": "public, max-age=0, s-maxage=3600, must-revalidate",
    },
  });
}
