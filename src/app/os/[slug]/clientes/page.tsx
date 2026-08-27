import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getTenantBySlug } from "@/lib/tenant";
import { esVidrios, ordenDatos, totalOrden, vehiculoLinea } from "@/lib/vidrios";

export const dynamic = "force-dynamic";
export const metadata = { title: "Clientes" };

const plata = (n: number) => `$ ${Math.round(n).toLocaleString("es-AR")}`;

/**
 * Base de clientes del taller: cada persona con TODO lo que se le hizo.
 * No es un CRM de ventas — es el historial de pasos por el taller, que se
 * arma solo con cada orden (mismo cliente = se le suma, no se duplica).
 */
export default async function ClientesVidriosPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { slug } = await params;
  const { q } = await searchParams;
  const tenant = await getTenantBySlug(slug);
  if (!tenant || !esVidrios(tenant)) notFound();
  const base = `/os/${slug}`;

  const [contactos, ordenes] = await Promise.all([
    db.contact.findMany({
      where: {
        clientId: tenant.id,
        ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { phone: { contains: q } }] } : {}),
      },
      orderBy: { name: "asc" },
      take: 500,
      select: { id: true, name: true, phone: true, email: true },
    }),
    db.presupuestoDoc.findMany({ where: { clientId: tenant.id }, orderBy: { numero: "desc" } }),
  ]);

  // El historial se cruza por nombre (así lo guarda la orden) y por teléfono.
  const clave = (n: string) => n.trim().toLowerCase();
  const porCliente = new Map<string, { visitas: number; total: number; ultima?: Date; ultimoVehiculo?: string }>();
  for (const o of ordenes) {
    const k = clave(o.nombre);
    const r = porCliente.get(k) ?? { visitas: 0, total: 0 };
    r.visitas += 1;
    r.total += totalOrden(o);
    if (!r.ultima || o.createdAt > r.ultima) {
      r.ultima = o.createdAt;
      r.ultimoVehiculo = vehiculoLinea(ordenDatos(o));
    }
    porCliente.set(k, r);
  }

  const filas = contactos
    .map((c) => ({ c, h: porCliente.get(clave(c.name)) }))
    .sort((a, b) => (b.h?.ultima?.getTime() ?? 0) - (a.h?.ultima?.getTime() ?? 0));

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Clientes</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {contactos.length} clientes · se cargan solos con cada orden. Entrá a uno para ver todo lo que se le hizo.
          </p>
        </div>
        <form className="flex gap-2">
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Buscar por nombre o teléfono…"
            className="h-9 w-64 rounded-lg border bg-card px-3 text-sm"
          />
          <button className="rounded-lg border px-3 text-xs font-semibold transition hover:bg-muted">Buscar</button>
        </form>
      </div>

      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-muted/50 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-3 py-2.5">Cliente</th>
              <th className="px-3 py-2.5">Teléfono</th>
              <th className="px-3 py-2.5">Último vehículo</th>
              <th className="px-3 py-2.5 text-right">Trabajos</th>
              <th className="px-3 py-2.5 text-right">Facturado</th>
              <th className="px-3 py-2.5">Última vez</th>
              <th className="px-3 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {filas.map(({ c, h }) => (
              <tr key={c.id} className="transition-colors hover:bg-muted/30">
                <td className="px-3 py-2.5 font-medium">
                  <Link href={`${base}/clientes/${c.id}`} className="hover:underline">{c.name}</Link>
                </td>
                <td className="px-3 py-2.5 tabular-nums text-muted-foreground">{c.phone ?? "—"}</td>
                <td className="px-3 py-2.5 text-muted-foreground">{h?.ultimoVehiculo || "—"}</td>
                <td className="px-3 py-2.5 text-right tabular-nums">{h?.visitas ?? 0}</td>
                <td className="px-3 py-2.5 text-right font-semibold tabular-nums">{h ? plata(h.total) : "—"}</td>
                <td className="px-3 py-2.5 text-muted-foreground">
                  {h?.ultima ? h.ultima.toLocaleDateString("es-AR") : "—"}
                </td>
                <td className="px-3 py-2.5 text-right">
                  <Link
                    href={`${base}/clientes/${c.id}`}
                    className="rounded-md border px-2.5 py-1 text-xs font-medium transition hover:bg-muted"
                  >
                    Historial
                  </Link>
                </td>
              </tr>
            ))}
            {!filas.length ? (
              <tr>
                <td colSpan={7} className="px-3 py-10 text-center text-muted-foreground">
                  Sin clientes {q ? "para esa búsqueda" : "todavía"}. Se crean solos al cargar una orden.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
