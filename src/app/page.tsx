import type { Metadata } from "next";
import type { BizArea, Recipe } from "@prisma/client";
import { db } from "@/lib/db";
import { getPricing, usdToArs, fmtUsd, fmtArs, type PackKey } from "@/lib/pricing";
import { AREA_LABELS, CASOS } from "@/lib/casos";
import { PublicShell } from "@/components/public/shell";
import { CurrentLines } from "@/components/public/cauce-mark";
import { SemanaEnVivo } from "@/components/public/semana-en-vivo";
import { Doors } from "@/components/public/doors";
import { Card, Badge, ButtonLink } from "@/components/ui";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Cauce — Automatización con IA para tu negocio",
  description:
    "Cualquier empresa, cualquier proceso, resuelto con mínimos clicks. Bots de WhatsApp, CRM, turnos, stock y más, funcionando solos. Bahía Blanca, Argentina.",
};

const PASOS = [
  {
    n: 1,
    titulo: "Contanos tu proceso",
    detalle:
      "En 5 pasos guiados o en una videollamada gratis. Sin tecnicismos: nos contás qué te come el día.",
  },
  {
    n: 2,
    titulo: "Diagnóstico con IA",
    detalle:
      "Nuestra IA cruza tu caso contra el recetario completo de automatizaciones y arma tu plan a medida.",
  },
  {
    n: 3,
    titulo: "Lo construimos y probamos",
    detalle:
      "Armamos el flujo, lo conectamos a tus apps y lo probamos con casos reales antes de que toque un cliente.",
  },
  {
    n: 4,
    titulo: "Corre solo y te reporta",
    detalle:
      "El proceso se maneja solo, todos los días. Vos recibís reportes con resultados, no tareas nuevas.",
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

const AREA_ORDER: BizArea[] = [
  "ATENCION",
  "VENTAS_CRM",
  "MARKETING",
  "OPERACIONES",
  "TURNOS",
  "RRHH",
  "FINANZAS",
];

function setupLine(p: { setupUsd: number | null; setupFrom: boolean }): string {
  if (p.setupUsd === null) return "Setup a cotizar";
  if (p.setupUsd === 0) return "Sin costo de setup";
  return `Setup ${p.setupFrom ? "desde " : ""}${fmtUsd(p.setupUsd)} + IVA`;
}

export default async function LandingPage() {
  let recipes: Recipe[] = [];
  try {
    recipes = await db.recipe.findMany({ where: { active: true } });
  } catch (e) {
    console.error("landing: error leyendo recetas", e);
  }
  const pricing = await getPricing();

  const byArea = new Map<BizArea, Recipe[]>();
  for (const r of recipes) {
    const list = byArea.get(r.area) ?? [];
    list.push(r);
    byArea.set(r.area, list);
  }

  const packOrder: PackKey[] = ["starter", "pro", "scale", "custom"];

  return (
    <PublicShell>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        <CurrentLines />
        <div className="relative mx-auto max-w-6xl px-4 pb-12 pt-16 sm:px-6 sm:pt-20">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div className="text-center lg:text-left">
              <Badge variant="primary">Automatización con IA — Bahía Blanca, Argentina</Badge>
              <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
                Cualquier empresa, cualquier proceso,{" "}
                <span className="text-primary">resuelto con mínimos clicks</span>
              </h1>
              <p className="mt-4 text-lg text-muted-foreground">
                No vendemos horas. Vendemos procesos que se manejan solos: mensajes,
                ventas, turnos, stock, cobranzas — corriendo sin vos.
              </p>
            </div>
            <SemanaEnVivo />
          </div>
          <div className="mx-auto mt-12 max-w-4xl">
            <Doors />
          </div>
        </div>
      </section>

      {/* ── Cómo funciona ── */}
      <section id="como-funciona" className="border-t bg-muted/40 scroll-mt-20">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="text-center text-3xl font-bold">Cómo funciona</h2>
          <p className="mx-auto mt-2 max-w-xl text-center text-muted-foreground">
            De &quot;esto me come el día&quot; a &quot;esto corre solo&quot;, en cuatro pasos.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PASOS.map((p) => (
              <Card key={p.n} className="p-5">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-soft text-sm font-bold text-primary">
                  {p.n}
                </div>
                <h3 className="mt-3 font-semibold">{p.titulo}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{p.detalle}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── Qué te entregamos (diferencial) ── */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="primary">La entrega Cauce</Badge>
          <h2 className="mt-4 text-3xl font-bold">No te damos un bot suelto. Te damos tu negocio entero, online.</h2>
          <p className="mt-3 text-muted-foreground">
            Toda empresa que entra a Cauce se va con las tres patas funcionando en paralelo
            —y todo con <span className="font-semibold text-foreground">tu marca</span>, no la nuestra.
          </p>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {[
            {
              icon: "🌐",
              t: "Tu página web",
              d: "Pública y lista para mostrar: institucional, catálogo, reservas online o tu carta. Con tus colores y tu logo. Si ya tenés web, nos integramos a ella.",
            },
            {
              icon: "🗂️",
              t: "Tu software de gestión",
              d: "El back para operar: CRM, turnos, stock, finanzas, proyectos, equipo. Tu sistema propio, no una planilla — con tu marca y tu gente adentro.",
            },
            {
              icon: "⚡",
              t: "Tus automatizaciones",
              d: "Trabajando solas 24/7: responden, agendan, cobran, hacen seguimiento y cargan todo al sistema. Vos recibís resultados, no tareas.",
            },
          ].map((x) => (
            <Card key={x.t} className="p-6">
              <div className="text-3xl">{x.icon}</div>
              <h3 className="mt-3 text-lg font-semibold">{x.t}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{x.d}</p>
            </Card>
          ))}
        </div>
        <p className="mx-auto mt-8 max-w-2xl text-center text-sm text-muted-foreground">
          Las tres conectadas entre sí: la web capta, el sistema ordena, las automatizaciones empujan.
          <span className="font-medium text-foreground"> Tu negocio funcionando solo, de punta a punta.</span>
        </p>
      </section>

      {/* ── Áreas ── */}
      <section className="border-t bg-muted/40">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-center text-3xl font-bold">Resolvemos todas las áreas</h2>
        <p className="mx-auto mt-2 max-w-xl text-center text-muted-foreground">
          Estas son automatizaciones reales de nuestro recetario, listas para
          adaptarse a tu negocio.
        </p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {AREA_ORDER.map((area) => {
            const areaRecipes = (byArea.get(area) ?? []).slice(0, 2);
            const caso = CASOS.find((c) => c.area === area);
            return (
              <Card key={area} className="flex flex-col p-5">
                <div className="flex items-center gap-2">
                  <span aria-hidden className="text-xl">{AREA_ICONS[area]}</span>
                  <h3 className="font-semibold">{AREA_LABELS[area]}</h3>
                </div>
                <ul className="mt-3 flex-1 space-y-2 text-sm text-muted-foreground">
                  {areaRecipes.length > 0 ? (
                    areaRecipes.map((r) => (
                      <li key={r.id} className="flex gap-2">
                        <span aria-hidden className="text-primary">✓</span>
                        <span>{r.solves}</span>
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
                    className="mt-3 text-sm font-medium text-primary hover:underline"
                  >
                    Ver el caso completo →
                  </Link>
                ) : null}
              </Card>
            );
          })}
        </div>
        </div>
      </section>

      {/* ── Packs resumido ── */}
      <section className="border-t bg-muted/40">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="text-center text-3xl font-bold">Planes claros, sin sorpresas</h2>
          <p className="mx-auto mt-2 max-w-xl text-center text-muted-foreground">
            Setup por única vez + mensual. Precios en USD + IVA {pricing.ivaPct}%.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {packOrder.map((key) => {
              const p = pricing.packs[key];
              return (
                <Card key={key} className="flex flex-col p-5">
                  <h3 className="font-bold">{p.label}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{p.tagline}</p>
                  <div className="mt-4 space-y-1">
                    <p className="text-xs text-muted-foreground">{setupLine(p)}</p>
                    {p.monthlyUsd === null ? (
                      <p className="text-xl font-bold">A consultar</p>
                    ) : (
                      <>
                        <p className="text-xl font-bold">
                          {p.monthlyFrom ? "desde " : ""}
                          {fmtUsd(p.monthlyUsd)}
                          <span className="text-sm font-normal text-muted-foreground">
                            {" "}
                            /mes + IVA
                          </span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          ≈ {fmtArs(usdToArs(p.monthlyUsd, pricing.dolarArs))}/mes
                        </p>
                      </>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
          <div className="mt-8 text-center">
            <ButtonLink href="/precios" variant="secondary">
              Ver precios en detalle
            </ButtonLink>
          </div>
        </div>
      </section>

      {/* ── CTA final: doble puerta ── */}
      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        <h2 className="text-center text-3xl font-bold">
          ¿Listo para que tu negocio corra solo?
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-center text-muted-foreground">
          Elegí tu puerta: las dos terminan con un proceso funcionando sin vos.
        </p>
        <div className="mt-8">
          <Doors compact />
        </div>
      </section>
    </PublicShell>
  );
}
