import type { Client } from "@prisma/client";
import { FormConsulta } from "../piletas/form-consulta";

/**
 * Landing de Jess Design, con la estética de su panel: crema #EDE8DE,
 * tinta #1A1816, Italiana para los títulos, Pinyon para la frase y
 * Montserrat espaciada para las etiquetas.
 */
const TINTA = "#1A1816";
const CREMA = "#EDE8DE";
const TOPO = "#9E9387";
const TERRA = "#B85850";

export function JessHome({ tenant }: { tenant: Client }) {
  const logo = ((tenant.branding as { logo?: string } | null)?.logo) ?? null;
  const st = (tenant.settings ?? {}) as {
    instagram?: string;
    plantillaCotizacion?: { servicios?: { nombre: string; items: string[] }[] };
    tiposEvento?: string[];
  };
  const ig = st.instagram ?? "jessdesign.bb";
  const servicios = st.plantillaCotizacion?.servicios ?? [];
  const tipos = st.tiposEvento ?? [];
  const wa = tenant.whatsapp?.replace(/\D/g, "");

  return (
    <div style={{ backgroundColor: CREMA, color: TINTA, fontFamily: "var(--font-montserrat)" }}>
      {/* Header negro con monograma */}
      <header className="sticky top-0 z-40" style={{ backgroundColor: TINTA, color: CREMA }}>
        <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-6 px-6 py-4">
          <a href="#top" className="flex items-center gap-3">
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo} alt="Jess Design" className="h-11 w-auto" />
            ) : null}
            <span>
              <span className="block text-[15px] font-semibold tracking-[0.34em]">JESS</span>
              <span className="block text-[9px] tracking-[0.5em] opacity-70">DESIGN</span>
            </span>
          </a>
          <nav className="hidden items-center gap-8 text-[11px] font-medium tracking-[0.22em] md:flex">
            <a href="#servicios" className="transition hover:opacity-60">SERVICIOS</a>
            <a href="#eventos" className="transition hover:opacity-60">EVENTOS</a>
            <a href="#contacto" className="transition hover:opacity-60">CONTACTO</a>
          </nav>
          <a
            href={`https://www.instagram.com/${ig}/`}
            target="_blank"
            rel="noreferrer"
            className="border px-5 py-2.5 text-[11px] font-medium tracking-[0.18em] transition hover:opacity-80"
            style={{ borderColor: "rgba(237,232,222,.4)" }}
          >
            @{ig.toUpperCase()}
          </a>
        </div>
      </header>

      {/* Hero */}
      <section id="top" className="mx-auto max-w-[1200px] px-6 pb-16 pt-20 text-center sm:pt-28">
        <p className="text-[11px] font-semibold tracking-[0.4em]" style={{ color: TOPO }}>
          EVENT PLANNER · BAHÍA BLANCA
        </p>
        <h1 className="mx-auto mt-6 max-w-[900px] text-[52px] leading-[1.05] sm:text-[76px]" style={{ fontFamily: "var(--font-italiana)" }}>
          Sofisticación en cada detalle
        </h1>
        <p className="mt-4 text-[30px] sm:text-[38px]" style={{ fontFamily: "var(--font-pinyon)", color: TERRA }}>
          elegancia en cada momento
        </p>
        <p className="mx-auto mt-6 max-w-[560px] text-[15px] leading-[1.8]" style={{ color: "#6d645b" }}>
          Diseño, planificación y coordinación integral de eventos. Vos vivís el momento;
          del resto nos ocupamos nosotras.
        </p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
          <a
            href="#contacto"
            className="px-9 py-4 text-[12px] font-semibold tracking-[0.2em] transition hover:opacity-90"
            style={{ backgroundColor: TINTA, color: CREMA }}
          >
            PEDIR UNA REUNIÓN
          </a>
        </div>
        {tipos.length ? (
          <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-[11px] tracking-[0.28em]" style={{ color: TOPO }}>
            {tipos.map((t) => (
              <span key={t}>{t.toUpperCase()}</span>
            ))}
          </div>
        ) : null}
      </section>

      {/* Servicios: los 6 de su plantilla */}
      <section id="servicios" style={{ backgroundColor: "#F6F2EA" }}>
        <div className="mx-auto max-w-[1200px] px-6 py-16">
          <div className="text-center">
            <p className="text-[11px] font-semibold tracking-[0.4em]" style={{ color: TOPO }}>NUESTRO SERVICIO</p>
            <h2 className="mt-3 text-[38px] sm:text-[46px]" style={{ fontFamily: "var(--font-italiana)" }}>
              Qué incluye trabajar con Jess
            </h2>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {servicios.map((s, i) => (
              <div key={s.nombre} className="bg-white p-7">
                <p className="text-[26px]" style={{ fontFamily: "var(--font-italiana)", color: TOPO }}>
                  {String(i + 1).padStart(2, "0")}
                </p>
                <p className="mt-2 text-[17px] font-semibold leading-snug">{s.nombre}</p>
                <ul className="mt-3 space-y-1.5 text-[13px] leading-relaxed" style={{ color: "#6d645b" }}>
                  {s.items.slice(0, 4).map((it) => (
                    <li key={it} className="flex gap-2">
                      <span style={{ color: TERRA }}>·</span>
                      {it}
                    </li>
                  ))}
                  {s.items.length > 4 ? <li className="text-[12px] italic opacity-70">y más…</li> : null}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cómo trabajamos */}
      <section id="eventos" style={{ backgroundColor: TINTA, color: CREMA }}>
        <div className="mx-auto max-w-[1200px] px-6 py-16 text-center">
          <p className="text-[11px] font-semibold tracking-[0.4em]" style={{ color: TOPO }}>EL PROCESO</p>
          <h2 className="mt-3 text-[36px] sm:text-[44px]" style={{ fontFamily: "var(--font-italiana)" }}>
            De la idea al brindis
          </h2>
          <div className="mx-auto mt-10 grid max-w-[900px] gap-8 sm:grid-cols-3">
            {[
              { n: "01", t: "Nos conocemos", d: "Una reunión para entender el evento que imaginás, el estilo y el presupuesto." },
              { n: "02", t: "Diseñamos y planificamos", d: "Propuesta, cronograma, proveedores y ambientación. Todo por escrito y con seguimiento." },
              { n: "03", t: "Vos disfrutás", d: "El día del evento coordinamos todo: montaje, tiempos, proveedores e imprevistos." },
            ].map((p) => (
              <div key={p.n}>
                <p className="text-[34px]" style={{ fontFamily: "var(--font-pinyon)", color: TERRA }}>{p.n}</p>
                <p className="mt-1 text-[16px] font-semibold">{p.t}</p>
                <p className="mt-2 text-[13px] leading-relaxed opacity-75">{p.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contacto */}
      <section id="contacto" className="mx-auto max-w-[1200px] px-6 py-16">
        <div className="grid gap-12 md:grid-cols-[1fr_1.1fr]">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.4em]" style={{ color: TOPO }}>CONTACTO</p>
            <h2 className="mt-4 max-w-[380px] text-[40px] leading-[1.1] sm:text-[48px]" style={{ fontFamily: "var(--font-italiana)" }}>
              Contanos qué estás soñando
            </h2>
            <p className="mt-5 max-w-[400px] text-[14px] leading-[1.8]" style={{ color: "#6d645b" }}>
              Escribinos y coordinamos una primera reunión sin cargo para conocer tu evento.
            </p>
            <div className="mt-8 space-y-2 text-[14px]">
              {wa ? (
                <p><a href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer" className="font-semibold transition hover:opacity-60">WhatsApp</a></p>
              ) : null}
              <p><a href={`https://www.instagram.com/${ig}/`} target="_blank" rel="noreferrer" className="transition hover:opacity-60">@{ig}</a></p>
              <p style={{ color: TOPO }}>Bahía Blanca y zona</p>
            </div>
          </div>
          <div className="bg-white p-8 sm:p-10">
            <FormConsulta slug={tenant.slug} />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ backgroundColor: TINTA, color: CREMA }}>
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-4 px-6 py-10">
          <span className="flex items-center gap-4">
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo} alt="" className="h-14 w-auto" />
            ) : null}
            <p className="text-[22px] tracking-[0.3em]" style={{ fontFamily: "var(--font-italiana)" }}>JESS DESIGN</p>
          </span>
          <p className="text-[20px]" style={{ fontFamily: "var(--font-pinyon)", color: TOPO }}>
            Sofisticación en cada detalle
          </p>
          <p className="text-[12px] opacity-60">© 2026 Jess Design · @{ig}</p>
        </div>
      </footer>
    </div>
  );
}
