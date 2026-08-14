import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getTenantBySlug, hasModule } from "@/lib/tenant";
import { JessHeader, JessFooter, jessDatos, JESS_TINTA, JESS_CREMA, JESS_TOPO, JESS_TERRA } from "../_components/eventos/jess-chrome";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const tenant = await getTenantBySlug(slug);
  const nombre = ((tenant?.branding as { displayName?: string } | null)?.displayName) ?? "Nuestros trabajos";
  return { title: `Nuestros trabajos — ${nombre}` };
}

// Arranca con la foto que eligió Fran; el resto sale de las publicaciones del panel.
const FOTOS_BASE = [
  { url: "https://res.cloudinary.com/dgtlyzyra/image/upload/v1786728002/jessdesign/hero-abrazo.png", texto: "Mi trabajo empieza mucho antes del evento. Y termina cuando vos me decís que fue perfecto." },
];

export default async function TrabajosPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant || !hasModule(tenant, "sitio")) notFound();
  const tpl = (tenant.settings as { template?: string } | null)?.template;
  if (tpl !== "eventos") notFound();

  const { logo, ig, st, base } = jessDatos(tenant);

  // Fotos: las fijas de settings + lo que suban a Publicaciones en el panel.
  const pubs = await db.bazarPublicacion.findMany({
    where: { clientId: tenant.id },
    orderBy: { createdAt: "desc" },
    take: 40,
  });
  const dePanel = pubs.flatMap((p) => {
    const fotos = (p.fotos as string[] | null) ?? [];
    return fotos.map((url) => ({ url, texto: p.caption || undefined }));
  });
  const fotos = [...(st.fotosTrabajos ?? []), ...dePanel, ...FOTOS_BASE]
    .filter((f, i, arr) => arr.findIndex((x) => x.url === f.url) === i);

  return (
    <div className="min-h-screen" style={{ backgroundColor: JESS_CREMA, color: JESS_TINTA, fontFamily: "var(--font-montserrat)" }}>
      <JessHeader logo={logo} ig={ig} base={base} activa="trabajos" />

      <section className="mx-auto max-w-[1200px] px-6 py-16 sm:py-20">
        <div className="text-center">
          <p className="text-[11px] font-semibold tracking-[0.4em]" style={{ color: JESS_TOPO }}>NUESTROS TRABAJOS</p>
          <h1 className="mt-4 text-[48px] leading-[1.05] sm:text-[64px]" style={{ fontFamily: "var(--font-italiana)" }}>
            Eventos que cuentan historias
          </h1>
          <p className="mt-4 text-[26px]" style={{ fontFamily: "var(--font-pinyon)", color: JESS_TERRA }}>
            con identidad propia
          </p>
        </div>

        <div className="mt-12 columns-1 gap-5 sm:columns-2 lg:columns-3 [&>figure]:mb-5">
          {fotos.map((f) => (
            <figure key={f.url} className="break-inside-avoid bg-white p-3 pb-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={f.url} alt={f.texto ?? "Trabajo de Jess Design"} className="w-full object-cover" />
              {f.texto ? (
                <figcaption className="mt-3 px-1 text-[13px] leading-relaxed" style={{ color: "#6d645b" }}>
                  {f.texto}
                </figcaption>
              ) : null}
            </figure>
          ))}
        </div>

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
