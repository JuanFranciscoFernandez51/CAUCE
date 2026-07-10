import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getTenantBySlug, hasModule, MODULE_LABELS } from "@/lib/tenant";
import { Badge } from "@/components/ui";
import { ModuleDisabled } from "../../_components/module-disabled";
import { fmtDateShort } from "../../_lib/dates";
import { VentaDetail, type VentaData } from "./venta-detail";
import type { PagoVenta } from "../saldo";

const ESTADOS: Record<string, { label: string; variant: "default" | "success" | "warning" | "destructive" }> = {
  SENADA: { label: "Señada", variant: "warning" },
  ENTREGADA: { label: "Entregada", variant: "success" },
  CANCELADA: { label: "Cancelada", variant: "destructive" },
};

export default async function VentaPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) notFound();
  if (!hasModule(tenant, "ventas")) {
    return <ModuleDisabled moduleLabel={MODULE_LABELS.ventas} />;
  }

  const venta = await db.venta.findFirst({
    where: { id, clientId: tenant.id },
    include: { contact: { select: { id: true, name: true, phone: true } } },
  });
  if (!venta) notFound();

  const e = ESTADOS[venta.estado];
  const data: VentaData = {
    id: venta.id,
    numero: venta.numero,
    descripcion: venta.descripcion,
    precioArs: venta.precioArs,
    senaArs: venta.senaArs,
    permutaDetalle: venta.permutaDetalle,
    permutaValorArs: venta.permutaValorArs,
    pagos: (venta.pagos as PagoVenta[] | null) ?? [],
    cuotas: (venta.cuotas as VentaData["cuotas"]) ?? null,
    estado: venta.estado,
    notas: venta.notas,
    contacto: venta.contact
      ? { id: venta.contact.id, name: venta.contact.name, phone: venta.contact.phone }
      : null,
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <Link
          href={`/os/${tenant.slug}/ventas`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Ventas
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold">
            V-{String(venta.numero).padStart(4, "0")} · {venta.descripcion}
          </h1>
          <Badge variant={e.variant}>{e.label}</Badge>
          <span className="text-sm text-muted-foreground">{fmtDateShort(venta.createdAt)}</span>
        </div>
        {venta.contact ? (
          <p className="mt-0.5 text-sm text-muted-foreground">
            Comprador:{" "}
            <Link
              href={`/os/${tenant.slug}/crm/${venta.contact.id}`}
              className="font-medium text-primary hover:underline"
            >
              {venta.contact.name}
            </Link>
            {venta.contact.phone ? ` · ${venta.contact.phone}` : ""}
          </p>
        ) : null}
      </div>

      <VentaDetail slug={tenant.slug} venta={data} />
    </div>
  );
}
