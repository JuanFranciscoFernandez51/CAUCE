import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getTenantBySlug } from "@/lib/tenant";
import { esConcesionaria } from "@/lib/conce-server";
import { FinanciacionNueva } from "../../_components/conce/financiacion-nueva";

export const dynamic = "force-dynamic";

/** Alta manual de una financiación (la del boleto se arma sola al entregarlo). */
export default async function FinanciacionNuevaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant || !esConcesionaria(tenant)) notFound();

  const clientes = await db.contact.findMany({
    where: { clientId: tenant.id },
    orderBy: { name: "asc" },
    take: 500,
    select: { id: true, name: true, phone: true },
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Nueva financiación</h1>
          <p className="max-w-3xl text-sm text-muted-foreground">
            Cargá el monto y las cuotas: el plan se arma solo y queda listo para cobrar y avisar.
          </p>
        </div>
        <Link
          href={`/os/${tenant.slug}/financiaciones`}
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Volver
        </Link>
      </div>

      <FinanciacionNueva
        slug={tenant.slug}
        clientes={clientes.map((c) => ({ id: c.id, nombre: c.name, telefono: c.phone }))}
      />
    </div>
  );
}
