import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { conceSettings } from "@/lib/conce-server";
import { getConceSite } from "../_lib/conce-site";
import { ConceShell } from "../_components/conce/conce-shell";
import { RC } from "@/lib/conce";
import { Reveal } from "../_components/conce/reveal";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const site = await getConceSite(slug);
  if (!site) return { title: "Nosotros" };
  return {
    title: `Nosotros — ${site.info.nombre}`,
    robots: { index: false, follow: false },
  };
}

export default async function NosotrosPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const site = await getConceSite(slug);
  if (!site) notFound();
  const { tenant, info } = site;
  const s = conceSettings(tenant);
  const base = `/sitio/${tenant.slug}`;

  return (
    <ConceShell info={info}>
      {/* Hero */}
      <section className="px-3 pt-4">
        <div
          className="mx-auto max-w-6xl rounded-[2.5rem] px-6 py-16 text-center sm:py-20"
          style={{ backgroundColor: RC.negro }}
        >
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: RC.dorado }}>
            Desde 2008 · Bahía Blanca
          </p>
          <h1 className="mx-auto mt-3 max-w-2xl text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            Sobre {info.nombre}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-gray-400">
            Tu concesionaria de confianza con más de 15 años de experiencia en la venta de
            vehículos nuevos y usados.
          </p>
        </div>
      </section>

      {/* Números */}
      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(s.nosotros?.numeros ?? []).map((n, i) => (
            <Reveal key={n.label} delay={i * 80}>
              <div className="rounded-3xl bg-white p-6 text-center shadow-sm" style={{ border: `1px solid ${RC.borde}` }}>
                <p className="text-4xl font-extrabold tracking-tight" style={{ color: RC.doradoTexto }}>
                  {n.valor}
                </p>
                <p className="mt-1 text-sm font-semibold text-gray-600">{n.label}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Historia */}
      <section className="mx-auto max-w-3xl px-4 py-6">
        <Reveal>
          <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Nuestra historia</h2>
          <div className="mt-4 space-y-4 text-[15px] leading-relaxed text-gray-600">
            {(s.nosotros?.historia ?? "").split("\n\n").map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </Reveal>
      </section>

      {/* Valores */}
      {s.nosotros?.valores?.length ? (
        <section className="mx-auto max-w-6xl px-4 py-8">
          <div className="grid gap-3 sm:grid-cols-3">
            {s.nosotros.valores.map((v, i) => {
              const nombre = typeof v === "string" ? v : v.nombre;
              const texto = typeof v === "string" ? null : v.texto;
              return (
                <Reveal key={nombre} delay={i * 80}>
                  <div className="rounded-3xl p-6" style={{ backgroundColor: RC.doradoSuave }}>
                    <p className="font-bold">{nombre}</p>
                    {texto ? <p className="mt-1 text-sm text-gray-600">{texto}</p> : null}
                  </div>
                </Reveal>
              );
            })}
          </div>
        </section>
      ) : null}

      {/* Visitanos */}
      <section className="mx-auto max-w-6xl px-4 py-10">
        <Reveal>
          <div className="rounded-[2.5rem] px-6 py-12 text-center" style={{ backgroundColor: RC.negro }}>
            <h2 className="text-2xl font-extrabold text-white sm:text-3xl">Vení a conocernos</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-gray-400">
              {(info.sucursales ?? []).map((su) => su.direccion).join(" · ")}
              {info.horarios ? ` — ${info.horarios}` : ""}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                href={`${base}/catalogo`}
                className="rounded-full px-6 py-3 text-sm font-bold"
                style={{ backgroundColor: RC.dorado, color: "#0A0A0A" }}
              >
                Ver el catálogo
              </Link>
              <Link
                href={`${base}/contacto`}
                className="rounded-full border border-white/30 px-6 py-3 text-sm font-bold text-white hover:bg-white/10"
              >
                Contactanos
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    </ConceShell>
  );
}
