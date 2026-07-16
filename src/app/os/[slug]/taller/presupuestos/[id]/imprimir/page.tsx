import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getTenantBySlug, hasModule, tenantBranding } from "@/lib/tenant";
import { Imprimible } from "../../../../_components/imprimible";

type Item = { descripcion: string; cantidad: number; precioArs: number; tipo: string };
const ars = (n: number) => `$ ${Math.round(n).toLocaleString("es-AR")}`;

/** Presupuesto imprimible: para mandar o entregar en mano. */
export default async function ImprimirPresupuestoPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant || !hasModule(tenant, "taller")) notFound();

  const p = await db.presupuestoTaller.findFirst({
    where: { id, clientId: tenant.id },
    include: { contact: { select: { name: true, phone: true } } },
  });
  if (!p) notFound();

  const branding = tenantBranding(tenant);
  const items = ((p.items as Item[] | null) ?? []).filter((i) => i.descripcion);

  return (
    <Imprimible
      negocio={branding.displayName}
      primary={branding.primary}
      titulo={`Presupuesto P-${String(p.numero).padStart(4, "0")}`}
      subtitulo={`Válido por ${p.validezDias} días`}
    >
      <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
        <div>
          <dt className="text-xs uppercase tracking-wide text-gray-500">Cliente</dt>
          <dd className="font-medium">{p.contact?.name ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-gray-500">Equipo</dt>
          <dd className="font-medium">{p.equipo}</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-xs uppercase tracking-wide text-gray-500">Trabajo cotizado</dt>
          <dd>{p.detalle}</dd>
        </div>
      </dl>

      {items.length > 0 ? (
        <table className="mt-5 w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs uppercase tracking-wide text-gray-500">
              <th className="py-1.5">Detalle</th>
              <th className="py-1.5 text-center">Cant.</th>
              <th className="py-1.5 text-right">Precio</th>
              <th className="py-1.5 text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {items.map((i, idx) => (
              <tr key={idx} className="border-b border-gray-100">
                <td className="py-1.5">{i.descripcion}</td>
                <td className="py-1.5 text-center tabular-nums">{i.cantidad}</td>
                <td className="py-1.5 text-right tabular-nums">{ars(i.precioArs)}</td>
                <td className="py-1.5 text-right tabular-nums">{ars(i.cantidad * i.precioArs)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="font-semibold">
              <td colSpan={3} className="py-2 text-right">Total</td>
              <td className="py-2 text-right text-base font-bold tabular-nums">{ars(p.totalArs)}</td>
            </tr>
          </tfoot>
        </table>
      ) : null}

      <p className="mt-6 text-xs text-gray-500">
        Presupuesto sin cargo y sin compromiso. Los precios pueden variar pasada la validez.
      </p>
    </Imprimible>
  );
}
