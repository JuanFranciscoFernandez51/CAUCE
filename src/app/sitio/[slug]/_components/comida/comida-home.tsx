import type { Client } from "@prisma/client";
import { db } from "@/lib/db";
import { PedidoProvider, BarraPedido } from "./pedido-store";
import { Destacados } from "./catalogo";
import { MiloEstilos, MiloCinta, MiloHeader } from "./milo-chrome";
import { Reveal } from "../conce/reveal";

/**
 * Home de Casa Milo — según el brand book y el handoff de diseño.
 * Bordó #7A303B, crema #FEFAEF, celeste #B0CEFE (un solo uso por bloque) y
 * tinta #3A1218. Bodoni Moda para titulares, Archivo para el texto.
 * El pedido se arma acá y se cierra por WhatsApp: no hay checkout.
 */
const BORDO = "#7A303B";
const CREMA = "#FEFAEF";
const CELESTE = "#B0CEFE";
const TINTA = "#3A1218";



const PASOS = [
  { n: "01", t: "Armás tu pedido", d: "Sumás lo que quieras del catálogo. El mínimo es 2 kg." },
  { n: "02", t: "Lo pagás por la web o por WhatsApp", d: "Pagás online con MercadoPago, o lo cerramos por WhatsApp y pagás al recibir." },
  { n: "03", t: "Llega el mismo día", d: "Con frío hasta tu puerta, en cualquier barrio de CABA." },
];

const DIFERENCIALES = [
  "Corte seleccionado a mano",
  "Rebozado propio, sin conservantes",
  "Cadena de frío hasta tu puerta",
  "Pagás al recibir o por transferencia",
];

const FAQ = [
  { p: "¿Llega congelado?", r: "Sale con frío y llega listo para guardar en el freezer o cocinar en el momento." },
  { p: "¿Cómo pago?", r: "Por MercadoPago desde la web (tarjeta o dinero en cuenta), por transferencia, o en efectivo al recibir." },
  { p: "¿Puedo elegir el mix del combo?", r: "Sí. Cuando cerramos por WhatsApp nos decís cómo lo querés armar." },
];

export async function ComidaHome({ tenant }: { tenant: Client }) {
  const st = (tenant.settings ?? {}) as {
    anuncio?: string;
    minimoKg?: number;
    instagram?: string;
    horarios?: string;
    envios?: { corte?: string; barrios?: string[] };
  };
  const envios = st.envios ?? {};
  const wa = tenant.whatsapp?.replace(/\D/g, "") || null;
  const waLink = wa ? `https://wa.me/${wa}` : "#catalogo";

  const productos = await db.bazarProducto.findMany({
    where: { clientId: tenant.id, activo: true },
    orderBy: [{ categoria: "asc" }, { precio: "asc" }],
    select: { id: true, nombre: true, precio: true, descripcion: true, categoria: true, fotos: true },
  });

  const fotosDe = (f: unknown) => (Array.isArray(f) ? f.filter((x): x is string => typeof x === "string") : []);
  const foto = (f: unknown) => fotosDe(f)[0] ?? null;

  // Promesas reales para la cinta: si hay anuncio cargado se parte por "·".
  const promesas = (st.anuncio ?? "Entrega en el día en CABA · Milanesas y pollo premium · Envío sin cargo desde $60.000 · Rebozado propio, sin conservantes · Pedido mínimo 2 kg")
    .split("·")
    .map((p) => p.trim())
    .filter(Boolean);
  const base = `/sitio/${tenant.slug}`;
  const NAV = [
    { href: `${base}/catalogo`, label: "Catálogo" },
    { href: `${base}#como`, label: "Cómo funciona" },
    { href: `${base}#cobertura`, label: "Cobertura" },
  ];

  return (
    <PedidoProvider slug={tenant.slug}>
      <div style={{ backgroundColor: CREMA, color: TINTA, fontFamily: "var(--font-archivo)" }}>
        <MiloEstilos />

        <MiloCinta promesas={promesas} />

        <MiloHeader base={base} wa={wa} nav={NAV} />

        {/* 1.3 Hero */}
        <section className="mx-auto grid max-w-[1180px] items-center gap-11 px-7 pb-10 pt-9 md:grid-cols-[1.35fr_0.65fr]">
          <Reveal>
            <p className="text-[13px] font-semibold uppercase" style={{ color: BORDO, letterSpacing: "0.22em" }}>
              Milanesas & pollo premium · BS-AS
            </p>
            <h1
              className="mt-4 text-[42px] font-black sm:text-[58px]"
              style={{ fontFamily: "var(--font-bodoni)", color: BORDO, lineHeight: 0.94, letterSpacing: "-0.025em" }}
            >
              Lo simple, cuando está bien hecho.
            </h1>
            <p className="mt-5 max-w-[460px] text-[17px] leading-[1.45]" style={{ color: "#4A2A30" }}>
              Corte seleccionado, rebozado propio. Pedís y te llega el mismo día a tu casa.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-4">
              <a
                href="#catalogo"
                className="px-[30px] py-[15px] text-[15px] font-semibold uppercase transition-all duration-200 hover:-translate-y-0.5 hover:opacity-90 active:scale-[0.98] motion-reduce:transform-none"
                style={{ backgroundColor: BORDO, color: CREMA }}
              >
                Ver catálogo
              </a>
              <a
                href={waLink}
                target="_blank"
                rel="noreferrer"
                className="px-[30px] py-[15px] text-[15px] font-semibold uppercase transition-all duration-200 hover:-translate-y-0.5 hover:opacity-90 active:scale-[0.98] motion-reduce:transform-none"
                style={{ backgroundColor: CELESTE, color: TINTA, fontWeight: 700 }}
              >
                WhatsApp
              </a>
              <span className="inline-flex items-center gap-2 px-4 py-2 text-[13px] font-semibold" style={{ backgroundColor: "rgba(176,206,254,0.35)", color: TINTA }}>
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: BORDO }} />
                Entrega en el día en CABA · envío sin cargo desde $60.000
              </span>
            </div>
          </Reveal>

          {/* Marco bordó desplazado: es parte de la identidad. La foto respira con ken burns. */}
          <Reveal delay={120} className="w-full max-w-[320px] justify-self-end">
            <div style={{ background: CELESTE, padding: "0 0 14px 14px" }}>
            <div style={{ background: BORDO, padding: "18px 18px 0 0", transform: "translate(-14px,-14px)" }}>
              <div className="aspect-square w-full overflow-hidden" style={{ transform: "translate(18px,18px)" }}>
                {foto(productos[0]?.fotos) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={foto(productos[0]?.fotos)!}
                    alt="Milanesa de Casa Milo"
                    className="milo-kenburns h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full" style={{ backgroundColor: "#EADFC4" }} />
                )}
              </div>
            </div>
            </div>
          </Reveal>
        </section>

        {/* 1.4 Franja de diferenciales */}
        <div style={{ backgroundColor: BORDO, color: CREMA, borderTop: `4px solid ${CELESTE}` }}>
          <div className="mx-auto flex max-w-[1180px] flex-wrap justify-between gap-x-9 gap-y-3 px-7 py-[26px]">
            {DIFERENCIALES.map((d, i) => (
              <Reveal key={d} delay={i * 90}>
                <p className="text-[15px] font-medium">
                  <span className="mr-2 font-bold" style={{ color: CELESTE }}>
                    0{i + 1}
                  </span>
                  {d}
                </p>
              </Reveal>
            ))}
          </div>
        </div>

        {/* 1.5 Destacados: 5 productos en carrusel; el catálogo entero vive en su pestaña */}
        <Destacados
          base={base}
          productos={[...productos]
            .sort((a, b) => Number(/combo/i.test(b.categoria)) - Number(/combo/i.test(a.categoria)))
            .slice(0, 5)
            .map((p) => ({
              id: p.id,
              nombre: p.nombre,
              precio: p.precio,
              descripcion: p.descripcion ?? "",
              categoria: p.categoria,
              fotos: fotosDe(p.fotos),
            }))}
        />

        {/* 1.6 Cómo funciona */}
        <section id="como" className="mx-auto max-w-[1180px] px-7 py-20">
          <Reveal>
            <p className="text-[13px] font-semibold uppercase" style={{ color: BORDO, letterSpacing: "0.22em" }}>
              Cómo funciona
            </p>
            <h2
              className="mt-3 text-[38px] font-black sm:text-[54px]"
              style={{ fontFamily: "var(--font-bodoni)", color: BORDO, lineHeight: 1, letterSpacing: "-0.02em" }}
            >
              Pedís y comés el mismo día
            </h2>
          </Reveal>
          <div className="mt-10 grid gap-7 md:grid-cols-3">
            {PASOS.map((p, i) => (
              <Reveal key={p.n} delay={i * 90}>
                <div className="milo-paso" style={{ borderTop: `3px solid ${CELESTE}`, padding: "20px 14px 16px" }}>
                <p className="milo-paso-num text-[44px] font-black" style={{ fontFamily: "var(--font-bodoni)", color: CELESTE }}>
                  {p.n}
                </p>
                <p className="mt-1 text-[21px] font-bold" style={{ color: BORDO }}>
                  {p.t}
                </p>
                <p className="mt-2 text-[15px] leading-[1.55]" style={{ color: "#4A2A30" }}>
                  {p.d}
                </p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* 1.7 Cobertura + FAQ */}
        <section id="cobertura" style={{ backgroundColor: BORDO, color: CREMA }}>
          <div className="mx-auto grid max-w-[1180px] gap-14 px-7 py-20 md:grid-cols-2">
            <Reveal>
              <p className="text-[13px] font-semibold uppercase" style={{ color: CELESTE, letterSpacing: "0.22em" }}>
                Cobertura
              </p>
              <h2
                className="mt-3 text-[38px] font-black sm:text-[52px]"
                style={{ fontFamily: "var(--font-bodoni)", lineHeight: 1, letterSpacing: "-0.02em" }}
              >
                Toda CABA, en el día
              </h2>
              <p className="mt-5 text-[17px]" style={{ color: "rgba(254,250,239,0.85)" }}>
                {st.horarios ? `${st.horarios}. ` : "Salimos todos los días de 10 a 20 hs. "}
                {envios.corte ?? "Los pedidos confirmados antes de las 17 hs se entregan ese mismo día."}
              </p>
              <div className="mt-6 flex flex-wrap gap-2.5">
                {(envios.barrios ?? []).map((b) => (
                  <span key={b} className="px-4 py-2 text-[14px]" style={{ border: "1px solid rgba(176,206,254,0.5)" }}>
                    {b}
                  </span>
                ))}
              </div>
            </Reveal>

            <Reveal delay={120}>
              <div className="h-full p-[34px]" style={{ backgroundColor: "rgba(254,250,239,0.08)" }}>
              <p className="text-[26px] font-bold" style={{ fontFamily: "var(--font-bodoni)", color: CELESTE }}>
                Preguntas rápidas
              </p>
              <div className="mt-5">
                {FAQ.map((f, i) => (
                  <div key={f.p} className="py-4" style={i ? { borderTop: "1px solid rgba(176,206,254,0.3)" } : undefined}>
                    <p className="text-[16px] font-bold">{f.p}</p>
                    <p className="mt-1 text-[14.5px]" style={{ color: "rgba(254,250,239,0.85)" }}>
                      {f.r}
                    </p>
                  </div>
                ))}
              </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* 1.8 Footer */}
        <footer className="mx-auto grid max-w-[1180px] items-start gap-10 px-7 pb-[120px] pt-16 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <p className="text-[40px] font-black" style={{ fontFamily: "var(--font-bodoni)", color: BORDO, letterSpacing: "-0.02em" }}>
              Casa Milo
            </p>
            <p className="mt-2 text-[15px]" style={{ color: "#6B4A4F" }}>
              Milanesas & pollo premium. Ciudad de Buenos Aires.
            </p>
          </div>
          <div>
            <p className="text-[12px] font-semibold uppercase" style={{ color: BORDO, letterSpacing: "0.2em" }}>
              Tienda
            </p>
            <ul className="mt-3 space-y-2 text-[15px]">
              {NAV.map((n) => (
                <li key={n.href}>
                  <a href={n.href} className="transition hover:opacity-70">
                    {n.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-[12px] font-semibold uppercase" style={{ color: BORDO, letterSpacing: "0.2em" }}>
              Contacto
            </p>
            <ul className="mt-3 space-y-2 text-[15px]">
              {wa ? (
                <li>
                  <a href={waLink} target="_blank" rel="noreferrer" className="transition hover:opacity-70">
                    WhatsApp
                  </a>
                </li>
              ) : null}
              {st.instagram ? (
                <li>
                  <a href={`https://www.instagram.com/${st.instagram}/`} target="_blank" rel="noreferrer" className="transition hover:opacity-70">
                    @{st.instagram}
                  </a>
                </li>
              ) : null}
              <li style={{ color: "#6B4A4F" }}>Lun a sáb · 10 a 20 hs</li>
              <li>
                <a href={`/sitio/${tenant.slug}/terminos`} className="transition hover:opacity-70">
                  Términos y condiciones
                </a>
              </li>
            </ul>
          </div>
        </footer>

        <BarraPedido whatsapp={wa} minimoKg={st.minimoKg} base={`/sitio/${tenant.slug}`} />
      </div>
    </PedidoProvider>
  );
}
