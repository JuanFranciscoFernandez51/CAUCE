import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getTenantBySlug } from "@/lib/tenant";
import { esBazar } from "@/lib/bazar-server";
import { fotosDe } from "@/lib/bazar";
import { Badge } from "@/components/ui";
import { ProductoForm } from "../../_components/bazar/producto-form";

export const dynamic = "force-dynamic";

export default async function EditarProductoPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant || !esBazar(tenant)) notFound();

  const [producto, categoriasRaw] = await Promise.all([
    db.bazarProducto.findFirst({ where: { id, clientId: tenant.id } }),
    db.bazarProducto.groupBy({
      by: ["categoria"],
      where: { clientId: tenant.id },
      orderBy: { categoria: "asc" },
    }),
  ]);
  if (!producto) notFound();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-semibold tracking-tight">{producto.nombre}</h1>
          <p className="text-sm text-muted-foreground">
            {producto.vendidos} vendidos · {producto.visitas} visitas
          </p>
        </div>
        {!producto.activo ? <Badge variant="warning">Pausado</Badge> : null}
        <Link
          href={`/sitio/${tenant.slug}/producto/${producto.slug}`}
          target="_blank"
          className="text-sm font-medium text-primary hover:underline"
        >
          Ver en la tienda →
        </Link>
      </div>
      <ProductoForm
        slug={tenant.slug}
        categorias={categoriasRaw.map((c) => c.categoria)}
        inicial={{
          id: producto.id,
          nombre: producto.nombre,
          categoria: producto.categoria,
          precio: producto.precio,
          precioOferta: producto.precioOferta,
          stock: producto.stock,
          descripcion: producto.descripcion ?? "",
          sku: producto.sku ?? "",
          destacado: producto.destacado,
          activo: producto.activo,
          fotos: fotosDe(producto.fotos),
        }}
      />
    </div>
  );
}
