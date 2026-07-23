import type { Metadata } from "next";
import type { BizArea } from "@prisma/client";
import { getPricing, usdToArs, fmtUsd, fmtArs, type PackKey } from "@/lib/pricing";
import { AREA_LABELS, CASOS } from "@/lib/casos";
import { catalogoPorArea } from "@/lib/procesos-catalogo";
import { PublicShell } from "@/components/public/shell";
import { ESPEJOS, PIEZA_BASE } from "@/lib/piezas";
import { CurrentLines } from "@/components/public/cauce-mark";
import { Doors } from "@/components/public/doors";
import { Card, Badge, ButtonLink } from "@/components/ui";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Cauce — Automatización con IA para tu negocio",
  description:
    "Tu página web y tu sistema de gestión, hechos 100% a tu medida. Dejá el Excel y el cuaderno: turnos, cobros, clientes y caja en un solo lugar. Bahía Blanca, Argentina.",
};

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

const AREA_ORDER: BizArea[] = [
  "ATENCION",
  "TURNOS",
  "FINANZAS",
  "VENTAS_CRM",
  "OPERACIONES",
  "RRHH",
  "MARKETING",
];

function setupLine(p: { setupUsd: number | null; setupFrom: boolean }): string {
  if (p.setupUsd === null) return "Setup a cotizar";
  if (p.setupUsd === 0) return "Sin costo de setup";
  return `Setup ${p.setupFrom ? "desde " : ""}${fmtUsd(p.setupUsd)} + IVA`;
}

export default async function LandingPage() {
  const pricing = await getPricing();
  const byArea = catalogoPorArea();

  const packOrder: PackKey[] = ["starter", "pro", "scale", "custom"];

  return (
    <PublicShell>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        <CurrentLines />
        <div className="relative mx-auto max-w-6xl px-4 pb-12 pt-16 sm:px-6 sm:pt-20">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div className="text-center lg:text-left">
              <Badge variant="primary">Web + sistema de gestión a medida — Bahía Blanca, Argentina</Badge>
              <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
                Tu negocio entero, en un sistema{" "}
                <span className="text-primary">hecho a tu medida</span>
              </h1>
              <p className="mt-4 text-lg text-muted-foreground">
                Tu página web, tu gestión y tus avisos automáticos, armados como trabajás vos.
                Dejá el Excel, el cuaderno y las cosas lentas:{" "}
                <span className="font-medium text-foreground">todo en un solo lugar, simple y con tu marca.</span>
              </p>
            </div>
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <p className="font-semibold">Un día cualquiera adentro de Cauce</p>
                <span className="text-xs text-muted-foreground">tu sistema, desde el celular</span>
              </div>
              <ul className="mt-4 space-y-3 text-sm">
                {[
                  ["09:02", "Un cliente sacó turno solo desde tu página", "📅"],
                  ["10:40", "Trabajo terminado: aviso de \"listo para retirar\" armado por WhatsApp", "🔧"],
                  ["11:15", "Los avisos de cobro del mes salieron listos para mandar", "💸"],
                  ["16:30", "Entró una consulta por la web y ya está en tu lista de clientes", "💬"],
                  ["20:00", "La caja del día cerró sola: ingresos, gastos y diferencia", "✅"],
                ].map(([h, t, icon]) => (
                  <li key={h} className="flex items-start gap-3">
                    <span aria-hidden>{icon}</span>
                    <div>
                      <span className="font-mono text-xs text-muted-foreground">{h}</span>{" "}
                      <span className="text-muted-foreground">{t}</span>
                    </div>
                  </li>
                ))}
              </ul>
              <p className="mt-4 border-t pt-3 text-xs text-muted-foreground">
                Sin plantillas: lo que ves acá se arma con TUS rubros, TUS precios y TU manera de trabajar.
              </p>
            </Card>
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
            De tenerlo todo en la cabeza a tenerlo todo resuelto, en cuatro pasos.
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
          ].map((x) => (
            <Card key={x.t} className="p-6">
              <div className="text-3xl">{x.icon}</div>
              <h3 className="mt-3 text-lg font-semibold">{x.t}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{x.d}</p>
            </Card>
          ))}
        </div>
        <p className="mx-auto mt-8 max-w-2xl text-center text-sm text-muted-foreground">
          Las tres conectadas entre sí: la web capta, el sistema ordena, los avisos empujan.
          <span className="font-medium text-foreground"> Y todo se maneja desde el celular.</span>
        </p>
      </section>

      {/* ── Áreas ── */}
      <section className="border-t bg-muted/40">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-center text-3xl font-bold">Software 100% a tu medida, área por área</h2>
        <p className="mx-auto mt-2 max-w-2xl text-center text-muted-foreground">
          El problema de los sistemas enlatados es que la mitad de las pestañas no las usás y la
          otra mitad es de otro rubro. Acá es al revés:{" "}
          <span className="font-medium text-foreground">
            nos sentamos con vos, entendemos tu manera de trabajar y el software se adapta a ella
          </span>
          . Todo lo de abajo funciona hoy en negocios reales.
        </p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="flex flex-col p-5">
            <div className="flex items-center gap-2">
              <span aria-hidden className="text-xl">🔧</span>
              <h3 className="font-semibold">Taller & Órdenes de trabajo</h3>
            </div>
            <ul className="mt-3 flex-1 space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <span aria-hidden className="text-primary">✓</span>
                <span>
                  Cada trabajo entra con fotos y diagnóstico, avanza por estados y se entrega con su
                  orden imprimible con tu marca y el saldo claro.
                </span>
              </li>
              <li className="flex gap-2">
                <span aria-hidden className="text-primary">✓</span>
                <span>
                  Un presupuesto aceptado se convierte en orden de trabajo con un clic, y el aviso de
                  &quot;está listo para retirar&quot; sale armado por WhatsApp.
                </span>
              </li>
            </ul>
            <Link href="/casos" className="mt-3 text-sm font-medium text-primary hover:underline">
              Ver el caso completo →
            </Link>
          </Card>
          {AREA_ORDER.map((area) => {
            const procesos = (byArea.get(area) ?? []).slice(0, 2);
            const caso = CASOS.find((c) => c.area === area);
            return (
              <Card key={area} className="flex flex-col p-5">
                <div className="flex items-center gap-2">
                  <span aria-hidden className="text-xl">{AREA_ICONS[area]}</span>
                  <h3 className="font-semibold">{AREA_LABELS[area]}</h3>
                </div>
                <ul className="mt-3 flex-1 space-y-2 text-sm text-muted-foreground">
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
                    className="mt-3 text-sm font-medium text-primary hover:underline"
                  >
                    Ver el caso completo →
                  </Link>
                ) : null}
              </Card>
            );
          })}
        </div>
        <div className="mt-10 text-center">
          <ButtonLink href="/casos" variant="secondary">
            Ver negocios reales que ya funcionan con Cauce →
          </ButtonLink>
        </div>
        </div>
      </section>

      {/* ── Packs resumido ── */}
      <section className="border-t bg-muted/40">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="text-center text-3xl font-bold">Precios simples, sin planes enlatados</h2>
          <p className="mx-auto mt-2 max-w-2xl text-center text-muted-foreground">
            Pagás una base y le sumás solo las piezas que tu negocio usa. Precios en USD + IVA{" "}
            {pricing.ivaPct}%.
          </p>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            <Card className="flex flex-col p-6">
              <h3 className="font-bold">1 · La base (va siempre)</h3>
              <p className="mt-1.5 flex-1 text-sm text-muted-foreground">{PIEZA_BASE.queIncluye}</p>
              <div className="mt-4">
                <p className="text-2xl font-bold">
                  {fmtUsd(PIEZA_BASE.setupUsd)}
                  <span className="text-sm font-normal text-muted-foreground"> por única vez</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  + {fmtUsd(PIEZA_BASE.monthlyUsd)}/mes (hosting, soporte y mejoras)
                </p>
              </div>
            </Card>
            <Card className="flex flex-col p-6">
              <h3 className="font-bold">2 · Las piezas de tu rubro</h3>
              <p className="mt-1.5 flex-1 text-sm text-muted-foreground">
                Taller con órdenes de trabajo, turnos online, ventas con cuotas, caja diaria,
                eventos con cronómetro… Sumás solo lo que usás — nada de pestañas de otro rubro.
              </p>
              <div className="mt-4">
                <p className="text-2xl font-bold">
                  desde {fmtUsd(100)}
                  <span className="text-sm font-normal text-muted-foreground"> por pieza</span>
                </p>
                <p className="text-sm text-muted-foreground">+ un mensual chico por mantenerla viva</p>
              </div>
            </Card>
            <Card className="flex flex-col border-primary p-6">
              <h3 className="font-bold">3 · Un negocio completo, real</h3>
              <p className="mt-1.5 flex-1 text-sm text-muted-foreground">
                {ESPEJOS[0].nombre}: {ESPEJOS[0].historia}
              </p>
              <div className="mt-4">
                <p className="text-2xl font-bold">
                  {fmtUsd(ESPEJOS[0].setupUsd)}
                  <span className="text-sm font-normal text-muted-foreground"> todo armado</span>
                </p>
                <p className="text-sm text-muted-foreground">+ {fmtUsd(ESPEJOS[0].monthlyUsd)}/mes con soporte directo</p>
              </div>
            </Card>
          </div>
          <div className="mt-8 text-center">
            <ButtonLink
              href="https://wa.me/5492915757101?text=Hola!%20Quiero%20un%20presupuesto%20para%20mi%20negocio."
              variant="primary"
            >
              Armemos tu presupuesto por WhatsApp →
            </ButtonLink>
          </div>
        </div>
      </section>

      {/* ── CTA final: doble puerta ── */}
      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        <h2 className="text-center text-3xl font-bold">
          ¿Listo para sacarte trabajo de encima?
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-center text-muted-foreground">
          Elegí tu puerta: las dos terminan con tu sistema andando y tu día más liviano.
        </p>
        <div className="mt-8">
          <Doors compact />
        </div>
      </section>
    </PublicShell>
  );
}
