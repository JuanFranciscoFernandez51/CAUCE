import type { Metadata } from "next";
import type { BizArea } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { getPricing, fmtUsd } from "@/lib/pricing";
import { AREA_LABELS, CASOS } from "@/lib/casos";
import { catalogoPorArea } from "@/lib/procesos-catalogo";
import { PublicShell } from "@/components/public/shell";
import { ESPEJOS, PIEZA_BASE } from "@/lib/piezas";
import { Doors } from "@/components/public/doors";
import { Reveal, Parallax, StepsFlow } from "@/components/public/menta";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Cauce — Automatización con IA para tu negocio",
  description:
    "Tu página web y tu sistema de gestión, hechos 100% a tu medida. Dejá el Excel y el cuaderno: turnos, cobros, clientes y caja en un solo lugar. Bahía Blanca, Argentina.",
};

const WA_URL =
  "https://wa.me/5492915757101?text=Hola!%20Quiero%20un%20presupuesto%20para%20mi%20negocio.";

const PASOS = [
  {
    n: 1,
    titulo: "Nos contás cómo trabajás",
    detalle:
      "Una charla por WhatsApp o un café, sin tecnicismos. Qué vendés, cómo cobrás, qué te tiene podrido de hacer a mano.",
  },
  {
    n: 2,
    titulo: "Te mostramos uno andando",
    detalle:
      "Antes de pagar nada, ves un sistema de un negocio como el tuyo funcionando de verdad: su página, sus turnos, su caja.",
  },
  {
    n: 3,
    titulo: "Te lo armamos a tu medida",
    detalle:
      "Tu página web, tu gestión y tu marca, adaptado a cómo laburás vos — no vos a un sistema. En días, no en meses.",
  },
  {
    n: 4,
    titulo: "Vos atendés, el resto se simplifica",
    detalle:
      "Los turnos se agendan solos, los avisos de cobro salen listos para mandar y la caja cierra al día. Y si necesitás algo, nos escribís a nosotros, no a un 0800.",
  },
];

const AREA_ICONS: Record<BizArea, string> = {
  ATENCION: "💬",
  VENTAS_CRM: "📋",
  MARKETING: "📣",
  OPERACIONES: "📦",
  TURNOS: "📅",
  RRHH: "👥",
  FINANZAS: "💸",
};

/** Chips horizontales de áreas (estilo "We handle…" de menta). */
const AREA_CHIPS = [
  { icon: "💸", label: "Finanzas al día" },
  { icon: "📦", label: "Operaciones ordenadas" },
  { icon: "🧾", label: "Papelería sin tipeo" },
  { icon: "💬", label: "Atención que no se pierde" },
  { icon: "📅", label: "Turnos que se agendan solos" },
  { icon: "📋", label: "Ventas y CRM en un lugar" },
  { icon: "👥", label: "Equipo en orden" },
  { icon: "🔧", label: "Taller bajo control" },
  { icon: "📣", label: "Marketing en marcha" },
];

/** Capturas REALES del producto (Cloudinary, ver casos-reales.ts). */
const SHOTS = {
  mfDashboard:
    "https://res.cloudinary.com/dgtlyzyra/image/upload/v1785161802/cauce/sistema/casos/motos-fernandez/admin-full/ixvlghlwc8igfh3mcxub.png",
  mfInstagram:
    "https://res.cloudinary.com/dgtlyzyra/image/upload/v1785161916/cauce/sistema/casos/motos-fernandez/admin-full/spv4yuasztpnih7rbo80.png",
  mfOutreach:
    "https://res.cloudinary.com/dgtlyzyra/image/upload/v1785161911/cauce/sistema/casos/motos-fernandez/admin-full/mhnag8gqjfcqrawazmv6.png",
  mfTaller:
    "https://res.cloudinary.com/dgtlyzyra/image/upload/v1785161854/cauce/sistema/casos/motos-fernandez/admin-full/npfaq7hjnywtucys5x04.png",
  vbStock:
    "https://res.cloudinary.com/dgtlyzyra/image/upload/v1785162028/cauce/sistema/casos/vespa-bahia/admin-full/lzoyvxllf7qleofywcpk.png",
  vbArca:
    "https://res.cloudinary.com/dgtlyzyra/image/upload/v1785162158/cauce/sistema/casos/vespa-bahia/admin-full/wsgn9ito9uxchh43wa3t.png",
  lbCaja:
    "https://res.cloudinary.com/dgtlyzyra/image/upload/v1785162312/cauce/sistema/casos/la-base/admin-full/arpjgot7xmvrqhfazqos.png",
  lbCalendario:
    "https://res.cloudinary.com/dgtlyzyra/image/upload/v1785162281/cauce/sistema/casos/la-base/admin-full/vfsjkm62i3rbiq7f0ro3.png",
};

const DIA_CAUCE: [string, string, string][] = [
  ["09:02", "Un cliente sacó turno solo desde tu página", "📅"],
  ["10:40", 'Trabajo terminado: aviso de "listo para retirar" armado por WhatsApp', "🔧"],
  ["11:15", "Los avisos de cobro del mes salieron listos para mandar", "💸"],
  ["16:30", "Entró una consulta por la web y ya está en tu lista de clientes", "💬"],
  ["20:00", "La caja del día cerró sola: ingresos, gastos y diferencia", "✅"],
];

/** Marca de captura real flotante, con rotación leve y sombra suave. */
function Shot({
  src,
  alt,
  className = "",
  priority = false,
}: {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_24px_70px_-24px_rgba(11,15,22,0.45)] ${className}`}
    >
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes="(min-width: 1024px) 400px, 90vw"
        className="object-cover object-left-top"
      />
    </div>
  );
}

/** La tarjeta "Un día cualquiera adentro de Cauce" (contenido intacto, look menta). */
function DiaCard({ className = "" }: { className?: string }) {
  return (
    <div
      className={`menta-dark rounded-3xl border border-white/10 p-5 shadow-[0_30px_80px_-28px_rgba(11,15,22,0.6)] ${className}`}
    >
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-display text-sm font-medium">Un día cualquiera adentro de Cauce</p>
      </div>
      <p className="mt-0.5 text-[11px] text-muted-foreground">tu sistema, desde el celular</p>
      <ul className="mt-4 space-y-3 text-[13px]">
        {DIA_CAUCE.map(([h, t, icon]) => (
          <li key={h} className="flex items-start gap-2.5">
            <span aria-hidden className="text-sm">{icon}</span>
            <div className="leading-snug">
              <span className="font-mono text-[11px] text-accent">{h}</span>{" "}
              <span className="text-muted-foreground">{t}</span>
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-4 border-t border-white/10 pt-3 text-[11px] leading-snug text-muted-foreground">
        Sin plantillas: lo que ves acá se arma con TUS rubros, TUS precios y TU manera de
        trabajar.
      </p>
    </div>
  );
}

export default async function LandingPage() {
  const pricing = await getPricing();
  const byArea = catalogoPorArea();

  const areaCard = (area: BizArea, delay: number) => {
    const procesos = (byArea.get(area) ?? []).slice(0, 2);
    const caso = CASOS.find((c) => c.area === area);
    return (
      <Reveal key={area} delay={delay} className="h-full">
        <div className="flex h-full flex-col rounded-3xl border border-black/5 bg-background p-6">
          <div className="flex items-center gap-3">
            <span
              aria-hidden
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-lg"
            >
              {AREA_ICONS[area]}
            </span>
            <h3 className="font-display text-lg font-medium tracking-tight">
              {AREA_LABELS[area]}
            </h3>
          </div>
          <ul className="mt-4 flex-1 space-y-2.5 text-sm text-muted-foreground">
            {procesos.length > 0 ? (
              procesos.map((p) => (
                <li key={p.key} className="flex gap-2">
                  <span aria-hidden className="text-primary">✓</span>
                  <span>{p.queHace}</span>
                </li>
              ))
            ) : (
              <li className="flex gap-2">
                <span aria-hidden className="text-primary">✓</span>
                <span>{caso?.solucion ?? "Automatizaciones a medida para esta área."}</span>
              </li>
            )}
          </ul>
          {caso ? (
            <Link
              href={`/casos/${caso.slug}`}
              className="mt-4 text-sm font-medium text-primary hover:underline"
            >
              Ver el caso completo →
            </Link>
          ) : null}
        </div>
      </Reveal>
    );
  };

  return (
    <PublicShell>
      {/* ══ HERO — claro, título gigante + collage de capturas reales ══ */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-4 pb-14 pt-12 sm:px-6 sm:pt-16 lg:pt-20">
          <div className="grid items-center gap-12 lg:grid-cols-[1.02fr_1fr]">
            <div>
              <Reveal>
                <span className="inline-flex items-center rounded-full border border-black/10 bg-white px-4 py-1.5 text-xs font-medium text-muted-foreground">
                  Web + sistema de gestión a medida — Bahía Blanca, Argentina
                </span>
              </Reveal>
              <Reveal delay={90}>
                <h1 className="title-mega mt-5 text-[42px] sm:text-6xl lg:text-7xl xl:text-[80px]">
                  Tu negocio entero, en un sistema{" "}
                  <span className="text-primary">hecho 100% a tu medida</span>
                </h1>
              </Reveal>
              <Reveal delay={190}>
                <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
                  Tu página web, tu gestión y tus avisos automáticos, armados como trabajás
                  vos. Dejá el Excel, el cuaderno y las cosas lentas:{" "}
                  <span className="font-medium text-foreground">
                    todo en un solo lugar, simple y con tu marca.
                  </span>
                </p>
              </Reveal>
              <Reveal delay={280}>
                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <a
                    href={WA_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-12 items-center rounded-full bg-[#111111] px-7 text-sm font-medium text-white transition hover:bg-black"
                  >
                    Armemos el tuyo por WhatsApp
                  </a>
                  <Link
                    href="/casos"
                    className="inline-flex h-12 items-center rounded-full border border-black/10 bg-white px-7 text-sm font-medium transition hover:bg-black/5"
                  >
                    Ver casos reales →
                  </Link>
                </div>
              </Reveal>
            </div>

            {/* Collage desktop: capturas reales flotando con chips de UI y parallax */}
            <div className="relative hidden h-[600px] lg:block">
              <Parallax amount={34} className="absolute right-0 top-0 z-10 w-[400px]">
                <Reveal delay={150}>
                  <div className="rotate-[2deg]">
                    <Shot
                      src={SHOTS.mfDashboard}
                      alt="Dashboard real de Motos Fernández en Cauce"
                      className="aspect-[16/10]"
                      priority
                    />
                    <span className="ui-chip absolute -bottom-4 right-8 bg-white text-foreground">
                      ✓ Factura ARCA emitida
                    </span>
                  </div>
                </Reveal>
              </Parallax>
              <Parallax amount={-30} className="absolute bottom-4 right-8 z-30 w-[330px]">
                <Reveal delay={300}>
                  <div className="rotate-[-2deg]">
                    <Shot
                      src={SHOTS.lbCaja}
                      alt="Caja en 4 monedas de La Base en Cauce"
                      className="aspect-[16/10]"
                    />
                    <span className="ui-chip absolute -top-4 right-6 bg-primary text-primary-foreground">
                      📅 Un turno entró desde la web
                    </span>
                  </div>
                </Reveal>
              </Parallax>
              <Parallax amount={20} className="absolute left-0 top-10 z-20 w-[300px]">
                <Reveal delay={240}>
                  <div className="rotate-[-1.5deg]">
                    <DiaCard />
                    <span className="ui-chip absolute -bottom-4 left-8 bg-[#0B1220] text-white">
                      ⚡ Aviso de service enviado
                    </span>
                  </div>
                </Reveal>
              </Parallax>
            </div>
          </div>

          {/* Collage mobile: apilado */}
          <div className="mt-12 space-y-6 lg:hidden">
            <Reveal>
              <div className="relative rotate-[1deg]">
                <Shot
                  src={SHOTS.mfDashboard}
                  alt="Dashboard real de Motos Fernández en Cauce"
                  className="aspect-[16/10]"
                  priority
                />
                <span className="ui-chip absolute -bottom-4 left-4 bg-white text-foreground">
                  ✓ Factura ARCA emitida
                </span>
              </div>
            </Reveal>
            <Reveal delay={120}>
              <div className="relative pt-2">
                <DiaCard />
                <span className="ui-chip absolute -top-2 right-4 bg-primary text-primary-foreground">
                  ⚡ Aviso de service enviado
                </span>
              </div>
            </Reveal>
          </div>

          <Reveal className="mt-16">
            <Doors />
          </Reveal>
        </div>

        {/* Franja de logos de los casos, en gris */}
        <div className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
          <Reveal>
            <p className="text-center text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Negocios reales que ya fluyen con Cauce
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 opacity-70 grayscale">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/casos/motos-fernandez-logo.png"
                alt="Motos Fernández"
                className="h-9 w-auto object-contain"
              />
              <span className="font-display text-lg font-medium text-muted-foreground">
                Vespa Bahía
              </span>
              <span className="font-display text-lg font-medium text-muted-foreground">
                Vespa Club Bahía Blanca
              </span>
              <span className="font-display text-lg font-medium text-muted-foreground">
                Zatiori
              </span>
              <span className="font-display text-lg font-medium text-muted-foreground">
                La Base
              </span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/avefenix/logo.png"
                alt="Ave Fénix Publicidad"
                className="h-8 w-auto rounded-md bg-[#111] object-contain px-2 py-1"
              />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══ CÓMO FUNCIONA — mega-tarjeta clara, columna sticky + línea que se dibuja ══ */}
      <section id="como-funciona" className="scroll-mt-24 px-3 sm:px-4">
        <div className="mx-auto max-w-6xl rounded-[32px] border border-black/5 bg-card px-6 py-16 shadow-[0_2px_40px_-16px_rgba(17,17,17,0.1)] sm:rounded-[40px] sm:px-10 sm:py-24 lg:px-16">
          <div className="grid gap-14 lg:grid-cols-[1fr_1.1fr] lg:gap-10">
            <div className="lg:sticky lg:top-32 lg:self-start">
              <Reveal>
                <p className="text-sm font-semibold text-primary">Cómo funciona</p>
                <h2 className="title-mega mt-4 text-4xl sm:text-5xl lg:text-[56px]">
                  De tenerlo todo en la cabeza a tenerlo todo resuelto
                </h2>
                <p className="mt-5 max-w-md text-lg text-muted-foreground">
                  En cuatro pasos, sin tecnicismos y sin meses de espera.
                </p>
              </Reveal>
            </div>
            <StepsFlow pasos={PASOS} />
          </div>
        </div>
      </section>

      {/* ══ LA ENTREGA CAUCE — mega-tarjeta oscura con capturas flotando ══ */}
      <section className="mt-6 px-3 sm:px-4">
        <div className="menta-dark relative mx-auto max-w-6xl overflow-hidden rounded-[32px] px-6 py-16 sm:rounded-[40px] sm:px-10 sm:py-24 lg:px-16">
          {/* Glow de fondo */}
          <div
            aria-hidden
            className="pointer-events-none absolute -right-32 -top-40 h-[420px] w-[420px] rounded-full bg-[#2E6BFF]/30 blur-[130px]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-48 -left-32 h-[380px] w-[380px] rounded-full bg-[#7FE8FF]/15 blur-[130px]"
          />

          <div className="relative mx-auto max-w-2xl text-center">
            <Reveal>
              <span className="inline-flex items-center rounded-full border border-white/15 px-4 py-1.5 text-xs font-medium text-accent">
                La entrega Cauce
              </span>
              <h2 className="title-mega mt-5 text-4xl sm:text-5xl lg:text-[56px]">
                No te damos un bot suelto. Te damos tu negocio entero, online.
              </h2>
              <p className="mt-5 text-lg text-muted-foreground">
                Toda empresa que entra a Cauce se va con las tres patas funcionando en
                paralelo —y todo con{" "}
                <span className="font-medium text-foreground">tu marca</span>, no la
                nuestra.
              </p>
            </Reveal>
          </div>

          <div className="relative mt-14 grid gap-4 md:grid-cols-3">
            {[
              {
                icon: "🌐",
                t: "Tu página web",
                d: "No es un folleto: está enchufada a tu sistema. Los turnos, consultas y pedidos que entran por la web te caen adentro de la gestión, solos. Con tus colores y tu logo.",
              },
              {
                icon: "🗂️",
                t: "Tu software de gestión",
                d: "El back para operar: CRM, turnos, stock, finanzas, proyectos, equipo. Tu sistema propio, no una planilla — con tu marca y tu gente adentro.",
              },
              {
                icon: "⚡",
                t: "Tus automatizaciones",
                d: "Recordatorios de turno, avisos de cobro y seguimientos que salen armados, listos para mandar con un clic. Menos memoria, menos persecución, menos plata que se escapa.",
              },
            ].map((x, i) => (
              <Reveal key={x.t} delay={i * 100} className="h-full">
                <div className="flex h-full flex-col rounded-3xl border border-white/10 bg-white/[0.04] p-7">
                  <span
                    aria-hidden
                    className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-xl shadow-[0_14px_34px_-12px_rgba(46,107,255,0.7)]"
                  >
                    {x.icon}
                  </span>
                  <h3 className="mt-4 font-display text-xl font-medium tracking-tight">
                    {x.t}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{x.d}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal className="relative mt-8">
            <p className="mx-auto max-w-2xl text-center text-sm text-muted-foreground">
              Las tres conectadas entre sí: la web capta, el sistema ordena, los avisos
              empujan.{" "}
              <span className="font-medium text-foreground">
                Y todo se maneja desde el celular.
              </span>
            </p>
          </Reveal>

          {/* Collage oscuro: capturas reales del producto con chips y parallax */}
          <div className="relative mt-14 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Parallax amount={26}>
              <Reveal>
                <Shot
                  src={SHOTS.mfInstagram}
                  alt="Publicar en Instagram con un botón — Motos Fernández"
                  className="aspect-[4/3] rotate-[-1.5deg]"
                />
              </Reveal>
            </Parallax>
            <Parallax amount={-24}>
              <Reveal delay={90}>
                <div className="relative rotate-[1.5deg]">
                  <Shot
                    src={SHOTS.vbArca}
                    alt="Facturación ARCA — Vespa Bahía"
                    className="aspect-[4/3]"
                  />
                  <span className="ui-chip absolute -bottom-3 left-3 bg-white text-[#111111]">
                    ✓ Factura ARCA emitida
                  </span>
                </div>
              </Reveal>
            </Parallax>
            <Parallax amount={30}>
              <Reveal delay={180}>
                <div className="relative rotate-[1deg]">
                  <Shot
                    src={SHOTS.mfOutreach}
                    alt="Avisos por WhatsApp — Motos Fernández"
                    className="aspect-[4/3]"
                  />
                  <span className="ui-chip absolute -top-3 right-3 bg-primary text-primary-foreground">
                    ⚡ Aviso de service enviado
                  </span>
                </div>
              </Reveal>
            </Parallax>
            <Parallax amount={-20}>
              <Reveal delay={270}>
                <div className="relative rotate-[-1deg]">
                  <Shot
                    src={SHOTS.lbCalendario}
                    alt="Calendario del mes — La Base"
                    className="aspect-[4/3]"
                  />
                  <span className="ui-chip absolute -bottom-3 right-3 bg-[#0B1220] text-white ring-1 ring-white/15">
                    📷 Publicado en Instagram
                  </span>
                </div>
              </Reveal>
            </Parallax>
          </div>
        </div>
      </section>

      {/* ══ ÁREAS — mega-tarjeta clara con chips + grilla ══ */}
      <section className="mt-6 px-3 sm:px-4">
        <div className="mx-auto max-w-6xl rounded-[32px] border border-black/5 bg-card px-6 py-16 shadow-[0_2px_40px_-16px_rgba(17,17,17,0.1)] sm:rounded-[40px] sm:px-10 sm:py-24 lg:px-16">
          <div className="mx-auto max-w-3xl text-center">
            <Reveal>
              <h2 className="title-mega text-4xl sm:text-5xl lg:text-[56px]">
                Software 100% a tu medida, área por área
              </h2>
              <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
                El problema de los sistemas enlatados es que la mitad de las pestañas no las
                usás y la otra mitad es de otro rubro. Acá es al revés:{" "}
                <span className="font-medium text-foreground">
                  nos sentamos con vos, entendemos tu manera de trabajar y el software se
                  adapta a ella
                </span>
                . Todo lo de abajo funciona hoy en negocios reales.
              </p>
            </Reveal>
          </div>

          {/* Chips horizontales con ícono azul */}
          <Reveal className="mt-10">
            <div className="flex flex-wrap justify-center gap-2.5">
              {AREA_CHIPS.map((c) => (
                <span
                  key={c.label}
                  className="inline-flex items-center gap-2 rounded-full bg-muted py-1.5 pl-1.5 pr-4 text-sm font-medium"
                >
                  <span
                    aria-hidden
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-soft text-[13px]"
                  >
                    {c.icon}
                  </span>
                  {c.label}
                </span>
              ))}
            </div>
          </Reveal>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {areaCard("FINANZAS", 0)}
            {areaCard("OPERACIONES", 80)}
            <Reveal delay={160} className="h-full">
              <div className="flex h-full flex-col rounded-3xl border border-black/5 bg-background p-6">
                <div className="flex items-center gap-3">
                  <span
                    aria-hidden
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-lg"
                  >
                    🧾
                  </span>
                  <h3 className="font-display text-lg font-medium tracking-tight">
                    Papelería &amp; Documentos
                  </h3>
                </div>
                <ul className="mt-4 flex-1 space-y-2.5 text-sm text-muted-foreground">
                  <li className="flex gap-2">
                    <span aria-hidden className="text-primary">✓</span>
                    <span>
                      Boletos de compra-venta, presupuestos y órdenes de trabajo en PDF con
                      tu marca, listos para firmar o mandar por WhatsApp.
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span aria-hidden className="text-primary">✓</span>
                    <span>
                      Facturación oficial integrada: la factura sale del mismo sistema donde
                      cargaste la venta, sin tipear dos veces.
                    </span>
                  </li>
                </ul>
                <Link
                  href="/casos"
                  className="mt-4 text-sm font-medium text-primary hover:underline"
                >
                  Ver el caso completo →
                </Link>
              </div>
            </Reveal>
            {areaCard("ATENCION", 0)}
            {areaCard("TURNOS", 80)}
            {areaCard("VENTAS_CRM", 160)}
            {areaCard("RRHH", 0)}
            <Reveal delay={80} className="h-full">
              <div className="flex h-full flex-col rounded-3xl border border-black/5 bg-background p-6">
                <div className="flex items-center gap-3">
                  <span
                    aria-hidden
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-lg"
                  >
                    🔧
                  </span>
                  <h3 className="font-display text-lg font-medium tracking-tight">
                    Taller &amp; Órdenes de trabajo
                  </h3>
                </div>
                <ul className="mt-4 flex-1 space-y-2.5 text-sm text-muted-foreground">
                  <li className="flex gap-2">
                    <span aria-hidden className="text-primary">✓</span>
                    <span>
                      Cada trabajo entra con fotos y diagnóstico, avanza por estados y se
                      entrega con su orden imprimible y el saldo claro.
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span aria-hidden className="text-primary">✓</span>
                    <span>
                      Un presupuesto aceptado se convierte en orden de trabajo con un clic, y
                      el aviso de &quot;está listo para retirar&quot; sale armado por
                      WhatsApp.
                    </span>
                  </li>
                </ul>
                <Link
                  href="/casos"
                  className="mt-4 text-sm font-medium text-primary hover:underline"
                >
                  Ver el caso completo →
                </Link>
              </div>
            </Reveal>
            {areaCard("MARKETING", 160)}
          </div>

          <Reveal className="mt-12 text-center">
            <Link
              href="/casos"
              className="inline-flex h-12 items-center rounded-full border border-black/10 bg-white px-7 text-sm font-medium transition hover:bg-black/5"
            >
              Ver negocios reales que ya funcionan con Cauce →
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ══ PRECIOS — mega-tarjeta oscura ══ */}
      <section className="mt-6 px-3 sm:px-4">
        <div className="menta-dark relative mx-auto max-w-6xl overflow-hidden rounded-[32px] px-6 py-16 sm:rounded-[40px] sm:px-10 sm:py-24 lg:px-16">
          <div
            aria-hidden
            className="pointer-events-none absolute -left-32 -top-40 h-[420px] w-[420px] rounded-full bg-[#2E6BFF]/25 blur-[130px]"
          />
          <div className="relative mx-auto max-w-2xl text-center">
            <Reveal>
              <h2 className="title-mega text-4xl sm:text-5xl lg:text-[56px]">
                Precios simples, sin planes enlatados
              </h2>
              <p className="mt-5 text-lg text-muted-foreground">
                Pagás una base y le sumás solo las piezas que tu negocio usa. Precios en USD
                + IVA {pricing.ivaPct}%.
              </p>
            </Reveal>
          </div>

          <div className="relative mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Reveal className="h-full">
              <div className="flex h-full flex-col rounded-3xl border border-white/10 bg-white/[0.04] p-6">
                <h3 className="font-display text-lg font-medium tracking-tight">
                  1 · La base (va siempre)
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {PIEZA_BASE.queIncluye}
                </p>
                <div className="mt-5">
                  <p className="font-display text-3xl font-medium">
                    {fmtUsd(PIEZA_BASE.setupUsd)}
                    <span className="text-sm font-normal text-muted-foreground">
                      {" "}
                      por única vez
                    </span>
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    + {fmtUsd(PIEZA_BASE.monthlyUsd)}/mes (hosting, soporte y mejoras)
                  </p>
                </div>
              </div>
            </Reveal>
            <Reveal delay={90} className="h-full">
              <div className="flex h-full flex-col rounded-3xl border border-white/10 bg-white/[0.04] p-6">
                <h3 className="font-display text-lg font-medium tracking-tight">
                  2 · Las piezas de tu rubro
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                  Taller con órdenes de trabajo, turnos online, ventas con cuotas, caja
                  diaria, eventos con cronómetro… Sumás solo lo que usás — nada de pestañas
                  de otro rubro.
                </p>
                <div className="mt-5">
                  <p className="font-display text-3xl font-medium">
                    {fmtUsd(40)}
                    <span className="text-sm font-normal text-muted-foreground">
                      {" "}
                      por componente
                    </span>
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    + un mensual chico por mantenerla viva
                  </p>
                </div>
              </div>
            </Reveal>
            <Reveal delay={180} className="h-full">
              {/* Destacado: tarjeta clara sobre el fondo oscuro */}
              <div className="menta flex h-full flex-col rounded-3xl bg-card p-6 shadow-[0_24px_70px_-24px_rgba(11,15,22,0.7)]">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-display text-lg font-medium tracking-tight">
                    3 · Un negocio completo, real
                  </h3>
                </div>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {ESPEJOS[0].nombre}: {ESPEJOS[0].historia}
                </p>
                <div className="mt-5">
                  <p className="font-display text-3xl font-medium">
                    desde {fmtUsd(ESPEJOS[0].setupUsd)}
                    <span className="text-sm font-normal text-muted-foreground">
                      {" "}
                      todo armado
                    </span>
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    + {fmtUsd(ESPEJOS[0].monthlyUsd)}/mes con soporte directo
                  </p>
                </div>
              </div>
            </Reveal>
            <Reveal delay={270} className="h-full">
              <div className="flex h-full flex-col rounded-3xl border border-white/10 bg-white/[0.04] p-6">
                <h3 className="font-display text-lg font-medium tracking-tight">
                  4 · Escala
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                  Para empresas grandes: desarrollos a medida, integraciones con tus
                  sistemas, infraestructura dedicada y equipo asignado. Lo armamos juntos.
                </p>
                <div className="mt-5">
                  <p className="font-display text-3xl font-medium">A medida</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    valores según el proyecto
                  </p>
                </div>
              </div>
            </Reveal>
          </div>

          <Reveal className="relative mt-10 text-center">
            <a
              href={WA_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-12 items-center rounded-full bg-white px-7 text-sm font-semibold text-[#111111] transition hover:bg-white/90"
            >
              Armemos tu presupuesto por WhatsApp →
            </a>
          </Reveal>
        </div>
      </section>

      {/* ══ CTA FINAL — doble puerta ══ */}
      <section className="mx-auto max-w-4xl px-4 py-20 sm:px-6 sm:py-24">
        <Reveal>
          <h2 className="title-mega text-center text-4xl sm:text-5xl">
            ¿Listo para sacarte trabajo de encima?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-center text-lg text-muted-foreground">
            Elegí tu puerta: las dos terminan con tu sistema andando y tu día más liviano.
          </p>
        </Reveal>
        <Reveal delay={120} className="mt-10">
          <Doors compact />
        </Reveal>
      </section>
    </PublicShell>
  );
}
