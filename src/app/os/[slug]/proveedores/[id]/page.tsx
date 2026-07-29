import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getTenantBySlug } from "@/lib/tenant";
import { esConcesionaria } from "@/lib/conce-server";
import { Badge } from "@/components/ui";
import { contactosDe, cuentasDe, preciosDe } from "@/lib/conce-fin";
import { ProveedorFicha } from "../../_components/conce/proveedor-ficha";

export const dynamic = "force-dynamic";

/** Ficha del proveedor: datos, contactos, cuentas bancarias y lista de precios. */
export default async function ProveedorPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant || !esConcesionaria(tenant)) notFound();

  const p = await db.proveedor.findFirst({ where: { id, clientId: tenant.id } });
  if (!p) notFound();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{p.nombre}</h1>
            <Badge variant={p.activo ? "success" : "default"}>
              {p.activo ? "Activo" : "Inactivo"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {[p.rubro, p.ciudad, p.cuit ? `CUIT ${p.cuit}` : null].filter(Boolean).join(" · ") ||
              "Completá la ficha para tener todo a mano"}
          </p>
        </div>
        <Link
          href={`/os/${tenant.slug}/proveedores`}
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Volver a proveedores
        </Link>
      </div>

      <ProveedorFicha
        slug={tenant.slug}
        inicial={{
          id: p.id,
          nombre: p.nombre,
          rubro: p.rubro ?? "",
          cuit: p.cuit ?? "",
          telefono: p.telefono ?? "",
          email: p.email ?? "",
          direccion: p.direccion ?? "",
          ciudad: p.ciudad ?? "",
          sitio: p.sitio ?? "",
          notas: p.notas ?? "",
          activo: p.activo,
          contactos: contactosDe(p.contactos),
          cuentasBancarias: cuentasDe(p.cuentasBancarias),
          listaPrecios: preciosDe(p.listaPrecios),
        }}
      />
    </div>
  );
}
