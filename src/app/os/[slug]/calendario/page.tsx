import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getTenantBySlug } from "@/lib/tenant";

export const dynamic = "force-dynamic";
export const metadata = { title: "Calendario" };

/** Calendario como el de su panel: eventos confirmados + hitos por evento. */
export default async function CalendarioPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ m?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) notFound();

  const hoy = new Date();
  const [anio, mes] = (sp.m ?? `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}`)
    .split("-")
    .map(Number);
  const m0 = mes - 1;
  const primer = new Date(anio, m0, 1);
  const diasEnMes = new Date(anio, m0 + 1, 0).getDate();
  const arranque = (primer.getDay() + 6) % 7;
  const mesAnt = `${m0 === 0 ? anio - 1 : anio}-${String(m0 === 0 ? 12 : m0).padStart(2, "0")}`;
  const mesSig = `${m0 === 11 ? anio + 1 : anio}-${String(m0 === 11 ? 1 : m0 + 2).padStart(2, "0")}`;

  const eventos = await db.eventoOrg.findMany({ where: { clientId: tenant.id } });
  type Marca = { texto: string; color: string; href: string };
  const porDia = new Map<number, Marca[]>();
  const poner = (d: Date | null, m: Marca) => {
    if (!d || d.getFullYear() !== anio || d.getMonth() !== m0) return;
    const l = porDia.get(d.getDate()) ?? [];
    l.push(m);
    porDia.set(d.getDate(), l);
  };
  const COLOR: Record<string, string> = { cotizado: "#9E9387", confirmado: "#B8935A", produccion: "#B85850", cerrado: "#5A8A57" };
  for (const e of eventos) {
    poner(e.fecha, { texto: e.nombre, color: COLOR[e.estado] ?? "#9E9387", href: `/os/${slug}/eventos-org?abrir=${e.id}` });
    for (const h of (e.hitos as { titulo: string; fecha: string; hecho: boolean }[]) ?? []) {
      if (h.hecho) continue;
      const f = new Date(h.fecha);
      const vencido = f < hoy;
      poner(f, { texto: h.titulo, color: vencido ? "#B85850" : "#5A8A57", href: `/os/${slug}/eventos-org?abrir=${e.id}` });
    }
  }

  const celdas: (number | null)[] = [...Array(arranque).fill(null), ...Array.from({ length: diasEnMes }, (_, i) => i + 1)];
  const nombreMes = primer.toLocaleDateString("es-AR", { month: "long", year: "numeric" });

  return (
    <div className="space-y-5 p-4 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[40px] leading-none" style={{ fontFamily: "var(--font-italiana)" }}>Calendario</h1>
          <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Eventos confirmados + hitos por evento
          </p>
        </div>
        <Link href={`/os/${slug}/calendario`} className="border border-border px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] transition hover:bg-muted">
          Hoy
        </Link>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border border-border bg-card px-4 py-3">
        <div className="flex items-center gap-4">
          <Link href={`?m=${mesAnt}`} className="border border-border px-3 py-1.5 transition hover:bg-muted">‹</Link>
          <p className="text-[24px] capitalize" style={{ fontFamily: "var(--font-italiana)" }}>{nombreMes}</p>
          <Link href={`?m=${mesSig}`} className="border border-border px-3 py-1.5 transition hover:bg-muted">›</Link>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          {[["Evento", "#B8935A"], ["Hito", "#5A8A57"], ["Hito vencido", "#B85850"]].map(([l, c]) => (
            <span key={l} className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5" style={{ backgroundColor: c }} /> {l}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px border border-border bg-border">
        {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((d) => (
          <div key={d} className="bg-muted/60 py-2 text-center text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            {d}
          </div>
        ))}
        {celdas.map((dia, i) => {
          const esHoy = dia === hoy.getDate() && m0 === hoy.getMonth() && anio === hoy.getFullYear();
          return (
            <div key={i} className="min-h-[104px] bg-card p-1.5" style={esHoy ? { backgroundColor: "#DCD6C8" } : undefined}>
              {dia ? (
                <>
                  <span className={`inline-flex h-6 w-6 items-center justify-center text-[12px] ${esHoy ? "rounded-full font-bold text-white" : "text-muted-foreground"}`} style={esHoy ? { backgroundColor: "#8A8070" } : undefined}>
                    {dia}
                  </span>
                  <div className="mt-1 space-y-0.5">
                    {(porDia.get(dia) ?? []).slice(0, 3).map((m, k) => (
                      <Link key={k} href={m.href} className="block truncate border-l-2 bg-white px-1.5 py-0.5 text-[11px] transition hover:opacity-70" style={{ borderLeftColor: m.color }} title={m.texto}>
                        {m.texto}
                      </Link>
                    ))}
                    {(porDia.get(dia)?.length ?? 0) > 3 ? (
                      <p className="text-[10px] text-muted-foreground">+{porDia.get(dia)!.length - 3} más</p>
                    ) : null}
                  </div>
                </>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
