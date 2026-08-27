import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getTenantBySlug } from "@/lib/tenant";
import { esVidrios, ordenDatos, ordenItems, totalOrden, vehiculoLinea } from "@/lib/vidrios";
import { MarcarColocada } from "./marcar-colocada";

export const dynamic = "force-dynamic";
export const metadata = { title: "Taller · Colocaciones" };

/** La cola del taller: órdenes confirmadas, agrupadas por día de colocación. */
export default async function ColocacionesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant || !esVidrios(tenant)) notFound();
  const base = `/os/${slug}`;

  const confirmadas = await db.presupuestoDoc.findMany({
    where: { clientId: tenant.id, estado: "CONFIRMADA" },
    orderBy: { numero: "asc" },
  });

  const hoy = new Date().toISOString().slice(0, 10);
  const manana = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const fechaLinda = (f: string) => f.split("-").reverse().join("/");
  const plata = (n: number) => `$ ${n.toLocaleString("es-AR")}`;

  const conDatos = confirmadas.map((p) => ({ p, d: ordenDatos(p) }));
  const grupos: { titulo: string; tono: string; filas: typeof conDatos }[] = [
    { titulo: "Hoy", tono: "text-destructive", filas: conDatos.filter((x) => x.d.fechaColocacion === hoy) },
    { titulo: "Mañana", tono: "text-warning", filas: conDatos.filter((x) => x.d.fechaColocacion === manana) },
    {
      titulo: "Próximos días",
      tono: "text-primary",
      filas: conDatos
        .filter((x) => x.d.fechaColocacion && x.d.fechaColocacion > manana)
        .sort((a, b) => (a.d.fechaColocacion! < b.d.fechaColocacion! ? -1 : 1)),
    },
    { titulo: "Vencidas / sin fecha", tono: "text-muted-foreground", filas: conDatos.filter((x) => !x.d.fechaColocacion || x.d.fechaColocacion < hoy) },
  ];

  return (
    <div className="space-y-5 p-4 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Taller · Pendientes de colocación</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {confirmadas.length} orden{confirmadas.length === 1 ? "" : "es"} confirmadas esperando colocación.
            Se confirman desde{" "}
            <Link href={`${base}/ordenes`} className="underline underline-offset-2">Órdenes</Link>.
          </p>
        </div>
        <Link href={`${base}/taller`} className="rounded-lg border px-3 py-2 text-xs font-semibold transition hover:bg-muted">
          Órdenes de trabajo del taller →
        </Link>
      </div>

      {grupos.map((g) =>
        g.filas.length ? (
          <section key={g.titulo}>
            <h2 className={`text-xs font-bold uppercase tracking-wide ${g.tono}`}>
              {g.titulo} · {g.filas.length}
            </h2>
            <div className="mt-2 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {g.filas.map(({ p, d }) => {
                const total = totalOrden(p);
                const saldo = total - d.senia;
                return (
                  <div key={p.id} className="rounded-xl border bg-card p-4 transition hover:shadow-md">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold">#{String(p.numero).padStart(4, "0")} · {p.nombre}</p>
                        <p className="text-sm text-muted-foreground">{vehiculoLinea(d) || "Sin vehículo"}</p>
                      </div>
                      {d.fechaColocacion ? (
                        <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
                          {fechaLinda(d.fechaColocacion)}
                        </span>
                      ) : null}
                    </div>
                    <ul className="mt-2 space-y-0.5 text-xs text-muted-foreground">
                      {ordenItems(p).slice(0, 3).map((i, k) => (
                        <li key={k}>• {i.cant}× {i.detalle}{i.codigo ? ` (${i.codigo})` : ""}</li>
                      ))}
                    </ul>
                    <div className="mt-3 flex items-center justify-between border-t pt-2 text-sm">
                      <span className="tabular-nums">
                        {plata(total)}{saldo > 0 ? <span className="text-destructive"> · saldo {plata(saldo)}</span> : null}
                      </span>
                      <span className="flex gap-2">
                        <Link href={`${base}/ordenes/${p.id}/imprimir`} target="_blank" className="rounded-md border px-2 py-1 text-xs transition hover:bg-muted">
                          🖨
                        </Link>
                        <MarcarColocada slug={slug} id={p.id} />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ) : null
      )}

      {!confirmadas.length ? (
        <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          Nada en cola. Cuando confirmes una orden desde <Link href={`${base}/ordenes`} className="underline">Órdenes</Link>, aparece acá con su día.
        </div>
      ) : null}
    </div>
  );
}
