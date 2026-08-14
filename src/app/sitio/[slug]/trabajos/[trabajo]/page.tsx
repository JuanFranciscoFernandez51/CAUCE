import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTenantBySlug, hasModule } from "@/lib/tenant";
import { JessHeader, JessFooter, jessDatos, JESS_TINTA, JESS_CREMA, JESS_TOPO, JESS_TERRA } from "../../_components/eventos/jess-chrome";
import { BookFotos } from "../../_components/eventos/book-fotos";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string; trabajo: string }> }): Promise<Metadata> {
  const { slug, trabajo } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) return { title: "Trabajo" };
  const t = jessDatos(tenant).st.trabajos?.find((x) => x.id === trabajo);
  return { title: t ? `${t.titulo} — Jess Design` : "Trabajo" };
}

export default async function TrabajoPage({ params }: { params: Promise<{ slug: string; trabajo: string }> }) {
  const { slug, trabajo } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant || !hasModule(tenant, "sitio")) notFound();
  const tpl = (tenant.settings as { template?: string } | null)?.template;
  if (tpl !== "eventos") notFound();

  const { logo, ig, st, base } = jessDatos(tenant);
  const t = st.trabajos?.find((x) => x.id === trabajo);
  if (!t) notFound();
  const otros = (st.trabajos ?? []).filter((x) => x.id !== t.id).slice(0, 3);

  return (
    <div className="min-h-screen" style={{ backgroundColor: JESS_CREMA, color: JESS_TINTA, fontFamily: "var(--font-montserrat)" }}>
      <JessHeader logo={logo} ig={ig} base={base} activa="trabajos" />

      {/* Portada grande con el título encima */}
      <section className="relative overflow-hidden" style={{ maxHeight: "62vh" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={t.portada} alt={t.titulo} className="w-full object-cover" style={{ maxHeight: "62vh" }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(26,24,22,.1) 40%, rgba(26,24,22,.65) 100%)" }} />
        <div className="absolute inset-x-0 bottom-0 pb-10 text-center" style={{ color: JESS_CREMA }}>
          <p className="text-[11px] font-semibold tracking-[0.4em]">{t.tipo.toUpperCase()}</p>
          <h1 className="mt-2 px-6 text-[44px] leading-[1.05] sm:text-[60px]" style={{ fontFamily: "var(--font-italiana)" }}>
            {t.titulo}
          </h1>
        </div>
      </section>

      <section className="mx-auto max-w-[900px] px-6 py-14 text-center">
        <p className="text-[24px]" style={{ fontFamily: "var(--font-pinyon)", color: JESS_TERRA }}>
          la historia
        </p>
        <div className="mx-auto mt-4 max-w-[640px] space-y-4 text-left text-[15px] leading-[1.9] sm:text-center" style={{ color: "#4d463f" }}>
          {t.descripcion.split("\n\n").map((par) => (
            <p key={par.slice(0, 30)}>{par}</p>
          ))}
        </div>
      </section>

      {/* Book de fotos */}
      {t.fotos.length ? (
        <section className="mx-auto max-w-[1200px] px-6 pb-16">
          <BookFotos fotos={t.fotos} alt={t.titulo} />
        </section>
      ) : null}

      {/* Otros trabajos + CTA */}
      <section className="mx-auto max-w-[1200px] px-6 pb-16 text-center">
        {otros.length ? (
          <div className="mb-14">
            <p className="text-[11px] font-semibold tracking-[0.4em]" style={{ color: JESS_TOPO }}>OTROS TRABAJOS</p>
            <div className="mt-6 grid gap-5 sm:grid-cols-3">
              {otros.map((o) => (
                <Link key={o.id} href={`${base}/trabajos/${o.id}`} className="group relative block overflow-hidden bg-white" style={{ aspectRatio: "4 / 3" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={o.portada} alt={o.titulo} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.06]" />
                  <span
                    className="absolute inset-0 flex items-end justify-center pb-5 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                    style={{ background: "linear-gradient(180deg, rgba(26,24,22,0) 40%, rgba(26,24,22,.7) 100%)", color: JESS_CREMA }}
                  >
                    <span className="text-[20px]" style={{ fontFamily: "var(--font-italiana)" }}>{o.titulo}</span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        ) : null}
        <Link
          href={`${base}/trabajos`}
          className="mr-4 inline-block border px-9 py-4 text-[12px] font-semibold tracking-[0.2em] transition hover:opacity-70"
          style={{ borderColor: JESS_TINTA }}
        >
          ← TODOS LOS TRABAJOS
        </Link>
        <a
          href={`${base}#contacto`}
          className="inline-block px-9 py-4 text-[12px] font-semibold tracking-[0.2em] transition hover:opacity-90"
          style={{ backgroundColor: JESS_TINTA, color: JESS_CREMA }}
        >
          QUIERO ALGO ASÍ
        </a>
      </section>

      <JessFooter logo={logo} ig={ig} />
    </div>
  );
}
