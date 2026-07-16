import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getTenantBySlug, hasModule, tenantBranding } from "@/lib/tenant";
import { Imprimible } from "../../../_components/imprimible";
import { saldoDeVenta, type PagoVenta } from "../../saldo";

const ars = (n: number) => `$ ${Math.round(n).toLocaleString("es-AR")}`;

/** Boleto de la venta imprimible: la operación completa, para firmar. */
export default async function BoletoPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant || !hasModule(tenant, "ventas")) notFound();

  const venta = await db.venta.findFirst({
    where: { id, clientId: tenant.id },
    include: { contact: { select: { name: true, phone: true } } },
  });
  if (!venta) notFound();

  const branding = tenantBranding(tenant);
  const pagos = (venta.pagos as PagoVenta[] | null) ?? [];
  const cuotas = venta.cuotas as { cantidad: number; valorArs: number; diaVencimiento: number } | null;
  const saldo = saldoDeVenta(venta.precioArs, venta.senaArs, venta.permutaValorArs, pagos);

  return (
    <Imprimible
      negocio={branding.displayName}
      primary={branding.primary}
      titulo={`Boleto de venta V-${String(venta.numero).padStart(4, "0")}`}
      subtitulo={venta.estado === "ENTREGADA" ? "Entregada" : "Señada"}
    >
      <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
        <div>
          <dt className="text-xs uppercase tracking-wide text-gray-500">Comprador</dt>
          <dd className="font-medium">{venta.contact?.name ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-gray-500">Teléfono</dt>
          <dd className="font-medium">{venta.contact?.phone ?? "—"}</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-xs uppercase tracking-wide text-gray-500">Objeto de la venta</dt>
          <dd className="font-medium">{venta.descripcion}</dd>
        </div>
      </dl>

      <table className="mt-5 w-full text-sm">
        <tbody>
          <tr className="border-b border-gray-100">
            <td className="py-1.5">Precio de venta</td>
            <td className="py-1.5 text-right font-semibold tabular-nums">{ars(venta.precioArs)}</td>
          </tr>
          {venta.senaArs > 0 ? (
            <tr className="border-b border-gray-100">
              <td className="py-1.5">Seña</td>
              <td className="py-1.5 text-right tabular-nums">− {ars(venta.senaArs)}</td>
            </tr>
          ) : null}
          {venta.permutaValorArs > 0 ? (
            <tr className="border-b border-gray-100">
              <td className="py-1.5">
                Permuta{venta.permutaDetalle ? ` — ${venta.permutaDetalle}` : ""}
              </td>
              <td className="py-1.5 text-right tabular-nums">− {ars(venta.permutaValorArs)}</td>
            </tr>
          ) : null}
          {pagos.map((p, i) => (
            <tr key={i} className="border-b border-gray-100">
              <td className="py-1.5 text-gray-600">
                Pago {p.fecha} ({p.medio})
              </td>
              <td className="py-1.5 text-right tabular-nums">− {ars(p.montoArs)}</td>
            </tr>
          ))}
          <tr>
            <td className="py-2 font-semibold">Saldo</td>
            <td className="py-2 text-right text-base font-bold tabular-nums">
              {saldo > 0 ? ars(saldo) : "SALDADA ✓"}
            </td>
          </tr>
        </tbody>
      </table>

      {cuotas ? (
        <p className="mt-3 rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-700">
          El saldo se abona en <span className="font-semibold">{cuotas.cantidad} cuotas</span> de{" "}
          <span className="font-semibold">{ars(cuotas.valorArs)}</span>, con vencimiento el día{" "}
          {cuotas.diaVencimiento} de cada mes.
        </p>
      ) : null}

      {venta.notas ? <p className="mt-3 text-sm text-gray-600">{venta.notas}</p> : null}

      <div className="mt-14 grid grid-cols-2 gap-10 text-center text-sm">
        <div className="border-t pt-2 text-gray-500">Por {branding.displayName}</div>
        <div className="border-t pt-2 text-gray-500">Firma del comprador</div>
      </div>
    </Imprimible>
  );
}
