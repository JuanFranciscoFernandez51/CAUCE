import type { Client } from "@prisma/client";
import { FormConsulta } from "./form-consulta";

/**
 * Landing de Piletas Bahía Blanca, según su manual de marca y su handoff.
 * Verde pizarra #14201E, verde agua #17827A, agua clara #A9CFC7, crema #F5F1E8.
 * Cormorant Garamond para titulares, Jost para texto. La onda atraviesa el
 * logo de lado a lado y sobresale por los extremos: es la marca.
 */
const PIZARRA = "#14201E";
const AGUA = "#17827A";
const CLARA = "#A9CFC7";
const CREMA = "#F5F1E8";
const ARENA = "#E3E0D6";

const SERVICIOS = [
  {
    tag: "CONSTRUCCIÓN",
    titulo: "Piletas de hormigón proyectado",
    texto: "Diseño a medida, excavación, estructura, revestimiento en venecita y puesta en marcha. Plazos de 45 a 60 días hábiles.",
  },
  {
    tag: "MANTENIMIENTO",
    titulo: "Agua lista todo el año",
    texto: "Visita semanal con química incluida, aspirado, cepillado y control de PH, cloro y alcalinidad en cada pasada.",
  },
  {
    tag: "SERVICIO TÉCNICO",
    titulo: "Bombas, filtros y fugas",
    texto: "Detección de pérdidas, cambio de arena, reparación de equipos y venta de repuestos originales.",
  },
];

const ABONO = [
  "Visita semanal programada",
  "Química y consumibles incluidos",
  "Control de bomba y filtro",
  "Informe de valores por WhatsApp",
];

const OBRAS = [
  { titulo: "Hormigón, 8,00 × 3,50 m", lugar: "CABILDO" },
  { titulo: "Recuperación en 72 h", lugar: "AGUA VERDE" },
  { titulo: "Cambio de venecita", lugar: "BAHÍA BLANCA" },
];

const VALORES = [
  { k: "PH", v: "7,2 — 7,6" },
  { k: "CLORO LIBRE", v: "1 — 3 ppm" },
  { k: "ALCALINIDAD", v: "80 — 120" },
];

/** El logo: la onda siempre atraviesa el bloque y sobresale por los extremos. */
function Logo({ claro, chico }: { claro?: boolean; chico?: boolean }) {
  const color = claro ? CREMA : PIZARRA;
  return (
    <span className="relative inline-block" style={{ padding: "0 14px" }}>
      <span
        className="block font-semibold uppercase"
        style={{
          fontFamily: "var(--font-cormorant)",
          color,
          fontSize: chico ? 22 : 30,
          lineHeight: 0.95,
          letterSpacing: "0.04em",
        }}
      >
        Piletas
        <span className="block" style={{ fontSize: chico ? 11 : 14, letterSpacing: "0.3em", fontFamily: "var(--font-jost)" }}>
          Bahía Blanca
        </span>
      </span>
      <svg
        aria-hidden
        viewBox="0 0 120 12"
        preserveAspectRatio="none"
        className="absolute left-[-12px] right-[-12px]"
        style={{ top: chico ? 12 : 16, width: "calc(100% + 24px)", height: chico ? 8 : 10 }}
      >
        <path d="M0 6 Q 15 0, 30 6 T 60 6 T 90 6 T 120 6" fill="none" stroke={AGUA} strokeWidth="2.4" />
      </svg>
    </span>
  );
}

export function PiletasHome({ tenant }: { tenant: Client }) {
  const st = (tenant.settings ?? {}) as { instagram?: string; zona?: string };
  const wa = tenant.whatsapp?.replace(/\D/g, "") ?? "";
  const waLink = `https://wa.me/${wa}`;
  const telVisible = "291 526 0511";
  const ig = st.instagram ?? "piletasbahia.blanca";

  return (
    <div style={{ backgroundColor: CREMA, color: PIZARRA, fontFamily: "var(--font-jost)" }}>
      {/* Header */}
      <header
        className="sticky top-0 z-40 backdrop-blur-[8px]"
        style={{ backgroundColor: "rgba(245,241,232,0.94)", borderBottom: `1px solid ${ARENA}` }}
      >
        <div className="mx-auto flex max-w-[1140px] items-center justify-between gap-4 px-6 py-3">
          <a href="#top"><Logo chico /></a>
          <nav className="hidden items-center gap-7 text-[13px] font-medium uppercase tracking-[0.14em] md:flex">
            <a href="#servicios" className="transition hover:opacity-60">Servicios</a>
            <a href="#abono" className="transition hover:opacity-60">Abono</a>
            <a href="#obras" className="transition hover:opacity-60">Obras</a>
          </nav>
          <a
            href={waLink}
            target="_blank"
            rel="noreferrer"
            className="px-5 py-2.5 text-[13px] font-semibold tracking-[0.08em] transition hover:opacity-90"
            style={{ backgroundColor: AGUA, color: CREMA }}
          >
            {telVisible}
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-[1140px] px-6 pb-16 pt-14 sm:pt-20" id="top">
        <p className="text-[12px] font-semibold uppercase tracking-[0.28em]" style={{ color: AGUA }}>
          Bahía Blanca y zona
        </p>
        <h1
          className="mt-4 max-w-[820px] text-[44px] font-semibold leading-[1.02] sm:text-[64px]"
          style={{ fontFamily: "var(--font-cormorant)" }}
        >
          Construimos, mantenemos y recuperamos piletas
        </h1>
        <p className="mt-5 max-w-[520px] text-[16px] leading-relaxed" style={{ color: "#4C5C58" }}>
          Obra de hormigón, abono mensual de mantenimiento, reparación de bombas y filtros. Un solo
          equipo para todo el año.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <a
            href="#contacto"
            className="px-8 py-4 text-[14px] font-semibold uppercase tracking-[0.1em] transition hover:opacity-90"
            style={{ backgroundColor: PIZARRA, color: CREMA }}
          >
            Pedir presupuesto
          </a>
          <a href={`https://www.instagram.com/${ig}/`} target="_blank" rel="noreferrer" className="text-[14px] font-medium transition hover:opacity-60" style={{ color: AGUA }}>
            @{ig}
          </a>
        </div>
      </section>

      {/* Servicios */}
      <section id="servicios" style={{ backgroundColor: "#FFFFFF" }}>
        <div className="mx-auto max-w-[1140px] px-6 py-16">
          <p className="text-[12px] font-semibold uppercase tracking-[0.28em]" style={{ color: AGUA }}>
            01 · Servicios
          </p>
          <h2 className="mt-2 text-[34px] font-semibold" style={{ fontFamily: "var(--font-cormorant)" }}>
            Qué hacemos
          </h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {SERVICIOS.map((s) => (
              <div key={s.tag} className="border-t-2 pt-5" style={{ borderColor: AGUA }}>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: "#8A8674" }}>
                  {s.tag}
                </p>
                <p className="mt-2 text-[22px] font-semibold leading-tight" style={{ fontFamily: "var(--font-cormorant)" }}>
                  {s.titulo}
                </p>
                <p className="mt-2.5 text-[14px] leading-relaxed" style={{ color: "#4C5C58" }}>
                  {s.texto}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Abono */}
      <section id="abono" style={{ backgroundColor: PIZARRA, color: CREMA }}>
        <div className="mx-auto grid max-w-[1140px] gap-10 px-6 py-16 md:grid-cols-[1fr_1fr]">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.28em]" style={{ color: CLARA }}>
              02 · Abono mensual
            </p>
            <h2 className="mt-3 text-[34px] font-semibold leading-tight" style={{ fontFamily: "var(--font-cormorant)" }}>
              Una visita por semana y nada más que hacer
            </h2>
            <p className="mt-4 max-w-[420px] text-[15px] leading-relaxed" style={{ color: "rgba(245,241,232,0.8)" }}>
              Nos ocupamos del agua durante toda la temporada. Vos abrís la puerta y usás la pileta.
            </p>
            <a
              href={waLink}
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-block px-7 py-3.5 text-[13px] font-semibold uppercase tracking-[0.1em] transition hover:opacity-90"
              style={{ backgroundColor: AGUA, color: CREMA }}
            >
              Ver planes
            </a>
          </div>
          <div className="grid content-center gap-4">
            {ABONO.map((a, i) => (
              <div key={a} className="flex items-baseline gap-4 border-b pb-3" style={{ borderColor: "rgba(169,207,199,0.25)" }}>
                <span className="text-[15px] font-semibold" style={{ color: CLARA }}>
                  0{i + 1}
                </span>
                <span className="text-[16px]">{a}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Obras */}
      <section id="obras" className="mx-auto max-w-[1140px] px-6 py-16">
        <p className="text-[12px] font-semibold uppercase tracking-[0.28em]" style={{ color: AGUA }}>
          03 · Obras
        </p>
        <h2 className="mt-2 text-[34px] font-semibold" style={{ fontFamily: "var(--font-cormorant)" }}>
          Trabajos recientes
        </h2>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {OBRAS.map((o) => (
            <div key={o.titulo} className="flex aspect-[4/3] flex-col justify-end p-5" style={{ backgroundColor: ARENA }}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: AGUA }}>
                {o.lugar}
              </p>
              <p className="mt-1 text-[19px] font-semibold" style={{ fontFamily: "var(--font-cormorant)" }}>
                {o.titulo}
              </p>
            </div>
          ))}
        </div>

        {/* Valores del agua */}
        <div className="mt-12 border-t pt-8" style={{ borderColor: ARENA }}>
          <p className="text-[14px] font-medium" style={{ color: "#4C5C58" }}>
            Los valores que deberías ver en tu pileta
          </p>
          <div className="mt-4 grid max-w-[560px] grid-cols-3 gap-6">
            {VALORES.map((v) => (
              <div key={v.k}>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: "#8A8674" }}>
                  {v.k}
                </p>
                <p className="mt-1 text-[22px] font-semibold" style={{ fontFamily: "var(--font-cormorant)", color: AGUA }}>
                  {v.v}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contacto */}
      <section id="contacto" style={{ backgroundColor: "#FFFFFF" }}>
        <div className="mx-auto grid max-w-[1140px] gap-10 px-6 py-16 md:grid-cols-[1fr_1fr]">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.28em]" style={{ color: AGUA }}>
              04 · Contacto
            </p>
            <h2 className="mt-3 text-[34px] font-semibold leading-tight" style={{ fontFamily: "var(--font-cormorant)" }}>
              Contanos qué necesita tu pileta
            </h2>
            <p className="mt-4 max-w-[420px] text-[15px] leading-relaxed" style={{ color: "#4C5C58" }}>
              Respondemos el mismo día. Si es una obra, coordinamos una visita para medir sin cargo.
            </p>
            <div className="mt-6 space-y-2 text-[15px]">
              <p>
                <a href={waLink} target="_blank" rel="noreferrer" className="font-semibold" style={{ color: AGUA }}>
                  {telVisible}
                </a>
              </p>
              <p>
                <a href={`https://www.instagram.com/${ig}/`} target="_blank" rel="noreferrer" className="transition hover:opacity-60">
                  @{ig}
                </a>
              </p>
              <p style={{ color: "#4C5C58" }}>{st.zona ?? "Bahía Blanca, Punta Alta y Monte Hermoso"}</p>
            </div>
          </div>
          <FormConsulta slug={tenant.slug} />
        </div>
      </section>

      {/* Footer */}
      <footer style={{ backgroundColor: PIZARRA, color: CREMA }}>
        <div className="mx-auto flex max-w-[1140px] flex-wrap items-center justify-between gap-4 px-6 py-8">
          <Logo claro chico />
          <p className="text-[13px]" style={{ color: "rgba(245,241,232,0.6)" }}>
            © 2026 Piletas Bahía Blanca · {telVisible} · @{ig}
          </p>
        </div>
      </footer>

      {/* WhatsApp flotante */}
      <a
        href={waLink}
        target="_blank"
        rel="noreferrer"
        aria-label="Escribinos por WhatsApp"
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full text-2xl shadow-lg transition-transform hover:scale-105"
        style={{ backgroundColor: "#25D366", color: "#fff" }}
      >
        💬
      </a>
    </div>
  );
}
