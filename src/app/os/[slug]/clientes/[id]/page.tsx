import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getTenantBySlug } from "@/lib/tenant";
import { esVidrios, ordenDatos, ordenItems, totalOrden, vehiculoLinea, FACTURACION_LABEL } from "@/lib/vidrios";
import { BotonWhatsApp, FLUJO_LABEL } from "../../colocaciones/acciones-orden";

export const dynamic = "force-dynamic";
export const metadata = { title: "Historial del cliente" };

const plata = (n: number) => `$ ${Math.round(n).toLocaleString("es-AR")}`;
const etiqueta = "text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground";

/** Ficha del cliente: sus datos y cada paso que hizo por el taller. */
export default async function ClienteVidriosPage({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant || !esVidrios(tenant)) notFound();
  const base = `/os/${slug}`;

  const c = await db.contact.findFirst({ where: { id, clientId: tenant.id } });
  if (!c) notFound();
  const tel = c.phone?.replace(/\D/g, "") ?? "";

  const [ordenes, turnos] = await Promise.all([
    db.presupuestoDoc.findMany({
      where: {
        clientId: tenant.id,
        OR: [
          { nombre: { equals: c.name, mode: "insensitive" } },
          ...(tel ? [{ telefono: { contains: tel.slice(-8) } }] : []),
        ],
      },
      orderBy: { numero: "desc" },
    }),
    db.appointment.findMany({ where: { clientId: tenant.id, contactId: c.id }, orderBy: { startsAt: "desc" }, take: 20 }),
  ]);

  const total = ordenes.reduce((a, o) => a + totalOrden(o), 0);
  const cobrado = ordenes.reduce((a, o) => a + ordenDatos(o).senia, 0);
  const vehiculos = [...new Set(ordenes.map((o) => vehiculoLinea(ordenDatos(o))).filter(Boolean))];

  return (
    <div className="space-y-5 p-4 sm:p-6">
      <Link href={`${base}/clientes`} className="text-xs font-semibold uppercase tracking-wide text-muted-foreground transition hover:text-foreground">
        ← Clientes
      </Link>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{c.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {c.phone ?? "sin teléfono"} {c.email ? `· ${c.email}` : ""}
            {vehiculos.length ? ` · ${vehiculos.join(" / ")}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <BotonWhatsApp telefono={c.phone} nombre={c.name} numero={ordenes[0]?.numero ?? 0} estado="PENDIENTE" />
          <Link
            href={`${base}/ordenes/nueva?cliente=${encodeURIComponent(c.name)}&telefono=${encodeURIComponent(c.phone ?? "")}`}
            className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition hover:opacity-90"
          >
            + Nueva orden
          </Link>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { t: "TRABAJOS", v: String(ordenes.length) },
          { t: "FACTURADO", v: plata(total) },
          { t: "SEÑAS COBRADAS", v: plata(cobrado) },
        ].map((k) => (
          <div key={k.t} className="rounded-xl border bg-card p-4">
            <p className={etiqueta}>{k.t}</p>
            <p className="mt-1 text-2xl font-bold tabular-nums">{k.v}</p>
          </div>
        ))}
      </div>

      <section className="rounded-xl border bg-card p-5">
        <h2 className={`${etiqueta} border-b pb-2`}>Historial en el taller</h2>
        <div className="mt-3 divide-y">
          {ordenes.map((o) => {
            const d = ordenDatos(o);
            return (
              <div key={o.id} className="flex flex-wrap items-start justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="font-semibold">
                    #{String(o.numero).padStart(4, "0")} · {vehiculoLinea(d) || "Sin vehículo"}
                    <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                      {FLUJO_LABEL[o.estado] ?? o.estado}
                    </span>
                    {d.seguro ? (
                      <span className="ml-1.5 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">
                        🛡 {d.seguro.compania}
                      </span>
                    ) : null}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {o.createdAt.toLocaleDateString("es-AR")}
                    {d.fechaColocacion ? ` · colocación ${d.fechaColocacion.split("-").reverse().join("/")}` : ""}
                    {" · "}
                    {FACTURACION_LABEL[d.facturacion]}
                  </p>
                  <ul className="mt-1 text-xs text-muted-foreground">
                    {ordenItems(o).map((i, k) => (
                      <li key={k}>• {i.cant}× {i.detalle}{i.codigo ? ` (${i.codigo})` : ""}</li>
                    ))}
                  </ul>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold tabular-nums">{plata(totalOrden(o))}</span>
                  <a
                    href={`${base}/ordenes/${o.id}/imprimir`}
                    target="_blank"
                    className="rounded-md border px-2 py-1 text-xs transition hover:bg-muted"
                  >
                    🖨
                  </a>
                </div>
              </div>
            );
          })}
          {!ordenes.length ? <p className="py-6 text-center text-sm text-muted-foreground">Todavía no pasó por el taller.</p> : null}
        </div>
      </section>

      {turnos.length ? (
        <section className="rounded-xl border bg-card p-5">
          <h2 className={`${etiqueta} border-b pb-2`}>Turnos</h2>
          <div className="mt-2 divide-y">
            {turnos.map((t) => (
              <div key={t.id} className="flex items-center justify-between py-2 text-sm">
                <span>{t.title}</span>
                <span className="text-muted-foreground">
                  {t.startsAt.toLocaleDateString("es-AR")} {t.startsAt.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
