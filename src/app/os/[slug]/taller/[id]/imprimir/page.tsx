import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getTenantBySlug, hasModule, tenantBranding } from "@/lib/tenant";
import { Imprimible } from "../../../_components/imprimible";
import { OT_ESTADOS } from "../../estados";

type Item = { descripcion: string; cantidad: number; precioArs: number; tipo: string };
const ars = (n: number) => `$ ${Math.round(n).toLocaleString("es-AR")}`;

/** Orden de trabajo imprimible: para el mostrador y para el cliente. */
export default async function ImprimirOtPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant || !hasModule(tenant, "taller")) notFound();

  const ot = await db.ordenTrabajo.findFirst({
    where: { id, clientId: tenant.id },
    include: { contact: { select: { name: true, phone: true } } },
  });
  if (!ot) notFound();

  const branding = tenantBranding(tenant);
  const items = ((ot.items as Item[] | null) ?? []).filter((i) => i.descripcion);
  const saldo = ot.totalArs - ot.pagadoArs;

  return (
    <Imprimible
      negocio={branding.displayName}
      primary={branding.primary}
      titulo={`Orden de trabajo OT-${String(ot.numero).padStart(4, "0")}`}
      subtitulo={OT_ESTADOS[ot.estado]?.label}
    >
      <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
        <div>
          <dt className="text-xs uppercase tracking-wide text-gray-500">Cliente</dt>
          <dd className="font-medium">{ot.contact?.name ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-gray-500">Teléfono</dt>
          <dd className="font-medium">{ot.contact?.phone ?? "—"}</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-xs uppercase tracking-wide text-gray-500">Equipo</dt>
          <dd className="font-medium">{ot.equipo}</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-xs uppercase tracking-wide text-gray-500">Motivo de ingreso</dt>
          <dd>{ot.motivoIngreso}</dd>
        </div>
        {ot.diagnostico ? (
          <div className="col-span-2">
            <dt className="text-xs uppercase tracking-wide text-gray-500">Diagnóstico</dt>
            <dd>{ot.diagnostico}</dd>
          </div>
        ) : null}
        {ot.trabajos ? (
          <div className="col-span-2">
            <dt className="text-xs uppercase tracking-wide text-gray-500">Trabajos realizados</dt>
            <dd>{ot.trabajos}</dd>
          </div>
        ) : null}
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
                <td className="py-1.5">
                  {i.tipo === "mano_obra" ? "🧑‍🔧 " : "🔩 "}
                  {i.descripcion}
                </td>
                <td className="py-1.5 text-center tabular-nums">{i.cantidad}</td>
                <td className="py-1.5 text-right tabular-nums">{ars(i.precioArs)}</td>
                <td className="py-1.5 text-right tabular-nums">{ars(i.cantidad * i.precioArs)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="text-sm font-semibold">
              <td colSpan={3} className="py-2 text-right">Total</td>
              <td className="py-2 text-right tabular-nums">{ars(ot.totalArs)}</td>
            </tr>
            {ot.pagadoArs > 0 ? (
              <>
                <tr className="text-sm">
                  <td colSpan={3} className="py-0.5 text-right text-gray-500">Pagado</td>
                  <td className="py-0.5 text-right tabular-nums text-gray-500">{ars(ot.pagadoArs)}</td>
                </tr>
                <tr className="text-sm font-semibold">
                  <td colSpan={3} className="py-0.5 text-right">Saldo</td>
                  <td className="py-0.5 text-right tabular-nums">{ars(Math.max(0, saldo))}</td>
                </tr>
              </>
            ) : null}
          </tfoot>
        </table>
      ) : null}

      <div className="mt-14 grid grid-cols-2 gap-10 text-center text-sm">
        <div className="border-t pt-2 text-gray-500">Por el taller</div>
        <div className="border-t pt-2 text-gray-500">Recibí conforme (cliente)</div>
      </div>
    </Imprimible>
  );
}
