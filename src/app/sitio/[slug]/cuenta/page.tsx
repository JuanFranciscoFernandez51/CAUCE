import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getBazarSite } from "../_lib/bazar-site";
import { BazarShell } from "../_components/bazar/bazar-shell";
import { CuentaPage } from "../_components/bazar/cuenta-page";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const site = await getBazarSite(slug);
  return {
    title: site ? `Mi cuenta — ${site.info.nombre}` : "Mi cuenta",
    robots: { index: false, follow: false },
  };
}

export default async function CuentaRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const site = await getBazarSite(slug);
  if (!site) notFound();
  return (
    <BazarShell info={site.info}>
      <CuentaPage slug={site.tenant.slug} />
    </BazarShell>
  );
}
