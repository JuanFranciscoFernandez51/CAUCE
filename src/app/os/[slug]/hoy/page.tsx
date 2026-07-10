import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { getTenantBySlug } from "@/lib/tenant";
import { Card, EmptyState } from "@/components/ui";
import { argDateStr, dayRange, fmtTime, fmtDayLabel } from "../_lib/dates";
import { OutreachList, type TareaData } from "../_components/outreach-list";

/**
 * PARA HOY — el día armado en una sola pantalla: los mensajes que hay que
 * mandar (con el WhatsApp listo a 1 clic) y los turnos de la jornada.
 * Lo genera el cron de procesos todas las mañanas.
 */
export default async function HoyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) notFound();

  const hoy = argDateStr();
  const rango = dayRange(hoy);

  const [tareas, turnosHoy] = await Promise.all([
    db.outreachTarea.findMany({
      where: { clientId: tenant.id, estado: "PROGRAMADA" },
      orderBy: [{ fechaProgramada: "asc" }, { createdAt: "asc" }],
      take: 50,
    }),
    tenant.modules.includes("turnos")
      ? db.appointment.findMany({
          where: {
            clientId: tenant.id,
            startsAt: { gte: rango.start, lt: rango.end },
            status: { in: ["PENDING", "CONFIRMED"] },
          },
          include: { contact: { select: { name: true, phone: true } }, employee: { select: { name: true } } },
          orderBy: { startsAt: "asc" },
        })
      : Promise.resolve([]),
  ]);

  const tareasData: TareaData[] = tareas.map((t) => ({
    id: t.id,
    tipo: t.tipo,
    nombre: t.nombre,
    telefono: t.telefono,
    mensaje: t.mensaje,
    fechaProgramada: t.fechaProgramada,
  }));

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Para hoy</h1>
        <p className="text-sm text-muted-foreground">
          {fmtDayLabel(hoy)} — tu día armado: mandá cada mensaje con un clic y marcalo.
        </p>
      </div>

      <OutreachList slug={tenant.slug} tareas={tareasData} />

      {tenant.modules.includes("turnos") ? (
        <Card className="p-5">
          <h2 className="mb-3 font-semibold">Turnos de hoy ({turnosHoy.length})</h2>
          {turnosHoy.length === 0 ? (
            <p className="rounded-md border border-dashed px-4 py-5 text-center text-sm text-muted-foreground">
              Sin turnos para hoy.
            </p>
          ) : (
            <ul className="divide-y">
              {turnosHoy.map((t) => (
                <li key={t.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                  <div>
                    <p className="font-medium">
                      <span className="font-mono text-sm tabular-nums text-muted-foreground">{fmtTime(t.startsAt)} h</span>{" "}
                      · {t.contact?.name ?? t.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t.title}
                      {t.employee ? ` · con ${t.employee.name}` : ""}
                    </p>
                  </div>
                  <Link
                    href={`/os/${tenant.slug}/turnos`}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    Ver agenda →
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      ) : null}
    </div>
  );
}
