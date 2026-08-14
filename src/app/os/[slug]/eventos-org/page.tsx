import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getTenantBySlug } from "@/lib/tenant";
import { EventosPanel, type EventoRow } from "./eventos-panel";

export const dynamic = "force-dynamic";
export const metadata = { title: "Eventos" };

/** Cada evento, sus ítems y sus hitos — el corazón del negocio de Jess. */
export default async function EventosOrgPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ nuevo?: string; abrir?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) notFound();

  const tipos = ((tenant.settings as { tiposEvento?: string[] } | null)?.tiposEvento) ?? ["Boda", "Cumpleaños", "Corporativo", "Otros"];
  const eventos = await db.eventoOrg.findMany({
    where: { clientId: tenant.id },
    orderBy: [{ fecha: "asc" }],
  });

  const filas: EventoRow[] = eventos.map((e) => ({
    id: e.id,
    nombre: e.nombre,
    tipo: e.tipo,
    fecha: e.fecha?.toISOString().slice(0, 10) ?? null,
    lugar: e.lugar,
    estado: e.estado,
    presupuesto: e.presupuesto,
    cobrado: e.cobrado,
    contacto: e.contacto,
    telefono: e.telefono,
    hitos: (e.hitos as { titulo: string; fecha: string; hecho: boolean }[]) ?? [],
    notas: e.notas,
  }));

  // ── Calendario del mes: eventos e hitos sobre la grilla ──
  const hoy = new Date();
  const anio = hoy.getFullYear();
  const mes = hoy.getMonth();
  const primerDia = new Date(anio, mes, 1);
  const diasEnMes = new Date(anio, mes + 1, 0).getDate();
  const arranque = (primerDia.getDay() + 6) % 7; // lunes = 0
  const celdas: { dia: number | null; eventos: typeof filas }[] = [];
  for (let i = 0; i < arranque; i++) celdas.push({ dia: null, eventos: [] });
  for (let d = 1; d <= diasEnMes; d++) {
    const clave = `${anio}-${String(mes + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    celdas.push({ dia: d, eventos: filas.filter((e) => e.fecha === clave) });
  }
  const COLOR: Record<string, string> = { cotizado: "#9E9387", confirmado: "#B8935A", produccion: "#B85850", cerrado: "#5A8A57" };

  return (
    <div className="space-y-5 p-4 sm:p-6">
      <div>
        <h1 className="text-[34px] leading-none" style={{ fontFamily: "var(--font-italiana)" }}>Eventos</h1>
        <p className="mt-1 text-sm text-muted-foreground">Cada evento, sus datos y sus hitos. Tocá uno para abrirlo.</p>
      </div>

      <section className="border border-border bg-card p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          {hoy.toLocaleDateString("es-AR", { month: "long", year: "numeric" })}
        </p>
        <div className="mt-3 grid grid-cols-7 gap-px border border-border bg-border text-center text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
          {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((d) => (
            <div key={d} className="bg-muted/60 py-1.5">{d}</div>
          ))}
          {celdas.map((c, i) => (
            <div key={i} className="min-h-[64px] bg-card p-1 text-left">
              {c.dia ? (
                <>
                  <span className={`text-[11px] ${c.dia === hoy.getDate() ? "font-bold" : "text-muted-foreground"}`}>{c.dia}</span>
                  {c.eventos.map((e) => (
                    <a
                      key={e.id}
                      href={`?abrir=${e.id}`}
                      className="mt-0.5 block truncate px-1 py-0.5 text-[10px] font-medium text-white"
                      style={{ backgroundColor: COLOR[e.estado] ?? "#9E9387" }}
                      title={e.nombre}
                    >
                      {e.nombre}
                    </a>
                  ))}
                </>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      <EventosPanel slug={slug} eventos={filas} tipos={tipos} abrirInicial={sp.abrir ?? null} nuevoInicial={sp.nuevo === "1"} />
    </div>
  );
}
