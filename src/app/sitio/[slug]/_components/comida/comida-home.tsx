import type { Client } from "@prisma/client";
import { db } from "@/lib/db";
import { PedidoProvider, BarraPedido } from "./pedido-store";
import { Catalogo } from "./catalogo";

/**
 * Home de Casa Milo — según el brand book y el handoff de diseño.
 * Bordó #7B2434, crema #FBF3DE, celeste #A9C6F5 (un solo uso por bloque) y
 * tinta #3A1218. Bodoni Moda para titulares, Archivo para el texto.
 * El pedido se arma acá y se cierra por WhatsApp: no hay checkout.
 */
const BORDO = "#7B2434";
const CREMA = "#FBF3DE";
const CELESTE = "#A9C6F5";
const TINTA = "#3A1218";

const NAV = [
  { href: "#catalogo", label: "Catálogo" },
  { href: "#como", label: "Cómo funciona" },
  { href: "#cobertura", label: "Cobertura" },
];

const PASOS = [
  { n: "01", t: "Armás tu pedido", d: "Sumás lo que quieras del catálogo. El mínimo es 2 kg." },
  { n: "02", t: "Lo cerramos por WhatsApp", d: "Te confirmamos dirección, franja horaria y forma de pago." },
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
  { p: "¿Cómo pago?", r: "Al recibir, en efectivo, o por transferencia cuando confirmamos el pedido." },
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

  const foto = (f: unknown) => (Array.isArray(f) && typeof f[0] === "string" ? (f[0] as string) : null);

  return (
    <PedidoProvider slug={tenant.slug}>
      <div style={{ backgroundColor: CREMA, color: TINTA, fontFamily: "var(--font-archivo)" }}>
        {/* 1.1 Barra de anuncio */}
        <div
          className="px-5 py-2.5 text-center text-[13px] font-semibold uppercase"
          style={{ backgroundColor: BORDO, color: CREMA, letterSpacing: "0.14em" }}
        >
          {st.anuncio ?? "Entrega en el día en CABA · Pedido mínimo 2 kg · Envío sin cargo desde $30.000"}
        </div>

        {/* 1.2 Header */}
        <header
          className="sticky top-0 z-40 backdrop-blur-[8px]"
          style={{ backgroundColor: "rgba(251,243,222,0.94)", borderBottom: "1px solid rgba(123,36,52,0.16)" }}
        >
          <div className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-6 px-7 py-4">
            <a
              href="#top"
              className="text-[30px] font-black"
              style={{ fontFamily: "var(--font-bodoni)", color: BORDO, letterSpacing: "-0.02em" }}
            >
              Casa Milo
            </a>
            <nav className="hidden items-center gap-7 md:flex">
              {NAV.map((n) => (
                <a key={n.href} href={n.href} className="text-[15px] font-medium transition hover:opacity-70" style={{ color: TINTA }}>
                  {n.label}
                </a>
              ))}
            </nav>
            <a
              href={waLink}
              target="_blank"
              rel="noreferrer"
              className="px-[22px] py-3 text-[14px] font-semibold uppercase transition hover:opacity-90"
              style={{ backgroundColor: BORDO, color: CREMA, letterSpacing: "0.06em" }}
            >
              Pedir por WhatsApp
            </a>
          </div>
        </header>

        {/* 1.3 Hero */}
        <section className="mx-auto grid max-w-[1180px] items-center gap-11 px-7 pb-10 pt-9 md:grid-cols-[1.35fr_0.65fr]">
          <div>
            <p className="text-[13px] font-semibold uppercase" style={{ color: BORDO, letterSpacing: "0.22em" }}>
              Milanesas premium BS-AS
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
                className="px-[30px] py-[15px] text-[15px] font-semibold uppercase transition hover:opacity-90"
                style={{ backgroundColor: BORDO, color: CREMA }}
              >
                Ver catálogo
              </a>
              <a
                href={waLink}
                target="_blank"
                rel="noreferrer"
                className="px-[30px] py-[15px] text-[15px] font-semibold uppercase transition hover:bg-black/[0.04]"
                style={{ border: `1.5px solid ${BORDO}`, color: BORDO }}
              >
                WhatsApp
              </a>
              <span className="text-[14px]" style={{ color: "#6B4A4F" }}>
                Entrega en el día en CABA
              </span>
            </div>
          </div>

          {/* Marco bordó desplazado: es parte de la identidad */}
          <div className="w-full max-w-[320px] justify-self-end">
            <div style={{ background: BORDO, padding: "18px 18px 0 0" }}>
              {foto(productos[0]?.fotos) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={foto(productos[0]?.fotos)!}
                  alt="Milanesa de Casa Milo"
                  className="aspect-square w-full object-cover"
                  style={{ transform: "translate(18px,18px)" }}
                />
              ) : (
                <div
                  className="aspect-square w-full"
                  style={{ transform: "translate(18px,18px)", backgroundColor: "#EADFC4" }}
                />
              )}
            </div>
          </div>
        </section>

        {/* 1.4 Franja de diferenciales */}
        <div style={{ backgroundColor: BORDO, color: CREMA }}>
          <div className="mx-auto flex max-w-[1180px] flex-wrap justify-between gap-x-9 gap-y-3 px-7 py-[26px]">
            {DIFERENCIALES.map((d, i) => (
              <p key={d} className="text-[15px] font-medium">
                <span className="mr-2 font-bold" style={{ color: CELESTE }}>
                  0{i + 1}
                </span>
                {d}
              </p>
            ))}
          </div>
        </div>

        {/* 1.5 Catálogo */}
        <Catalogo
          productos={productos.map((p) => ({
            id: p.id,
            nombre: p.nombre,
            precio: p.precio,
            descripcion: p.descripcion ?? "",
            categoria: p.categoria,
            foto: foto(p.fotos),
          }))}
        />

        {/* 1.6 Cómo funciona */}
        <section id="como" className="mx-auto max-w-[1180px] px-7 py-20">
          <p className="text-[13px] font-semibold uppercase" style={{ color: BORDO, letterSpacing: "0.22em" }}>
            Cómo funciona
          </p>
          <h2
            className="mt-3 text-[38px] font-black sm:text-[54px]"
            style={{ fontFamily: "var(--font-bodoni)", color: BORDO, lineHeight: 1, letterSpacing: "-0.02em" }}
          >
            Pedís y comés el mismo día
          </h2>
          <div className="mt-10 grid gap-7 md:grid-cols-3">
            {PASOS.map((p) => (
              <div key={p.n} style={{ borderTop: `3px solid ${BORDO}`, paddingTop: 20 }}>
                <p className="text-[44px] font-black" style={{ fontFamily: "var(--font-bodoni)", color: CELESTE }}>
                  {p.n}
                </p>
                <p className="mt-1 text-[21px] font-bold" style={{ color: BORDO }}>
                  {p.t}
                </p>
                <p className="mt-2 text-[15px] leading-[1.55]" style={{ color: "#4A2A30" }}>
                  {p.d}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* 1.7 Cobertura + FAQ */}
        <section id="cobertura" style={{ backgroundColor: BORDO, color: CREMA }}>
          <div className="mx-auto grid max-w-[1180px] gap-14 px-7 py-20 md:grid-cols-2">
            <div>
              <p className="text-[13px] font-semibold uppercase" style={{ color: CELESTE, letterSpacing: "0.22em" }}>
                Cobertura
              </p>
              <h2
                className="mt-3 text-[38px] font-black sm:text-[52px]"
                style={{ fontFamily: "var(--font-bodoni)", lineHeight: 1, letterSpacing: "-0.02em" }}
              >
                Toda CABA, en el día
              </h2>
              <p className="mt-5 text-[17px]" style={{ color: "rgba(251,243,222,0.85)" }}>
                {st.horarios ? `${st.horarios}. ` : "Salimos todos los días de 10 a 20 hs. "}
                {envios.corte ?? "Los pedidos confirmados antes de las 17 hs se entregan ese mismo día."}
              </p>
              <div className="mt-6 flex flex-wrap gap-2.5">
                {(envios.barrios ?? []).map((b) => (
                  <span key={b} className="px-4 py-2 text-[14px]" style={{ border: "1px solid rgba(169,198,245,0.5)" }}>
                    {b}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-[34px]" style={{ backgroundColor: "rgba(251,243,222,0.08)" }}>
              <p className="text-[26px] font-bold" style={{ fontFamily: "var(--font-bodoni)", color: CELESTE }}>
                Preguntas rápidas
              </p>
              <div className="mt-5">
                {FAQ.map((f, i) => (
                  <div key={f.p} className="py-4" style={i ? { borderTop: "1px solid rgba(169,198,245,0.3)" } : undefined}>
                    <p className="text-[16px] font-bold">{f.p}</p>
                    <p className="mt-1 text-[14.5px]" style={{ color: "rgba(251,243,222,0.85)" }}>
                      {f.r}
                    </p>
                  </div>
                ))}
              </div>
            </div>
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
            </ul>
          </div>
        </footer>

        <BarraPedido whatsapp={wa} minimoKg={st.minimoKg} base={`/sitio/${tenant.slug}`} />
      </div>
    </PedidoProvider>
  );
}
