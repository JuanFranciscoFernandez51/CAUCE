import { notFound } from "next/navigation";
import { getTenantBySlug } from "@/lib/tenant";
import { esConcesionaria } from "@/lib/conce-server";
import { OperacionNueva } from "../../_components/conce/operacion-nueva";

export default async function NuevoMandatoPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ vehiculo?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const tenant = await getTenantBySlug(slug);
  if (!tenant || !esConcesionaria(tenant)) notFound();

  return <OperacionNueva tenant={tenant} tipo="MANDATO" vehiculoId={sp.vehiculo} />;
}
