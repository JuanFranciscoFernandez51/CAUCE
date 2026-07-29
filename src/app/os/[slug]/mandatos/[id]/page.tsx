import { notFound } from "next/navigation";
import { getTenantBySlug } from "@/lib/tenant";
import { esConcesionaria } from "@/lib/conce-server";
import { OperacionDetalle } from "../../_components/conce/operacion-detalle";

export const dynamic = "force-dynamic";

export default async function MandatoDetallePage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant || !esConcesionaria(tenant)) notFound();

  return <OperacionDetalle tenant={tenant} id={id} tipo="MANDATO" />;
}
