import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTenantBySlug, hasModule } from "@/lib/tenant";
import { Reveal } from "../_components/conce/reveal";
import { JessHeader, JessFooter, jessDatos, JESS_TINTA, JESS_CREMA, JESS_TOPO, JESS_TERRA } from "../_components/eventos/jess-chrome";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const tenant = await getTenantBySlug(slug);
  const nombre = ((tenant?.branding as { displayName?: string } | null)?.displayName) ?? "Conócenos";
  return { title: `Conócenos — ${nombre}` };
}

// El texto lo escribió Jess (presentación de su Instagram); se respeta tal cual.
const PARRAFOS = [
  "Soy wedding planner y ambientadora. Me dedico a diseñar, crear y planificar eventos que cuenten historias, que tengan identidad y que se sientan propios.",
  "Mi forma de trabajar empieza siempre escuchando. Entendiendo qué imaginan, qué les preocupa, qué los ilusiona. A partir de ahí, construimos cada detalle con intención.",
  "Me gusta que tengamos una primera charla, que puedan conocerme y sacarse todas las dudas. Incluso si después deciden no contratarme. Porque más allá de todo, me dedico a acompañar.",
  "Quiero que cuando llegue el gran día estén tranquilos, presentes y disfrutando. Que no tengan que pensar en nada más que en vivirlo.",
  "Creo mucho en compartir información. Los buenos datos se comparten. Por eso me gusta ayudarte a saber por dónde arrancar, qué es realmente prioritario, a qué darle importancia y cómo elegir proveedores que funcionen de manera excelente.",
  "Mi objetivo es que se sientan seguros en cada decisión y que su evento sea exactamente lo que soñaron… o incluso mejor.",
];

const FOTO_JESS = "https://res.cloudinary.com/dgtlyzyra/image/upload/v1786728006/jessdesign/jess-retrato.png";

export default async function ConocenosPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant || !hasModule(tenant, "sitio")) notFound();
  const tpl = (tenant.settings as { template?: string } | null)?.template;
  if (tpl !== "eventos") notFound();

  const { logo, ig, wa, base } = jessDatos(tenant);

  return (
    <div className="min-h-screen" style={{ backgroundColor: JESS_CREMA, color: JESS_TINTA, fontFamily: "var(--font-montserrat)" }}>
      <JessHeader logo={logo} ig={ig} base={base} activa="conocenos" />

      <section className="mx-auto max-w-[1200px] px-6 py-10 sm:py-20">
        <div className="grid items-start gap-12 md:grid-cols-[0.9fr_1.1fr]">
          <Reveal className="md:sticky md:top-28">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={FOTO_JESS} alt="Jess" className="w-full object-cover" />
            <p className="mt-4 text-center text-[24px]" style={{ fontFamily: "var(--font-pinyon)", color: JESS_TOPO }}>
              elegancia en cada momento
            </p>
          </Reveal>

          <Reveal delay={120}>
            <p className="text-[11px] font-semibold tracking-[0.4em]" style={{ color: JESS_TOPO }}>CONÓCENOS</p>
            <h1 className="mt-4 text-[34px] leading-[1.05] sm:text-[64px]" style={{ fontFamily: "var(--font-italiana)" }}>
              Soy Jess ✨
            </h1>
            <div className="mt-8 space-y-5 text-[15px] leading-[1.9]" style={{ color: "#4d463f" }}>
              {PARRAFOS.map((p) => (
                <p key={p.slice(0, 24)}>{p}</p>
              ))}
            </div>
            <div className="mt-10 border-l-2 pl-6" style={{ borderColor: JESS_TERRA }}>
              <p className="text-[17px] leading-[1.8]">
                Creo en la humildad de hacer las cosas con pasión. En estar presente en momentos
                irrepetibles. En transmitir calma cuando más se necesita.
              </p>
              <p className="mt-3 text-[15px]" style={{ color: JESS_TOPO }}>
                De eso se trata mi trabajo, y es algo que amo profundamente 🤍
              </p>
            </div>
            <div className="mt-10 flex flex-wrap gap-4">
              <a
                href={`${base}#contacto`}
                className="px-9 py-4 text-[12px] font-semibold tracking-[0.2em] transition hover:opacity-90"
                style={{ backgroundColor: JESS_TINTA, color: JESS_CREMA }}
              >
                PEDIR UNA REUNIÓN
              </a>
              {wa ? (
                <a
                  href={`https://wa.me/${wa}`}
                  target="_blank"
                  rel="noreferrer"
                  className="border px-9 py-4 text-[12px] font-semibold tracking-[0.2em] transition hover:opacity-70"
                  style={{ borderColor: JESS_TINTA }}
                >
                  WHATSAPP
                </a>
              ) : null}
            </div>
          </Reveal>
        </div>
      </section>

      <JessFooter logo={logo} ig={ig} />
    </div>
  );
}
