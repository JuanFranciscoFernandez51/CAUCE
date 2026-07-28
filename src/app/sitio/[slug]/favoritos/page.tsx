import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getConceSite } from "../_lib/conce-site";
import { ConceShell } from "../_components/conce/conce-shell";
import { FavoritosList } from "../_components/conce/favoritos-list";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const site = await getConceSite(slug);
  if (!site) return { title: "Favoritos" };
  return { title: `Favoritos — ${site.info.nombre}`, robots: { index: false, follow: false } };
}

export default async function FavoritosPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const site = await getConceSite(slug);
  if (!site) notFound();

  return (
    <ConceShell info={site.info}>
      <div className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">❤️ Tus favoritos</h1>
        <p className="mt-1 text-sm text-gray-500">
          Los vehículos que marcaste quedan guardados en este dispositivo.
        </p>
        <div className="mt-8">
          <FavoritosList slug={site.tenant.slug} />
        </div>
      </div>
    </ConceShell>
  );
}
