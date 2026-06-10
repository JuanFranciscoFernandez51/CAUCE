import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getTenantBySlug, hasModule, tenantBranding } from "@/lib/tenant";
import { Badge, ButtonLink, Card, EmptyState, Stat } from "@/components/ui";
import { addDays, argDateStr, dayRange, fmtTime, monthStart } from "./_lib/dates";
import { APPT_STATUS } from "./_lib/labels";

export default async function OsHomePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) notFound();

  const branding = tenantBranding(tenant);
  const crm = hasModule(tenant, "crm");
  const turnos = hasModule(tenant, "turnos");
  const base = `/os/${tenant.slug}`;

  const today = argDateStr();
  const { start: todayStart, end: todayEnd } = dayRange(today);
  const { end: weekEnd } = dayRange(addDays(today, 6));

  const [contactsTotal, contactsMonth, pendingTasks, todayAppts, weekCount] =
    await Promise.all([
      crm ? db.contact.count({ where: { clientId: tenant.id } }) : Promise.resolve(0),
      crm
        ? db.contact.count({
            where: { clientId: tenant.id, createdAt: { gte: monthStart() } },
          })
        : Promise.resolve(0),
      crm
        ? db.crmTask.count({ where: { clientId: tenant.id, done: false } })
        : Promise.resolve(0),
      turnos
        ? db.appointment.findMany({
            where: {
              clientId: tenant.id,
              startsAt: { gte: todayStart, lt: todayEnd },
            },
            orderBy: { startsAt: "asc" },
            include: { contact: { select: { name: true } } },
          })
        : Promise.resolve([]),
      turnos
        ? db.appointment.count({
            where: {
              clientId: tenant.id,
              startsAt: { gte: todayStart, lt: weekEnd },
              status: { not: "CANCELLED" },
            },
          })
        : Promise.resolve(0),
    ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Hola, {branding.displayName} 👋</h1>
          <p className="text-sm text-muted-foreground">
            Esto es lo que está pasando en tu negocio hoy.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {crm ? (
            <ButtonLink href={`${base}/crm/nuevo`} variant="secondary" size="sm">
              + Contacto
            </ButtonLink>
          ) : null}
          {turnos ? (
            <ButtonLink href={`${base}/turnos/nuevo`} size="sm">
              + Turno
            </ButtonLink>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {crm ? (
          <>
            <Stat label="Contactos" value={contactsTotal} hint="total en tu CRM" />
            <Stat
              label="Nuevos este mes"
              value={contactsMonth}
              tone={contactsMonth > 0 ? "success" : "default"}
            />
            <Stat
              label="Tareas pendientes"
              value={pendingTasks}
              tone={pendingTasks > 0 ? "warning" : "default"}
            />
          </>
        ) : null}
        {turnos ? (
          <Stat label="Turnos esta semana" value={weekCount} hint="próximos 7 días" />
        ) : null}
      </div>

      {turnos ? (
        <Card className="p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="font-semibold">Turnos de hoy</h2>
            <Link href={`${base}/turnos`} className="text-sm font-medium text-primary hover:underline">
              Ver agenda →
            </Link>
          </div>
          {todayAppts.length === 0 ? (
            <EmptyState
              icon="📅"
              title="Hoy no tenés turnos"
              detail="Cuando el bot o vos carguen turnos para hoy, aparecen acá."
            />
          ) : (
            <ul className="divide-y">
              {todayAppts.map((a) => (
                <li key={a.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5">
                  <span className="font-mono text-sm font-semibold tabular-nums">
                    {fmtTime(a.startsAt)}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm">
                    {a.title}
                    {a.contact ? (
                      <span className="text-muted-foreground"> · {a.contact.name}</span>
                    ) : null}
                  </span>
                  <Badge variant={APPT_STATUS[a.status].variant}>
                    {APPT_STATUS[a.status].label}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      ) : null}

      {!crm && !turnos ? (
        <EmptyState
          icon="🧩"
          title="Todavía no tenés módulos activos"
          detail="Hablá con Cauce para activar CRM, Turnos y más."
        />
      ) : null}
    </div>
  );
}
