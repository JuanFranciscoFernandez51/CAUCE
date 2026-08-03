import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { BLOG_CATEGORIAS } from "@/lib/conce";
import { getConceSite } from "../_lib/conce-site";
import { ConceShell } from "../_components/conce/conce-shell";
import { RC } from "@/lib/conce";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const site = await getConceSite(slug);
  if (!site) return { title: "Blog" };
  return { title: `Blog — ${site.info.nombre}`, robots: { index: false, follow: false } };
}

/**
 * Blog de la concesionaria: 5 categorías (como su web actual) con empty
 * state lindo — los artículos se cargan más adelante desde el admin.
 */
export default async function BlogPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const site = await getConceSite(slug);
  if (!site) notFound();
  const { tenant, info } = site;
  const base = `/sitio/${tenant.slug}`;

  return (
    <ConceShell info={info}>
      <div className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Blog</h1>
        <p className="mt-1 text-sm t-tenue">
          Noticias, consejos y novedades del mundo del auto.
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          {BLOG_CATEGORIAS.map((c) => (
            <span
              key={c}
              className="rounded-full t-card px-4 py-1.5 text-sm font-semibold"
              style={{ border: `1px solid ${RC.borde}` }}
            >
              {c}
            </span>
          ))}
        </div>

        <div
          className="mt-10 rounded-[2.5rem] t-card px-6 py-20 text-center"
          style={{ border: `1px solid ${RC.borde}` }}
        >
          <div className="text-6xl">📰</div>
          <h2 className="mt-4 text-2xl font-extrabold tracking-tight">
            Estamos preparando el primer artículo
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm t-tenue">
            Muy pronto vas a encontrar acá consejos para comprar tu próximo auto, novedades del
            salón y tips de mantenimiento. Mientras tanto, mirá lo que tenemos en stock. 👇
          </p>
          <Link
            href={`${base}/catalogo`}
            className="mt-6 inline-block rounded-full px-7 py-3 text-sm font-bold"
            style={{ backgroundColor: RC.dorado, color: "#0A0A0A" }}
          >
            Ver el catálogo
          </Link>
        </div>
      </div>
    </ConceShell>
  );
}
