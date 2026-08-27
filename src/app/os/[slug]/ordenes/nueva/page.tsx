import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getTenantBySlug } from "@/lib/tenant";
import { esVidrios } from "@/lib/vidrios";
import { OrdenForm } from "./orden-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Nueva orden" };

/** Armador de la orden: cliente del CRM (o nuevo), vehículo e ítems del stock. */
export default async function NuevaOrdenPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant || !esVidrios(tenant)) notFound();

  const [contactos, stock] = await Promise.all([
    db.contact.findMany({
      where: { clientId: tenant.id },
      orderBy: { name: "asc" },
      take: 500,
      select: { name: true, phone: true },
    }),
    db.bazarProducto.findMany({
      where: { clientId: tenant.id, activo: true },
      orderBy: { nombre: "asc" },
      take: 1000,
      select: { sku: true, nombre: true, precio: true, categoria: true, stock: true },
    }),
  ]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Nueva orden de pedido</h1>
        <p className="text-sm text-muted-foreground">
          Si el cliente ya está en Clientes lo encontrás escribiendo; si es nuevo, se crea solo.
        </p>
      </div>
      <OrdenForm
        slug={tenant.slug}
        contactos={contactos.map((c) => ({ nombre: c.name, telefono: c.phone ?? "" }))}
        stock={stock.map((p) => ({
          codigo: p.sku ?? "",
          nombre: p.nombre,
          precio: p.precio,
          categoria: p.categoria,
          stock: p.stock,
        }))}
      />
    </div>
  );
}
