import Link from "next/link";
import type { Client } from "@prisma/client";
import { db } from "@/lib/db";
import { Badge, Card, EmptyState, Stat } from "@/components/ui";
import { fmtArs } from "../money";
import { argDateStr, dayRange, addDays } from "../../_lib/dates";
import { ESTADOS_PAGOS, itemsDe, primeraFoto, PEDIDO_ESTADO_LABEL, type PedidoEstado } from "@/lib/bazar";

/**
 * Dashboard del OS para el template BAZAR: ventas hoy/semana/mes, pedidos por
 * estado (chips clickeables), top vendidos/visitados, stock crítico, gráfico
 * de 30 días (barras CSS, como Finanzas) y últimas consultas.
 */
export async function BazarDashboard({ tenant }: { tenant: Client }) {
  const base = `/os/${tenant.slug}`;
  const hoy = argDateStr();
  const inicio30 = dayRange(addDays(hoy, -29)).start;
  const inicioHoy = dayRange(hoy).start;
  const inicio7 = dayRange(addDays(hoy, -6)).start;

  const [pedidos30, porEstado, topVendidos, topVisitados, stockCritico, consultas, consultasNuevas, zonas] =
    await Promise.all([
      db.bazarPedido.findMany({
        where: { clientId: tenant.id, createdAt: { gte: inicio30 }, estado: { in: ESTADOS_PAGOS } },
        select: { total: true, items: true, createdAt: true },
      }),
      db.bazarPedido.groupBy({
        by: ["estado"],
        where: { clientId: tenant.id },
        _count: { _all: true },
      }),
      db.bazarProducto.findMany({
        where: { clientId: tenant.id, vendidos: { gt: 0 } },
        orderBy: { vendidos: "desc" },
        take: 10,
        select: { id: true, nombre: true, vendidos: true, fotos: true, precio: true, stock: true },
      }),
      db.bazarProducto.findMany({
        where: { clientId: tenant.id, visitas: { gt: 0 } },
        orderBy: { visitas: "desc" },
        take: 10,
        select: { id: true, nombre: true, visitas: true, fotos: true, stock: true },
      }),
      db.bazarProducto.findMany({
        where: { clientId: tenant.id, activo: true, stock: { lt: 3 } },
        orderBy: { vendidos: "desc" },
        take: 12,
        select: { id: true, nombre: true, stock: true, sku: true },
      }),
      db.bazarConsulta.findMany({
        where: { clientId: tenant.id },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      db.bazarConsulta.count({ where: { clientId: tenant.id, estado: "NUEVA" } }),
      // De dónde llegan los pedidos: en un negocio con reparto, la zona manda.
      db.bazarPedido.groupBy({
        by: ["ciudad"],
        where: { clientId: tenant.id, ciudad: { not: null } },
        _count: { _all: true },
        _sum: { total: true },
      }),
    ]);

  // Ventas por día argentino de los últimos 30 días (para KPIs y gráfico).
  const porDia = new Map<string, { plata: number; unidades: number }>();
  for (let i = 0; i < 30; i++) porDia.set(addDays(hoy, -29 + i), { plata: 0, unidades: 0 });
  let ventasHoy = { plata: 0, unidades: 0 };
  let ventas7 = { plata: 0, unidades: 0 };
  let ventas30 = { plata: 0, unidades: 0 };
  for (const p of pedidos30) {
    const dia = argDateStr(p.createdAt);
    const unidades = itemsDe(p.items).reduce((s, i) => s + i.cant, 0);
    const celda = porDia.get(dia);
    if (celda) {
      celda.plata += p.total;
      celda.unidades += unidades;
    }
    ventas30 = { plata: ventas30.plata + p.total, unidades: ventas30.unidades + unidades };
    if (p.createdAt >= inicio7)
      ventas7 = { plata: ventas7.plata + p.total, unidades: ventas7.unidades + unidades };
    if (p.createdAt >= inicioHoy)
      ventasHoy = { plata: ventasHoy.plata + p.total, unidades: ventasHoy.unidades + unidades };
  }
  const dias = [...porDia.entries()];
  const maxDia = Math.max(1, ...dias.map(([, v]) => v.plata));

  const conteoEstado = new Map(porEstado.map((e) => [e.estado, e._count._all]));
  const CHIP_TONO: Record<string, "default" | "primary" | "success" | "warning" | "destructive"> = {
    NUEVO: "default",
    PAGADO: "primary",
    PREPARANDO: "warning",
    DESPACHADO: "primary",
    ENTREGADO: "success",
    CANCELADO: "destructive",
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tu tienda, hoy</h1>
          <p className="text-sm text-muted-foreground">
            Lo importante de un vistazo: ventas, pedidos y qué se está moviendo.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/sitio/${tenant.slug}`}
            target="_blank"
            className="inline-flex h-9 items-center rounded-md border px-3 text-sm font-medium hover:bg-muted"
          >
            🌊 Ver la tienda
          </Link>
          <Link
            href={`${base}/productos/nuevo`}
            className="inline-flex h-9 items-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            + Producto
          </Link>
        </div>
      </div>

      {/* KPIs de ventas */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Stat
          label="Ventas hoy"
          value={fmtArs(ventasHoy.plata)}
          hint={`${ventasHoy.unidades} unidad${ventasHoy.unidades === 1 ? "" : "es"}`}
          tone={ventasHoy.plata > 0 ? "success" : "default"}
        />
        <Stat
          label="Últimos 7 días"
          value={fmtArs(ventas7.plata)}
          hint={`${ventas7.unidades} unidades`}
        />
        <Stat
          label="Últimos 30 días"
          value={fmtArs(ventas30.plata)}
          hint={`${ventas30.unidades} unidades · ${pedidos30.length} pedidos`}
        />
      </div>

      {/* Pedidos por estado (chips clickeables → Despacho filtrado) */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-sm font-medium">Pedidos:</span>
          {(Object.keys(PEDIDO_ESTADO_LABEL) as PedidoEstado[]).map((e) => (
            <Link key={e} href={`${base}/despacho?estado=${e}`}>
              <Badge variant={CHIP_TONO[e]} className="cursor-pointer text-sm hover:opacity-80">
                {PEDIDO_ESTADO_LABEL[e]} · {conteoEstado.get(e) ?? 0}
              </Badge>
            </Link>
          ))}
          {consultasNuevas > 0 ? (
            <Link href={`${base}/consultas`} className="ml-auto">
              <Badge variant="warning" className="cursor-pointer text-sm hover:opacity-80">
                💬 {consultasNuevas} consulta{consultasNuevas === 1 ? "" : "s"} sin responder
              </Badge>
            </Link>
          ) : null}
        </div>
      </Card>

      {/* Gráfico 30 días (barras CSS, patrón Finanzas) */}
      <Card className="p-4">
        <h2 className="text-sm font-semibold">Ventas de los últimos 30 días</h2>
        <div className="mt-3 flex h-32 items-end gap-[2px]">
          {dias.map(([dia, v]) => (
            <div key={dia} className="group relative flex-1">
              <div
                className="w-full rounded-t bg-primary/70 transition-colors group-hover:bg-primary"
                style={{ height: `${Math.max(v.plata > 0 ? 6 : 2, (v.plata / maxDia) * 120)}px` }}
              />
              <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded-md border bg-card px-2 py-1 text-xs shadow group-hover:block">
                {dia.slice(8, 10)}/{dia.slice(5, 7)} · {fmtArs(v.plata)} · {v.unidades} u.
              </div>
            </div>
          ))}
        </div>
        <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
          <span>hace 30 días</span>
          <span>hoy</span>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Top vendidos */}
        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">🏆 Top 10 más vendidos</h2>
            <Link href={`${base}/productos`} className="text-xs font-medium text-primary hover:underline">
              Ver catálogo →
            </Link>
          </div>
          {topVendidos.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Todavía sin ventas.</p>
          ) : (
            <ol className="space-y-2">
              {topVendidos.map((p, i) => (
                <li key={p.id} className="flex items-center gap-3 text-sm">
                  <span className="w-5 text-right text-xs text-muted-foreground">{i + 1}</span>
                  {primeraFoto(p.fotos) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={primeraFoto(p.fotos)!}
                      alt=""
                      className="h-9 w-9 rounded-md border object-cover"
                    />
                  ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted">🐚</div>
                  )}
                  <Link
                    href={`${base}/productos/${p.id}`}
                    className="min-w-0 flex-1 truncate hover:text-primary"
                  >
                    {p.nombre}
                  </Link>
                  <span className="shrink-0 font-semibold">{p.vendidos} u.</span>
                </li>
              ))}
            </ol>
          )}
        </Card>

        {/* Top visitados */}
        <Card className="p-4">
          <h2 className="mb-3 text-sm font-semibold">👀 Top 10 más visitados</h2>
          {topVisitados.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Todavía sin visitas.</p>
          ) : (
            <ol className="space-y-2">
              {topVisitados.map((p, i) => (
                <li key={p.id} className="flex items-center gap-3 text-sm">
                  <span className="w-5 text-right text-xs text-muted-foreground">{i + 1}</span>
                  {primeraFoto(p.fotos) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={primeraFoto(p.fotos)!}
                      alt=""
                      className="h-9 w-9 rounded-md border object-cover"
                    />
                  ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted">🐚</div>
                  )}
                  <Link
                    href={`${base}/productos/${p.id}`}
                    className="min-w-0 flex-1 truncate hover:text-primary"
                  >
                    {p.nombre}
                  </Link>
                  {p.stock <= 0 ? <Badge variant="destructive">sin stock</Badge> : null}
                  <span className="shrink-0 font-semibold">{p.visitas} visitas</span>
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Stock crítico */}
        <Card className="p-4">
          <h2 className="mb-3 text-sm font-semibold">⚠️ Stock crítico (menos de 3)</h2>
          {stockCritico.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Todo el catálogo tiene stock sano. 💪
            </p>
          ) : (
            <ul className="space-y-1.5">
              {stockCritico.map((p) => (
                <li key={p.id} className="flex items-center gap-2 text-sm">
                  <Link
                    href={`${base}/productos/${p.id}`}
                    className="min-w-0 flex-1 truncate hover:text-primary"
                  >
                    {p.nombre}
                    {p.sku ? <span className="ml-1 text-xs text-muted-foreground">({p.sku})</span> : null}
                  </Link>
                  <Badge variant={p.stock <= 0 ? "destructive" : "warning"}>
                    {p.stock <= 0 ? "sin stock" : `quedan ${p.stock}`}
                  </Badge>
                </li>
              ))}
            </ul>
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
          {consultas.length === 0 ? (
            <EmptyState icon="💬" title="Sin consultas todavía" />
          ) : (
            <ul className="space-y-2.5">
              {consultas.map((c) => (
                <li key={c.id} className="text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{c.nombre}</span>
                    <Badge variant={c.estado === "NUEVA" ? "warning" : "success"}>
                      {c.estado === "NUEVA" ? "Nueva" : "Respondida"}
                    </Badge>
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-muted-foreground">{c.mensaje}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* Zonas: dónde está la demanda */}
      {zonas.length ? (
        <section className="rounded-xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold">De dónde llegan los pedidos</h2>
          <p className="text-xs text-muted-foreground">Zonas ordenadas por facturación.</p>
          <div className="mt-3 space-y-2">
            {[...zonas]
              .sort((a, b) => (b._sum.total ?? 0) - (a._sum.total ?? 0))
              .slice(0, 8)
              .map((z) => {
                const tope = Math.max(...zonas.map((x) => x._sum.total ?? 0), 1);
                return (
                  <div key={z.ciudad} className="flex items-center gap-3">
                    <span className="w-36 truncate text-sm">{z.ciudad}</span>
                    <span className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                      <span
                        className="block h-full rounded-full bg-primary"
                        style={{ width: `${Math.round(((z._sum.total ?? 0) / tope) * 100)}%` }}
                      />
                    </span>
                    <span className="w-24 text-right text-sm font-semibold tabular-nums">
                      $ {(z._sum.total ?? 0).toLocaleString("es-AR")}
                    </span>
                    <span className="w-16 text-right text-xs text-muted-foreground">
                      {z._count._all} {z._count._all === 1 ? "pedido" : "pedidos"}
                    </span>
                  </div>
                );
              })}
          </div>
        </section>
      ) : null}
    </div>
  );
}
