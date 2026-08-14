import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getTenantBySlug } from "@/lib/tenant";
import { MobiliarioEditor, type SectorCatalogo, type ItemElegido } from "./mobiliario-editor";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mobiliario" };

/** Presupuesto de mobiliario del evento, como la pantalla de su panel. */
export default async function MobiliarioPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) notFound();
  const evento = await db.eventoOrg.findFirst({ where: { id, clientId: tenant.id } });
  if (!evento) notFound();

  const catalogo = ((tenant.settings as { mobiliario?: SectorCatalogo[] } | null)?.mobiliario) ?? [];
  const elegidos = (evento.mobiliario as ItemElegido[]) ?? [];
  const logo = ((tenant.branding as { logo?: string } | null)?.logo) ?? null;

  return (
    <MobiliarioEditor
      slug={slug}
      eventoId={evento.id}
      eventoNombre={evento.nombre}
      catalogo={catalogo}
      inicial={elegidos}
      logo={logo}
      instagram={((tenant.settings as { instagram?: string } | null)?.instagram) ?? "jessdesign.bb"}
    />
  );
}
