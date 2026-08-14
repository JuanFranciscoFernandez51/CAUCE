import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getTenantBySlug, hasModule } from "@/lib/tenant";
import { Reveal } from "../_components/conce/reveal";
import { JessHeader, JessFooter, jessDatos, JESS_TINTA, JESS_CREMA, JESS_TOPO, JESS_TERRA, type JessTrabajo } from "../_components/eventos/jess-chrome";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const tenant = await getTenantBySlug(slug);
  const nombre = ((tenant?.branding as { displayName?: string } | null)?.displayName) ?? "Nuestros trabajos";
  return { title: `Nuestros trabajos — ${nombre}` };
}

export default async function TrabajosPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant || !hasModule(tenant, "sitio")) notFound();
  const tpl = (tenant.settings as { template?: string } | null)?.template;
  if (tpl !== "eventos") notFound();

  const { logo, ig, st, base } = jessDatos(tenant);
  const trabajos = st.trabajos ?? [];

  // Momentos sueltos: lo que suben a Publicaciones en el panel.
  const pubs = await db.bazarPublicacion.findMany({
    where: { clientId: tenant.id },
    orderBy: { createdAt: "desc" },
    take: 24,
  });
  const enTrabajos = new Set(trabajos.flatMap((t) => [t.portada, ...t.fotos]));
  const momentos = pubs
    .flatMap((p) => ((p.fotos as string[] | null) ?? []).map((url) => ({ url, texto: p.caption || undefined })))
    .filter((f, i, arr) => !enTrabajos.has(f.url) && arr.findIndex((x) => x.url === f.url) === i);

  return (
    <div className="min-h-screen" style={{ backgroundColor: JESS_CREMA, color: JESS_TINTA, fontFamily: "var(--font-montserrat)" }}>
      <JessHeader logo={logo} ig={ig} base={base} activa="trabajos" />

      <section className="mx-auto max-w-[1200px] px-6 py-10 sm:py-20">
        <Reveal className="text-center">
          <p className="text-[11px] font-semibold tracking-[0.4em]" style={{ color: JESS_TOPO }}>NUESTROS TRABAJOS</p>
          <h1 className="mt-4 text-[34px] leading-[1.05] sm:text-[64px]" style={{ fontFamily: "var(--font-italiana)" }}>
            Eventos que cuentan historias
          </h1>
          <p className="mt-4 text-[26px]" style={{ fontFamily: "var(--font-pinyon)", color: JESS_TERRA }}>
            con identidad propia
          </p>
        </Reveal>

        {/* Portadas estilo portfolio: en hover la foto respira y aparece de qué es */}
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {trabajos.map((t, i) => (
            <Reveal key={t.id} delay={i * 90}>
            <Link
              href={`${base}/trabajos/${t.id}`}
              className="group relative block overflow-hidden bg-white"
              style={{ aspectRatio: "4 / 5" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={t.portada}
                alt={t.titulo}
                className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.06]"
              />
              {/* En el celu no hay hover: el titulo va fijo sobre la portada */}
              <span
                className="absolute inset-x-0 bottom-0 flex flex-col items-center pb-4 pt-10 text-center sm:hidden"
                style={{ background: "linear-gradient(180deg, rgba(26,24,22,0) 0%, rgba(26,24,22,.72) 100%)", color: JESS_CREMA }}
              >
                <span className="text-[9px] font-semibold tracking-[0.3em]">{t.tipo.toUpperCase()}</span>
                <span className="mt-1 px-4 text-[22px] leading-tight" style={{ fontFamily: "var(--font-italiana)" }}>
                  {t.titulo}
                </span>
              </span>
              <span
                className="absolute inset-0 hidden flex-col items-center justify-end pb-10 text-center opacity-0 transition-opacity duration-300 group-hover:opacity-100 sm:flex"
                style={{ background: "linear-gradient(180deg, rgba(26,24,22,0) 30%, rgba(26,24,22,.72) 100%)", color: JESS_CREMA }}
              >
                <span className="text-[10px] font-semibold tracking-[0.4em]">{t.tipo.toUpperCase()}</span>
                <span className="mt-2 px-6 text-[30px] leading-tight" style={{ fontFamily: "var(--font-italiana)" }}>
                  {t.titulo}
                </span>
                <span className="mt-3 border-b pb-0.5 text-[10px] tracking-[0.3em]" style={{ borderColor: "rgba(237,232,222,.5)" }}>
                  VER TRABAJO
                </span>
              </span>
            </Link>
            </Reveal>
          ))}
        </div>

        {momentos.length ? (
          <div className="mt-20">
            <p className="text-center text-[11px] font-semibold tracking-[0.4em]" style={{ color: JESS_TOPO }}>MOMENTOS</p>
            <div className="mt-8 columns-1 gap-5 sm:columns-2 lg:columns-3 [&>figure]:mb-5">
              {momentos.map((f) => (
                <figure key={f.url} className="break-inside-avoid overflow-hidden bg-white p-3 pb-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={f.url} alt={f.texto ?? "Jess Design"} className="w-full object-cover transition-transform duration-500 hover:scale-[1.03]" />
                  {f.texto ? (
                    <figcaption className="mt-3 px-1 text-[13px] leading-relaxed" style={{ color: "#6d645b" }}>{f.texto}</figcaption>
                  ) : null}
                </figure>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-14 text-center">
          <p className="text-[14px]" style={{ color: JESS_TOPO }}>
            Muchos más en{" "}
            <a href={`https://www.instagram.com/${ig}/`} target="_blank" rel="noreferrer" className="font-semibold underline underline-offset-4 transition hover:opacity-60" style={{ color: JESS_TINTA }}>
              @{ig}
            </a>
          </p>
          <a
            href={`${base}#contacto`}
            className="mt-6 inline-block px-9 py-4 text-[12px] font-semibold tracking-[0.2em] transition hover:opacity-90"
            style={{ backgroundColor: JESS_TINTA, color: JESS_CREMA }}
          >
            QUIERO ALGO ASÍ
          </a>
        </div>
      </section>

      <JessFooter logo={logo} ig={ig} />
    </div>
  );
}
