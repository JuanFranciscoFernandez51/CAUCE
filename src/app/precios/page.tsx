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
import { PublicShell } from "@/components/public/shell";
import { Card, Badge, ButtonLink } from "@/components/ui";

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
    <Card className="mt-12 p-6 sm:p-8">
      <Badge variant="primary">Incluido en Scale y Custom</Badge>
      <h2 className="mt-3 text-2xl font-bold">Cauce OS — tu software propio</h2>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Scale no es &quot;más bot&quot;: es tu sistema, con tu marca y tu dominio. Elegís
        los módulos que tu negocio necesita y todo queda conectado a tus
        automatizaciones: <strong className="text-foreground">el bot agenda y el turno cae en TU
        sistema</strong>, la venta descuenta de TU stock, el lead entra a TU CRM.
      </p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {modules.map(([key, m]) => (
          <div key={key} className="rounded-md border bg-muted/40 p-4">
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
      <p className="mt-4 text-sm text-muted-foreground">
        Sumás módulos a medida que crecés. Sin migraciones, sin volver a empezar.
      </p>
    </Card>
  );
}

export default async function PreciosPage() {
  const pricing = await getPricing();
  const packOrder: PackKey[] = ["starter", "pro", "scale", "custom"];

  return (
    <PublicShell>
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-4xl font-bold">Precios</h1>
          <p className="mt-3 text-muted-foreground">
            Setup por única vez + mensual, siempre separados. Lo que ves es lo
            que pagás.
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {packOrder.map((key) => {
            const p = pricing.packs[key];
            const cta = PACK_CTAS[key];
            const highlighted = key === "pro";
            return (
              <Card
                key={key}
                className={`flex flex-col p-6 ${highlighted ? "border-2 border-primary" : ""}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-lg font-bold">{p.label}</h2>
                  {highlighted ? <Badge variant="primary">Más elegido</Badge> : null}
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

                <ButtonLink
                  href={cta.href}
                  variant={highlighted ? "primary" : "secondary"}
                  className="mt-6 w-full"
                >
                  {cta.label}
                </ButtonLink>
              </Card>
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
