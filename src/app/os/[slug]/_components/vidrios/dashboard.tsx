import Link from "next/link";
import type { Client } from "@prisma/client";
import { db } from "@/lib/db";
import { tenantBranding } from "@/lib/tenant";
import { buildRanges } from "@/lib/playbooks";
import { ordenDatos, totalOrden, vehiculoLinea } from "@/lib/vidrios";
import { ButtonLink, Card, EmptyState, Stat } from "@/components/ui";
import { fmtTime } from "../../_lib/dates";

const STOCK_BAJO = 2; // umbral: con 2 o menos unidades hay que pedir a Malatesta

/**
 * Dashboard del template VIDRIOS (Código Auto): lo que importa al abrir el día —
 * qué falta colocar, qué turnos hay, qué stock se está acabando y cuánto
 * queda por facturar. Con accesos rápidos a todo.
 */
export async function VidriosDashboard({ tenant }: { tenant: Client }) {
  const branding = tenantBranding(tenant);
  const base = `/os/${tenant.slug}`;
  const ranges = buildRanges();

  const [ordenes, turnosHoy, stockBajo] = await Promise.all([
    db.presupuestoDoc.findMany({
      where: { clientId: tenant.id },
      orderBy: { numero: "desc" },
      take: 300,
    }),
    db.appointment.findMany({
      where: { clientId: tenant.id, startsAt: { gte: ranges.todayStart, lt: ranges.todayEnd } },
      orderBy: { startsAt: "asc" },
      include: { contact: { select: { name: true } } },
    }),
    db.bazarProducto.findMany({
      where: { clientId: tenant.id, activo: true, stock: { lte: STOCK_BAJO } },
      orderBy: { stock: "asc" },
      take: 8,
      select: { id: true, nombre: true, sku: true, stock: true, categoria: true },
    }),
  ]);

  const pendientes = ordenes.filter((o) => o.estado === "PENDIENTE");
  const porFacturar = ordenes
    .filter((o) => ordenDatos(o).facturacion !== "facturada")
    .reduce((a, o) => a + totalOrden(o), 0);
  const plata = (n: number) => `$ ${n.toLocaleString("es-AR")}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Hola, {branding.displayName} 👋</h1>
          <p className="text-sm text-muted-foreground">
            Parabrisas, turnos y depósito: todo lo de hoy en una pantalla.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ButtonLink href={`${base}/ordenes/nueva`} size="sm">
            + Nueva orden
          </ButtonLink>
          <ButtonLink href={`${base}/productos`} variant="secondary" size="sm">
            Stock
          </ButtonLink>
          <ButtonLink href={`${base}/facturacion`} variant="secondary" size="sm">
            Facturación
          </ButtonLink>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Link href={`${base}/ordenes?estado=PENDIENTE`}>
          <Stat label="Por colocar" value={pendientes.length} hint="órdenes pendientes" tone={pendientes.length ? "warning" : "default"} />
        </Link>
        <Link href={`${base}/turnos`}>
          <Stat label="Turnos de hoy" value={turnosHoy.length} hint="en la agenda" />
        </Link>
        <Link href={`${base}/productos`}>
          <Stat label="Stock bajo" value={stockBajo.length} hint={`con ${STOCK_BAJO} o menos`} tone={stockBajo.length ? "destructive" : "default"} />
        </Link>
        <Link href={`${base}/facturacion`}>
          <Stat label="Por facturar" value={plata(porFacturar)} hint="órdenes sin factura" />
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Órdenes pendientes de colocar */}
        <Card className="p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="font-semibold">Pendientes de colocar</h2>
            <Link href={`${base}/ordenes`} className="text-sm font-medium text-primary hover:underline">
              Ver órdenes →
            </Link>
          </div>
          {pendientes.length === 0 ? (
            <EmptyState icon="✅" title="Nada pendiente" detail="Todas las órdenes están colocadas." />
          ) : (
            <ul className="divide-y">
              {pendientes.slice(0, 6).map((o) => {
                const d = ordenDatos(o);
                return (
                  <li key={o.id} className="flex items-center gap-3 py-2.5">
                    <span className="font-mono text-xs font-semibold text-muted-foreground">
                      #{String(o.numero).padStart(4, "0")}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm">
                      {o.nombre}
                      {vehiculoLinea(d) ? <span className="text-muted-foreground"> · {vehiculoLinea(d)}</span> : null}
                    </span>
                    <span className="shrink-0 text-sm font-semibold tabular-nums">{plata(totalOrden(o))}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        {/* Turnos de hoy */}
        <Card className="p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="font-semibold">Turnos de hoy</h2>
            <Link href={`${base}/turnos`} className="text-sm font-medium text-primary hover:underline">
              Ver agenda →
            </Link>
          </div>
          {turnosHoy.length === 0 ? (
            <EmptyState icon="📅" title="Hoy no hay turnos" detail="Los turnos de colocación aparecen acá." />
          ) : (
            <ul className="divide-y">
              {turnosHoy.slice(0, 6).map((a) => (
                <li key={a.id} className="flex items-center gap-3 py-2.5">
                  <span className="font-mono text-sm font-semibold tabular-nums">{fmtTime(a.startsAt)}</span>
                  <span className="min-w-0 flex-1 truncate text-sm">
                    {a.title}
                    {a.contact ? <span className="text-muted-foreground"> · {a.contact.name}</span> : null}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* Stock bajo: qué pedirle a Malatesta */}
      {stockBajo.length > 0 ? (
        <Card className="p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="font-semibold">Stock bajo — para pedir al proveedor</h2>
            <Link href={`${base}/productos`} className="text-sm font-medium text-primary hover:underline">
              Ver stock →
            </Link>
          </div>
          <ul className="divide-y">
            {stockBajo.map((p) => (
              <li key={p.id} className="flex items-center gap-3 py-2.5">
                {p.sku ? <span className="font-mono text-xs text-muted-foreground">{p.sku}</span> : null}
                <span className="min-w-0 flex-1 truncate text-sm">
                  {p.nombre} <span className="text-muted-foreground">· {p.categoria}</span>
                </span>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                    p.stock === 0 ? "bg-destructive/10 text-destructive" : "bg-warning/15 text-warning"
                  }`}
                >
                  {p.stock === 0 ? "Sin stock" : `Quedan ${p.stock}`}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </div>
  );
}
