import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getPricing } from "@/lib/pricing";
import { PROCESOS_CATALOGO } from "@/lib/procesos-catalogo";
import { ESPEJOS, PIEZA_BASE, PIEZAS, valorHorasUsdMes, VALOR_EMPLEADO_USD_MES } from "@/lib/piezas";
import { shotsDeSettings, type Shot } from "@/lib/casos";
import { CurrentLines } from "@/components/public/cauce-mark";
import { Card } from "@/components/ui";
import { PropuestaAcciones } from "./acciones";

export const dynamic = "force-dynamic";

const fmtUsd = (n: number) => `USD ${n.toLocaleString("es-AR")}`;
const fmtArs = (n: number) => `$ ${Math.round(n).toLocaleString("es-AR")}`;

/**
 * Propuesta pública en 3 capas: el RESULTADO (horas que recupera y qué valen),
 * el ESPEJO (así quedó un negocio real, con capturas) y el DESGLOSE pieza por
 * pieza. Cierra con "se paga solo" y el botón de aceptar.
 */
export default async function PropuestaPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const p = await db.propuesta.findUnique({ where: { token } });
  if (!p) notFound();

  if (!p.vistaAt) {
    await db.propuesta
      .update({ where: { id: p.id }, data: { vistaAt: new Date(), estado: p.estado === "ENVIADA" ? "VISTA" : p.estado } })
      .catch(() => undefined);
  }

  const pricing = await getPricing().catch(() => null);
  const dolar = p.dolarArs || pricing?.dolarArs || 0;
  const iva = p.conIva ? 1 : 1 + p.ivaPct / 100;
  const setup = p.setupUsd * iva;
  const mensual = p.monthlyUsd * iva;

  const procesos = p.procesoKeys
    .map((k) => PROCESOS_CATALOGO.find((x) => x.key === k))
    .filter((x): x is (typeof PROCESOS_CATALOGO)[number] => Boolean(x));
  const horas = p.horasSemana || procesos.reduce((s, x) => s + x.horasSemana, 0);
  const valorMesArs = valorHorasUsdMes(horas) * dolar;

  const piezasElegidas = p.piezas
    .map((k) => PIEZAS.find((x) => x.key === k))
    .filter((x): x is (typeof PIEZAS)[number] => Boolean(x));

  const espejo = ESPEJOS.find((e) => e.key === p.casoEspejo) ?? null;
  let shots: Shot[] = [];
  if (espejo) {
    const tenantEspejo = await db.client.findUnique({
      where: { slug: espejo.shotsSlug },
      select: { settings: true },
    });
    shots = tenantEspejo ? shotsDeSettings(tenantEspejo.settings).slice(0, 3) : [];
  }

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <CurrentLines />
      <div className="relative mx-auto max-w-2xl space-y-6 px-4 py-10 sm:px-6">
        <header>
          <p className="flex items-center gap-2 text-sm font-bold tracking-tight">
            <span className="text-xl">🌊</span> Cauce
          </p>
          <h1 className="mt-4 text-3xl font-bold">
            Propuesta para <span className="text-primary">{p.negocio}</span>
          </h1>
        </header>

        {/* ── CAPA 1: EL RESULTADO ── */}
        {horas > 0 ? (
          <Card className="border-primary/40 bg-primary-soft/40 p-6">
            <p className="text-sm text-muted-foreground">
              Un negocio como el tuyo pierde, en tareas que Cauce hace solo,
            </p>
            <p className="mt-1 text-4xl font-bold">
              ~{horas} horas <span className="text-xl font-semibold text-muted-foreground">por semana</span>
            </p>
            {dolar ? (
              <p className="mt-2 text-sm text-muted-foreground">
                A valor de un empleado (USD {VALOR_EMPLEADO_USD_MES}/mes), eso es{" "}
                <span className="font-bold text-foreground">~{fmtArs(valorMesArs)} por mes</span> que se va
                en trabajo repetitivo.
              </p>
            ) : null}
          </Card>
        ) : null}

        {/* ── CAPA 2: EL ESPEJO ── */}
        {espejo ? (
          <Card className="overflow-hidden p-0">
            <div className="p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">Así quedó</p>
              <h2 className="mt-0.5 text-xl font-bold">{espejo.nombre}</h2>
              <p className="text-sm text-muted-foreground">{espejo.rubro}</p>
              <p className="mt-2 text-sm">{espejo.historia}</p>
              <p className="mt-2 text-sm font-semibold">
                Su sistema: {fmtUsd(espejo.setupUsd)} de creación + {fmtUsd(espejo.monthlyUsd)}/mes.
              </p>
            </div>
            {shots.length > 0 ? (
              <div className="grid grid-cols-3 gap-1 px-1 pb-1">
                {shots.map((s, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={i} src={s.url} alt={s.titulo} className="h-28 w-full rounded-md border object-cover object-top" />
                ))}
              </div>
            ) : null}
          </Card>
        ) : null}

        {/* ── CAPA 3: EL DESGLOSE ── */}
        <Card className="p-5">
          <h2 className="mb-1 font-semibold">Tu sistema, pieza por pieza</h2>
          <p className="mb-3 text-sm text-muted-foreground">
            Cada pieza con su precio. Nada escondido.
          </p>
          <ul className="divide-y text-sm">
            <li className="flex items-start justify-between gap-3 py-2.5">
              <span>
                <span className="font-semibold">{PIEZA_BASE.label}</span>
                <span className="block text-xs text-muted-foreground">{PIEZA_BASE.queIncluye}</span>
              </span>
              <span className="shrink-0 text-right tabular-nums">
                {fmtUsd(PIEZA_BASE.setupUsd)}
                <span className="block text-xs text-muted-foreground">+{fmtUsd(PIEZA_BASE.monthlyUsd)}/mes</span>
              </span>
            </li>
            {piezasElegidas.map((x) => (
              <li key={x.key} className="flex items-start justify-between gap-3 py-2.5">
                <span>
                  <span className="font-medium">{x.label}</span>
                  <span className="block text-xs text-muted-foreground">{x.queIncluye}</span>
                </span>
                <span className="shrink-0 text-right tabular-nums">
                  +{fmtUsd(x.setupUsd)}
                  <span className="block text-xs text-muted-foreground">+{fmtUsd(x.monthlyUsd)}/mes</span>
                </span>
              </li>
            ))}
          </ul>
        </Card>

        {/* Procesos incluidos */}
        {procesos.length > 0 ? (
          <Card className="p-5">
            <h2 className="mb-3 font-semibold">Lo que queda corriendo solo</h2>
            <ul className="space-y-2">
              {procesos.map((pr) => (
                <li key={pr.key} className="flex gap-2.5 text-sm">
                  <span aria-hidden className="text-primary">⚡</span>
                  <span>
                    <span className="font-semibold">{pr.nombre}</span>{" "}
                    <span className="text-xs text-muted-foreground">(~{pr.horasSemana} hs/sem)</span>
                    <span className="block text-muted-foreground">{pr.queHace}</span>
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        ) : null}

        {p.nota ? (
          <Card className="border-l-4 border-l-primary p-5">
            <p className="text-sm">{p.nota}</p>
          </Card>
        ) : null}

        {/* ── EL CIERRE ── */}
        <Card className="p-5">
          <h2 className="mb-3 font-semibold">La inversión</h2>
          <dl className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-md bg-muted/50 p-4">
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">Creación (pago único)</dt>
              <dd className="mt-1 text-2xl font-bold">{fmtUsd(setup)}</dd>
              {dolar ? <dd className="text-sm text-muted-foreground">{fmtArs(setup * dolar)}</dd> : null}
            </div>
            <div className="rounded-md bg-muted/50 p-4">
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">Mensual (todo incluido)</dt>
              <dd className="mt-1 text-2xl font-bold">{fmtUsd(mensual)}</dd>
              {dolar ? <dd className="text-sm text-muted-foreground">{fmtArs(mensual * dolar)}/mes</dd> : null}
            </div>
          </dl>
          {horas > 0 && dolar && valorMesArs > mensual * dolar ? (
            <p className="mt-3 rounded-md bg-success/10 px-3 py-2 text-sm font-medium">
              Te devuelve ~{fmtArs(valorMesArs)}/mes en horas recuperadas:{" "}
              <span className="font-bold">el sistema se paga solo.</span>
            </p>
          ) : null}
          <p className="mt-2 text-xs text-muted-foreground">
            {p.conIva ? "IVA incluido." : `+ IVA (${p.ivaPct}%).`} El mensual cubre hosting,
            mantenimiento, mejoras y soporte directo con nosotros.
          </p>
        </Card>

        <PropuestaAcciones token={token} estado={p.estado} />

        <p className="text-center text-xs text-muted-foreground">
          Cauce — tu negocio funcionando solo · Bahía Blanca, Argentina
        </p>
      </div>
    </div>
  );
}
