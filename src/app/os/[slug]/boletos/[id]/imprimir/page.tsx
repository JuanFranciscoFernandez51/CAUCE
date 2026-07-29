import { notFound } from "next/navigation";
import { getTenantBySlug } from "@/lib/tenant";
import { esConcesionaria } from "@/lib/conce-server";
import { OperacionImprimir } from "../../../_components/conce/operacion-imprimir";

export default async function ImprimirBoletoPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant || !esConcesionaria(tenant)) notFound();

  return <OperacionImprimir tenant={tenant} id={id} tipo="BOLETO" />;
}
