import Link from "next/link";
import type { Client } from "@prisma/client";
import { db } from "@/lib/db";
import { Badge, Card, EmptyState, Stat } from "@/components/ui";
import { fmtKm, fmtPrecioVehiculo, nombreVehiculo, primeraFotoVehiculo } from "@/lib/conce";

/**
 * Dashboard del OS para el template CONCESIONARIA: ventas del mes (boletos
 * concretados), stock por condición, analítica de la web (más vistos, de dónde
 * vienen las consultas, qué vehículos las generan y el embudo vistas →
 * consultas → operaciones), consultas nuevas y stock viejo (+90 días).
 *
 * DATO QUE FALTA EN EL MODELO (acá NO se toca el schema):
 * `ConceVehiculo.visitas` es un contador acumulado SIN fecha, así que las
 * vistas no se pueden cortar por semana/mes ni comparar contra el período
 * anterior. Para eso haría falta un modelo tipo `ConceVista { clientId,
 * vehiculoId, createdAt, origen/referrer }` — una fila por vista, la escribiría
 * el endpoint público /api/public/sitio/[slug]/conce-vista, que hoy solo hace
 * `increment`. Mientras tanto: las vistas se muestran acumuladas y la
 * comparación semana/mes se hace sobre CONSULTAS, que sí tienen `createdAt`.
 * También faltaría guardar referrer/UTM para saber si el tráfico llega de
 * Instagram, Google o directo, y vistas del home/catálogo (hoy solo ficha).
 */
export async function ConceDashboard({ tenant }: { tenant: Client }) {
  const base = `/os/${tenant.slug}`;
  const ahora = new Date();
  const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
  const inicioMesAnterior = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1);
  const hace7 = new Date(Date.now() - 7 * 86_400_000);
  const hace14 = new Date(Date.now() - 14 * 86_400_000);
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
    vistasAgg,
    consultasRecientes,
    consultasTotal,
    consultasFicha,
    consultasGeneral,
    consultasChatbot,
    topConsultadosRaw,
    operacionesConcretadas,
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
        slug: true,
        marca: true,
        modelo: true,
        version: true,
        anio: true,
        precio: true,
        moneda: true,
        visitas: true,
        fotos: true,
        estado: true,
        publicado: true,
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
    // Vistas acumuladas de TODO el stock (incluidos los vendidos).
    db.conceVehiculo.aggregate({
      where: { clientId: tenant.id },
      _sum: { visitas: true },
    }),
    // Consultas desde el inicio del mes anterior: alcanza para semana vs
    // semana anterior y mes vs mes anterior sin traer el histórico entero.
    db.conceConsulta.findMany({
      where: { clientId: tenant.id, createdAt: { gte: inicioMesAnterior } },
      select: { createdAt: true, origen: true, vehiculoId: true },
    }),
    db.conceConsulta.count({ where: { clientId: tenant.id } }),
    db.conceConsulta.count({
      where: { clientId: tenant.id, origen: { not: "chatbot" }, vehiculoId: { not: null } },
    }),
    db.conceConsulta.count({
      where: { clientId: tenant.id, origen: { not: "chatbot" }, vehiculoId: null },
    }),
    db.conceConsulta.count({ where: { clientId: tenant.id, origen: "chatbot" } }),
    db.conceConsulta.groupBy({
      by: ["vehiculoId"],
      where: { clientId: tenant.id, vehiculoId: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { vehiculoId: "desc" } },
      take: 5,
    }),
    db.conceOperacion.count({ where: { clientId: tenant.id, estado: "CONCRETADA" } }),
  ]);

  // Vehículos del TOP de consultas (segunda vuelta: el groupBy trae solo ids).
  const idsConsultados = topConsultadosRaw
    .map((g) => g.vehiculoId)
    .filter((id): id is string => Boolean(id));
  const vehiculosConsultados = idsConsultados.length
    ? await db.conceVehiculo.findMany({
        where: { id: { in: idsConsultados }, clientId: tenant.id },
        select: {
          id: true,
          slug: true,
          marca: true,
          modelo: true,
          version: true,
          anio: true,
          visitas: true,
          fotos: true,
        },
      })
    : [];
  const porId = new Map(vehiculosConsultados.map((v) => [v.id, v]));
  const topConsultados = topConsultadosRaw
    .map((g) => ({ vehiculo: g.vehiculoId ? porId.get(g.vehiculoId) : undefined, consultas: g._count._all }))
    .filter(
      (r): r is { vehiculo: (typeof vehiculosConsultados)[number]; consultas: number } =>
        r.vehiculo !== undefined
    );

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

  // ── Analítica de la web ───────────────────────────────────────────────────
  const vistasTotales = vistasAgg._sum.visitas ?? 0;

  const consSemana = consultasRecientes.filter((c) => c.createdAt >= hace7).length;
  const consSemanaPrev = consultasRecientes.filter(
    (c) => c.createdAt >= hace14 && c.createdAt < hace7
  ).length;
  const consMes = consultasRecientes.filter((c) => c.createdAt >= inicioMes).length;
  const consMesPrev = consultasRecientes.filter((c) => c.createdAt < inicioMes).length;

  /** "▲ +40% vs período anterior" / "▼ -12% …" contra el período anterior. */
  const variacion = (actual: number, previo: number): string => {
    if (previo === 0) return actual === 0 ? "igual que antes" : "sin dato previo";
    const p = Math.round(((actual - previo) / previo) * 100);
    if (p === 0) return "igual que el período anterior";
    return `${p > 0 ? "▲ +" : "▼ "}${p}% vs período anterior`;
  };
  const tono = (actual: number, previo: number): "success" | "destructive" | "default" =>
    actual > previo ? "success" : actual < previo ? "destructive" : "default";

  const origenes = [
    { label: "Ficha de un vehículo", emoji: "🚗", n: consultasFicha },
    { label: "Contacto general", emoji: "✉️", n: consultasGeneral },
    { label: "Chatbot asesor", emoji: "🤖", n: consultasChatbot },
  ].sort((a, b) => b.n - a.n);
  const totalOrigenes = origenes.reduce((s, o) => s + o.n, 0);

  const maxVistas = topVistos[0]?.visitas ?? 1;
  const maxConsultas = topConsultados[0]?.consultas ?? 1;

  const pct = (a: number, b: number) => (b > 0 ? (a / b) * 100 : 0);
  const pctTxt = (a: number, b: number) => (b > 0 ? `${((a / b) * 100).toFixed(1)}%` : "—");

  const embudo = [
    { label: "Vistas de vehículos", n: vistasTotales, tone: "bg-primary/70" },
    { label: "Consultas recibidas", n: consultasTotal, tone: "bg-warning/70" },
    { label: "Operaciones concretadas", n: operacionesConcretadas, tone: "bg-success/70" },
  ];
  const maxEmbudo = Math.max(...embudo.map((e) => e.n), 1);

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
        <Stat label="Operaciones vigentes" value={operacionesVigentes} hint="mandatos + boletos" />
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

      {/* ── Analítica de la web ─────────────────────────────────────────── */}
      <div>
        <h2 className="mb-3 text-lg font-semibold tracking-tight">📈 Analítica de la web</h2>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat
            label="Vistas acumuladas"
            value={vistasTotales.toLocaleString("es-AR")}
            hint="fichas de vehículos abiertas (histórico)"
          />
          <Stat
            label="Consultas esta semana"
            value={consSemana}
            hint={variacion(consSemana, consSemanaPrev)}
            tone={tono(consSemana, consSemanaPrev)}
          />
          <Stat
            label="Consultas este mes"
            value={consMes}
            hint={variacion(consMes, consMesPrev)}
            tone={tono(consMes, consMesPrev)}
          />
          <Stat
            label="Vista → consulta"
            value={pctTxt(consultasTotal, vistasTotales)}
            hint={`${consultasTotal} consulta${consultasTotal === 1 ? "" : "s"} sobre ${vistasTotales.toLocaleString("es-AR")} vistas`}
          />
        </div>

        <p className="mt-2 text-xs text-muted-foreground">
          Las vistas se cuentan por vehículo de forma acumulada (sin fecha), así que la comparación
          semana contra semana se hace sobre las consultas. Para ver vistas por período habría que
          registrar cada visita con su fecha.
        </p>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {/* De dónde vienen las consultas */}
          <Card className="p-4">
            <h3 className="mb-3 text-sm font-semibold">📥 De dónde vienen las consultas</h3>
            {totalOrigenes === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Todavía no entraron consultas.
              </p>
            ) : (
              <ul className="space-y-3">
                {origenes.map((o) => (
                  <li key={o.label}>
                    <div className="flex items-center justify-between text-sm">
                      <span>
                        {o.emoji} {o.label}
                      </span>
                      <span className="font-semibold tabular-nums">
                        {o.n}{" "}
                        <span className="text-xs font-normal text-muted-foreground">
                          ({pctTxt(o.n, totalOrigenes)})
                        </span>
                      </span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-primary/70"
                        style={{ width: `${Math.max(pct(o.n, totalOrigenes), o.n > 0 ? 3 : 0)}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* Embudo */}
          <Card className="p-4">
            <h3 className="mb-3 text-sm font-semibold">
              🔻 Embudo: vistas → consultas → operaciones
            </h3>
            <ul className="space-y-3">
              {embudo.map((e) => (
                <li key={e.label}>
                  <div className="flex items-center justify-between text-sm">
                    <span>{e.label}</span>
                    <span className="font-semibold tabular-nums">{e.n.toLocaleString("es-AR")}</span>
                  </div>
                  <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-2.5 rounded-full ${e.tone}`}
                      style={{ width: `${Math.max(pct(e.n, maxEmbudo), e.n > 0 ? 3 : 0)}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-3 grid grid-cols-2 gap-2 border-t pt-3 text-sm">
              <p>
                <span className="text-muted-foreground">Vista → consulta:</span>{" "}
                <span className="font-semibold">{pctTxt(consultasTotal, vistasTotales)}</span>
              </p>
              <p>
                <span className="text-muted-foreground">Consulta → operación:</span>{" "}
                <span className="font-semibold">{pctTxt(operacionesConcretadas, consultasTotal)}</span>
              </p>
            </div>
          </Card>
        </div>
      </div>

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
            <ol className="space-y-2.5">
              {topVistos.map((v, i) => (
                <li key={v.id} className="flex items-center gap-3 text-sm">
                  <span className="w-5 shrink-0 text-right text-xs text-muted-foreground">{i + 1}</span>
                  {primeraFotoVehiculo(v.fotos) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={primeraFotoVehiculo(v.fotos)!}
                      alt=""
                      className="h-9 w-12 shrink-0 rounded-md border object-cover"
                    />
                  ) : (
                    <div className="flex h-9 w-12 shrink-0 items-center justify-center rounded-md bg-muted">
                      🚗
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`${base}/stock/${v.id}`}
                        className="min-w-0 flex-1 truncate hover:text-primary"
                        title="Editar la ficha"
                      >
                        {nombreVehiculo(v)} {v.anio}
                      </Link>
                      {v.estado === "reservado" ? <Badge variant="warning">reservado</Badge> : null}
                      {v.publicado ? (
                        <Link
                          href={`/sitio/${tenant.slug}/vehiculo/${v.slug}`}
                          target="_blank"
                          className="shrink-0 text-xs text-muted-foreground hover:text-primary"
                          title="Ver la ficha en la web"
                        >
                          ↗
                        </Link>
                      ) : (
                        <Badge variant="default">fuera de la web</Badge>
                      )}
                      <span className="shrink-0 font-semibold tabular-nums">{v.visitas}</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-1.5 rounded-full bg-primary/70"
                        style={{ width: `${Math.max(pct(v.visitas, maxVistas), 3)}%` }}
                      />
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Card>

        {/* TOP que generan consultas */}
        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">🔥 TOP 5 que generan consultas</h2>
            <Link href={`${base}/consultas`} className="text-xs font-medium text-primary hover:underline">
              Ver bandeja →
            </Link>
          </div>
          {topConsultados.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Todavía no hay consultas atadas a un vehículo.
            </p>
          ) : (
            <ol className="space-y-2.5">
              {topConsultados.map((r, i) => (
                <li key={r.vehiculo.id} className="flex items-center gap-3 text-sm">
                  <span className="w-5 shrink-0 text-right text-xs text-muted-foreground">{i + 1}</span>
                  {primeraFotoVehiculo(r.vehiculo.fotos) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={primeraFotoVehiculo(r.vehiculo.fotos)!}
                      alt=""
                      className="h-9 w-12 shrink-0 rounded-md border object-cover"
                    />
                  ) : (
                    <div className="flex h-9 w-12 shrink-0 items-center justify-center rounded-md bg-muted">
                      🚗
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`${base}/stock/${r.vehiculo.id}`}
                        className="min-w-0 flex-1 truncate hover:text-primary"
                      >
                        {nombreVehiculo(r.vehiculo)} {r.vehiculo.anio}
                      </Link>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {r.vehiculo.visitas} vistas · {pctTxt(r.consultas, r.vehiculo.visitas)}
                      </span>
                      <span className="shrink-0 font-semibold tabular-nums">{r.consultas}</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-1.5 rounded-full bg-warning/70"
                        style={{ width: `${Math.max(pct(r.consultas, maxConsultas), 3)}%` }}
                      />
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
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

        {/* Stock viejo */}
        <Card className="p-4">
          <h2 className="mb-3 text-sm font-semibold">
            ⏳ Stock viejo (+90 días) — candidatos a oferta o repricing
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
    </div>
  );
}
