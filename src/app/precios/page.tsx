import type { Metadata } from "next";
import Link from "next/link";
import { PublicShell } from "@/components/public/shell";
import { Reveal } from "@/components/public/menta";
import { PIEZA_BASE, PIEZAS, ESPEJOS } from "@/lib/piezas";

export const metadata: Metadata = {
  title: "Precios",
  description:
    "Base USD 300 + 40/mes. Cada componente, USD 40. Negocio completo real desde USD 999. Sin letra chica: lo que ves es lo que pagás.",
};

const WA =
  "https://wa.me/5492915757101?text=" +
  encodeURIComponent("Hola! Vi los precios de Cauce y quiero armar el sistema de mi negocio.");

const fmt = (n: number) => `USD ${n}`;

export default function PreciosPage() {
  const grandes = PIEZAS.filter((p) => !p.micro);
  const micros = PIEZAS.filter((p) => p.micro);

  return (
    <PublicShell>
      <section className="mx-auto max-w-6xl px-4 pb-16 pt-12 sm:px-6 sm:pt-16">
        <div className="mx-auto max-w-2xl text-center">
          <Reveal>
            <h1 className="title-mega text-[44px] sm:text-6xl lg:text-[72px]">
              Precios de frente
            </h1>
            <p className="mt-5 text-lg text-muted-foreground">
              Una base que va siempre, componentes con precio chico y visible, y
              anclas reales de negocios completos. Lo que ves es lo que pagás.
            </p>
          </Reveal>
        </div>

        {/* ── Los 4 planes (mismo modelo que la landing) ── */}
        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Reveal className="h-full">
            <div className="flex h-full flex-col rounded-[28px] border border-black/5 bg-card p-6 shadow-[0_2px_24px_-10px_rgba(17,17,17,0.1)]">
              <h2 className="font-display text-lg font-medium tracking-tight">La base</h2>
              <p className="mt-1 text-sm text-muted-foreground">{PIEZA_BASE.queIncluye}</p>
              <div className="mt-5 border-t pt-5">
                <p className="text-2xl font-bold">{fmt(PIEZA_BASE.setupUsd)}</p>
                <p className="text-sm text-muted-foreground">
                  de creación + {fmt(PIEZA_BASE.monthlyUsd)}/mes
                </p>
              </div>
            </div>
          </Reveal>
          <Reveal delay={90} className="h-full">
            <div className="flex h-full flex-col rounded-[28px] border border-black/5 bg-card p-6 shadow-[0_2px_24px_-10px_rgba(17,17,17,0.1)]">
              <h2 className="font-display text-lg font-medium tracking-tight">Componentes</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Taller, ventas, turnos, catálogo, finanzas… agregás lo que tu negocio
                necesita, cuando lo necesita.
              </p>
              <div className="mt-5 border-t pt-5">
                <p className="text-2xl font-bold">{fmt(40)} <span className="text-sm font-normal text-muted-foreground">cada uno</span></p>
                <p className="text-sm text-muted-foreground">+ su mensual chico (1 a 15 USD)</p>
              </div>
            </div>
          </Reveal>
          <Reveal delay={180} className="h-full">
            <div className="flex h-full flex-col rounded-[28px] border border-primary bg-card p-6 shadow-[0_2px_24px_-10px_rgba(17,17,17,0.1)] ring-1 ring-primary">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-display text-lg font-medium tracking-tight">Negocio completo</h2>
                <span className="rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-medium text-primary">
                  El elegido
                </span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Web + sistema entero + automatizaciones, como los casos reales que
                mostramos abajo.
              </p>
              <div className="mt-5 border-t pt-5">
                <p className="text-2xl font-bold">desde {fmt(999)}</p>
                <p className="text-sm text-muted-foreground">de creación + mensual según armado</p>
              </div>
            </div>
          </Reveal>
          <Reveal delay={270} className="h-full">
            <div className="flex h-full flex-col rounded-[28px] border border-black/5 bg-card p-6 shadow-[0_2px_24px_-10px_rgba(17,17,17,0.1)]">
              <h2 className="font-display text-lg font-medium tracking-tight">Escala</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Empresas grandes, integraciones especiales, varios locales o
                volúmenes fuera de serie.
              </p>
              <div className="mt-5 border-t pt-5">
                <p className="text-2xl font-bold">A medida</p>
                <p className="text-sm text-muted-foreground">lo cotizamos juntos</p>
              </div>
            </div>
          </Reveal>
        </div>

        {/* ── Desglose de componentes ── */}
        <div className="menta-dark mt-14 rounded-[32px] p-7 sm:rounded-[40px] sm:p-12">
          <Reveal>
            <span className="inline-flex items-center rounded-full border border-white/15 px-4 py-1.5 text-xs font-medium text-accent">
              El desglose, pieza por pieza
            </span>
            <h2 className="title-mega mt-4 text-3xl sm:text-4xl">Armá el tuyo como un lego</h2>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Cada componente cuesta <strong className="text-foreground">{fmt(40)} de
              creación</strong> más un mensual chico. Sumás y restás hasta que quede
              exactamente tu negocio.
            </p>
          </Reveal>
          <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {grandes.map((p, i) => (
              <Reveal key={p.key} delay={(i % 4) * 80}>
                <div className="h-full rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <p className="font-semibold">{p.label}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{p.queIncluye}</p>
                  <p className="mt-2 text-sm font-medium text-accent">
                    {fmt(p.setupUsd)} + {p.monthlyUsd}/mes
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
          <p className="mt-6 text-sm font-medium text-muted-foreground">Ajustes finos</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {micros.map((p) => (
              <span
                key={p.key}
                title={p.queIncluye}
                className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-muted-foreground"
              >
                {p.label} · {fmt(p.setupUsd)} + {p.monthlyUsd}/mes
              </span>
            ))}
          </div>
        </div>

        {/* ── Anclas: negocios completos reales ── */}
        <div className="mt-14">
          <Reveal>
            <h2 className="title-mega text-center text-3xl sm:text-4xl">
              ¿Cuánto sale un negocio completo?
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-center text-muted-foreground">
              Tres armados reales, con su precio real. El tuyo se arma igual: con tus
              piezas.
            </p>
          </Reveal>
          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {ESPEJOS.map((e, i) => (
              <Reveal key={e.key} delay={i * 100} className="h-full">
                <div className="flex h-full flex-col rounded-[28px] border border-black/5 bg-card p-6 shadow-[0_2px_24px_-10px_rgba(17,17,17,0.1)]">
                  <h3 className="font-display text-lg font-medium tracking-tight">{e.nombre}</h3>
                  <p className="text-xs text-muted-foreground">{e.rubro}</p>
                  <p className="mt-3 flex-1 text-sm text-muted-foreground">{e.historia}</p>
                  <div className="mt-5 border-t pt-4">
                    <p className="text-xl font-bold">
                      {fmt(e.setupUsd)}{" "}
                      <span className="text-sm font-normal text-muted-foreground">
                        + {e.monthlyUsd}/mes
                      </span>
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        {/* ── CTA ── */}
        <div className="menta-dark mt-14 rounded-[32px] px-6 py-12 text-center sm:rounded-[40px] sm:px-10">
          <h2 className="title-mega text-3xl sm:text-4xl">
            Contanos tu negocio y te lo cotizamos en el día
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-muted-foreground">
            15 minutos por WhatsApp: te decimos qué piezas lleva, cuánto sale de
            creación y cuánto por mes. Sin compromiso.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <a
              href={WA}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-11 items-center rounded-full bg-white px-6 text-sm font-semibold text-[#111111] transition hover:bg-white/90"
            >
              Cotizar por WhatsApp
            </a>
            <Link
              href="/casos"
              className="inline-flex h-11 items-center rounded-full border border-white/20 px-6 text-sm font-medium text-white transition hover:bg-white/10"
            >
              Ver los casos reales →
            </Link>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
