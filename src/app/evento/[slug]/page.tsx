import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getTenantBySlug, hasModule, tenantBranding } from "@/lib/tenant";
import { EventoPublico } from "./evento-publico";

/**
 * Página pública del evento activo: ranking en vivo + inscripción.
 * Pensada para proyectar en pantalla y compartir por WhatsApp/IG.
 */
export default async function EventoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant || !hasModule(tenant, "eventos")) notFound();

  const evento = await db.evento.findFirst({
    where: { clientId: tenant.id, activo: true },
    select: { id: true },
  });
  if (!evento) notFound();

  const branding = tenantBranding(tenant);
  const themeVars = {
    "--primary": branding.primary,
    "--primary-foreground": "#ffffff",
    "--primary-soft": `color-mix(in srgb, ${branding.primary} 16%, transparent)`,
    "--accent": branding.accent,
    "--ring": branding.primary,
  } as React.CSSProperties;

  return (
    <div style={themeVars} className="min-h-screen bg-background text-foreground">
      <EventoPublico slug={tenant.slug} negocio={branding.displayName} />
    </div>
  );
}
