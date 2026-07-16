import Link from "next/link";
import { notFound } from "next/navigation";
import type { VentaEstado } from "@prisma/client";
import { db } from "@/lib/db";
import { getTenantBySlug, hasModule, MODULE_LABELS } from "@/lib/tenant";
import { Badge, ButtonLink, Card, EmptyState, Stat } from "@/components/ui";
import { ModuleDisabled } from "../_components/module-disabled";
import { fmtDateShort } from "../_lib/dates";
import { fmtArs } from "../_components/money";
import { saldoDeVenta, type PagoVenta } from "./saldo";
import { VentaAccionesFila } from "./venta-acciones-fila";

const ESTADOS: Record<string, { label: string; variant: "default" | "success" | "warning" | "destructive" }> = {
  SENADA: { label: "Señada", variant: "warning" },
  ENTREGADA: { label: "Entregada", variant: "success" },
  CANCELADA: { label: "Cancelada", variant: "destructive" },
};

/** Ventas — cada operación con su seña, su permuta y su saldo al día. */
export default async function VentasPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ ver?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) notFound();
  if (!hasModule(tenant, "ventas")) {
    return <ModuleDisabled moduleLabel={MODULE_LABELS.ventas} />;
  }

  const ver = sp.ver === "entregadas" ? "entregadas" : "abiertas";
  const estados: VentaEstado[] = ver === "abiertas" ? ["SENADA"] : ["ENTREGADA", "CANCELADA"];

  const ventas = await db.venta.findMany({
    where: { clientId: tenant.id, estado: { in: estados } },
    include: { contact: { select: { name: true, phone: true } } },
    orderBy: { numero: "desc" },
    take: 100,
  });

  // Plata en la calle: saldos pendientes de TODAS las ventas no canceladas.
  const abiertas = await db.venta.findMany({
    where: { clientId: tenant.id, estado: { not: "CANCELADA" } },
    select: { precioArs: true, senaArs: true, permutaValorArs: true, pagos: true },
  });
  const porCobrar = abiertas.reduce(
    (s, v) => s + Math.max(0, saldoDeVenta(v.precioArs, v.senaArs, v.permutaValorArs, v.pagos as PagoVenta[] | null)),
    0
  );

  const base = `/os/${tenant.slug}/ventas`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Ventas</h1>
          <p className="text-sm text-muted-foreground">
            Señas, permutas y cuotas — cada operación con su saldo al día.
          </p>
        </div>
        <ButtonLink href={`${base}/nueva`} size="sm">
          + Venta
        </ButtonLink>
      </div>

      <div className="grid max-w-sm grid-cols-1">
        <Stat
          label="Por cobrar"
          value={fmtArs(porCobrar)}
          hint="Saldos pendientes de todas las ventas"
          tone={porCobrar > 0 ? "warning" : "success"}
        />
      </div>

      <div className="-mx-1 flex items-center gap-1 overflow-x-auto border-b pb-px">
        {[
          { key: "abiertas", label: "Abiertas" },
          { key: "entregadas", label: "Entregadas" },
        ].map((t) => (
          <Link
            key={t.key}
            href={`${base}?ver=${t.key}`}
            aria-current={ver === t.key ? "page" : undefined}
            className={`shrink-0 rounded-t-md px-4 py-2 text-sm font-medium transition-colors ${
              ver === t.key
                ? "border-b-2 border-primary text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {ventas.length === 0 ? (
        <EmptyState
          icon="🤝"
          title={ver === "abiertas" ? "Sin ventas abiertas" : "Sin entregas todavía"}
          detail={ver === "abiertas" ? 'Cargá la primera con "+ Venta".' : ""}
        />
      ) : (
        <ul className="space-y-2">
          {ventas.map((v) => {
            const e = ESTADOS[v.estado];
            const saldo = saldoDeVenta(v.precioArs, v.senaArs, v.permutaValorArs, v.pagos as PagoVenta[] | null);
            return (
              <li key={v.id}>
                <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <Link href={`${base}/${v.id}`} className="font-semibold hover:text-primary hover:underline">
                      <span className="font-mono text-sm text-muted-foreground">
                        V-{String(v.numero).padStart(4, "0")}
                      </span>{" "}
                      · {v.descripcion}
                    </Link>
                    <p className="truncate text-sm text-muted-foreground">
                      {v.contact?.name ?? "Sin cliente"} · {fmtArs(v.precioArs)}
                      {v.permutaValorArs > 0 ? ` · permuta ${fmtArs(v.permutaValorArs)}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {saldo > 0 ? (
                      <span className="text-sm font-medium tabular-nums text-warning">
                        debe {fmtArs(saldo)}
                      </span>
                    ) : (
                      <span className="text-sm font-medium text-success">saldada ✓</span>
                    )}
                    <Badge variant={e.variant}>{e.label}</Badge>
                    <VentaAccionesFila
                      slug={tenant.slug}
                      ventaId={v.id}
                      nombre={v.contact?.name ?? null}
                      telefono={v.contact?.phone ?? null}
                      descripcion={v.descripcion}
                      saldo={saldo}
                      abierta={v.estado === "SENADA"}
                    />
                    <span className="text-xs text-muted-foreground">{fmtDateShort(v.createdAt)}</span>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
