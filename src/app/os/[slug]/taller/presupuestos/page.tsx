import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getTenantBySlug, hasModule, MODULE_LABELS } from "@/lib/tenant";
import { Badge, ButtonLink, Card, EmptyState } from "@/components/ui";
import { ModuleDisabled } from "../../_components/module-disabled";
import { fmtDateShort } from "../../_lib/dates";
import { fmtArs } from "../../_components/money";

const ESTADOS: Record<string, { label: string; variant: "default" | "primary" | "success" | "warning" | "destructive" }> = {
  BORRADOR: { label: "Borrador", variant: "default" },
  ENVIADO: { label: "Enviado", variant: "warning" },
  ACEPTADO: { label: "Aceptado → OT", variant: "success" },
  RECHAZADO: { label: "Rechazado", variant: "destructive" },
};

/** Presupuestos del taller: cotizar sin ingresar, y convertir en OT al aceptar. */
export default async function PresupuestosPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) notFound();
  if (!hasModule(tenant, "taller")) {
    return <ModuleDisabled moduleLabel={MODULE_LABELS.taller} />;
  }

  const presupuestos = await db.presupuestoTaller.findMany({
    where: { clientId: tenant.id },
    include: { contact: { select: { name: true } } },
    orderBy: { numero: "desc" },
    take: 100,
  });

  const base = `/os/${tenant.slug}/taller`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href={base} className="text-sm text-muted-foreground hover:text-foreground">
            ← Taller
          </Link>
          <h1 className="text-2xl font-semibold">Presupuestos</h1>
          <p className="text-sm text-muted-foreground">
            Cotizá sin ingresar el equipo. Si el cliente acepta, se convierte en OT con un clic.
          </p>
        </div>
        <ButtonLink href={`${base}/presupuestos/nuevo`} size="sm">
          + Presupuesto
        </ButtonLink>
      </div>

      {presupuestos.length === 0 ? (
        <EmptyState icon="🧾" title="Sin presupuestos" detail='Creá el primero con "+ Presupuesto".' />
      ) : (
        <ul className="space-y-2">
          {presupuestos.map((p) => {
            const e = ESTADOS[p.estado];
            return (
              <li key={p.id}>
                <Link href={`${base}/presupuestos/${p.id}`} className="block">
                  <Card className="flex flex-wrap items-center justify-between gap-3 p-4 transition-colors hover:bg-muted/50">
                    <div className="min-w-0">
                      <p className="font-semibold">
                        <span className="font-mono text-sm text-muted-foreground">
                          P-{String(p.numero).padStart(4, "0")}
                        </span>{" "}
                        · {p.equipo}
                      </p>
                      <p className="truncate text-sm text-muted-foreground">
                        {p.contact?.name ?? "Sin cliente"} · {p.detalle}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {p.totalArs > 0 ? (
                        <span className="text-sm font-medium tabular-nums">{fmtArs(p.totalArs)}</span>
                      ) : null}
                      <Badge variant={e.variant}>{e.label}</Badge>
                      <span className="text-xs text-muted-foreground">{fmtDateShort(p.createdAt)}</span>
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
