import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getTenantBySlug, tenantBranding } from "@/lib/tenant";
import { esBazar } from "@/lib/bazar-server";
import { itemsDe } from "@/lib/bazar";
import { Imprimible } from "../../_components/imprimible";
import { fmtArs } from "../../_components/money";

export const dynamic = "force-dynamic";

/**
 * Lista de picking imprimible: todos los pedidos a preparar (PAGADO y
 * PREPARANDO) con sus items y cantidades, más el total agregado por producto
 * para juntar todo de una pasada por el depósito.
 */
export default async function PickingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant || !esBazar(tenant)) notFound();
  const branding = tenantBranding(tenant);

  const pedidos = await db.bazarPedido.findMany({
    where: { clientId: tenant.id, estado: { in: ["PAGADO", "PREPARANDO"] } },
    orderBy: { numero: "asc" },
  });

  // Agregado por producto (para juntar de una sola pasada).
  const agregado = new Map<string, { nombre: string; cant: number }>();
  for (const p of pedidos) {
    for (const i of itemsDe(p.items)) {
      const previo = agregado.get(i.productoId);
      agregado.set(i.productoId, { nombre: i.nombre, cant: (previo?.cant ?? 0) + i.cant });
    }
  }
  const totalUnidades = [...agregado.values()].reduce((s, a) => s + a.cant, 0);

  return (
    <div className="space-y-4">
      <Link
        href={`/os/${tenant.slug}/despacho`}
        className="no-print text-sm font-medium text-primary hover:underline"
      >
        ← Volver a Despacho
      </Link>
      <Imprimible
        negocio={branding.displayName}
        primary={branding.primary}
        titulo="Lista de picking"
        subtitulo={`${pedidos.length} pedido${pedidos.length === 1 ? "" : "s"} · ${totalUnidades} unidades`}
      >
        {pedidos.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-500">
            No hay pedidos para preparar ahora mismo. 🎉
          </p>
        ) : (
          <div className="space-y-6">
            {/* Juntar todo de una pasada */}
            <section>
              <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-gray-600">
                Para juntar (total por producto)
              </h2>
              <table className="w-full text-sm">
                <tbody>
                  {[...agregado.values()]
                    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"))
                    .map((a, i) => (
                      <tr key={i} className="border-b border-gray-200">
                        <td className="py-1.5 pr-2">☐ {a.nombre}</td>
                        <td className="py-1.5 text-right font-bold">×{a.cant}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </section>

            {/* Detalle por pedido */}
            <section>
              <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-gray-600">
                Armado por pedido
              </h2>
              <div className="space-y-4">
                {pedidos.map((p) => (
                  <div key={p.id} className="rounded border border-gray-300 p-3">
                    <div className="flex items-center justify-between text-sm">
                      <p className="font-bold">
                        Pedido #{p.numero} — {p.nombre}
                      </p>
                      <p className="font-semibold">{fmtArs(p.total)}</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      {p.retiroEnLocal
                        ? "Retira por el local"
                        : `Envío: ${p.direccion ?? ""}${p.ciudad ? `, ${p.ciudad}` : ""}${p.cp ? ` (CP ${p.cp})` : ""}`}
                      {" · "}📞 {p.telefono}
                    </p>
                    <ul className="mt-2 space-y-1 text-sm">
                      {itemsDe(p.items).map((i) => (
                        <li key={i.productoId} className="flex justify-between">
                          <span>☐ {i.nombre}</span>
                          <span className="font-bold">×{i.cant}</span>
                        </li>
                      ))}
                    </ul>
                    {p.notas ? (
                      <p className="mt-2 text-xs italic text-gray-500">Nota: “{p.notas}”</p>
                    ) : null}
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </Imprimible>
    </div>
  );
}
