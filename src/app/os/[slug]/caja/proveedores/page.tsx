import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getTenantBySlug, hasModule, MODULE_LABELS } from "@/lib/tenant";
import { ModuleDisabled } from "../../_components/module-disabled";
import { ProveedoresList, type ProveedorView } from "./proveedores-list";

export default async function ProveedoresPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) notFound();
  if (!hasModule(tenant, "caja")) {
    return <ModuleDisabled moduleLabel={MODULE_LABELS.caja} />;
  }

  const proveedores = await db.proveedor.findMany({
    where: { clientId: tenant.id },
    orderBy: [{ activo: "desc" }, { montoMensual: "desc" }],
  });

  const views: ProveedorView[] = proveedores.map((p) => ({
    id: p.id,
    nombre: p.nombre,
    categoria: p.categoria,
    detalle: p.detalle,
    telefono: p.telefono,
    montoMensual: p.montoMensual,
    diaPago: p.diaPago,
    activo: p.activo,
    notas: p.notas,
  }));

  return <ProveedoresList slug={tenant.slug} proveedores={views} />;
}
