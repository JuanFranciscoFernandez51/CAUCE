import Link from "next/link";
import type { Client } from "@prisma/client";
import { db } from "@/lib/db";
import { Badge, Card, EmptyState, Stat } from "@/components/ui";
import { fmtKm, fmtPrecioVehiculo, nombreVehiculo, primeraFotoVehiculo } from "@/lib/conce";

/**
 * Dashboard del OS para el template CONCESIONARIA: ventas del mes (boletos
 * concretados), stock por condición, TOP más vistos (visitas reales de la
 * web), consultas nuevas y stock viejo (+90 días sin venderse).
 */
export async function ConceDashboard({ tenant }: { tenant: Client }) {
  const base = `/os/${tenant.slug}`;
  const ahora = new Date();
  const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
  const hace90 = new Date(Date.now() - 90 * 86_400_000);

  const [
    ventasMes,
    stockPorCondicion,
    reservados,
    topVistos,
    consultasNuevas,
    ultimasConsultas,
    stockViejo,
    operacionesVigentes,
  ] = await Promise.all([
    db.conceOperacion.findMany({
      where: {
        clientId: tenant.id,
        tipo: "BOLETO",
        estado: "CONCRETADA",
        updatedAt: { gte: inicioMes },
      },
      select: { precio: true, moneda: true },
    }),
    db.conceVehiculo.groupBy({
      by: ["condicion"],
      where: { clientId: tenant.id, estado: { not: "vendido" } },
      _count: { _all: true },
    }),
    db.conceVehiculo.count({ where: { clientId: tenant.id, estado: "reservado" } }),
    db.conceVehiculo.findMany({
      where: { clientId: tenant.id, estado: { not: "vendido" }, visitas: { gt: 0 } },
      orderBy: { visitas: "desc" },
      take: 10,
      select: {
        id: true,
        marca: true,
        modelo: true,
        version: true,
        anio: true,
        precio: true,
        moneda: true,
        visitas: true,
        fotos: true,
        estado: true,
      },
    }),
    db.conceConsulta.count({ where: { clientId: tenant.id, estado: "NUEVA" } }),
    db.conceConsulta.findMany({
      where: { clientId: tenant.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        vehiculo: { select: { marca: true, modelo: true, version: true, anio: true } },
      },
    }),
    db.conceVehiculo.findMany({
      where: { clientId: tenant.id, estado: "disponible", ingresadoEl: { lt: hace90 } },
      orderBy: { ingresadoEl: "asc" },
      take: 10,
      select: {
        id: true,
        marca: true,
        modelo: true,
        version: true,
        anio: true,
        km: true,
        precio: true,
        moneda: true,
        ingresadoEl: true,
      },
    }),
    db.conceOperacion.count({ where: { clientId: tenant.id, estado: "VIGENTE" } }),
  ]);

  const conteo = new Map(stockPorCondicion.map((c) => [c.condicion, c._count._all]));
  const cant0km = conteo.get("0km") ?? 0;
  const cantUsados = conteo.get("usado") ?? 0;

  const ventasArs = ventasMes
    .filter((v) => v.moneda !== "USD")
    .reduce((s, v) => s + (v.precio ?? 0), 0);
  const ventasUsd = ventasMes
    .filter((v) => v.moneda === "USD")
    .reduce((s, v) => s + (v.precio ?? 0), 0);
  const ventasTxt =
    ventasMes.length === 0
      ? "—"
      : [
          ventasArs > 0 ? `$ ${Math.round(ventasArs).toLocaleString("es-AR")}` : null,
          ventasUsd > 0 ? `US$ ${Math.round(ventasUsd).toLocaleString("es-AR")}` : null,
        ]
          .filter(Boolean)
          .join(" + ") || "—";

  const diasEnStock = (d: Date) => Math.floor((Date.now() - d.getTime()) / 86_400_000);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tu concesionaria, hoy</h1>
          <p className="text-sm text-muted-foreground">
            Ventas, stock y lo que la gente está mirando en la web.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/sitio/${tenant.slug}`}
            target="_blank"
            className="inline-flex h-9 items-center rounded-md border px-3 text-sm font-medium hover:bg-muted"
          >
            🌐 Ver la web
          </Link>
          <Link
            href={`${base}/stock/nuevo`}
            className="inline-flex h-9 items-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            + Vehículo
          </Link>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat
          label="Ventas del mes"
          value={ventasTxt}
          hint={`${ventasMes.length} boleto${ventasMes.length === 1 ? "" : "s"} concretado${ventasMes.length === 1 ? "" : "s"}`}
          tone={ventasMes.length > 0 ? "success" : "default"}
        />
        <Stat label="Stock 0KM" value={cant0km} hint="unidades nuevas" />
        <Stat label="Stock usados" value={cantUsados} hint={`${reservados} reservado${reservados === 1 ? "" : "s"}`} />
        <Stat
          label="Consultas nuevas"
          value={consultasNuevas}
          hint="sin responder"
          tone={consultasNuevas > 0 ? "warning" : "default"}
        />
        <Stat
          label="Operaciones vigentes"
          value={operacionesVigentes}
          hint="mandatos + boletos"
        />
      </div>

      {consultasNuevas > 0 ? (
        <Link
          href={`${base}/consultas`}
          className="flex items-center justify-between gap-3 rounded-lg border border-primary/40 bg-primary-soft px-4 py-3 transition-opacity hover:opacity-90"
        >
          <p className="text-sm font-medium">
            💬 Tenés <span className="font-bold">{consultasNuevas}</span> consulta
            {consultasNuevas === 1 ? "" : "s"} de la web sin responder — cada una con el WhatsApp a un click.
          </p>
          <span className="shrink-0 text-sm font-semibold text-primary">Ir a Consultas →</span>
        </Link>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        {/* TOP más vistos (visitas reales) */}
        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">👀 TOP 10 más vistos en la web</h2>
            <Link href={`${base}/stock`} className="text-xs font-medium text-primary hover:underline">
              Ver stock →
            </Link>
          </div>
          {topVistos.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Todavía sin visitas.</p>
          ) : (
            <ol className="space-y-2">
              {topVistos.map((v, i) => (
                <li key={v.id} className="flex items-center gap-3 text-sm">
                  <span className="w-5 text-right text-xs text-muted-foreground">{i + 1}</span>
                  {primeraFotoVehiculo(v.fotos) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={primeraFotoVehiculo(v.fotos)!}
                      alt=""
                      className="h-9 w-12 rounded-md border object-cover"
                    />
                  ) : (
                    <div className="flex h-9 w-12 items-center justify-center rounded-md bg-muted">🚗</div>
                  )}
                  <Link
                    href={`${base}/stock/${v.id}`}
                    className="min-w-0 flex-1 truncate hover:text-primary"
                  >
                    {nombreVehiculo(v)} {v.anio}
                  </Link>
                  {v.estado === "reservado" ? <Badge variant="warning">reservado</Badge> : null}
                  <span className="shrink-0 font-semibold">{v.visitas} visitas</span>
                </li>
              ))}
            </ol>
          )}
        </Card>

        {/* Últimas consultas */}
        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">💬 Últimas consultas</h2>
            <Link href={`${base}/consultas`} className="text-xs font-medium text-primary hover:underline">
              Ver bandeja →
            </Link>
          </div>
          {ultimasConsultas.length === 0 ? (
            <EmptyState icon="💬" title="Sin consultas todavía" />
          ) : (
            <ul className="space-y-2.5">
              {ultimasConsultas.map((c) => (
                <li key={c.id} className="text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{c.nombre}</span>
                    {c.origen === "chatbot" ? <Badge variant="primary">🤖 chatbot</Badge> : null}
                    <Badge variant={c.estado === "NUEVA" ? "warning" : "success"}>
                      {c.estado === "NUEVA" ? "Nueva" : "Respondida"}
                    </Badge>
                    {c.vehiculo ? (
                      <span className="text-xs text-muted-foreground">
                        {nombreVehiculo(c.vehiculo)} {c.vehiculo.anio}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-muted-foreground">{c.mensaje}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* Stock viejo */}
      <Card className="p-4">
        <h2 className="mb-3 text-sm font-semibold">
          ⏳ Stock viejo (+90 días sin venderse) — candidatos a oferta o repricing
        </h2>
        {stockViejo.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Nada estancado: todo el stock tiene menos de 90 días. 💪
          </p>
        ) : (
          <ul className="space-y-1.5">
            {stockViejo.map((v) => (
              <li key={v.id} className="flex flex-wrap items-center gap-2 text-sm">
                <Link
                  href={`${base}/stock/${v.id}`}
                  className="min-w-0 flex-1 truncate font-medium hover:text-primary"
                >
                  {nombreVehiculo(v)} {v.anio}
                  <span className="ml-1.5 text-xs text-muted-foreground">
                    {fmtKm(v.km)} · {fmtPrecioVehiculo(v.precio, v.moneda)}
                  </span>
                </Link>
                <Badge variant="destructive">{diasEnStock(v.ingresadoEl)} días</Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
