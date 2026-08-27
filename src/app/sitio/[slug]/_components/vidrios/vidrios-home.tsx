import type { Client } from "@prisma/client";
import { tenantBranding } from "@/lib/tenant";
import { Reveal } from "../conce/reveal";
import { VidriosConsulta } from "./vidrios-consulta";

/**
 * Landing de Código Auto (template VIDRIOS): hero verde con la mascota,
 * cinta de promesas, servicios, cómo trabajamos, ubicación y consulta al CRM.
 * WhatsApp e Instagram aparecen SOLO si están cargados (tenant.whatsapp /
 * settings.instagram) — Fran los pasa después y salen solos.
 * Perfil comercial (skill estética): movimiento que se siente, no se ve.
 */
const VERDE = "#008000";
const VERDE_OSCURO = "#005c00";
const TINTA = "#0c1f0c";
const FONDO = "#f4faf4";
const LINEA = "#cfe3cf";

const PROMESAS = [
  "Parabrisas de todas las marcas",
  "Colocación profesional",
  "Trabajamos con todos los seguros",
  "Repuestos y accesorios",
  "Atención en el día",
];

const SERVICIOS = [
  {
    icono: "🪟",
    titulo: "Venta de parabrisas",
    texto: "Vidrios para todas las marcas y modelos. Si no está en depósito, lo pedimos y llega en días.",
  },
  {
    icono: "🔧",
    titulo: "Colocación profesional",
    texto: "Taller propio con equipo fijo. Sellado garantizado y el auto listo en el día.",
  },
  {
    icono: "🛡️",
    titulo: "Gestión con seguros",
    texto: "¿Lo cubre el seguro? Cotizamos y hacemos la gestión con tu compañía para que no des vueltas.",
  },
  {
    icono: "🔩",
    titulo: "Repuestos",
    texto: "Burletes, molduras, levantavidrios y accesorios. Consultanos por tu modelo.",
  },
];

const PASOS = [
  {
    titulo: "Contanos qué se rompió",
    texto: "Escribinos con la marca y modelo del auto. Si es por seguro, avisanos con qué compañía.",
  },
  {
    titulo: "Te cotizamos en el día",
    texto: "Confirmamos el vidrio, el precio y coordinamos el turno de colocación.",
  },
  {
    titulo: "Lo colocamos y listo",
    texto: "Dejás el auto en 9 de Julio 578 y te lo llevás con el vidrio colocado y sellado.",
  },
];

/** El PNG del logo vino con fondo blanco: Cloudinary lo vuelve transparente al vuelo. */
const sinFondo = (url: string) =>
  url.includes("res.cloudinary.com") ? url.replace("/upload/", "/upload/e_make_transparent:12/") : url;

const DIRECCION = "9 de Julio 578, Bahía Blanca";
const MAPS = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent("Código Auto " + DIRECCION)}`;

export function VidriosHome({ tenant }: { tenant: Client }) {
  const branding = tenantBranding(tenant);
  const st = (tenant.settings ?? {}) as { instagram?: string; horarios?: string; direccion?: string };
  const wa = (tenant.whatsapp ?? "").replace(/\D/g, "");
  const waLink = wa ? `https://wa.me/${wa}` : "";
  const ig = (st.instagram ?? "").replace(/^@/, "");
  const direccion = st.direccion ?? DIRECCION;

  return (
    <div style={{ backgroundColor: FONDO, color: TINTA }}>
      {/* Header sticky que reacciona */}
      <header
        className="sticky top-0 z-40 border-b backdrop-blur"
        style={{ backgroundColor: "rgba(244,250,244,0.9)", borderColor: LINEA }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <a href="#top" className="flex items-center gap-2.5" aria-label={branding.displayName}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={sinFondo(branding.logo)} alt="" className="h-9 w-9 object-contain" />
            <span className="text-lg font-extrabold tracking-tight">
              Código <span style={{ color: VERDE }}>Auto</span>
            </span>
          </a>
          <nav className="hidden items-center gap-7 text-sm font-medium md:flex">
            <a href="#servicios" className="vid-link">Servicios</a>
            <a href="#pasos" className="vid-link">Cómo trabajamos</a>
            <a href="#ubicacion" className="vid-link">Ubicación</a>
          </nav>
          <a
            href={waLink || "#contacto"}
            {...(waLink ? { target: "_blank", rel: "noreferrer" } : {})}
            className="rounded-lg px-4 py-2.5 text-sm font-bold text-white transition hover:opacity-90 active:scale-[0.98]"
            style={{ backgroundColor: VERDE }}
          >
            {waLink ? "WhatsApp" : "Cotizar"}
          </a>
        </div>
      </header>

      {/* Hero verde con la mascota */}
      <section id="top" className="relative overflow-hidden" style={{ backgroundColor: VERDE, color: "#fff" }}>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(52% 70% at 78% 30%, rgba(255,255,255,0.22) 0%, transparent 70%), radial-gradient(40% 55% at 15% 85%, rgba(0,0,0,0.25) 0%, transparent 70%)",
          }}
        />
        <div className="relative mx-auto grid max-w-6xl items-center gap-8 px-4 py-16 sm:px-6 sm:py-20 md:grid-cols-[1.2fr_1fr] md:py-24">
          <Reveal>
            <div>
              <p className="text-[12px] font-bold uppercase" style={{ letterSpacing: "0.28em", color: "#d6f5d6" }}>
                Bahía Blanca · {direccion.split(",")[0]}
              </p>
              <h1 className="mt-5 text-5xl font-extrabold leading-[0.95] tracking-tight md:text-7xl">
                Tu parabrisas,
                <br />
                resuelto <em className="not-italic" style={{ color: "#b8ffb8" }}>en el día</em>.
              </h1>
              <p className="mt-6 max-w-md text-lg" style={{ color: "rgba(255,255,255,0.85)" }}>
                Venta y colocación de parabrisas para todas las marcas. Gestionamos con tu seguro y
                te entregamos el auto listo.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <a
                  href="#contacto"
                  className="rounded-lg px-7 py-4 text-[15px] font-bold transition hover:opacity-90 active:scale-[0.98]"
                  style={{ backgroundColor: "#fff", color: VERDE_OSCURO }}
                >
                  Pedí tu cotización
                </a>
                <a
                  href="#servicios"
                  className="rounded-lg border px-7 py-4 text-[15px] font-semibold transition hover:bg-white/10"
                  style={{ borderColor: "rgba(255,255,255,0.5)" }}
                >
                  Ver servicios
                </a>
              </div>
            </div>
          </Reveal>
          <Reveal delay={150} className="justify-self-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={sinFondo(branding.logo)}
              alt={`Mascota de ${branding.displayName}`}
              className="vid-flota w-56 drop-shadow-2xl sm:w-72 md:w-80"
            />
          </Reveal>
        </div>
      </section>

      {/* Cinta marquee de promesas */}
      <div className="overflow-hidden border-b py-3.5" style={{ backgroundColor: TINTA, color: "#d6f5d6", borderColor: TINTA }}>
        <div className="vid-marquee flex w-max items-center gap-10 pr-10 text-[13px] font-semibold uppercase" style={{ letterSpacing: "0.14em" }}>
          {[...PROMESAS, ...PROMESAS].map((t, i) => (
            <span key={i} className="flex items-center gap-10">
              {t} <span aria-hidden style={{ color: VERDE }}>✦</span>
            </span>
          ))}
        </div>
      </div>

      {/* Servicios */}
      <section id="servicios" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6 sm:py-20">
        <Reveal>
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Qué hacemos</h2>
          <p className="mt-2 max-w-xl text-[15px]" style={{ color: "#3c553c" }}>
            Cuatro sectores trabajando para que el vidrio esté cuando lo necesitás.
          </p>
        </Reveal>
        <div className="mt-9 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SERVICIOS.map((s, i) => (
            <Reveal key={s.titulo} delay={i * 90}>
              <div
                className="group h-full rounded-2xl border bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                style={{ borderColor: LINEA }}
              >
                <span
                  className="inline-flex h-12 w-12 items-center justify-center rounded-xl text-2xl transition-transform duration-300 group-hover:scale-110"
                  style={{ backgroundColor: FONDO }}
                  aria-hidden
                >
                  {s.icono}
                </span>
                <h3 className="mt-4 text-lg font-bold">{s.titulo}</h3>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: "#3c553c" }}>
                  {s.texto}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Cómo trabajamos: banda oscura, 3 pasos */}
      <section id="pasos" className="scroll-mt-20" style={{ backgroundColor: TINTA, color: "#fff" }}>
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <Reveal>
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              Cómo trabajamos<span style={{ color: "#b8ffb8" }}>.</span>
            </h2>
          </Reveal>
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {PASOS.map((p, i) => (
              <Reveal key={p.titulo} delay={i * 110}>
                <div className="border-t pt-5" style={{ borderColor: "rgba(255,255,255,0.18)" }}>
                  <span className="text-4xl font-extrabold" style={{ color: VERDE }}>
                    0{i + 1}
                  </span>
                  <h3 className="mt-3 text-lg font-bold">{p.titulo}</h3>
                  <p className="mt-2 text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.72)" }}>
                    {p.texto}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Ubicación */}
      <section id="ubicacion" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6">
        <div className="grid gap-8 md:grid-cols-2">
          <Reveal>
            <div className="h-full rounded-2xl border bg-white p-7" style={{ borderColor: LINEA }}>
              <p className="text-[11px] font-bold uppercase" style={{ letterSpacing: "0.24em", color: VERDE }}>
                Dónde estamos
              </p>
              <h2 className="mt-3 text-2xl font-extrabold tracking-tight">{direccion}</h2>
              <p className="mt-2 text-sm" style={{ color: "#3c553c" }}>
                A pasos del centro de Bahía Blanca. Podés dejar el auto y retirarlo con el vidrio colocado.
              </p>
              <a href={MAPS} target="_blank" rel="noreferrer" className="vid-link mt-5 inline-block text-sm font-bold" style={{ color: VERDE_OSCURO }}>
                Cómo llegar (Google Maps) →
              </a>
            </div>
          </Reveal>
          <Reveal delay={110}>
            <div className="h-full rounded-2xl p-7" style={{ backgroundColor: VERDE, color: "#fff" }}>
              <p className="text-[11px] font-bold uppercase" style={{ letterSpacing: "0.24em", color: "#d6f5d6" }}>
                Horarios y contacto
              </p>
              <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed">
                {st.horarios ?? "Lunes a viernes de 8 a 17 hs\nSábados de 9 a 13 hs"}
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                {waLink ? (
                  <a
                    href={waLink}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg px-5 py-3 text-sm font-bold transition hover:opacity-90"
                    style={{ backgroundColor: "#fff", color: VERDE_OSCURO }}
                  >
                    💬 WhatsApp
                  </a>
                ) : null}
                {ig ? (
                  <a
                    href={`https://www.instagram.com/${ig}/`}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg border px-5 py-3 text-sm font-semibold transition hover:bg-white/10"
                    style={{ borderColor: "rgba(255,255,255,0.5)" }}
                  >
                    📷 @{ig}
                  </a>
                ) : null}
                {!waLink && !ig ? (
                  <a
                    href="#contacto"
                    className="rounded-lg px-5 py-3 text-sm font-bold transition hover:opacity-90"
                    style={{ backgroundColor: "#fff", color: VERDE_OSCURO }}
                  >
                    Escribinos →
                  </a>
                ) : null}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Contacto → CRM */}
      <section id="contacto" className="scroll-mt-20 border-t" style={{ borderColor: LINEA }}>
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-2">
          <Reveal>
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                Pedí tu cotización
              </h2>
              <p className="mt-3 max-w-md text-[15px] leading-relaxed" style={{ color: "#3c553c" }}>
                Contanos qué vidrio necesitás y te respondemos con precio y turno. Si es por
                seguro, nos encargamos de la gestión.
              </p>
              <ul className="mt-6 space-y-2.5 text-sm" style={{ color: "#3c553c" }}>
                <li>✔ Respuesta en el día</li>
                <li>✔ Vidrios para todas las marcas</li>
                <li>✔ Colocación con garantía</li>
              </ul>
            </div>
          </Reveal>
          <Reveal delay={110}>
            <div className="rounded-2xl border bg-white p-6 shadow-sm sm:p-8" style={{ borderColor: LINEA }}>
              <VidriosConsulta slug={tenant.slug} />
            </div>
          </Reveal>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ backgroundColor: TINTA, color: "#fff" }}>
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-5 px-4 py-10 sm:px-6">
          <div className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={sinFondo(branding.logo)} alt="" className="h-10 w-10 object-contain" />
            <div>
              <p className="font-extrabold">Código Auto</p>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>
                Venta y colocación de parabrisas · {direccion}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>
            {ig ? (
              <a href={`https://www.instagram.com/${ig}/`} target="_blank" rel="noreferrer" className="transition hover:text-white">
                Instagram
              </a>
            ) : null}
            {waLink ? (
              <a href={waLink} target="_blank" rel="noreferrer" className="transition hover:text-white">
                WhatsApp
              </a>
            ) : null}
            <span>© {new Date().getFullYear()} Código Auto</span>
          </div>
        </div>
      </footer>

      {/* WhatsApp flotante — SOLO si hay número cargado */}
      {waLink ? (
        <a
          href={waLink}
          target="_blank"
          rel="noreferrer"
          aria-label="WhatsApp"
          className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full text-2xl shadow-lg transition-transform hover:scale-105"
          style={{ backgroundColor: "#25D366", color: "#fff" }}
        >
          💬
        </a>
      ) : null}

      <style>{`
        @keyframes vid-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .vid-marquee { animation: vid-marquee 30s linear infinite; }
        .vid-marquee:hover { animation-play-state: paused; }
        @keyframes vid-flota { from { transform: translateY(0); } to { transform: translateY(-12px); } }
        .vid-flota { animation: vid-flota 3.6s ease-in-out infinite alternate; }
        .vid-link { background: linear-gradient(currentColor, currentColor) no-repeat left bottom / 0% 2px; transition: background-size .3s; padding-bottom: 2px; }
        .vid-link:hover { background-size: 100% 2px; }
        @media (prefers-reduced-motion: reduce) {
          .vid-marquee, .vid-flota { animation: none; }
        }
      `}</style>
    </div>
  );
}
