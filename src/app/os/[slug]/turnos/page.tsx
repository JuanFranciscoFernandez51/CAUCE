import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getTenantBySlug, hasModule, MODULE_LABELS } from "@/lib/tenant";
import { Badge, ButtonLink, Card, EmptyState } from "@/components/ui";
import { ModuleDisabled } from "../_components/module-disabled";
import { AppointmentActions } from "../_components/appointment-actions";
import { addDays, argDateStr, dayRange, fmtDayLabel, fmtTime } from "../_lib/dates";
import { APPT_STATUS } from "../_lib/labels";

export default async function TurnosPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) notFound();
  if (!hasModule(tenant, "turnos")) {
    return <ModuleDisabled moduleLabel={MODULE_LABELS.turnos} />;
  }

  const base = `/os/${tenant.slug}`;
  const today = argDateStr();
  const { start: todayStart } = dayRange(today);
  const { end: rangeEnd } = dayRange(addDays(today, 7));

  const appts = await db.appointment.findMany({
    where: { clientId: tenant.id, startsAt: { gte: todayStart, lt: rangeEnd } },
    orderBy: { startsAt: "asc" },
    include: { contact: { select: { id: true, name: true, phone: true } } },
  });

  // Agrupar por día calendario ARGENTINO (UTC-3), no UTC.
  const byDay = new Map<string, typeof appts>();
  for (const a of appts) {
    const key = argDateStr(a.startsAt);
    const list = byDay.get(key) ?? [];
    list.push(a);
    byDay.set(key, list);
  }

  const todayList = byDay.get(today) ?? [];
  const nextDays = Array.from({ length: 7 }, (_, i) => addDays(today, i + 1));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Turnos & Agenda</h1>
          <p className="text-sm text-muted-foreground">Hoy y los próximos 7 días.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ButtonLink href={`${base}/turnos/config`} variant="secondary" size="sm">
            ⚙️ Disponibilidad
          </ButtonLink>
          <ButtonLink href={`${base}/turnos/nuevo`} size="sm">
            + Turno
          </ButtonLink>
        </div>
      </div>

      <section>
        <h2 className="mb-2 font-semibold">
          Hoy <span className="font-normal text-muted-foreground">· {fmtDayLabel(today)}</span>
        </h2>
        {todayList.length === 0 ? (
          <EmptyState
            icon="📅"
            title="Hoy no hay turnos"
            detail="Los turnos que entren por el bot o que cargues vos aparecen acá."
          />
        ) : (
          <Card className="divide-y p-0">
            {todayList.map((a) => (
              <ApptRow key={a.id} slug={tenant.slug} appt={a} />
            ))}
          </Card>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">Próximos 7 días</h2>
        {nextDays.map((day) => {
          const list = byDay.get(day) ?? [];
          return (
            <div key={day}>
              <h3 className="mb-1.5 text-sm font-medium capitalize text-muted-foreground">
                {fmtDayLabel(day)}
              </h3>
              {list.length === 0 ? (
                <p className="rounded-md border border-dashed px-3 py-2 text-xs text-muted-foreground">
                  Sin turnos
                </p>
              ) : (
                <Card className="divide-y p-0">
                  {list.map((a) => (
                    <ApptRow key={a.id} slug={tenant.slug} appt={a} />
                  ))}
                </Card>
              )}
            </div>
          );
        })}
      </section>
    </div>
  );
}

function ApptRow({
  slug,
  appt,
}: {
  slug: string;
  appt: {
    id: string;
    title: string;
    startsAt: Date;
    endsAt: Date;
    status: keyof typeof APPT_STATUS;
    source: string;
    notes: string | null;
    contact: { id: string; name: string; phone: string | null } | null;
  };
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2.5 sm:px-4">
      <span className="font-mono text-sm font-semibold tabular-nums">
        {fmtTime(appt.startsAt)}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {appt.title}
          {appt.source === "bot" ? <span title="Agendado por el bot"> 🤖</span> : null}
        </p>
        {appt.contact ? (
          <p className="truncate text-xs text-muted-foreground">
            {appt.contact.name}
            {appt.contact.phone ? ` · ${appt.contact.phone}` : ""}
          </p>
        ) : null}
      </div>
      <Badge variant={APPT_STATUS[appt.status].variant}>{APPT_STATUS[appt.status].label}</Badge>
      <AppointmentActions slug={slug} appointmentId={appt.id} status={appt.status} />
    </div>
  );
}
