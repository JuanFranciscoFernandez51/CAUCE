import type { Client } from "@prisma/client";
import { VidriosConsulta } from "./vidrios-consulta";
import { LogoCodigoAuto } from "./logo-codigoauto";
import { Aparece, Contador, EstilosVidrios } from "./vidrios-efectos";

/**
 * Web de Código Auto (Bariloche) — parabrisas, autopartes y colocación.
 * Diseño aprobado por el cliente: verde #009B57 + negro, titulares
 * condensados en itálica y foto real donde hay, placeholder donde falta.
 */
const VERDE = "#0DA25E";
const NEGRO = "#141414";
const HUESO = "#F1F2ED";

type Foto = { hero?: string; taller?: string; local?: string[]; siniestros?: string };

/** Titular condensado en itálica, la voz de la marca. */
function Titulo({ children, className = "", tono = NEGRO }: { children: React.ReactNode; className?: string; tono?: string }) {
  return (
    <h2
      className={`font-black uppercase leading-[0.92] ${className}`}
      style={{
        fontFamily: "var(--font-archivo)",
        fontStretch: "75%",
        fontStyle: "italic",
        letterSpacing: "-0.01em",
        color: tono,
      }}
    >
      {children}
    </h2>
  );
}

/** Hueco de foto: si el cliente todavía no la mandó, queda el recuadro. */
function Hueco({ alto = "h-[420px]", texto, foto }: { alto?: string; texto: string; foto?: string }) {
  if (foto) {
    return (
      <div className={`ca-zoom ${alto}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={foto} alt={texto} className="h-full w-full object-cover" />
      </div>
    );
  }
  return (
    <div
      className={`${alto} flex flex-col items-center justify-center gap-2 border-2 border-dashed text-center`}
      style={{ borderColor: "rgba(20,20,20,.22)", backgroundColor: "rgba(20,20,20,.04)" }}
    >
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="rgba(20,20,20,.45)" strokeWidth="1.6">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <path d="m21 15-5-5L5 21" />
      </svg>
      <p className="text-sm" style={{ color: "rgba(20,20,20,.6)" }}>{texto}</p>
    </div>
  );
}

const SERVICIOS = [
  { t: "Parabrisas", d: "Cambio completo con kit de pegado y sellado. Modelos con sensor de lluvia, cámara y banda degradé." },
  { t: "Lunetas y laterales", d: "Vidrios templados, ventiletes y lunetas con desempañador. Limpieza completa del habitáculo." },
  { t: "Autopartes", d: "Burletes, molduras, espejos, escobillas y accesorios. Venta al público y a talleres." },
  { t: "Reparación de picaduras", d: "Si el impacto es chico y no llegó al borde, se repara sin cambiar el cristal. Una fisura, no." },
  { t: "Colocación", d: "Colocamos lo que vendemos y también el cristal que traiga el cliente o la aseguradora." },
];

const PASOS_SEGURO = [
  "Hacés la denuncia en tu aseguradora y pedís que el trabajo lo haga Código Auto.",
  "Nos pasás el número de siniestro y los datos del auto por WhatsApp.",
  "Conseguimos el cristal y te damos turno. La colocación lleva unas horas.",
];

const PROMESAS = [
  "Parabrisas de todas las marcas",
  "Colocación profesional",
  "Trabajamos con todos los seguros",
  "Repuestos y accesorios",
  "Atención en el día",
];

const DATOS = [
  { n: "25 años", d: "En el rubro en Bariloche" },
  { n: "En el día", d: "Si la pieza está en stock" },
  { n: "Garantía", d: "Escrita sobre la colocación" },
  { n: "Todas", d: "Las marcas y modelos" },
];

export function VidriosHome({ tenant }: { tenant: Client }) {
  const st = (tenant.settings ?? {}) as {
    direccion?: string;
    ciudad?: string;
    provincia?: string;
    telefono?: string;
    instagram?: string;
    fotos?: Foto;
  };
  const fotos = st.fotos ?? {};
  const wa = tenant.whatsapp?.replace(/\D/g, "") || null;
  const tel = st.telefono ?? "2944 632884";
  const waLink = wa
    ? `https://wa.me/54${wa.replace(/^0/, "")}?text=${encodeURIComponent("Hola! Necesito un presupuesto. Mi auto es marca, modelo y año:")}`
    : null;
  const maps = "https://maps.google.com/?q=9+de+Julio+578+San+Carlos+de+Bariloche";

  const btn = "inline-flex items-center justify-center px-8 py-4 text-[15px] font-black uppercase italic transition-transform duration-200 hover:-translate-y-0.5 active:scale-[0.98] motion-reduce:transform-none";
  const btnStyle = { fontFamily: "var(--font-archivo)", fontStretch: "75%" } as React.CSSProperties;

  return (
    <div style={{ backgroundColor: HUESO, color: NEGRO, fontFamily: "var(--font-jost)" }}>
      <EstilosVidrios />
      {/* ── Header verde ── */}
      <header className="sticky top-0 z-40" style={{ backgroundColor: VERDE }}>
        <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-6 px-6 py-3">
          <a href="#top" className="shrink-0">
            <LogoCodigoAuto alto={34} bajada={false} />
          </a>
          <nav className="hidden items-center gap-8 text-[15px] font-medium text-white md:flex">
            <a href="#servicios" className="transition hover:opacity-75">Servicios</a>
            <a href="#seguros" className="transition hover:opacity-75">Seguros</a>
            <a href="#taller" className="transition hover:opacity-75">El taller</a>
          </nav>
          <a
            href={`tel:${tel.replace(/\s/g, "")}`}
            className="px-5 py-3 text-[15px] font-black italic text-white transition hover:opacity-90"
            style={{ ...btnStyle, backgroundColor: "rgba(0,0,0,.78)" }}
          >
            {tel}
          </a>
        </div>
      </header>

      {/* Cinta de promesas */}
      <div className="ca-cinta" style={{ backgroundColor: NEGRO, color: "#fff" }}>
        <div className="ca-cinta-tira py-2.5">
          {[...PROMESAS, ...PROMESAS, ...PROMESAS, ...PROMESAS].map((t, i) => (
            <span key={i} className="px-6 text-[12px] font-semibold uppercase" style={{ letterSpacing: "0.16em" }}>
              {t} <span className="pl-6" style={{ color: VERDE }}>◆</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── Hero negro ── */}
      <section id="top" className="relative overflow-hidden" style={{ backgroundColor: NEGRO }}>
        {fotos.hero ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={fotos.hero} alt="" className="ca-kb absolute inset-0 h-full w-full object-cover opacity-45" />
            <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(20,20,20,.94) 40%, rgba(20,20,20,.55) 100%)" }} />
          </>
        ) : null}
        <span className="ca-brillo" style={{ left: 0 }} aria-hidden="true" />
        <div className="relative mx-auto max-w-[1280px] px-6 py-16 sm:py-24">
          <Aparece>
          <p className="text-[12px] font-semibold uppercase tracking-[0.28em]" style={{ color: VERDE }}>
            Bariloche · Desde hace 25 años
          </p>
          <Titulo className="mt-5 max-w-[900px] text-[42px] sm:text-[76px]" tono="#ffffff">
            Te rompieron el parabrisas.<br className="hidden sm:block" /> Nosotros lo resolvemos.
          </Titulo>
          </Aparece>
          <Aparece delay={140}>
          <p className="mt-7 max-w-[520px] text-[17px] leading-[1.6]" style={{ color: "rgba(255,255,255,.78)" }}>
            Parabrisas, lunetas, vidrios laterales y autopartes para todas las marcas. Conseguimos el cristal, lo
            colocamos y gestionamos el trámite con tu seguro.
          </p>
          <div className="mt-9 flex flex-wrap gap-4">
            {waLink ? (
              <a href={waLink} target="_blank" rel="noreferrer" className={`${btn} ca-btn`} style={{ ...btnStyle, backgroundColor: VERDE, color: "#fff" }}>
                Pedir presupuesto
              </a>
            ) : (
              <a href="#contacto" className={`${btn} ca-btn`} style={{ ...btnStyle, backgroundColor: VERDE, color: "#fff" }}>
                Pedir presupuesto
              </a>
            )}
            <a
              href={`tel:${tel.replace(/\s/g, "")}`}
              className={`${btn} ca-btn`}
              style={{ ...btnStyle, border: "2px solid rgba(255,255,255,.55)", color: "#fff" }}
            >
              Llamar al {tel}
            </a>
          </div>
          </Aparece>
        </div>

        {/* Franja de datos */}
        <div className="relative grid grid-cols-2 md:grid-cols-4" style={{ backgroundColor: VERDE }}>
          {DATOS.map((d, i) => (
            <div
              key={d.n}
              className="px-6 py-6"
              style={{ borderLeft: i ? "1px solid rgba(255,255,255,.28)" : undefined }}
            >
              <p className="text-[26px] font-black italic text-white" style={btnStyle}>
                {i === 0 ? <><Contador hasta={25} /> años</> : d.n}
              </p>
              <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: "rgba(255,255,255,.85)" }}>
                {d.d}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Servicios ── */}
      <section id="servicios" className="mx-auto max-w-[1280px] px-6 py-20">
        <Aparece className="flex flex-wrap items-start justify-between gap-8">
          <Titulo className="max-w-[540px] text-[38px] sm:text-[52px]">Todo el vidrio del automóvil</Titulo>
          <p className="max-w-[460px] text-[16px] leading-[1.6]" style={{ color: "rgba(20,20,20,.65)" }}>
            Trabajamos con cristal laminado y templado original y alternativo. Si no lo tenemos, lo pedimos.
          </p>
        </Aparece>

        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {SERVICIOS.map((s, i) => (
            <Aparece key={s.t} delay={i * 80}>
              <article
                className="ca-card h-full bg-white p-7"
                style={{ borderTop: `4px solid ${VERDE}`, color: VERDE, boxShadow: "0 1px 0 rgba(20,20,20,.06)" }}
              >
                <h3 className="text-[22px] font-black uppercase italic" style={{ ...btnStyle, color: NEGRO }}>{s.t}</h3>
                <p className="mt-3 text-[15px] leading-[1.6]" style={{ color: "rgba(20,20,20,.65)" }}>{s.d}</p>
              </article>
            </Aparece>
          ))}

          <Aparece delay={400}>
          <article className="ca-card h-full p-7" style={{ backgroundColor: NEGRO, color: VERDE }}>
            <h3 className="text-[22px] font-black uppercase italic text-white" style={btnStyle}>
              ¿No sabés qué cristal lleva tu auto?
            </h3>
            <p className="mt-3 text-[15px] leading-[1.6]" style={{ color: "rgba(255,255,255,.7)" }}>
              Mandanos marca, modelo, año y una foto. Te decimos qué va y cuánto sale.
            </p>
            {waLink ? (
              <a
                href={waLink}
                target="_blank"
                rel="noreferrer"
                className="mt-5 inline-block text-[15px] font-black uppercase italic transition hover:opacity-80"
                style={{ ...btnStyle, color: VERDE }}
              >
                Escribinos por WhatsApp →
              </a>
            ) : (
              <a href="#contacto" className="mt-5 inline-block text-[15px] font-black uppercase italic" style={{ ...btnStyle, color: VERDE }}>
                Escribinos →
              </a>
            )}
          </article>
          </Aparece>
        </div>
      </section>

      {/* ── Seguros ── */}
      <section id="seguros" className="bg-white">
        <div className="mx-auto grid max-w-[1280px] items-start gap-12 px-6 py-20 lg:grid-cols-2">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.28em]" style={{ color: VERDE }}>
              Siniestros y aseguradoras
            </p>
            <Titulo className="mt-4 max-w-[460px] text-[38px] sm:text-[52px]">Del parte al auto listo, lo manejamos nosotros</Titulo>
            <p className="mt-6 max-w-[520px] text-[16px] leading-[1.65]" style={{ color: "rgba(20,20,20,.65)" }}>
              Trabajamos habitualmente con siniestros. Vos hacés la denuncia, nos pasás el número y nosotros
              coordinamos la orden, el cristal y el turno. En la mayoría de los casos solo pagás la franquicia si tu
              póliza la tiene.
            </p>
            <ol className="mt-8">
              {PASOS_SEGURO.map((p, i) => (
                <Aparece key={p} delay={i * 120}>
                <li className="ca-paso flex gap-5 py-4" style={{ color: "rgba(20,20,20,.25)" }}>
                  <span className="text-[17px] font-black italic" style={{ ...btnStyle, color: VERDE }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-[15px] leading-[1.6]" style={{ color: "rgba(20,20,20,.75)" }}>{p}</span>
                </li>
                </Aparece>
              ))}
            </ol>
          </div>
          <Aparece delay={120}><Hueco alto="h-[520px]" texto="Foto: colocación en el taller" foto={fotos.siniestros} /></Aparece>
        </div>
      </section>

      {/* ── El taller ── */}
      <section id="taller" className="mx-auto max-w-[1280px] px-6 py-20">
        <Aparece className="flex flex-wrap items-start justify-between gap-8">
          <Titulo className="max-w-[560px] text-[38px] sm:text-[52px]">El mismo local de 9 de Julio, hace 25 años</Titulo>
          <p className="max-w-[420px] text-[16px] leading-[1.6]" style={{ color: "rgba(20,20,20,.65)" }}>
            Seis personas, taller propio y stock de las piezas que más se rompen en Bariloche.
          </p>
        </Aparece>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <Aparece><Hueco texto="Frente del local" foto={fotos.local?.[0]} /></Aparece>
          <Aparece delay={110}><Hueco texto="El equipo trabajando" foto={fotos.local?.[1]} /></Aparece>
          <Aparece delay={220}><Hueco texto="Detalle de colocación" foto={fotos.local?.[2]} /></Aparece>
        </div>
      </section>

      {/* ── CTA verde ── */}
      <section id="contacto" style={{ backgroundColor: VERDE }}>
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-10 px-6 py-20">
          <Aparece className="max-w-[620px]">
            <Titulo className="text-[38px] sm:text-[56px]" tono="#ffffff">
              Mandá marca, modelo y año. Te pasamos el precio hoy.
            </Titulo>
            <p className="mt-6 text-[17px]" style={{ color: "rgba(255,255,255,.85)" }}>
              Presupuesto sin cargo, por WhatsApp o por teléfono.
            </p>
          </Aparece>
          {waLink ? (
            <a href={waLink} target="_blank" rel="noreferrer" className={`${btn} ca-btn px-12`} style={{ ...btnStyle, backgroundColor: "#fff", color: VERDE }}>
              Escribinos ahora
            </a>
          ) : (
            <div className="w-full max-w-[420px] bg-white p-6">
              <VidriosConsulta slug={tenant.slug} />
            </div>
          )}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ backgroundColor: NEGRO, color: "#fff" }}>
        <div className="mx-auto grid max-w-[1280px] gap-10 px-6 py-16 md:grid-cols-4">
          <div>
            <LogoCodigoAuto alto={42} />
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em]" style={{ color: "rgba(255,255,255,.5)" }}>
              Dónde estamos
            </p>
            <a href={maps} target="_blank" rel="noreferrer" className="mt-3 block text-[16px] leading-[1.6] transition hover:opacity-70">
              9 de Julio 578<br />San Carlos de Bariloche<br />Río Negro
            </a>
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em]" style={{ color: "rgba(255,255,255,.5)" }}>
              Contacto
            </p>
            <a href={`tel:${tel.replace(/\s/g, "")}`} className="mt-3 block text-[22px] font-black italic transition hover:opacity-80" style={btnStyle}>
              {tel}
            </a>
            {waLink ? (
              <a href={waLink} target="_blank" rel="noreferrer" className="mt-1 block text-[16px] transition hover:opacity-70" style={{ color: VERDE }}>
                WhatsApp
              </a>
            ) : null}
            {st.instagram ? (
              <a
                href={`https://www.instagram.com/${st.instagram}/`}
                target="_blank"
                rel="noreferrer"
                className="mt-1 block text-[16px] transition hover:opacity-70"
                style={{ color: VERDE }}
              >
                @{st.instagram}
              </a>
            ) : null}
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em]" style={{ color: "rgba(255,255,255,.5)" }}>
              Horarios
            </p>
            <p className="mt-3 text-[16px] leading-[1.6]">
              Lunes a viernes
              <br />
              <span style={{ color: "rgba(255,255,255,.7)" }}>8:30 a 18:00</span>
            </p>
            <p className="mt-3 text-[16px] leading-[1.6]">
              Sábados
              <br />
              <span style={{ color: "rgba(255,255,255,.7)" }}>9:00 a 13:00</span>
            </p>
          </div>
        </div>
      </footer>

      {/* WhatsApp flotante */}
      {waLink ? (
        <a
          href={waLink}
          target="_blank"
          rel="noreferrer"
          aria-label="Escribinos por WhatsApp"
          className="ca-late fixed bottom-5 right-5 z-[70] flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-transform duration-300 hover:-translate-y-1 motion-reduce:transform-none"
          style={{ backgroundColor: "#25D366" }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="#fff">
            <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5.1-1.3A10 10 0 1 0 12 2Zm5.5 14.1c-.2.7-1.3 1.3-1.9 1.4-.5.1-1.1.2-3.4-.7-2.9-1.2-4.7-4.1-4.9-4.3-.1-.2-1.1-1.5-1.1-2.9s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.4l.9 2.1c.1.2.1.4 0 .6l-.4.6-.5.5c-.2.2-.3.3-.1.6.2.3.9 1.4 1.9 2.3 1.3 1.2 2.4 1.5 2.7 1.7.3.1.5.1.7-.1l1-1.2c.2-.3.4-.2.7-.1l2.1 1c.3.2.5.3.6.4.1.2.1.7-.1 1.3Z" />
          </svg>
        </a>
      ) : null}
    </div>
  );
}
