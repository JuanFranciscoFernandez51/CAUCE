import type { Client } from "@prisma/client";
import { FormConsulta } from "../piletas/form-consulta";
import { Reveal } from "../conce/reveal";
import { JessHeader, JessFooter, jessDatos } from "./jess-chrome";

// La foto del abrazo (la que eligió Fran para el fondo), recortada abajo del texto.
const FOTO_HERO = "https://res.cloudinary.com/dgtlyzyra/image/upload/c_crop,g_south,h_0.62/v1786728002/jessdesign/hero-abrazo.png";

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
  const { logo, st, ig, wa, base } = jessDatos(tenant);
  const servicios = st.plantillaCotizacion?.servicios ?? [];
  const tipos = st.tiposEvento ?? [];

  return (
    <div style={{ backgroundColor: CREMA, color: TINTA, fontFamily: "var(--font-montserrat)" }}>
      <JessHeader logo={logo} ig={ig} base={base} activa="inicio" />

      {/* Hero sobre la foto del abrazo: ken burns sutil + velo crema para que el texto respire */}
      <section id="top" className="relative overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={FOTO_HERO}
          alt=""
          className="jess-kenburns absolute inset-0 h-full w-full object-cover"
          style={{ objectPosition: "center 62%" }}
        />
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(180deg, rgba(237,232,222,.96) 0%, rgba(237,232,222,.82) 45%, rgba(237,232,222,.35) 100%)" }}
        />
        <div className="relative mx-auto max-w-[1200px] px-6 pb-44 pt-20 text-center sm:pb-56 sm:pt-28">
          <Reveal>
            <p className="text-[11px] font-semibold tracking-[0.4em]" style={{ color: TOPO }}>
              EVENT PLANNER · BAHÍA BLANCA
            </p>
            <h1 className="mx-auto mt-6 max-w-[900px] text-[52px] leading-[1.05] sm:text-[76px]" style={{ fontFamily: "var(--font-italiana)" }}>
              Sofisticación en cada detalle
            </h1>
            <p className="mt-4 text-[30px] sm:text-[38px]" style={{ fontFamily: "var(--font-pinyon)", color: TERRA }}>
              elegancia en cada momento
            </p>
          </Reveal>
          <Reveal delay={150}>
            <p className="mx-auto mt-6 max-w-[560px] text-[15px] leading-[1.8]" style={{ color: "#4d463f" }}>
              Diseño, planificación y coordinación integral de eventos. Vos vivís el momento;
              del resto nos ocupamos nosotras.
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
              <a
                href="#contacto"
                className="px-9 py-4 text-[12px] font-semibold tracking-[0.2em] transition duration-200 hover:opacity-90 active:scale-[0.98]"
                style={{ backgroundColor: TINTA, color: CREMA }}
              >
                PEDIR UNA REUNIÓN
              </a>
              <a
                href={`${base}/conocenos`}
                className="border px-9 py-4 text-[12px] font-semibold tracking-[0.2em] transition duration-200 hover:opacity-70 active:scale-[0.98]"
                style={{ borderColor: TINTA }}
              >
                CONOCÉ A JESS
              </a>
            </div>
          </Reveal>
          {tipos.length ? (
            <Reveal delay={300}>
              <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-[11px] font-semibold tracking-[0.28em]" style={{ color: "#5d564e" }}>
                {tipos.map((t) => (
                  <span key={t}>{t.toUpperCase()}</span>
                ))}
              </div>
            </Reveal>
          ) : null}
        </div>
      </section>

      {/* Servicios: los 6 de su plantilla */}
      <section id="servicios" style={{ backgroundColor: "#F6F2EA" }}>
        <div className="mx-auto max-w-[1200px] px-6 py-16">
          <Reveal className="text-center">
            <p className="text-[11px] font-semibold tracking-[0.4em]" style={{ color: TOPO }}>NUESTRO SERVICIO</p>
            <h2 className="mt-3 text-[38px] sm:text-[46px]" style={{ fontFamily: "var(--font-italiana)" }}>
              Qué incluye trabajar con Jess
            </h2>
          </Reveal>
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {servicios.map((s, i) => (
              <Reveal key={s.nombre} delay={i * 90}>
                {/* el hover vive en un div interno para no pelearse con la transición del reveal */}
                <div className="group relative h-full overflow-hidden bg-white p-7 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_16px_40px_rgba(26,24,22,0.10)]">
                  <p
                    className="text-[26px] text-[#9E9387] transition-colors duration-300 group-hover:text-[#B85850]"
                    style={{ fontFamily: "var(--font-italiana)" }}
                  >
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
                  <span
                    className="absolute inset-x-0 bottom-0 h-[2px] origin-left scale-x-0 transition-transform duration-300 ease-out group-hover:scale-x-100"
                    style={{ backgroundColor: TERRA }}
                  />
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Cómo trabajamos */}
      <section id="eventos" style={{ backgroundColor: TINTA, color: CREMA }}>
        <div className="mx-auto max-w-[1200px] px-6 py-16 text-center">
          <Reveal>
            <p className="text-[11px] font-semibold tracking-[0.4em]" style={{ color: TOPO }}>EL PROCESO</p>
            <h2 className="mt-3 text-[36px] sm:text-[44px]" style={{ fontFamily: "var(--font-italiana)" }}>
              De la idea al brindis
            </h2>
          </Reveal>
          <div className="mx-auto mt-10 grid max-w-[900px] gap-8 sm:grid-cols-3">
            {[
              { n: "01", t: "Nos conocemos", d: "Una reunión para entender el evento que imaginás, el estilo y el presupuesto." },
              { n: "02", t: "Diseñamos y planificamos", d: "Propuesta, cronograma, proveedores y ambientación. Todo por escrito y con seguimiento." },
              { n: "03", t: "Vos disfrutás", d: "El día del evento coordinamos todo: montaje, tiempos, proveedores e imprevistos." },
            ].map((p, i) => (
              <Reveal key={p.n} delay={i * 120}>
                <p className="text-[34px]" style={{ fontFamily: "var(--font-pinyon)", color: TERRA }}>{p.n}</p>
                <p className="mt-1 text-[16px] font-semibold">{p.t}</p>
                <p className="mt-2 text-[13px] leading-relaxed opacity-75">{p.d}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Contacto */}
      <section id="contacto" className="mx-auto max-w-[1200px] px-6 py-16">
        <div className="grid gap-12 md:grid-cols-[1fr_1.1fr]">
          <Reveal>
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
          </Reveal>
          <Reveal delay={120} className="bg-white p-8 sm:p-10">
            <FormConsulta slug={tenant.slug} />
          </Reveal>
        </div>
      </section>

      <JessFooter logo={logo} ig={ig} />
    </div>
  );
}
