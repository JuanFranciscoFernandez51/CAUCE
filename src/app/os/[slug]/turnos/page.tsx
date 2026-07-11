import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { getTenantBySlug, hasModule, MODULE_LABELS } from "@/lib/tenant";
import { Badge, ButtonLink, Card, EmptyState } from "@/components/ui";
import { ModuleDisabled } from "../_components/module-disabled";
import { AppointmentActions } from "../_components/appointment-actions";
import { PublicBookingLink } from "../_components/public-booking-link";
import {
  addDays,
  addMonths,
  argDateStr,
  argMonthStr,
  dayRange,
  fmtDayLabel,
  fmtMonthLabel,
  fmtTime,
  monthGrid,
  weekdayOf,
} from "../_lib/dates";
import { APPT_STATUS } from "../_lib/labels";
import { MonthCalendar, type CalAppt } from "../_components/month-calendar";

type Vista = "calendario" | "semana" | "lista";

export default async function TurnosPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ vista?: string; fecha?: string; recurso?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) notFound();
  if (!hasModule(tenant, "turnos")) {
    return <ModuleDisabled moduleLabel={MODULE_LABELS.turnos} />;
  }

  const base = `/os/${tenant.slug}`;
  const vista: Vista =
    sp.vista === "lista" ? "lista" : sp.vista === "semana" ? "semana" : "calendario";
  const today = argDateStr();

  // Recursos del tenant (empleados activos). Si no hay, no se muestra el filtro.
  const employees = await db.employee.findMany({
    where: { clientId: tenant.id, active: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
  const recurso =
    sp.recurso && employees.some((e) => e.id === sp.recurso) ? sp.recurso : "";

  const apptWhere = {
    clientId: tenant.id,
    ...(recurso ? { employeeId: recurso } : {}),
  };

  // Helper para armar links preservando recurso/vista.
  const withParams = (next: Partial<{ vista: Vista; fecha: string; recurso: string }>) => {
    const q = new URLSearchParams();
    q.set("vista", next.vista ?? vista);
    if (next.fecha) q.set("fecha", next.fecha);
    const r = next.recurso ?? recurso;
    if (r) q.set("recurso", r);
    return `${base}/turnos?${q.toString()}`;
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Turnos &amp; Agenda</h1>
          <p className="text-sm text-muted-foreground">
            {vista === "calendario"
              ? "Vista mensual de tus turnos."
              : vista === "semana"
                ? "La semana de un vistazo, por recurso."
                : "Agenda por día."}
          </p>
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

      <PublicBookingLink slug={tenant.slug} />

      {/* Toggle de vista + filtro por recurso */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex overflow-hidden rounded-md border">
          <Link
            href={withParams({ vista: "calendario" })}
            className={`px-3 py-1.5 text-sm font-medium transition-colors ${
              vista === "calendario"
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground hover:bg-muted"
            }`}
          >
            📅 Calendario
          </Link>
          <Link
            href={withParams({ vista: "semana" })}
            className={`px-3 py-1.5 text-sm font-medium transition-colors ${
              vista === "semana"
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground hover:bg-muted"
            }`}
          >
            🗓️ Semana
          </Link>
          <Link
            href={withParams({ vista: "lista" })}
            className={`px-3 py-1.5 text-sm font-medium transition-colors ${
              vista === "lista"
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground hover:bg-muted"
            }`}
          >
            📋 Lista por día
          </Link>
        </div>

        {employees.length > 0 ? (
          <ResourceFilter
            employees={employees}
            current={recurso}
            hrefFor={(id) => withParams({ recurso: id })}
          />
        ) : null}
      </div>

      {vista === "calendario" ? (
        <CalendarView
          slug={tenant.slug}
          base={base}
          where={apptWhere}
          employees={employees}
          monthStr={sp.fecha && /^\d{4}-\d{2}/.test(sp.fecha) ? sp.fecha.slice(0, 7) : argMonthStr()}
          today={today}
          withParams={withParams}
        />
      ) : vista === "semana" ? (
        <WeekView
          slug={tenant.slug}
          base={base}
          where={apptWhere}
          fecha={sp.fecha && /^\d{4}-\d{2}-\d{2}$/.test(sp.fecha) ? sp.fecha : today}
          today={today}
          withParams={withParams}
        />
      ) : (
        <ListView slug={tenant.slug} where={apptWhere} today={today} />
      )}
    </div>
  );
}

// ── Vista semanal (grilla Lun-Dom con chips por estado) ─────
async function WeekView({
  slug,
  base,
  where,
  fecha,
  today,
  withParams,
}: {
  slug: string;
  base: string;
  where: { clientId: string; employeeId?: string };
  fecha: string;
  today: string;
  withParams: (next: Partial<{ vista: Vista; fecha: string; recurso: string }>) => string;
}) {
  // Lunes de la semana de `fecha`.
  const wd = weekdayOf(fecha); // 0=Dom … 6=Sáb
  const lunes = addDays(fecha, wd === 0 ? -6 : 1 - wd);
  const dias = Array.from({ length: 7 }, (_, i) => addDays(lunes, i));

  const { start } = dayRange(dias[0]);
  const { end } = dayRange(dias[6]);
  const appts = await db.appointment.findMany({
    where: { ...where, startsAt: { gte: start, lt: end }, status: { not: "CANCELLED" } },
    orderBy: { startsAt: "asc" },
    select: {
      id: true,
      title: true,
      startsAt: true,
      status: true,
      contact: { select: { name: true } },
      employee: { select: { name: true } },
    },
  });
  const porDia = new Map<string, typeof appts>();
  for (const a of appts) {
    const d = argDateStr(a.startsAt);
    porDia.set(d, [...(porDia.get(d) ?? []), a]);
  }

  const STATUS_CHIP: Record<string, string> = {
    PENDING: "border-warning/50 bg-warning/10",
    CONFIRMED: "border-primary/50 bg-primary-soft",
    DONE: "border-success/50 bg-success/10",
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <ButtonLink href={withParams({ vista: "semana", fecha: addDays(lunes, -7) })} variant="ghost" size="sm">
          ← Semana anterior
        </ButtonLink>
        <h2 className="text-sm font-semibold">
          Semana del {dias[0].slice(8)}/{dias[0].slice(5, 7)} al {dias[6].slice(8)}/{dias[6].slice(5, 7)}
        </h2>
        <ButtonLink href={withParams({ vista: "semana", fecha: addDays(lunes, 7) })} variant="ghost" size="sm">
          Semana siguiente →
        </ButtonLink>
      </div>

      <div
        className="grid gap-1.5 overflow-x-auto"
        style={{ gridTemplateColumns: "repeat(7, minmax(130px, 1fr))" }}
      >
        {dias.map((d) => {
          const turnos = porDia.get(d) ?? [];
          const esHoy = d === today;
          return (
            <div
              key={d}
              className={`rounded-lg border p-1.5 ${esHoy ? "border-primary bg-primary-soft/40" : "bg-muted/40"}`}
            >
              <p className={`px-1 pb-1 text-xs font-semibold capitalize ${esHoy ? "text-primary" : "text-muted-foreground"}`}>
                {fmtDayLabel(d)}
              </p>
              <div className="space-y-1">
                {turnos.length === 0 ? (
                  <p className="px-1 py-2 text-center text-[11px] text-muted-foreground">—</p>
                ) : (
                  turnos.map((t) => (
                    <Link
                      key={t.id}
                      href={`${base}/turnos?vista=lista&fecha=${d}`}
                      className={`block rounded border px-1.5 py-1 text-[11px] leading-tight transition-opacity hover:opacity-80 ${
                        STATUS_CHIP[t.status] ?? "bg-card"
                      }`}
                      title={`${fmtTime(t.startsAt)} h · ${t.contact?.name ?? t.title}${t.employee ? ` · ${t.employee.name}` : ""} (${APPT_STATUS[t.status]?.label ?? t.status})`}
                    >
                      <span className="font-mono font-semibold tabular-nums">{fmtTime(t.startsAt)}</span>{" "}
                      {t.contact?.name ?? t.title}
                      {t.employee ? (
                        <span className="block truncate text-muted-foreground">{t.employee.name}</span>
                      ) : null}
                    </Link>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">
        <span className="mr-3">🟡 pendiente</span>
        <span className="mr-3">🔵 confirmado</span>
        <span>🟢 hecho</span> · Filtrá por recurso arriba para ver la semana de cada uno.
      </p>
    </section>
  );
}

// ── Filtro por recurso (links server-side, sin JS) ──────────
function ResourceFilter({
  employees,
  current,
  hrefFor,
}: {
  employees: { id: string; name: string }[];
  current: string;
  hrefFor: (id: string) => string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 text-sm">
      <span className="text-muted-foreground">Recurso:</span>
      <Link
        href={hrefFor("")}
        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
          current === "" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-border"
        }`}
      >
        Todos
      </Link>
      {employees.map((e) => (
        <Link
          key={e.id}
          href={hrefFor(e.id)}
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
            current === e.id
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-border"
          }`}
        >
          {e.name}
        </Link>
      ))}
    </div>
  );
}

// ── Vista calendario (mes) ──────────────────────────────────
async function CalendarView({
  slug,
  base,
  where,
  employees,
  monthStr,
  today,
  withParams,
}: {
  slug: string;
  base: string;
  where: { clientId: string; employeeId?: string };
  employees: { id: string; name: string }[];
  monthStr: string;
  today: string;
  withParams: (next: Partial<{ vista: Vista; fecha: string; recurso: string }>) => string;
}) {
  const weeks = monthGrid(monthStr);
  const gridStart = weeks[0][0].date;
  const gridEnd = weeks[weeks.length - 1][6].date;
  const { start } = dayRange(gridStart);
  const { end } = dayRange(gridEnd);

  const appts = await db.appointment.findMany({
    where: { ...where, startsAt: { gte: start, lt: end } },
    orderBy: { startsAt: "asc" },
    select: {
      id: true,
      title: true,
      startsAt: true,
      status: true,
      employeeId: true,
      employee: { select: { name: true } },
    },
  });

  // Serializamos para el client component (sin objetos Date crudos).
  const serialized: CalAppt[] = appts.map((a) => ({
    id: a.id,
    title: a.title,
    date: argDateStr(a.startsAt),
    time: fmtTime(a.startsAt),
    status: a.status,
    employeeId: a.employeeId,
    employeeName: a.employee?.name ?? null,
  }));

  const prev = addMonths(monthStr, -1);
  const next = addMonths(monthStr, 1);

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <ButtonLink
          href={withParams({ vista: "calendario", fecha: `${prev}-01` })}
          variant="ghost"
          size="sm"
        >
          ← Mes anterior
        </ButtonLink>
        <h2 className="font-semibold capitalize">{fmtMonthLabel(monthStr)}</h2>
        <ButtonLink
          href={withParams({ vista: "calendario", fecha: `${next}-01` })}
          variant="ghost"
          size="sm"
        >
          Mes siguiente →
        </ButtonLink>
      </div>

      <MonthCalendar
        key={`${monthStr}:${where.employeeId ?? "all"}`}
        slug={slug}
        base={base}
        weeks={weeks}
        appointments={serialized}
        employees={employees}
        today={today}
      />
    </section>
  );
}

// ── Vista lista por día (agenda hoy + próximos 7) ───────────
async function ListView({
  slug,
  where,
  today,
}: {
  slug: string;
  where: { clientId: string; employeeId?: string };
  today: string;
}) {
  const { start: todayStart } = dayRange(today);
  const { end: rangeEnd } = dayRange(addDays(today, 7));

  const appts = await db.appointment.findMany({
    where: { ...where, startsAt: { gte: todayStart, lt: rangeEnd } },
    orderBy: { startsAt: "asc" },
    include: {
      contact: { select: { id: true, name: true, phone: true } },
      employee: { select: { id: true, name: true } },
    },
  });

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
    <>
      <section>
        <h2 className="mb-2 font-semibold">
          Hoy <span className="font-normal text-muted-foreground">· {fmtDayLabel(today)}</span>
        </h2>
        {todayList.length === 0 ? (
          <EmptyState
            icon="📅"
            title="Hoy no hay turnos"
            detail="Los turnos que entren por el bot, el calendario público o que cargues vos aparecen acá."
          />
        ) : (
          <Card className="divide-y p-0">
            {todayList.map((a) => (
              <ApptRow key={a.id} slug={slug} appt={a} />
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
                    <ApptRow key={a.id} slug={slug} appt={a} />
                  ))}
                </Card>
              )}
            </div>
          );
        })}
      </section>
    </>
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
    employee: { id: string; name: string } | null;
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
          {appt.source === "auto-agendado" ? (
            <span title="Agendado por el cliente"> 🔗</span>
          ) : null}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {appt.contact ? (
            <>
              {appt.contact.name}
              {appt.contact.phone ? ` · ${appt.contact.phone}` : ""}
            </>
          ) : null}
          {appt.employee ? (
            <span className="text-muted-foreground">
              {appt.contact ? " · " : ""}👤 {appt.employee.name}
            </span>
          ) : null}
        </p>
      </div>
      <Badge variant={APPT_STATUS[appt.status].variant}>{APPT_STATUS[appt.status].label}</Badge>
      <AppointmentActions slug={slug} appointmentId={appt.id} status={appt.status} />
    </div>
  );
}
