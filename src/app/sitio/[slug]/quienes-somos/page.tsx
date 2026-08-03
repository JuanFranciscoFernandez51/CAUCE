import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { bazarSettings } from "@/lib/bazar-server";
import { getBazarSite } from "../_lib/bazar-site";
import { BazarShell, BZ } from "../_components/bazar/bazar-shell";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const site = await getBazarSite(slug);
  return {
    title: site ? `Quiénes somos — ${site.info.nombre}` : "Quiénes somos",
    robots: { index: false, follow: false },
  };
}

export default async function QuienesSomosPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const site = await getBazarSite(slug);
  if (!site) notFound();
  const { tenant, info } = site;
  const base = `/sitio/${tenant.slug}`;
  const settings = bazarSettings(tenant);
  const fotos = (settings.fotos ?? []).filter(Boolean);

  // El texto sale del tenant; el del bazar quedó como respaldo de su propia web.
  const st = (tenant.settings ?? {}) as {
    nosotros?: { historia?: string; tituloHistoria?: string; parrafos?: string[]; numeros?: { valor: string; texto: string }[] };
    claim?: string;
  };
  const titulo = st.claim ?? "De la costa a tu casa";
  const historia =
    st.nosotros?.historia ??
    `Somos ${info.nombre}: un bazar de playa nacido en Monte Hermoso, con el mar como excusa y la casa linda como oficio.`;
  const parrafos =
    st.nosotros?.parrafos ??
    (st.nosotros?.historia
      ? []
      : [
          "Dos veces al año viajamos a Buenos Aires a recorrer las expos CAFIRA y PRESENTES, donde seleccionamos las colecciones una por una: vajilla gris piedra, textiles neutros, aromas, deco elegante. Si está en la tienda, es porque nos enamoró.",
          "Después, desde el local en Monte Hermoso, lo despachamos a todo el país. Tu casa con onda de mar, estés donde estés. 🌊",
        ]);
  const numeros = st.nosotros?.numeros ?? [];
  const sucursal =
    ((tenant.settings as { sucursales?: { direccion?: string }[] } | null)?.sucursales?.[0]?.direccion) ??
    "Consultanos por WhatsApp";

  return (
    <BazarShell info={info}>
      {/* Hero */}
      <section style={{ backgroundColor: "#F4F4F2" }}>
        <div className="mx-auto max-w-4xl px-4 py-14 text-center">
          <div className="text-5xl">{info.emoji}</div>
          <h1
            className="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl"
            style={{ color: "var(--t-texto)" }}
          >
            {titulo}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base t-tenue sm:text-lg">
            {historia}
          </p>
          {numeros.length ? (
            <div className="mx-auto mt-8 grid max-w-2xl grid-cols-3 gap-3">
              {numeros.map((n) => (
                <div key={n.texto} className="rounded-2xl bg-white/70 px-3 py-4">
                  <p className="text-2xl font-extrabold" style={{ color: "var(--t-texto)" }}>{n.valor}</p>
                  <p className="mt-0.5 text-xs t-tenue">{n.texto}</p>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      {/* Historia */}
      <section className="mx-auto max-w-4xl px-4 py-12">
        <div className={`grid items-center gap-8 ${fotos[2] ?? fotos[0] ? "md:grid-cols-2" : ""}`}>
          {fotos[2] ?? fotos[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={fotos[2] ?? fotos[0]}
              alt="Nuestras piezas"
              className="aspect-square w-full rounded-[2rem] object-cover shadow-lg"
            />
          ) : null}
          <div>
            <h2 className="text-2xl font-bold tracking-tight" style={{ color: "var(--t-texto)" }}>
              {st.nosotros?.tituloHistoria ?? "Elegimos cada pieza"}
            </h2>
            <p className="mt-3 leading-relaxed t-tenue">
              {settings.sobre ?? st.nosotros?.parrafos?.[0] ?? "Todo lo que ves en la tienda pasó por nuestras manos primero."}
            </p>
            {(settings.sobre ? parrafos : parrafos.slice(1)).map((t, i) => (
              <p key={i} className="mt-3 leading-relaxed t-tenue">{t}</p>
            ))}
          </div>
        </div>

        {/* Galería */}
        {fotos.length > 3 ? (
          <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {fotos.slice(3, 11).map((f, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={f}
                alt={`${info.nombre} — foto ${i + 1}`}
                loading="lazy"
                className="aspect-square w-full rounded-2xl object-cover"
              />
            ))}
          </div>
        ) : null}
      </section>

      {/* Datos de contacto */}
      <section style={{ backgroundColor: "#FBF9F4" }}>
        <div className="mx-auto grid max-w-4xl gap-6 px-4 py-12 sm:grid-cols-3">
          <div className="rounded-2xl t-card p-5 text-center shadow-sm">
            <div className="text-2xl">📍</div>
            <h3 className="mt-2 font-bold" style={{ color: "var(--t-texto)" }}>
              El local
            </h3>
            <p className="mt-1 text-sm t-tenue">
              {info.direccion ?? sucursal}
            </p>
            {info.horarios ? (
              <p className="mt-1 whitespace-pre-line text-xs t-tenue">{info.horarios}</p>
            ) : null}
          </div>
          <div className="rounded-2xl t-card p-5 text-center shadow-sm">
            <div className="text-2xl">📷</div>
            <h3 className="mt-2 font-bold" style={{ color: "var(--t-texto)" }}>
              Instagram
            </h3>
            {info.instagram ? (
              <a
                href={`https://instagram.com/${info.instagram}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 block text-sm font-semibold hover:underline"
                style={{ color: "var(--tpl, #3FA9A5)" }}
              >
                @{info.instagram}
              </a>
            ) : (
              <p className="mt-1 text-sm t-tenue">Muy pronto</p>
            )}
          </div>
          <div className="rounded-2xl t-card p-5 text-center shadow-sm">
            <div className="text-2xl">💬</div>
            <h3 className="mt-2 font-bold" style={{ color: "var(--t-texto)" }}>
              WhatsApp
            </h3>
            {info.whatsapp ? (
              <a
                href={`https://wa.me/${info.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 block text-sm font-semibold hover:underline"
                style={{ color: "var(--tpl, #3FA9A5)" }}
              >
                Escribinos →
              </a>
            ) : null}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-12 text-center">
        <Link
          href={`${base}/tienda`}
          className="inline-block rounded-full px-8 py-3.5 text-base font-semibold text-white shadow-lg"
          style={{ backgroundColor: "var(--tpl, #3FA9A5)", color: "var(--tpl-sobre, #fff)" }}
        >
          Conocé la tienda →
        </Link>
      </section>
    </BazarShell>
  );
}
