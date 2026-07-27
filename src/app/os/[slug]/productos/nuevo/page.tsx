import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getTenantBySlug } from "@/lib/tenant";
import { esBazar } from "@/lib/bazar-server";
import { ProductoForm } from "../../_components/bazar/producto-form";

export const dynamic = "force-dynamic";

export default async function NuevoProductoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant || !esBazar(tenant)) notFound();

  const categoriasRaw = await db.bazarProducto.groupBy({
    by: ["categoria"],
    where: { clientId: tenant.id },
    orderBy: { categoria: "asc" },
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Nuevo producto</h1>
        <p className="text-sm text-muted-foreground">
          Cargá los datos, guardá y en el paso siguiente le subís las fotos.
        </p>
      </div>
      <ProductoForm
        slug={tenant.slug}
        categorias={categoriasRaw.map((c) => c.categoria)}
        inicial={{
          nombre: "",
          categoria: "",
          precio: 0,
          precioOferta: null,
          stock: 0,
          descripcion: "",
          sku: "",
          destacado: false,
          activo: true,
          fotos: [],
        }}
      />
    </div>
  );
}
