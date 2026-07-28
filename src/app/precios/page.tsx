import type { Metadata } from "next";
import {
  getPricing,
  usdToArs,
  fmtUsd,
  fmtArs,
  type PackKey,
  type PackPricing,
  type PricingData,
} from "@/lib/pricing";
import Link from "next/link";
import { PublicShell } from "@/components/public/shell";
import { Reveal } from "@/components/public/menta";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Precios",
  description:
    "Planes de automatización con IA: Starter, Pro, Scale y Custom. Setup único + mensual, precios en USD + IVA. Sin letra chica.",
};

const PACK_CTAS: Record<PackKey, { href: string; label: string }> = {
  starter: { href: "/registro", label: "Crealo ahora" },
  pro: { href: "/intake", label: "Pedir mi diagnóstico" },
  scale: { href: "/consultoria", label: "Agendar consultoría" },
  custom: { href: "/consultoria", label: "Agendar consultoría" },
};

function SetupBlock({ p, dolar }: { p: PackPricing; dolar: number }) {
  if (p.setupUsd === null) {
    return (
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Setup (pago único)
        </p>
        <p className="mt-0.5 font-semibold">A cotizar</p>
      </div>
    );
  }
  if (p.setupUsd === 0) {
    return (
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Setup (pago único)
        </p>
        <p className="mt-0.5 font-semibold text-success">Sin costo de setup</p>
      </div>
    );
  }
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Setup (pago único)
      </p>
      <p className="mt-0.5 font-semibold">
        {p.setupFrom ? "desde " : ""}
        {fmtUsd(p.setupUsd)} + IVA{" "}
        <span className="text-xs font-normal text-muted-foreground">
          (≈ {fmtArs(usdToArs(p.setupUsd, dolar))})
        </span>
      </p>
    </div>
  );
}

function MonthlyBlock({ p, dolar }: { p: PackPricing; dolar: number }) {
  if (p.monthlyUsd === null) {
    return (
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Mensual
        </p>
        <p className="mt-0.5 text-2xl font-bold">A consultar</p>
      </div>
    );
  }
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Mensual
      </p>
      <p className="mt-0.5 text-2xl font-bold">
        {p.monthlyFrom ? "desde " : ""}
        {fmtUsd(p.monthlyUsd)}
        <span className="text-sm font-normal text-muted-foreground"> /mes + IVA</span>
      </p>
      <p className="text-xs text-muted-foreground">
        (≈ {fmtArs(usdToArs(p.monthlyUsd, dolar))}/mes)
      </p>
    </div>
  );
}

function CauceOsBlock({ pricing }: { pricing: PricingData }) {
  const modules = Object.entries(pricing.modulePricing);
  return (
    <div className="menta-dark mt-14 rounded-[32px] p-7 sm:rounded-[40px] sm:p-12">
      <span className="inline-flex items-center rounded-full border border-white/15 px-4 py-1.5 text-xs font-medium text-accent">
        Incluido en Scale y Custom
      </span>
      <h2 className="title-mega mt-4 text-3xl sm:text-4xl">Cauce OS — tu software propio</h2>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Scale no es &quot;más bot&quot;: es tu sistema, con tu marca y tu dominio. Elegís
        los módulos que tu negocio necesita y todo queda conectado a tus
        automatizaciones: <strong className="text-foreground">el bot agenda y el turno cae en TU
        sistema</strong>, la venta descuenta de TU stock, el lead entra a TU CRM.
      </p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {modules.map(([key, m]) => (
          <div key={key} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <p className="font-semibold">{m.label}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {fmtUsd(m.monthlyUsd)}/mes + IVA
            </p>
            <p className="text-xs text-muted-foreground">
              ≈ {fmtArs(usdToArs(m.monthlyUsd, pricing.dolarArs))}/mes
            </p>
          </div>
        ))}
      </div>
      <p className="mt-5 text-sm text-muted-foreground">
        Sumás módulos a medida que crecés. Sin migraciones, sin volver a empezar.
      </p>
    </div>
  );
}

export default async function PreciosPage() {
  const pricing = await getPricing();
  const packOrder: PackKey[] = ["starter", "pro", "scale", "custom"];

  return (
    <PublicShell>
      <section className="mx-auto max-w-6xl px-4 pb-16 pt-12 sm:px-6 sm:pt-16">
        <div className="mx-auto max-w-2xl text-center">
          <Reveal>
            <h1 className="title-mega text-[44px] sm:text-6xl lg:text-[72px]">Precios</h1>
            <p className="mt-5 text-lg text-muted-foreground">
              Setup por única vez + mensual, siempre separados. Lo que ves es lo
              que pagás.
            </p>
          </Reveal>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {packOrder.map((key, i) => {
            const p = pricing.packs[key];
            const cta = PACK_CTAS[key];
            const highlighted = key === "pro";
            return (
              <Reveal key={key} delay={i * 90} className="h-full">
              <div
                className={`flex h-full flex-col rounded-[28px] border bg-card p-6 shadow-[0_2px_24px_-10px_rgba(17,17,17,0.1)] ${highlighted ? "border-primary ring-1 ring-primary" : "border-black/5"}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <h2 className="font-display text-lg font-medium tracking-tight">{p.label}</h2>
                  {highlighted ? (
                    <span className="rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-medium text-primary">
                      Más elegido
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{p.tagline}</p>

                <div className="mt-5 space-y-4 border-t pt-5">
                  <SetupBlock p={p} dolar={pricing.dolarArs} />
                  <MonthlyBlock p={p} dolar={pricing.dolarArs} />
                  {p.fairUseMsgs !== null ? (
                    <p className="text-xs text-muted-foreground">
                      Fair use: hasta {p.fairUseMsgs.toLocaleString("es-AR")} mensajes/mes
                    </p>
                  ) : null}
                </div>

                <ul className="mt-5 flex-1 space-y-2 border-t pt-5 text-sm">
                  {p.features.map((f) => (
                    <li key={f} className="flex gap-2">
                      <span aria-hidden className="text-primary">✓</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={cta.href}
                  className={`mt-6 inline-flex h-11 w-full items-center justify-center rounded-full text-sm font-medium transition ${
                    highlighted
                      ? "bg-[#111111] text-white hover:bg-black"
                      : "border border-black/10 bg-white hover:bg-black/5"
                  }`}
                >
                  {cta.label}
                </Link>
              </div>
              </Reveal>
            );
          })}
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Precios en USD + IVA {pricing.ivaPct}% (Factura A). Referencia en pesos
          al dólar {fmtArs(pricing.dolarArs)}.
        </p>

        <CauceOsBlock pricing={pricing} />
      </section>
    </PublicShell>
  );
}
