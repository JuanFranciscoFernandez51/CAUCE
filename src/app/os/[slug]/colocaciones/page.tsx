import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getTenantBySlug } from "@/lib/tenant";
import { esVidrios, ordenDatos, ordenItems, totalOrden, vehiculoLinea } from "@/lib/vidrios";
import { AvanzarOrden, BotonFacturar, BotonWhatsApp, FLUJO_LABEL } from "./acciones-orden";

export const dynamic = "force-dynamic";
export const metadata = { title: "Taller" };

const DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

/**
 * TALLER = el calendario del negocio. Muestra el mes con los ingresos
 * (órdenes confirmadas + turnos del módulo agenda) y abajo la cola de
 * trabajos con su seguimiento hasta la entrega.
 */
export default async function TallerPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ m?: string; d?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const tenant = await getTenantBySlug(slug);
  if (!tenant || !esVidrios(tenant)) notFound();
  const base = `/os/${slug}`;

  const hoyD = new Date();
  const [anio, mes] = (sp.m ?? `${hoyD.getFullYear()}-${String(hoyD.getMonth() + 1).padStart(2, "0")}`)
    .split("-")
    .map(Number);
  const m0 = mes - 1;
  const primer = new Date(anio, m0, 1);
  const diasEnMes = new Date(anio, m0 + 1, 0).getDate();
  const arranque = (primer.getDay() + 6) % 7;
  const mesAnt = `${m0 === 0 ? anio - 1 : anio}-${String(m0 === 0 ? 12 : m0).padStart(2, "0")}`;
  const mesSig = `${m0 === 11 ? anio + 1 : anio}-${String(m0 === 11 ? 1 : m0 + 2).padStart(2, "0")}`;

  const [ordenes, turnos] = await Promise.all([
    db.presupuestoDoc.findMany({
      where: { clientId: tenant.id, estado: { in: ["CONFIRMADA", "COLOCADO", "ENTREGADO"] } },
      orderBy: { numero: "asc" },
    }),
    db.appointment.findMany({
      where: {
        clientId: tenant.id,
        startsAt: { gte: new Date(anio, m0, 1), lt: new Date(anio, m0 + 1, 1) },
        source: { not: "orden" },
      },
      orderBy: { startsAt: "asc" },
    }),
  ]);

  const hoy = new Date().toISOString().slice(0, 10);
  const manana = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const fechaLinda = (f: string) => f.split("-").reverse().join("/");
  const plata = (n: number) => `$ ${n.toLocaleString("es-AR")}`;

  const conDatos = ordenes.map((p) => ({ p, d: ordenDatos(p) }));
  const enTaller = conDatos.filter((x) => x.p.estado === "CONFIRMADA");
  const colocadas = conDatos.filter((x) => x.p.estado === "COLOCADO");
  // Entregadas que todavía nadie mandó a facturar.
  const paraFacturar = conDatos.filter((x) => x.p.estado === "ENTREGADO" && x.d.facturacion === "sin_facturar");

  // Vista del día: por defecto hoy, o el que se elija en el calendario.
  const dia = sp.d && /^\d{4}-\d{2}-\d{2}$/.test(sp.d) ? sp.d : hoy;
  const delDia = conDatos.filter((x) => x.d.fechaColocacion === dia);
  const turnosDelDia = turnos.filter((t) => t.startsAt.toISOString().slice(0, 10) === dia);
  const esHoyDia = dia === hoy;

  // Marcas del calendario: colocaciones del mes + turnos de agenda.
  const porDia = new Map<number, { texto: string; tono: string }[]>();
  const poner = (iso: string, marca: { texto: string; tono: string }) => {
    const [a, me, d] = iso.split("-").map(Number);
    if (a !== anio || me !== m0 + 1) return;
    porDia.set(d, [...(porDia.get(d) ?? []), marca]);
  };
  for (const { p, d } of conDatos) {
    if (!d.fechaColocacion) continue;
    poner(d.fechaColocacion, {
      texto: `#${String(p.numero).padStart(4, "0")} ${p.nombre}`,
      tono: p.estado === "COLOCADO" ? "#16a34a" : "#008000",
    });
  }
  for (const t of turnos) {
    poner(t.startsAt.toISOString().slice(0, 10), { texto: t.title, tono: "#b45309" });
  }

  const celdas: (number | null)[] = [
    ...Array(arranque).fill(null),
    ...Array.from({ length: diasEnMes }, (_, i) => i + 1),
  ];
  const nombreMes = primer.toLocaleDateString("es-AR", { month: "long", year: "numeric" });

  const grupos = [
    { titulo: "Hoy", tono: "text-destructive", filas: enTaller.filter((x) => x.d.fechaColocacion === hoy) },
    { titulo: "Mañana", tono: "text-warning", filas: enTaller.filter((x) => x.d.fechaColocacion === manana) },
    {
      titulo: "Próximos días",
      tono: "text-primary",
      filas: enTaller
        .filter((x) => x.d.fechaColocacion && x.d.fechaColocacion > manana)
        .sort((a, b) => (a.d.fechaColocacion! < b.d.fechaColocacion! ? -1 : 1)),
    },
    {
      titulo: "Atrasadas / sin fecha",
      tono: "text-muted-foreground",
      filas: enTaller.filter((x) => !x.d.fechaColocacion || x.d.fechaColocacion < hoy),
    },
    { titulo: "Colocadas — falta entregar", tono: "text-success", filas: colocadas },
  ];

  return (
    <div className="space-y-5 p-4 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Taller</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            El calendario de ingresos y los trabajos en curso. Las órdenes entran al confirmarse desde{" "}
            <Link href={`${base}/ordenes`} className="underline underline-offset-2">Órdenes</Link>.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`${base}/turnos/nuevo`} className="rounded-lg border px-3 py-2 text-xs font-semibold transition hover:bg-muted">
            + Turno suelto
          </Link>
          <Link href={`${base}/ordenes/nueva`} className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition hover:opacity-90">
            + Orden
          </Link>
        </div>
      </div>

      {/* Calendario del mes */}
      <section className="rounded-xl border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href={`?m=${mesAnt}`} className="rounded-md border px-2.5 py-1 transition hover:bg-muted">‹</Link>
            <p className="text-lg font-semibold capitalize">{nombreMes}</p>
            <Link href={`?m=${mesSig}`} className="rounded-md border px-2.5 py-1 transition hover:bg-muted">›</Link>
            <Link href={base + "/colocaciones"} className="rounded-md border px-2.5 py-1 text-xs transition hover:bg-muted">Hoy</Link>
          </div>
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            {[["Colocación", "#008000"], ["Colocada", "#16a34a"], ["Turno", "#b45309"]].map(([l, c]) => (
              <span key={l} className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: c }} /> {l}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-3 grid grid-cols-7 gap-px overflow-hidden rounded-lg border bg-border">
          {DIAS.map((d) => (
            <div key={d} className="bg-muted/60 py-1.5 text-center text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              {d}
            </div>
          ))}
          {celdas.map((celdaDia, i) => {
            if (!celdaDia) return <div key={i} className="min-h-[86px] bg-card p-1.5" />;
            const esHoy = celdaDia === hoyD.getDate() && m0 === hoyD.getMonth() && anio === hoyD.getFullYear();
            const marcas = porDia.get(celdaDia) ?? [];
            const iso = `${anio}-${String(m0 + 1).padStart(2, "0")}-${String(celdaDia).padStart(2, "0")}`;
            const elegido = iso === dia;
            return (
              <Link
                key={i}
                href={`?m=${anio}-${String(m0 + 1).padStart(2, "0")}&d=${iso}`}
                className={`min-h-[86px] p-1.5 transition hover:bg-muted/40 ${elegido ? "bg-primary/10" : "bg-card"} ${esHoy ? "ring-2 ring-inset ring-primary" : ""}`}
              >
                <span className={`text-[11px] ${esHoy ? "font-bold text-primary" : "text-muted-foreground"}`}>{celdaDia}</span>
                <div className="mt-1 space-y-0.5">
                  {marcas.slice(0, 3).map((mk, k) => (
                    <p
                      key={k}
                      className="truncate rounded-sm border-l-2 bg-muted/50 px-1 py-0.5 text-[10px]"
                      style={{ borderLeftColor: mk.tono }}
                      title={mk.texto}
                    >
                      {mk.texto}
                    </p>
                  ))}
                  {marcas.length > 3 ? <p className="text-[9px] text-muted-foreground">+{marcas.length - 3}</p> : null}
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Vista del día */}
      <section className="rounded-xl border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-bold">
            {esHoyDia ? "Hoy" : fechaLinda(dia)} · {delDia.length + turnosDelDia.length} en el taller
          </h2>
          {!esHoyDia ? (
            <Link href={`${base}/colocaciones`} className="text-xs text-muted-foreground underline underline-offset-2">
              Volver a hoy
            </Link>
          ) : null}
        </div>
        {delDia.length || turnosDelDia.length ? (
          <div className="mt-3 divide-y">
            {delDia.map(({ p, d }) => (
              <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 py-2.5 text-sm">
                <div className="min-w-0">
                  <p className="font-medium">
                    #{String(p.numero).padStart(4, "0")} · {p.nombre}
                    <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                      {FLUJO_LABEL[p.estado]}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {vehiculoLinea(d) || "Sin vehículo"} · {ordenItems(p).map((i) => `${i.cant}× ${i.detalle}`).join(" · ")}
                  </p>
                </div>
                <span className="flex items-center gap-1.5">
                  <BotonWhatsApp telefono={p.telefono} nombre={p.nombre} numero={p.numero} estado={p.estado} fecha={d.fechaColocacion} compacto />
                  <AvanzarOrden slug={slug} id={p.id} estado={p.estado} fecha={d.fechaColocacion} />
                </span>
              </div>
            ))}
            {turnosDelDia.map((t) => (
              <div key={t.id} className="flex items-center justify-between py-2.5 text-sm">
                <span>🗓 {t.title}</span>
                <span className="text-muted-foreground">
                  {t.startsAt.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">Sin trabajos para este día.</p>
        )}
      </section>

      {/* Entregados listos para facturar */}
      {paraFacturar.length ? (
        <section className="rounded-xl border p-4" style={{ borderColor: "var(--primary)" }}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-bold">
              Entregados · {paraFacturar.length} para mandar a facturar
            </h2>
            <Link href={`${base}/facturacion`} className="text-xs underline underline-offset-2">
              Ir a Facturación →
            </Link>
          </div>
          <div className="mt-3 divide-y">
            {paraFacturar.map(({ p, d }) => (
              <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 py-2.5 text-sm">
                <div className="min-w-0">
                  <p className="font-medium">
                    #{String(p.numero).padStart(4, "0")} · {p.nombre}
                    {d.seguro ? (
                      <span className="ml-1.5 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">
                        🛡 {d.seguro.compania}
                      </span>
                    ) : null}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {vehiculoLinea(d) || "Sin vehículo"}
                    {d.fechaColocacion ? ` · colocado ${fechaLinda(d.fechaColocacion)}` : ""}
                  </p>
                </div>
                <span className="flex items-center gap-2">
                  <span className="font-semibold tabular-nums">{plata(totalOrden(p))}</span>
                  <Link href={`${base}/ordenes/${p.id}/imprimir`} target="_blank" className="rounded-md border px-2 py-1 text-xs transition hover:bg-muted">🖨</Link>
                  <BotonFacturar slug={slug} id={p.id} />
                </span>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* Cola de trabajos con seguimiento */}
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
                      <div className="min-w-0">
                        <p className="truncate font-semibold">
                          #{String(p.numero).padStart(4, "0")} · {p.nombre}
                        </p>
                        <p className="truncate text-sm text-muted-foreground">{vehiculoLinea(d) || "Sin vehículo"}</p>
                        {d.seguro ? (
                          <p className="mt-0.5 text-xs text-primary">
                            🛡 {d.seguro.compania}{d.seguro.siniestro ? ` · ${d.seguro.siniestro}` : ""}
                          </p>
                        ) : null}
                      </div>
                      <span className="shrink-0 rounded-full bg-primary/10 px-2 py-1 text-[10px] font-semibold text-primary">
                        {d.fechaColocacion ? fechaLinda(d.fechaColocacion) : FLUJO_LABEL[p.estado]}
                      </span>
                    </div>
                    <ul className="mt-2 space-y-0.5 text-xs text-muted-foreground">
                      {ordenItems(p).slice(0, 3).map((i, k) => (
                        <li key={k}>• {i.cant}× {i.detalle}{i.codigo ? ` (${i.codigo})` : ""}</li>
                      ))}
                    </ul>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t pt-2 text-sm">
                      <span className="tabular-nums">
                        {plata(total)}
                        {saldo > 0 ? <span className="text-destructive"> · saldo {plata(saldo)}</span> : null}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <BotonWhatsApp
                          telefono={p.telefono}
                          nombre={p.nombre}
                          numero={p.numero}
                          estado={p.estado}
                          fecha={d.fechaColocacion}
                          compacto
                        />
                        <Link
                          href={`${base}/ordenes/${p.id}/imprimir`}
                          target="_blank"
                          className="rounded-md border px-2 py-1 text-xs transition hover:bg-muted"
                          title="Boleto"
                        >
                          🖨
                        </Link>
                        <AvanzarOrden slug={slug} id={p.id} estado={p.estado} fecha={d.fechaColocacion} />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ) : null
      )}

      {!conDatos.length ? (
        <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          No hay trabajos en el taller. Confirmá una orden desde{" "}
          <Link href={`${base}/ordenes`} className="underline">Órdenes</Link> y aparece acá con su día.
        </div>
      ) : null}
    </div>
  );
}
