import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getTenantBySlug, hasModule, MODULE_LABELS } from "@/lib/tenant";
import { Badge } from "@/components/ui";
import { ModuleDisabled } from "../../../_components/module-disabled";
import { fmtDateShort } from "../../../_lib/dates";
import { PresupuestoDetail, type PresupuestoData } from "./presupuesto-detail";

const ESTADOS: Record<string, { label: string; variant: "default" | "primary" | "success" | "warning" | "destructive" }> = {
  BORRADOR: { label: "Borrador", variant: "default" },
  ENVIADO: { label: "Enviado", variant: "warning" },
  ACEPTADO: { label: "Aceptado → OT", variant: "success" },
  RECHAZADO: { label: "Rechazado", variant: "destructive" },
};

export default async function PresupuestoPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) notFound();
  if (!hasModule(tenant, "taller")) {
    return <ModuleDisabled moduleLabel={MODULE_LABELS.taller} />;
  }

  const p = await db.presupuestoTaller.findFirst({
    where: { id, clientId: tenant.id },
    include: { contact: { select: { id: true, name: true, phone: true } } },
  });
  if (!p) notFound();

  const e = ESTADOS[p.estado];
  const data: PresupuestoData = {
    id: p.id,
    numero: p.numero,
    equipo: p.equipo,
    detalle: p.detalle,
    items: (p.items as PresupuestoData["items"]) ?? [],
    totalArs: p.totalArs,
    validezDias: p.validezDias,
    estado: p.estado,
    otId: p.otId,
    contacto: p.contact ? { id: p.contact.id, name: p.contact.name, phone: p.contact.phone } : null,
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <Link
          href={`/os/${tenant.slug}/taller/presupuestos`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Presupuestos
        </Link>
        <a
          href={`/os/${tenant.slug}/taller/presupuestos/${p.id}/imprimir`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-md border bg-card px-3 py-1.5 text-sm font-medium hover:bg-muted"
        >
          🖨️ Imprimir
        </a>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold">
          P-{String(p.numero).padStart(4, "0")} · {p.equipo}
        </h1>
        <Badge variant={e.variant}>{e.label}</Badge>
        <span className="text-sm text-muted-foreground">{fmtDateShort(p.createdAt)}</span>
      </div>
      {p.contact ? (
        <p className="-mt-2 text-sm text-muted-foreground">
          Cliente:{" "}
          <Link
            href={`/os/${tenant.slug}/crm/${p.contact.id}`}
            className="font-medium text-primary hover:underline"
          >
            {p.contact.name}
          </Link>
          {p.contact.phone ? ` · ${p.contact.phone}` : ""}
        </p>
      ) : null}

      <PresupuestoDetail slug={tenant.slug} presupuesto={data} />
    </div>
  );
}
