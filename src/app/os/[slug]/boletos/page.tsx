import { notFound } from "next/navigation";
import { getTenantBySlug } from "@/lib/tenant";
import { esConcesionaria } from "@/lib/conce-server";
import {
  OperacionesLista,
  type OperacionesSP,
} from "../_components/conce/operaciones-lista";

export const dynamic = "force-dynamic";

/** Módulo BOLETOS: lista propia, numeración propia y PDF propio. */
export default async function BoletosPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<OperacionesSP>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const tenant = await getTenantBySlug(slug);
  if (!tenant || !esConcesionaria(tenant)) notFound();

  return <OperacionesLista tenant={tenant} tipo="BOLETO" sp={sp} />;
}
