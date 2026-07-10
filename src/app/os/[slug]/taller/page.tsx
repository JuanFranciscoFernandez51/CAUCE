import Link from "next/link";
import { notFound } from "next/navigation";
import type { OtEstado } from "@prisma/client";
import { db } from "@/lib/db";
import { getTenantBySlug, hasModule, MODULE_LABELS } from "@/lib/tenant";
import { Badge, ButtonLink, Card, EmptyState } from "@/components/ui";
import { ModuleDisabled } from "../_components/module-disabled";
import { fmtDateShort } from "../_lib/dates";
import { fmtArs } from "../_components/money";
import { OT_ESTADOS } from "./estados";

/**
 * Taller — el tablero de órdenes de trabajo: qué está adentro, qué está
 * lista para avisar y qué ya salió. Sin planillas.
 */
export default async function TallerPage({
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
  if (!hasModule(tenant, "taller")) {
    return <ModuleDisabled moduleLabel={MODULE_LABELS.taller} />;
  }

  const ver = sp.ver === "listas" || sp.ver === "salidas" ? sp.ver : "adentro";
  const where: { estado: { in: OtEstado[] } } =
    ver === "adentro"
      ? { estado: { in: ["INGRESADA", "EN_DIAGNOSTICO", "APROBADA", "EN_REPARACION"] } }
      : ver === "listas"
        ? { estado: { in: ["LISTA"] } }
        : { estado: { in: ["ENTREGADA", "CANCELADA"] } };

  const ots = await db.ordenTrabajo.findMany({
    where: { clientId: tenant.id, ...where },
    include: { contact: { select: { name: true, phone: true } } },
    orderBy: { numero: "desc" },
    take: 100,
  });

  const base = `/os/${tenant.slug}/taller`;
  const tabs = [
    { key: "adentro", label: "En el taller" },
    { key: "listas", label: "Listas para entregar" },
    { key: "salidas", label: "Entregadas" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Taller</h1>
          <p className="text-sm text-muted-foreground">
            Órdenes de trabajo: del ingreso a la entrega, con el aviso al cliente automático.
          </p>
        </div>
        <ButtonLink href={`${base}/nueva`} size="sm">
          + Ingreso
        </ButtonLink>
      </div>

      <div className="-mx-1 flex items-center gap-1 overflow-x-auto border-b pb-px">
        {tabs.map((t) => (
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

      {ots.length === 0 ? (
        <EmptyState
          icon="🔧"
          title={ver === "adentro" ? "Nada en el taller" : ver === "listas" ? "Nada para entregar" : "Sin entregas todavía"}
          detail={ver === "adentro" ? 'Cargá el primer ingreso con "+ Ingreso".' : ""}
        />
      ) : (
        <ul className="space-y-2">
          {ots.map((ot) => {
            const e = OT_ESTADOS[ot.estado];
            const saldo = ot.totalArs - ot.pagadoArs;
            return (
              <li key={ot.id}>
                <Link href={`${base}/${ot.id}`} className="block">
                  <Card className="flex flex-wrap items-center justify-between gap-3 p-4 transition-colors hover:bg-muted/50">
                    <div className="min-w-0">
                      <p className="font-semibold">
                        <span className="font-mono text-sm text-muted-foreground">
                          OT-{String(ot.numero).padStart(4, "0")}
                        </span>{" "}
                        · {ot.equipo}
                      </p>
                      <p className="truncate text-sm text-muted-foreground">
                        {ot.contact?.name ?? "Sin cliente"} · {ot.motivoIngreso}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {ot.totalArs > 0 ? (
                        <span className="text-sm tabular-nums">
                          {fmtArs(ot.totalArs)}
                          {saldo > 0 ? (
                            <span className="ml-1 text-xs text-warning">(debe {fmtArs(saldo)})</span>
                          ) : null}
                        </span>
                      ) : null}
                      <Badge variant={e.variant}>{e.label}</Badge>
                      <span className="text-xs text-muted-foreground">{fmtDateShort(ot.createdAt)}</span>
                    </div>
                  </Card>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
