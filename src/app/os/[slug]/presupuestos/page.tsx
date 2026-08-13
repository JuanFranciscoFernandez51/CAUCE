import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { getTenantBySlug } from "@/lib/tenant";
import { ButtonLink } from "@/components/ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "Presupuestos" };

const TONO: Record<string, string> = {
  BORRADOR: "bg-muted text-muted-foreground",
  ENVIADO: "bg-primary/15 text-primary",
  ACEPTADO: "bg-emerald-500/15 text-emerald-500",
  RECHAZADO: "bg-destructive/10 text-destructive",
};

/** Presupuestos de servicio: se arman acá y salen en PDF con la marca. */
export default async function PresupuestosPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) notFound();

  const lista = await db.presupuestoDoc.findMany({
    where: { clientId: tenant.id },
    orderBy: { numero: "desc" },
    take: 100,
  });

  const plata = (n: number) => `$ ${n.toLocaleString("es-AR")}`;
  const totalDe = (p: (typeof lista)[number]) => {
    const items = (p.items as { cant: number; unitario: number }[]) ?? [];
    return items.reduce((a, i) => a + i.cant * i.unitario, 0) + p.materiales;
  };

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Presupuestos</h1>
          <p className="text-sm text-muted-foreground">Se arman acá y salen en PDF con tu marca, listos para mandar.</p>
        </div>
        <ButtonLink href={`/os/${slug}/presupuestos/nuevo`}>+ Nuevo presupuesto</ButtonLink>
      </div>

      {lista.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
          Todavía no hay presupuestos. Armá el primero.
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-2.5">N°</th>
                <th className="px-3 py-2.5">Cliente</th>
                <th className="px-3 py-2.5">Fecha</th>
                <th className="px-3 py-2.5 text-right">Total</th>
                <th className="px-3 py-2.5">Estado</th>
                <th className="px-3 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {lista.map((p) => (
                <tr key={p.id}>
                  <td className="px-3 py-2.5 font-semibold">#{String(p.numero).padStart(4, "0")}</td>
                  <td className="px-3 py-2.5">
                    <p className="font-medium">{p.nombre}</p>
                    {p.telefono ? <p className="text-xs text-muted-foreground">{p.telefono}</p> : null}
                  </td>
                  <td className="px-3 py-2.5 text-xs text-muted-foreground">
                    {p.createdAt.toLocaleDateString("es-AR")}
                  </td>
                  <td className="px-3 py-2.5 text-right font-semibold tabular-nums">{plata(totalDe(p))}</td>
                  <td className="px-3 py-2.5">
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${TONO[p.estado] ?? TONO.BORRADOR}`}>
                      {p.estado.toLowerCase()}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <Link
                      href={`/os/${slug}/presupuestos/${p.id}/imprimir`}
                      target="_blank"
                      className="rounded-md border border-border px-2.5 py-1 text-xs font-medium transition hover:bg-muted"
                    >
                      PDF / Imprimir
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
