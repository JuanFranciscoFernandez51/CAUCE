import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getPricing } from "@/lib/pricing";
import { PROCESOS_CATALOGO } from "@/lib/procesos-catalogo";
import { MODULE_LABELS, type OsModule } from "@/lib/tenant";
import { PACK_LABELS } from "@/app/admin/_components/format";
import { CurrentLines } from "@/components/public/cauce-mark";
import { Badge, Card } from "@/components/ui";
import { PropuestaAcciones } from "./acciones";

export const dynamic = "force-dynamic";

const fmtUsd = (n: number) => `USD ${n.toLocaleString("es-AR")}`;
const fmtArs = (n: number) => `$ ${Math.round(n).toLocaleString("es-AR")}`;

/** Propuesta pública: lo que incluye, lo que corre solo y el número. */
export default async function PropuestaPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const p = await db.propuesta.findUnique({ where: { token } });
  if (!p) notFound();

  // Primera vista → queda registrada (Fran ve "Vista" en el admin).
  if (!p.vistaAt) {
    await db.propuesta
      .update({ where: { id: p.id }, data: { vistaAt: new Date(), estado: p.estado === "ENVIADA" ? "VISTA" : p.estado } })
      .catch(() => undefined);
  }

  const pricing = await getPricing().catch(() => null);
  const dolar = p.dolarArs || pricing?.dolarArs || 0;
  const iva = p.conIva ? 1 : 1 + p.ivaPct / 100;
  const procesos = p.procesoKeys
    .map((k) => PROCESOS_CATALOGO.find((x) => x.key === k))
    .filter((x): x is (typeof PROCESOS_CATALOGO)[number] => Boolean(x));

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
          <p className="mt-2 text-muted-foreground">
            {p.contactoNombre ? `${p.contactoNombre.split(" ")[0]}, esto` : "Esto"} es lo que dejamos
            funcionando por vos: tu web, tu sistema de gestión y tus procesos corriendo solos — todo
            con tu marca.
          </p>
        </header>

        {/* Qué incluye */}
        <Card className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <h2 className="font-semibold">Tu sistema</h2>
            <Badge variant="primary">{PACK_LABELS[p.pack] ?? p.pack}</Badge>
          </div>
          <ul className="grid gap-2 sm:grid-cols-2">
            <li className="rounded-md bg-muted/50 px-3 py-2 text-sm">🌐 Tu página web con tu marca</li>
            {p.modulos.map((m) => (
              <li key={m} className="rounded-md bg-muted/50 px-3 py-2 text-sm">
                🗂️ {MODULE_LABELS[m as OsModule] ?? m}
              </li>
            ))}
          </ul>
        </Card>

        {/* Procesos */}
        {procesos.length > 0 ? (
          <Card className="p-5">
            <h2 className="mb-1 font-semibold">Lo que corre solo, todos los días</h2>
            <p className="mb-3 text-sm text-muted-foreground">
              Sin que vos ni tu equipo toquen nada:
            </p>
            <ul className="space-y-2.5">
              {procesos.map((pr) => (
                <li key={pr.key} className="flex gap-2.5">
                  <span aria-hidden className="text-primary">⚡</span>
                  <div>
                    <p className="text-sm font-semibold">{pr.nombre}</p>
                    <p className="text-sm text-muted-foreground">{pr.queHace}</p>
                  </div>
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

        {/* Inversión */}
        <Card className="p-5">
          <h2 className="mb-3 font-semibold">La inversión</h2>
          <dl className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-md bg-muted/50 p-4">
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">Armado (pago único)</dt>
              <dd className="mt-1 text-2xl font-bold">{fmtUsd(p.setupUsd * iva)}</dd>
              {dolar ? <dd className="text-sm text-muted-foreground">{fmtArs(p.setupUsd * iva * dolar)}</dd> : null}
            </div>
            <div className="rounded-md bg-muted/50 p-4">
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">Mensual (todo incluido)</dt>
              <dd className="mt-1 text-2xl font-bold">{fmtUsd(p.monthlyUsd * iva)}</dd>
              {dolar ? <dd className="text-sm text-muted-foreground">{fmtArs(p.monthlyUsd * iva * dolar)}/mes</dd> : null}
            </div>
          </dl>
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
