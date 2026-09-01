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
import { Reveal, StepsFlow } from "@/components/public/menta";
import { FondoDither } from "@/components/public/fondo-dither";
import {
  Manifiesto,
  CarruselCasos,
  CintaClaim,
  CardGlow,
  BotonEspecular,
} from "@/components/public/vivo";

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
    "https://res.cloudinary.com/dgtlyzyra/image/upload/v1785262068/cauce/sistema/hero/yxkwcepjsbi89ow0yd0l.png",
  mfInstagram:
    "https://res.cloudinary.com/dgtlyzyra/image/upload/v1785262073/cauce/sistema/hero/busrdpddobawzs9vvofi.png",
  mfOutreach:
    "https://res.cloudinary.com/dgtlyzyra/image/upload/v1785262078/cauce/sistema/hero/l6g7ukrtktfxakiudnze.png",
  mfTaller:
    "https://res.cloudinary.com/dgtlyzyra/image/upload/v1785262083/cauce/sistema/hero/lmurwve5wpp40tyksszy.png",
  vbStock:
    "https://res.cloudinary.com/dgtlyzyra/image/upload/v1785262089/cauce/sistema/hero/exppo79knigxlmmv4dfh.png",
  vbArca:
    "https://res.cloudinary.com/dgtlyzyra/image/upload/v1785262094/cauce/sistema/hero/kbpruvdb425tez1a1mhi.png",
  lbCaja:
    "https://res.cloudinary.com/dgtlyzyra/image/upload/v1785262104/cauce/sistema/hero/kzrho8qgih7qsk2ywedn.png",
  lbCalendario:
    "https://res.cloudinary.com/dgtlyzyra/image/upload/v1785262114/cauce/sistema/hero/yjgjy29urlaxv33t4kti.png",
};

/** Las capturas, listas para el carrusel 3D (alt = qué hace, sin humo). */
const SHOTS_CARRUSEL = [
  { image: SHOTS.mfDashboard, alt: "Dashboard real de Motos Fernández en Cauce" },
  { image: SHOTS.lbCaja, alt: "Caja en 4 monedas de La Base en Cauce" },
  { image: SHOTS.vbArca, alt: "Facturación ARCA — Vespa Bahía" },
  { image: SHOTS.mfOutreach, alt: "Avisos por WhatsApp — Motos Fernández" },
  { image: SHOTS.lbCalendario, alt: "Calendario del mes — La Base" },
  { image: SHOTS.mfInstagram, alt: "Publicar en Instagram con un botón — Motos Fernández" },
  { image: SHOTS.mfTaller, alt: "Taller con órdenes de trabajo — Motos Fernández" },
  { image: SHOTS.vbStock, alt: "Stock del catálogo — Vespa Bahía" },
];

const DIA_CAUCE: [string, string, string][] = [
  ["09:02", "Un cliente sacó turno solo desde tu página", "📅"],
  ["10:40", 'Trabajo terminado: aviso de "listo para retirar" armado por WhatsApp', "🔧"],
  ["11:15", "Los avisos de cobro del mes salieron listos para mandar", "💸"],
  ["16:30", "Entró una consulta por la web y ya está en tu lista de clientes", "💬"],
  ["20:00", "La caja del día cerró sola: ingresos, gastos y diferencia", "✅"],
];

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
        <div className="flex h-full flex-col rounded-3xl border border-border bg-background p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
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
      {/* ══ HERO — tipografía gigante con UNA palabra verde serif + paisaje dither ══ */}
      <section className="relative overflow-hidden">
        <FondoDither />
        <div className="relative mx-auto max-w-6xl px-4 pb-10 pt-16 text-center sm:px-6 sm:pt-24 lg:pt-28">
          <Reveal>
            <span className="inline-flex items-center rounded-full border border-border bg-card/80 px-4 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur">
              Web + sistema de gestión a medida — Bahía Blanca, Argentina
            </span>
          </Reveal>
          <Reveal delay={90}>
            <h1 className="title-mega mx-auto mt-6 max-w-5xl text-[56px] sm:text-8xl lg:text-[112px]">
              Que tu negocio <span className="palabra-verde">fluya</span>
            </h1>
          </Reveal>
          <Reveal delay={190}>
            <p className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
              Tu página web, tu gestión y tus avisos automáticos, armados como trabajás
              vos. Dejá el Excel, el cuaderno y las cosas lentas:{" "}
              <span className="font-medium text-foreground">
                todo en un solo lugar, simple y con tu marca.
              </span>
            </p>
          </Reveal>
          <Reveal delay={280}>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <a
                href={WA_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-12 items-center rounded-full bg-foreground px-7 text-sm font-medium text-background transition hover:opacity-90 active:scale-[0.98]"
              >
                Armemos el tuyo por WhatsApp
              </a>
              <Link
                href="/casos"
                className="inline-flex h-12 items-center rounded-full border border-border bg-card px-7 text-sm font-medium transition hover:bg-muted active:scale-[0.98]"
              >
                Ver casos reales →
              </Link>
            </div>
          </Reveal>
        </div>

        {/* Franja de logos de los casos, en gris */}
        <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-14 sm:px-6">
          <Reveal>
            <p className="text-center text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Negocios reales que ya fluyen con Cauce
            </p>
            {/* La tira corre sola (se duplica para el loop) y pausa en hover */}
            <div className="tira-logos mt-6 opacity-70 grayscale dark:opacity-90">
              <div className="tira-logos-pista">
                {[0, 1].map((vuelta) => (
                  <div key={vuelta} className="flex items-center gap-x-10" aria-hidden={vuelta === 1}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/casos/motos-fernandez-logo.png"
                      alt="Motos Fernández"
                      className="h-9 w-auto object-contain dark:invert"
                    />
                    <span className="whitespace-nowrap font-display text-lg font-medium text-muted-foreground">
                      Vespa Bahía
                    </span>
                    <span className="whitespace-nowrap font-display text-lg font-medium text-muted-foreground">
                      Vespa Club Bahía Blanca
                    </span>
                    <span className="whitespace-nowrap font-display text-lg font-medium text-muted-foreground">
                      Zatiori
                    </span>
                    <span className="whitespace-nowrap font-display text-lg font-medium text-muted-foreground">
                      La Base
                    </span>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/avefenix/logo.png"
                      alt="Ave Fénix Publicidad"
                      className="h-8 w-auto rounded-md bg-foreground object-contain px-2 py-1"
                    />
                    <span className="whitespace-nowrap font-display text-lg font-medium text-muted-foreground">
                      Jess Design
                    </span>
                    <span className="whitespace-nowrap font-display text-lg font-medium text-muted-foreground">
                      Casa Milo
                    </span>
                    <span className="whitespace-nowrap font-display text-lg font-medium text-muted-foreground">
                      Código Auto
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══ MANIFIESTO — texto que se escribe solo al scrollear + un día adentro ══ */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
        <div className="grid items-center gap-12 lg:grid-cols-[1.25fr_0.75fr]">
          <Manifiesto
            es="No vendemos horas: vendemos procesos que se manejan solos. Tu página, tu gestión y tus avisos, armados como trabajás vos — para que el día rinda y el negocio fluya."
            en="We don't sell hours: we sell processes that run themselves. Your website, your operations and your reminders, built the way you work — so the day goes further and your business flows."
          />
          <Reveal delay={120}>
            <div className="relative">
              <DiaCard className="rotate-[-1.5deg]" />
              <span className="ui-chip absolute -top-3 right-4 bg-primary text-primary-foreground">
                📅 Un turno entró desde la web
              </span>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══ CÓMO FUNCIONA — mega-tarjeta clara, columna sticky + línea que se dibuja ══ */}
      <section id="como-funciona" className="scroll-mt-24 px-3 sm:px-4">
        <div className="mx-auto max-w-6xl rounded-[32px] border border-border bg-card px-6 py-16 shadow-[0_2px_40px_-16px_rgba(17,17,17,0.1)] sm:rounded-[40px] sm:px-10 sm:py-24 lg:px-16">
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

      {/* ══ LA ENTREGA CAUCE — mega-tarjeta oscura + carrusel 3D de capturas ══ */}
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
                <div className="flex h-full flex-col rounded-3xl border border-white/10 bg-white/[0.04] p-7 transition-all duration-300 hover:-translate-y-1 hover:bg-white/[0.06]">
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

          {/* Carrusel 3D con capturas reales del producto */}
          <Reveal className="relative mt-12">
            <p className="text-center text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Así se ve por dentro
            </p>
            <div className="mt-6">
              <CarruselCasos items={SHOTS_CARRUSEL} />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══ SEPARADOR — el claim girando en una cinta ══ */}
      <section className="overflow-hidden py-6 sm:py-10">
        <CintaClaim texto="Que tu negocio fluya ✦ Cauce" />
      </section>

      {/* ══ ÁREAS — mega-tarjeta clara con chips + grilla ══ */}
      <section className="px-3 sm:px-4">
        <div className="mx-auto max-w-6xl rounded-[32px] border border-border bg-card px-6 py-16 shadow-[0_2px_40px_-16px_rgba(17,17,17,0.1)] sm:rounded-[40px] sm:px-10 sm:py-24 lg:px-16">
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
              <div className="flex h-full flex-col rounded-3xl border border-border bg-background p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
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
              <div className="flex h-full flex-col rounded-3xl border border-border bg-background p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
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
              className="inline-flex h-12 items-center rounded-full border border-border bg-card px-7 text-sm font-medium transition hover:bg-muted"
            >
              Ver negocios reales que ya funcionan con Cauce →
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ══ PRECIOS — mega-tarjeta oscura con cards que brillan ══ */}
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
              <CardGlow>
                <div className="flex h-full flex-col p-6">
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
              </CardGlow>
            </Reveal>
            <Reveal delay={90} className="h-full">
              <CardGlow>
                <div className="flex h-full flex-col p-6">
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
              </CardGlow>
            </Reveal>
            <Reveal delay={180} className="h-full">
              {/* Destacado: tarjeta clara sobre el fondo oscuro, con glow animado */}
              <CardGlow destacada>
                <div className="menta flex h-full flex-col rounded-[23px] bg-card p-6">
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
              </CardGlow>
            </Reveal>
            <Reveal delay={270} className="h-full">
              <CardGlow>
                <div className="flex h-full flex-col p-6">
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
              </CardGlow>
            </Reveal>
          </div>

          <Reveal className="relative mt-10 text-center">
            <BotonEspecular href={WA_URL}>
              Armemos tu presupuesto por WhatsApp →
            </BotonEspecular>
          </Reveal>
        </div>
      </section>

      {/* ══ CTA FINAL — doble puerta, con el paisaje asomando de nuevo ══ */}
      <section className="relative overflow-hidden">
        <FondoDither invertida />
        <div className="relative mx-auto max-w-4xl px-4 py-20 sm:px-6 sm:py-28">
          <Reveal>
            <h2 className="title-mega text-center text-5xl sm:text-6xl lg:text-7xl">
              Que tu negocio <span className="palabra-verde">fluya</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-center text-lg text-muted-foreground">
              Elegí tu puerta: las dos terminan con tu sistema andando y tu día más liviano.
            </p>
          </Reveal>
          <Reveal delay={120} className="mt-10">
            <Doors compact />
          </Reveal>
        </div>
      </section>
    </PublicShell>
  );
}
