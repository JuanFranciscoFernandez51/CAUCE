import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getTenantBySlug } from "@/lib/tenant";
import { AdjuntosCliente } from "./adjuntos-cliente";

export const dynamic = "force-dynamic";
export const metadata = { title: "Cliente" };

const plata = (n: number) => `$ ${Math.round(n).toLocaleString("es-AR")}`;
const etiqueta = "text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground";
const ESTADOS: Record<string, string> = { cotizado: "#9E9387", confirmado: "#B8935A", produccion: "#B85850", cerrado: "#5A8A57" };

/** Ficha del cliente: datos, archivos y TODO su historial (eventos, presupuestos, pagos). */
export default async function ClientePage({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) notFound();

  const c = await db.contact.findFirst({ where: { id, clientId: tenant.id } });
  if (!c) notFound();
  const nombre = c.name.trim();
  const tel = c.phone?.replace(/\D/g, "") ?? "";

  const [eventos, docs, adjuntos] = await Promise.all([
    db.eventoOrg.findMany({
      where: {
        clientId: tenant.id,
        OR: [
          { contacto: { equals: nombre, mode: "insensitive" } },
          ...(tel ? [{ telefono: { contains: tel.slice(-8) } }] : []),
        ],
      },
      orderBy: { fecha: "desc" },
    }),
    db.presupuestoDoc.findMany({
      where: { clientId: tenant.id, nombre: { equals: nombre, mode: "insensitive" } },
      orderBy: { numero: "desc" },
      take: 50,
    }),
    db.attachment.findMany({
      where: { clientId: tenant.id, refType: "contact", refId: id },
      orderBy: { createdAt: "desc" },
      select: { id: true, url: true, name: true, mime: true },
    }),
  ]);

  const pagos = eventos.flatMap((e) =>
    (((e.pagos as { fecha: string; concepto: string; monto: number }[] | null) ?? []).map((p) => ({ ...p, evento: e.nombre })))
  ).sort((a, b) => b.fecha.localeCompare(a.fecha));
  const totalFacturado = eventos.reduce((a, e) => a + e.presupuesto, 0);
  const totalCobrado = eventos.reduce((a, e) => a + e.cobrado, 0);

  return (
    <div className="p-4 sm:p-6">
      <Link href={`/os/${slug}/clientes`} className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground transition hover:text-foreground">
        ← Clientes
      </Link>
      <div className="mt-1 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[40px] leading-none" style={{ fontFamily: "var(--font-italiana)" }}>{c.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {c.phone ?? "sin teléfono"} {c.email ? `· ${c.email}` : ""}
          </p>
        </div>
        <div className="flex gap-3">
          {tel ? (
            <a href={`https://wa.me/54${tel}`} target="_blank" rel="noreferrer" className="rounded-lg border border-border px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] transition hover:bg-muted">
              WhatsApp
            </a>
          ) : null}
          <Link
            href={`/os/${slug}/cotizaciones?nueva=1&cliente=${encodeURIComponent(c.name)}&telefono=${encodeURIComponent(c.phone ?? "")}`}
            className="rounded-lg px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] transition hover:opacity-90"
            style={{ backgroundColor: "#1A1816", color: "#EDE8DE" }}
          >
            ✦ Nueva cotización
          </Link>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {[
          { t: "EVENTOS", v: String(eventos.length) },
          { t: "FACTURADO", v: plata(totalFacturado) },
          { t: "COBRADO", v: plata(totalCobrado) },
        ].map((k) => (
          <div key={k.t} className="rounded-xl border border-border bg-card p-4">
            <p className={etiqueta}>{k.t}</p>
            <p className="mt-1 text-[28px] leading-none tabular-nums" style={{ fontFamily: "var(--font-italiana)" }}>{k.v}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        {/* Eventos */}
        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className={`${etiqueta} border-b border-border pb-2`}>Eventos</h2>
          <div className="mt-3 divide-y divide-border">
            {eventos.map((e) => (
              <Link key={e.id} href={`/os/${slug}/eventos-org/${e.id}`} className="flex items-center gap-3 py-2.5 text-sm transition hover:opacity-70">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: ESTADOS[e.estado] ?? "#9E9387" }} />
                <span className="flex-1 font-medium">{e.nombre}</span>
                <span className="text-muted-foreground">{e.fecha ? e.fecha.toISOString().slice(0, 10).split("-").reverse().join("/") : "sin fecha"}</span>
                <span className="font-semibold tabular-nums">{plata(e.presupuesto)}</span>
              </Link>
            ))}
            {!eventos.length ? <p className="py-4 text-sm text-muted-foreground">Sin eventos todavía.</p> : null}
          </div>
        </section>

        {/* Presupuestos */}
        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className={`${etiqueta} border-b border-border pb-2`}>Presupuestos</h2>
          <div className="mt-3 divide-y divide-border">
            {docs.map((d) => (
              <div key={d.id} className="flex items-center gap-3 py-2.5 text-sm">
                <span className="font-semibold">#{String(d.numero).padStart(4, "0")}</span>
                <span className="flex-1 text-muted-foreground">{d.createdAt.toLocaleDateString("es-AR")}</span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{d.estado}</span>
                <a href={`/os/${slug}/cotizaciones/${d.id}/imprimir`} target="_blank" className="underline underline-offset-4 transition hover:opacity-60">
                  Descargar
                </a>
              </div>
            ))}
            {!docs.length ? <p className="py-4 text-sm text-muted-foreground">Sin presupuestos todavía.</p> : null}
          </div>
        </section>

        {/* Pagos */}
        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className={`${etiqueta} border-b border-border pb-2`}>Pagos recibidos</h2>
          <div className="mt-3 divide-y divide-border">
            {pagos.map((p, i) => (
              <div key={`${p.fecha}-${i}`} className="flex items-center gap-3 py-2.5 text-sm">
                <span className="text-muted-foreground tabular-nums">{p.fecha.split("-").reverse().join("/")}</span>
                <span className="flex-1">{p.concepto} <span className="text-muted-foreground">· {p.evento}</span></span>
                <span className="font-semibold tabular-nums" style={{ color: "#5A8A57" }}>{plata(p.monto)}</span>
              </div>
            ))}
            {!pagos.length ? <p className="py-4 text-sm text-muted-foreground">Sin pagos registrados.</p> : null}
          </div>
        </section>

        {/* Archivos */}
        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className={`${etiqueta} border-b border-border pb-2`}>Archivos del cliente</h2>
          <div className="mt-3">
            <AdjuntosCliente slug={slug} contactId={c.id} adjuntos={adjuntos} />
          </div>
        </section>
      </div>
    </div>
  );
}
