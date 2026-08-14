import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getTenantBySlug, tenantBranding, tenantEstilo } from "@/lib/tenant";
import { resolveOsRole, isOsOwner } from "../_components/os-role";
import { ModuleDisabled } from "../_components/module-disabled";
import { BrandingSection } from "../_components/config-panel";
import { ConfigJess, type ConfigJessInicial } from "./config-jess";

export const dynamic = "force-dynamic";

export default async function ConfigPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) notFound();

  const session = await auth();
  const role = session ? await resolveOsRole(session.user.id, tenant.id) : null;
  if (!isOsOwner(role)) {
    return (
      <ModuleDisabled
        moduleLabel="Configuración"
        title="Configuración de la página"
        detail="Solo el dueño de la cuenta puede entrar acá. Pedile acceso si lo necesitás."
      />
    );
  }

  const brandingRaw = tenantBranding(tenant);

  // Template eventos: la configuración completa al estilo de su panel.
  const tplCfg = (tenant.settings as { template?: string } | null)?.template;
  if (tplCfg === "eventos") {
    const st = (tenant.settings ?? {}) as Record<string, unknown>;
    const pl = (st.plantillaCotizacion ?? {}) as { precio?: number; moneda?: string; servicios?: { nombre: string; items: string[] }[]; nota?: string };
    const inicial: ConfigJessInicial = {
      displayName: brandingRaw.displayName,
      eslogan: String(st.eslogan ?? ""),
      email: tenant.email ?? "",
      telefono: tenant.whatsapp ?? "",
      cuit: String(st.cuit ?? ""),
      instagram: String(st.instagram ?? ""),
      direccion: String(st.direccion ?? ""),
      tiposEvento: (st.tiposEvento as string[]) ?? [],
      categoriasProveedores: (st.categoriasProveedores as string[]) ?? ["Catering", "DJ", "Fotografía", "Video", "Flores", "Decoración", "Mobiliario", "Venue", "Transporte", "Pastelería", "Animación", "Otros"],
      categoriasGastos: (st.categoriasGastos as string[]) ?? ["Catering", "Decoración", "Música", "Fotografía", "Flores", "Mobiliario", "Honorarios", "Otros"],
      plantilla: {
        precio: pl.precio ?? 7500,
        moneda: pl.moneda ?? "USD",
        servicios: pl.servicios ?? [],
        nota: pl.nota ?? "",
      },
    };
    return (
      <div className="p-4 sm:p-6">
        <ConfigJess slug={slug} inicial={inicial} />
      </div>
    );
  }


  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Configuración de la página</h1>
        <p className="text-sm text-muted-foreground">
          La identidad de tu sistema: nombre y colores de tu marca. Los cambios se aplican al instante.
        </p>
      </div>
      <BrandingSection
        slug={slug}
        initial={{
          displayName: brandingRaw.displayName,
          primary: brandingRaw.primary,
          accent: brandingRaw.accent,
          estilo: tenantEstilo(tenant),
        }}
      />
    </div>
  );
}
