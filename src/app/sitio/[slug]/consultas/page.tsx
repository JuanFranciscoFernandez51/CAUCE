import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getBazarSite } from "../_lib/bazar-site";
import { BazarShell, BZ } from "../_components/bazar/bazar-shell";
import { ConsultaBazarForm } from "../_components/bazar/consulta-bazar-form";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const site = await getBazarSite(slug);
  return {
    title: site ? `Consultas — ${site.info.nombre}` : "Consultas",
    robots: { index: false, follow: false },
  };
}

export default async function ConsultasPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const site = await getBazarSite(slug);
  if (!site) notFound();
  const { info } = site;

  return (
    <BazarShell info={info}>
      <div className="mx-auto max-w-lg px-4 py-12">
        <div className="text-center">
          <div className="text-4xl">💬</div>
          <h1
            className="mt-3 text-3xl font-extrabold tracking-tight"
            style={{ color: "var(--t-texto)" }}
          >
            Consultanos lo que quieras
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            ¿Buscás algo puntual? ¿Querés saber si llega a tu ciudad? Escribinos y te
            respondemos a la brevedad.
          </p>
        </div>
        <div className="mt-7">
          <ConsultaBazarForm slug={info.slug} />
        </div>
        {info.whatsapp ? (
          <p className="mt-6 text-center text-sm text-gray-500">
            ¿Apurado? Escribinos directo por{" "}
            <a
              href={`https://wa.me/${info.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold hover:underline"
              style={{ color: "var(--tpl, #3FA9A5)" }}
            >
              WhatsApp →
            </a>
          </p>
        ) : null}
      </div>
    </BazarShell>
  );
}
