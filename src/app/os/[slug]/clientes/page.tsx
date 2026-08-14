import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getTenantBySlug } from "@/lib/tenant";

export const dynamic = "force-dynamic";
export const metadata = { title: "Clientes" };

const plata = (n: number) => `$ ${Math.round(n).toLocaleString("es-AR")}`;

/** Base de clientes: la lista completa, con su historial a un click. */
export default async function ClientesPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { slug } = await params;
  const { q } = await searchParams;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) notFound();

  const [contactos, eventos] = await Promise.all([
    db.contact.findMany({
      where: {
        clientId: tenant.id,
        ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { phone: { contains: q } }] } : {}),
      },
      orderBy: { name: "asc" },
      take: 400,
      select: { id: true, name: true, phone: true, email: true },
    }),
    db.eventoOrg.findMany({ where: { clientId: tenant.id }, select: { contacto: true, presupuesto: true, cobrado: true } }),
  ]);

  // Historial resumido por nombre: cuántos eventos y cuánto facturó cada cliente.
  const resumen = new Map<string, { eventos: number; total: number }>();
  for (const e of eventos) {
    const k = (e.contacto ?? "").trim().toLowerCase();
    if (!k) continue;
    const r = resumen.get(k) ?? { eventos: 0, total: 0 };
    r.eventos += 1;
    r.total += e.presupuesto;
    resumen.set(k, r);
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[40px] leading-none" style={{ fontFamily: "var(--font-italiana)" }}>Clientes</h1>
          <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {contactos.length} en la base · entrá a cada uno para ver su historial
          </p>
        </div>
        <form className="flex gap-2">
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Buscar por nombre o teléfono…"
            className="h-10 w-64 rounded-lg border border-border bg-white px-3 text-sm outline-none focus:border-primary"
          />
          <button className="rounded-lg border border-border px-4 text-[11px] font-semibold uppercase tracking-[0.14em] transition hover:bg-muted">
            Buscar
          </button>
        </form>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Teléfono</th>
              <th className="hidden px-4 py-3 sm:table-cell">Email</th>
              <th className="px-4 py-3 text-right">Eventos</th>
              <th className="px-4 py-3 text-right">Facturado</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {contactos.map((c) => {
              const r = resumen.get(c.name.trim().toLowerCase());
              return (
                <tr key={c.id} className="border-b border-border/60 last:border-0">
                  <td className="px-4 py-3 font-medium">
                    <Link href={`/os/${slug}/clientes/${c.id}`} className="transition hover:opacity-60">
                      {c.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 tabular-nums text-muted-foreground">{c.phone ?? "—"}</td>
                  <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">{c.email ?? "—"}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{r?.eventos ?? 0}</td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums">{r ? plata(r.total) : "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/os/${slug}/clientes/${c.id}`}
                      className="rounded-lg border border-border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] transition hover:bg-muted"
                    >
                      Ver ficha
                    </Link>
                  </td>
                </tr>
              );
            })}
            {!contactos.length ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">Sin clientes {q ? "para esa búsqueda" : "todavía"}.</td></tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
