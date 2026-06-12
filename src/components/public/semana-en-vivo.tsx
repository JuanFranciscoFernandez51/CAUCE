import { db } from "@/lib/db";
import { currentPeriod } from "@/lib/usage";
import { Card } from "@/components/ui";

/**
 * "Esta semana en los negocios que confían en Cauce" — tarjeta EN VIVO del hero.
 * Nada inventado: los números y el feed salen de la DB (uso del período,
 * turnos y leads que crearon los bots en los Cauce OS de los clientes).
 */

function timeAgo(d: Date): string {
  const min = Math.floor((Date.now() - d.getTime()) / 60000);
  if (min < 5) return "recién";
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h`;
  return `hace ${Math.floor(h / 24)} d`;
}

export async function SemanaEnVivo() {
  let msgs = 0;
  let turnosBot = 0;
  let leadsBot = 0;
  let feed: { texto: string; cuando: string }[] = [];

  try {
    const period = currentPeriod();
    const [usage, tBot, lBot, ultimosTurnos, ultimosLeads] = await Promise.all([
      db.usage.aggregate({ where: { period }, _sum: { messages: true } }),
      db.appointment.count({ where: { source: "bot" } }),
      db.contact.count({ where: { source: "bot" } }),
      db.appointment.findMany({
        where: { source: "bot" },
        orderBy: { createdAt: "desc" },
        take: 2,
        include: { client: { select: { name: true } } },
      }),
      db.contact.findMany({
        where: { source: "bot" },
        orderBy: { createdAt: "desc" },
        take: 2,
        include: { client: { select: { name: true } } },
      }),
    ]);
    msgs = usage._sum.messages ?? 0;
    turnosBot = tBot;
    leadsBot = lBot;
    feed = [
      ...ultimosTurnos.map((t) => ({
        texto: `Turno agendado solo · ${t.client.name}`,
        cuando: timeAgo(t.createdAt),
        ts: t.createdAt.getTime(),
      })),
      ...ultimosLeads.map((l) => ({
        texto: `Lead capturado por el bot · ${l.client.name}`,
        cuando: timeAgo(l.createdAt),
        ts: l.createdAt.getTime(),
      })),
    ]
      .sort((a, b) => b.ts - a.ts)
      .slice(0, 4);
  } catch (e) {
    console.error("semana-en-vivo:", e);
    return null;
  }

  // horas ahorradas estimadas: ~1,5 min por mensaje atendido + 10 min por turno gestionado
  const horas = (msgs * 1.5 + turnosBot * 10) / 60;
  const horasFmt = horas >= 100 ? Math.round(horas).toLocaleString("es-AR") : horas.toFixed(1).replace(".", ",");

  const stats: { valor: string; etiqueta: string; accent?: boolean }[] = [
    { valor: `${horasFmt} hs`, etiqueta: "ahorradas este mes", accent: true },
    { valor: msgs.toLocaleString("es-AR"), etiqueta: "mensajes en automático" },
    { valor: String(turnosBot), etiqueta: "turnos agendados solos" },
    { valor: String(leadsBot), etiqueta: "leads capturados por bots" },
  ];

  return (
    <Card className="p-5 shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold sm:text-base">
          Esta semana en los negocios que confían en Cauce
        </h2>
        <span className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
          <span className="h-2 w-2 animate-pulse rounded-full bg-success" aria-hidden />
          en vivo
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        {stats.map((s) => (
          <div key={s.etiqueta} className="rounded-md border bg-muted/40 p-3.5">
            <p className={`font-display text-2xl font-bold ${s.accent ? "text-accent" : ""}`}>{s.valor}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{s.etiqueta}</p>
          </div>
        ))}
      </div>

      {feed.length > 0 ? (
        <ul className="mt-4 divide-y">
          {feed.map((f, i) => (
            <li key={i} className="flex items-center justify-between gap-3 py-2.5">
              <span className="flex items-center gap-2.5 text-sm">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-primary-soft text-xs text-primary" aria-hidden>
                  ✓
                </span>
                {f.texto}
              </span>
              <span className="shrink-0 text-xs text-muted-foreground">{f.cuando}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </Card>
  );
}
