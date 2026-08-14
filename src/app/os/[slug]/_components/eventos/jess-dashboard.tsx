import Link from "next/link";
import type { Client } from "@prisma/client";
import { Reveal } from "@/app/sitio/[slug]/_components/conce/reveal";
import { db } from "@/lib/db";

/**
 * Dashboard del template eventos (Jess Design), fiel a su panel: saludo en
 * Italiana con la frase en Pinyon, KPIs del mes, cobranzas pendientes,
 * próximos eventos con cuenta regresiva e hitos vencidos.
 */
type Hito = { titulo: string; fecha: string; hecho: boolean };

const ESTADOS: Record<string, { label: string; color: string }> = {
  cotizado: { label: "Cotizado", color: "#9E9387" },
  confirmado: { label: "Confirmado", color: "#B8935A" },
  produccion: { label: "En producción", color: "#B85850" },
  cerrado: { label: "Cerrado", color: "#5A8A57" },
};

const plata = (n: number) => `$ ${Math.round(n).toLocaleString("es-AR")}`;

export async function JessDashboard({ tenant }: { tenant: Client }) {
  const base = `/os/${tenant.slug}`;
  const hoy = new Date();
  const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  const finMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0, 23, 59);
  const en30 = new Date(hoy.getTime() + 30 * 86400000);

  const eventos = await db.eventoOrg.findMany({
    where: { clientId: tenant.id },
    orderBy: { fecha: "asc" },
  });

  const delMes = eventos.filter((e) => e.fecha && e.fecha >= inicioMes && e.fecha <= finMes);
  const proximos = eventos.filter((e) => e.fecha && e.fecha >= hoy && e.fecha <= en30 && e.estado !== "cerrado");
  const activos = eventos.filter((e) => e.estado !== "cerrado");
  const ingresosMes = delMes.reduce((a, e) => a + e.presupuesto, 0);
  const cobradoMes = delMes.reduce((a, e) => a + e.cobrado, 0);
  const pendiente = activos.reduce((a, e) => a + Math.max(0, e.presupuesto - e.cobrado), 0);
  const conSaldo = activos.filter((e) => e.presupuesto - e.cobrado > 0);

  const hitosPend = eventos
    .flatMap((e) => ((e.hitos as Hito[]) ?? []).filter((h) => !h.hecho).map((h) => ({ ...h, evento: e.nombre, eventoId: e.id })))
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
    .slice(0, 6);

  const saludo = hoy.getHours() < 13 ? "Buenos días" : hoy.getHours() < 20 ? "Buenas tardes" : "Buenas noches";
  const dias = (f: Date) => Math.ceil((f.getTime() - hoy.getTime()) / 86400000);

  const kpis = [
    { t: "EVENTOS DEL MES", v: String(delMes.length), d: `${eventos.length} totales en sistema` },
    { t: "PRÓXIMOS CONFIRMADOS", v: String(proximos.length), d: "de los siguientes 30 días" },
    { t: "INGRESOS ESPERADOS (MES)", v: plata(ingresosMes), d: `Cobrado: ${plata(cobradoMes)}` },
    { t: "PENDIENTE COBRAR", v: plata(pendiente), d: `${conSaldo.length} evento(s) con saldo` },
  ];

  return (
    <div className="space-y-5 p-4 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[40px] leading-none sm:text-[52px]" style={{ fontFamily: "var(--font-italiana)" }}>
            {saludo}, Jess
          </h1>
          <p className="mt-1 text-[20px]" style={{ fontFamily: "var(--font-pinyon)", color: "#6d645b" }}>
            Sofisticación en cada detalle, elegancia en cada momento
          </p>
          <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {hoy.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <Link
          href={`${base}/eventos-org?nuevo=1`}
          className="rounded-lg px-5 py-3 text-[12px] font-semibold uppercase tracking-[0.14em] transition hover:opacity-90"
          style={{ backgroundColor: "#1A1816", color: "#EDE8DE" }}
        >
          + Nuevo evento
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k, i) => (
          <Reveal key={k.t} delay={i * 70} className="rounded-xl border border-border bg-card p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{k.t}</p>
            <p className="mt-2 text-[26px] font-bold tabular-nums">{k.v}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{k.d}</p>
          </Reveal>
        ))}
      </div>

      <Reveal><section className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Cobranzas pendientes</h2>
          <span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{conSaldo.length ? "" : "Al día"}</span>
        </div>
        {conSaldo.length ? (
          <div className="mt-3 divide-y divide-border">
            {conSaldo.map((e) => (
              <Link key={e.id} href={`${base}/eventos-org?abrir=${e.id}`} className="flex items-center justify-between gap-3 py-2.5 transition hover:opacity-70">
                <span className="text-sm font-medium">{e.nombre}</span>
                <span className="text-sm font-semibold tabular-nums" style={{ color: "#B85850" }}>
                  {plata(e.presupuesto - e.cobrado)}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="py-6 text-center text-sm text-muted-foreground">No tenés cobranzas pendientes</p>
        )}
      </section></Reveal>

      <div className="grid gap-4 lg:grid-cols-2">
        <Reveal><section className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Próximos eventos</h2>
            <span className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Cuenta regresiva</span>
          </div>
          {proximos.length ? (
            <div className="mt-3 space-y-3">
              {proximos.map((e) => (
                <Link key={e.id} href={`${base}/eventos-org?abrir=${e.id}`} className="flex items-center justify-between gap-3 rounded-lg border border-border p-3 transition hover:bg-muted/40">
                  <div>
                    <p className="text-sm font-semibold">{e.nombre}</p>
                    <p className="text-xs text-muted-foreground">
                      {e.fecha!.toLocaleDateString("es-AR", { day: "numeric", month: "long" })} · {e.lugar ?? "sin lugar"}
                    </p>
                  </div>
                  <span className="text-right">
                    <span className="block text-[22px] font-bold leading-none" style={{ fontFamily: "var(--font-italiana)" }}>
                      {dias(e.fecha!)}
                    </span>
                    <span className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">días</span>
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No hay eventos próximos. <Link href={`${base}/eventos-org?nuevo=1`} className="underline">Cargar uno</Link>
            </p>
          )}
        </section></Reveal>

        <Reveal><section className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Hitos pendientes</h2>
            <span className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Tareas</span>
          </div>
          {hitosPend.length ? (
            <div className="mt-3 space-y-2">
              {hitosPend.map((h, i) => {
                const vencido = new Date(h.fecha) < hoy;
                return (
                  <Link key={i} href={`${base}/eventos-org?abrir=${h.eventoId}`} className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2 text-sm transition hover:bg-muted/40">
                    <span>
                      {h.titulo}
                      <span className="ml-2 text-xs text-muted-foreground">{h.evento}</span>
                    </span>
                    <span className={`text-xs font-semibold ${vencido ? "" : "text-muted-foreground"}`} style={vencido ? { color: "#B85850" } : undefined}>
                      {vencido ? "Vencido" : new Date(h.fecha).toLocaleDateString("es-AR", { day: "numeric", month: "short" })}
                    </span>
                  </Link>
                );
              })}
            </div>
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">Todo al día</p>
          )}
        </section></Reveal>
      </div>

      <Reveal><section className="rounded-xl border border-border bg-card p-4">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Eventos por estado</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {Object.entries(ESTADOS).map(([k, v]) => {
            const n = eventos.filter((e) => e.estado === k).length;
            return (
              <span key={k} className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-sm">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: v.color }} />
                {v.label} <strong>{n}</strong>
              </span>
            );
          })}
        </div>
      </section></Reveal>
    </div>
  );
}
