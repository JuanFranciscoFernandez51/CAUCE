import type { Client } from "@prisma/client";
import { FormConsulta } from "./form-consulta";

/**
 * Landing de Piletas Bahía Blanca — fiel al diseño del handoff:
 * hero en verde pizarra con la bajada en Cormorant ("piletas" en itálica),
 * logo PILETAS espaciado con doble onda, cards blancas de servicios,
 * abono oscuro insertado, obras con epígrafe abajo y banda aqua de valores.
 */
const PIZARRA = "#14201E";
const AGUA = "#17827A";
const CLARA = "#A9CFC7";
const CREMA = "#F5F1E8";
const ARENA = "#E3E0D6";
const GRIS = "#4C5C58";

const SERVICIOS = [
  { tag: "CONSTRUCCIÓN", titulo: "Piletas de hormigón proyectado", texto: "Diseño a medida, excavación, estructura, revestimiento en venecita y puesta en marcha. Plazos de 45 a 60 días hábiles." },
  { tag: "MANTENIMIENTO", titulo: "Agua lista todo el año", texto: "Visita semanal con química incluida, aspirado, cepillado y control de PH, cloro y alcalinidad en cada pasada." },
  { tag: "SERVICIO TÉCNICO", titulo: "Bombas, filtros y fugas", texto: "Detección de pérdidas, cambio de arena, reparación de equipos y venta de repuestos originales." },
];

const ABONO = ["Visita semanal programada", "Química y consumibles incluidos", "Control de bomba y filtro", "Informe de valores por WhatsApp"];

const VALORES = [
  { k: "PH", v: "7,2 — 7,6" },
  { k: "CLORO LIBRE", v: "1 — 3 ppm" },
  { k: "ALCALINIDAD", v: "80 — 120" },
];

/** El logo del brand book: PILETAS espaciado, doble onda, BAHÍA BLANCA abajo. */
function Logo({ claro, chico }: { claro?: boolean; chico?: boolean }) {
  const color = claro ? CREMA : PIZARRA;
  const w = chico ? 150 : 200;
  return (
    <span className="inline-block" style={{ width: w }}>
      <span
        className="block font-semibold"
        style={{ fontFamily: "var(--font-jost)", color, fontSize: chico ? 20 : 27, letterSpacing: "0.32em", lineHeight: 1 }}
      >
        PILETAS
      </span>
      <svg aria-hidden viewBox="0 0 200 14" className="block" style={{ width: "100%", height: chico ? 9 : 12, marginTop: 2 }}>
        <path d="M0 4 Q 25 0, 50 4 T 100 4 T 150 4 T 200 4" fill="none" stroke={AGUA} strokeWidth="2.6" />
        <path d="M0 10 Q 25 6, 50 10 T 100 10 T 150 10 T 200 10" fill="none" stroke={claro ? CLARA : "#8FBFB6"} strokeWidth="1.8" />
      </svg>
      <span
        className="block"
        style={{ fontFamily: "var(--font-jost)", color: claro ? CLARA : GRIS, fontSize: chico ? 9.5 : 12, letterSpacing: "0.42em", marginTop: 4 }}
      >
        BAHÍA BLANCA
      </span>
    </span>
  );
}

function SeccionTitulo({ titulo, num }: { titulo: string; num: string }) {
  return (
    <div className="flex items-end justify-between gap-4 border-b pb-4" style={{ borderColor: ARENA }}>
      <h2 className="text-[34px] sm:text-[42px]" style={{ fontFamily: "var(--font-cormorant)", color: PIZARRA, lineHeight: 1 }}>
        {titulo}
      </h2>
      <span className="text-[11px] font-semibold" style={{ fontFamily: "var(--font-jost)", color: "#8A8674", letterSpacing: "0.3em" }}>
        {num}
      </span>
    </div>
  );
}

export function PiletasHome({ tenant }: { tenant: Client }) {
  const st = (tenant.settings ?? {}) as { instagram?: string; zona?: string; fotos?: { hero?: string; obras?: string[] } };
  const wa = tenant.whatsapp?.replace(/\D/g, "") ?? "";
  const waLink = `https://wa.me/${wa}`;
  const tel = "291 526 0511";
  const ig = st.instagram ?? "piletasbahia.blanca";
  const fotos = st.fotos ?? {};

  const obras = [
    { titulo: "Hormigón, 8,00 × 3,50 m", lugar: "CABILDO", foto: fotos.obras?.[0], grande: true },
    { titulo: "Recuperación en 72 h", lugar: "", foto: fotos.obras?.[1] },
    { titulo: "Cambio de venecita", lugar: "", foto: fotos.obras?.[2] },
  ];

  return (
    <div style={{ backgroundColor: CREMA, color: PIZARRA, fontFamily: "var(--font-jost)" }}>
      {/* Header sobre crema */}
      <header className="sticky top-0 z-40" style={{ backgroundColor: "rgba(245,241,232,0.95)", backdropFilter: "blur(8px)" }}>
        <div className="mx-auto flex max-w-[1220px] items-center justify-between gap-6 px-6 py-4">
          <a href="#top" aria-label="Piletas Bahía Blanca"><Logo chico /></a>
          <div className="flex items-center gap-8">
            <nav className="hidden items-center gap-8 text-[13px] font-medium md:flex" style={{ letterSpacing: "0.18em" }}>
              <a href="#servicios" className="transition hover:opacity-60">SERVICIOS</a>
              <a href="#abono" className="transition hover:opacity-60">ABONO</a>
              <a href="#obras" className="transition hover:opacity-60">OBRAS</a>
            </nav>
            <a
              href={waLink} target="_blank" rel="noreferrer"
              className="px-6 py-3 text-[13px] font-medium transition hover:opacity-90"
              style={{ backgroundColor: PIZARRA, color: CREMA, letterSpacing: "0.1em" }}
            >
              {tel}
            </a>
          </div>
        </div>
      </header>

      {/* Hero oscuro, como el diseño */}
      <section id="top" className="mx-auto max-w-[1360px] px-3 sm:px-6">
        <div className="relative overflow-hidden" style={{ backgroundColor: PIZARRA, color: CREMA }}>
          {fotos.hero ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={fotos.hero} alt="" className="absolute inset-0 h-full w-full object-cover opacity-45" />
          ) : null}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{ background: "linear-gradient(90deg, rgba(20,32,30,0.94) 0%, rgba(20,32,30,0.65) 55%, rgba(20,32,30,0.35) 100%)" }}
          />
          <div className="relative px-7 py-20 sm:px-14 sm:py-28">
            <p className="text-[12px] font-medium" style={{ letterSpacing: "0.32em", color: CLARA }}>
              BAHÍA BLANCA Y ZONA
            </p>
            <h1 className="mt-6 max-w-[760px] text-[46px] leading-[1.05] sm:text-[68px]" style={{ fontFamily: "var(--font-cormorant)", fontWeight: 500 }}>
              Construimos,
              <br />
              mantenemos
              <br />
              y recuperamos <em>piletas</em>
            </h1>
            <p className="mt-6 max-w-[430px] text-[16px] leading-relaxed" style={{ color: "rgba(245,241,232,0.75)" }}>
              Obra de hormigón, abono mensual de mantenimiento, reparación de bombas y filtros. Un
              solo equipo para todo el año.
            </p>
            <div className="mt-10 flex justify-end">
              <a
                href="#contacto"
                className="px-9 py-4 text-[14px] font-medium transition hover:opacity-90"
                style={{ backgroundColor: CREMA, color: PIZARRA, letterSpacing: "0.08em" }}
              >
                Pedir presupuesto
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Servicios: cards blancas */}
      <section id="servicios" className="mx-auto max-w-[1220px] px-6 pb-4 pt-16">
        <SeccionTitulo titulo="Qué hacemos" num="01 · SERVICIOS" />
        <div className="mt-9 grid gap-6 md:grid-cols-3">
          {SERVICIOS.map((s) => (
            <div key={s.tag} className="bg-white p-7" style={{ boxShadow: "0 1px 0 rgba(20,32,30,0.05)" }}>
              <p className="text-[11px] font-semibold" style={{ color: AGUA, letterSpacing: "0.24em" }}>
                {s.tag}
              </p>
              <p className="mt-3 text-[24px] leading-tight" style={{ fontFamily: "var(--font-cormorant)" }}>
                {s.titulo}
              </p>
              <p className="mt-3 text-[14px] leading-[1.7]" style={{ color: GRIS }}>
                {s.texto}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Abono: bloque oscuro insertado */}
      <section id="abono" className="mx-auto max-w-[1220px] px-6 py-14">
        <div className="grid gap-10 px-8 py-14 sm:px-12 md:grid-cols-2" style={{ backgroundColor: PIZARRA, color: CREMA }}>
          <div>
            <p className="text-[12px] font-medium" style={{ letterSpacing: "0.3em", color: CLARA }}>
              02 · ABONO MENSUAL
            </p>
            <h2 className="mt-5 text-[36px] leading-[1.1] sm:text-[44px]" style={{ fontFamily: "var(--font-cormorant)", fontWeight: 500 }}>
              Una visita por semana y nada más que hacer
            </h2>
            <p className="mt-5 max-w-[380px] text-[15px] leading-relaxed" style={{ color: "rgba(245,241,232,0.72)" }}>
              Nos ocupamos del agua durante toda la temporada. Vos abrís la puerta y usás la pileta.
            </p>
            <a
              href={waLink} target="_blank" rel="noreferrer"
              className="mt-8 inline-block px-7 py-3.5 text-[13px] font-medium transition hover:opacity-90"
              style={{ backgroundColor: AGUA, color: CREMA, letterSpacing: "0.08em" }}
            >
              Ver planes
            </a>
          </div>
          <div className="grid content-center">
            {ABONO.map((a, i) => (
              <div key={a} className="flex items-center gap-6 border-t py-5" style={{ borderColor: "rgba(169,207,199,0.25)" }}>
                <span className="text-[12px]" style={{ color: CLARA, letterSpacing: "0.2em" }}>0{i + 1}</span>
                <span className="text-[16px]">{a}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Obras: grande a la izquierda, dos a la derecha, epígrafes abajo */}
      <section id="obras" className="mx-auto max-w-[1220px] px-6 pb-6">
        <SeccionTitulo titulo="Trabajos recientes" num="03 · OBRAS" />
        <div className="mt-9 grid gap-6 md:grid-cols-[1.55fr_1fr]">
          <figure>
            {obras[0].foto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={obras[0].foto} alt={obras[0].titulo} className="aspect-[16/10] w-full object-cover" />
            ) : (
              <div className="aspect-[16/10] w-full" style={{ backgroundColor: ARENA }} />
            )}
            <figcaption className="mt-3 flex items-baseline justify-between gap-4">
              <span className="text-[17px]" style={{ fontFamily: "var(--font-cormorant)" }}>{obras[0].titulo}</span>
              <span className="text-[11px]" style={{ color: "#8A8674", letterSpacing: "0.24em" }}>{obras[0].lugar}</span>
            </figcaption>
          </figure>
          <div className="grid gap-6">
            {obras.slice(1).map((o) => (
              <figure key={o.titulo}>
                {o.foto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={o.foto} alt={o.titulo} className="aspect-[16/9] w-full object-cover" />
                ) : (
                  <div className="aspect-[16/9] w-full" style={{ backgroundColor: ARENA }} />
                )}
                <figcaption className="mt-2 text-[14px]" style={{ color: GRIS }}>{o.titulo}</figcaption>
              </figure>
            ))}
          </div>
        </div>

        {/* Banda aqua de valores */}
        <div className="mt-14 grid gap-8 px-8 py-12 sm:px-12 md:grid-cols-[1fr_1.4fr]" style={{ backgroundColor: "#DCE9E5" }}>
          <p className="max-w-[260px] text-[26px] italic leading-snug" style={{ fontFamily: "var(--font-cormorant)", color: PIZARRA }}>
            Los valores que deberías ver en tu pileta
          </p>
          <div className="grid grid-cols-3 items-center gap-6">
            {VALORES.map((v) => (
              <div key={v.k}>
                <p className="text-[11px] font-semibold" style={{ color: GRIS, letterSpacing: "0.22em" }}>{v.k}</p>
                <p className="mt-2 text-[30px] sm:text-[34px]" style={{ fontFamily: "var(--font-cormorant)", color: AGUA }}>
                  {v.v}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contacto: tarjeta blanca con inputs subrayados */}
      <section id="contacto" className="mx-auto max-w-[1220px] px-6 py-16">
        <div className="grid gap-12 md:grid-cols-[1fr_1.1fr]">
          <div>
            <p className="text-[12px] font-semibold" style={{ color: "#8A8674", letterSpacing: "0.3em" }}>
              04 · CONTACTO
            </p>
            <h2 className="mt-4 max-w-[380px] text-[40px] leading-[1.08] sm:text-[48px]" style={{ fontFamily: "var(--font-cormorant)" }}>
              Contanos qué necesita tu pileta
            </h2>
            <p className="mt-5 max-w-[400px] text-[15px] leading-relaxed" style={{ color: GRIS }}>
              Respondemos el mismo día. Si es una obra, coordinamos una visita para medir sin cargo.
            </p>
            <div className="mt-8 border-t pt-6" style={{ borderColor: ARENA }}>
              <p className="text-[22px]" style={{ fontFamily: "var(--font-jost)" }}>
                <a href={waLink} target="_blank" rel="noreferrer" className="transition hover:opacity-60">{tel}</a>
              </p>
              <p className="mt-2 text-[15px]">
                <a href={`https://www.instagram.com/${ig}/`} target="_blank" rel="noreferrer" className="transition hover:opacity-60">@{ig}</a>
              </p>
              <p className="mt-2 text-[14px]" style={{ color: "#8A8674" }}>{st.zona ?? "Bahía Blanca, Punta Alta y Monte Hermoso"}</p>
            </div>
          </div>
          <div className="bg-white p-8 sm:p-10">
            <FormConsulta slug={tenant.slug} />
          </div>
        </div>
      </section>

      {/* Footer oscuro con el logo grande */}
      <footer style={{ backgroundColor: PIZARRA, color: CREMA }}>
        <div className="mx-auto flex max-w-[1220px] flex-wrap items-center justify-between gap-6 px-6 py-14">
          <Logo claro />
          <p className="text-[13px]" style={{ color: "rgba(245,241,232,0.5)" }}>© 2026 Piletas Bahía Blanca</p>
        </div>
      </footer>

      <a
        href={waLink} target="_blank" rel="noreferrer" aria-label="WhatsApp"
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full text-2xl shadow-lg transition-transform hover:scale-105"
        style={{ backgroundColor: "#25D366", color: "#fff" }}
      >
        💬
      </a>
    </div>
  );
}
