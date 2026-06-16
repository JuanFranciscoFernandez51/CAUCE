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
  dayNum,
  dayRange,
  fmtDayLabel,
  fmtMonthLabel,
  fmtTime,
  monthGrid,
} from "../_lib/dates";
import { APPT_STATUS } from "../_lib/labels";

type Vista = "calendario" | "lista";

const STATUS_DOT: Record<keyof typeof APPT_STATUS, string> = {
  PENDING: "bg-warning",
  CONFIRMED: "bg-success",
  CANCELLED: "bg-muted-foreground",
  DONE: "bg-primary",
};

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
  const vista: Vista = sp.vista === "lista" ? "lista" : "calendario";
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
            {vista === "calendario" ? "Vista mensual de tus turnos." : "Agenda por día."}
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
          monthStr={sp.fecha && /^\d{4}-\d{2}/.test(sp.fecha) ? sp.fecha.slice(0, 7) : argMonthStr()}
          today={today}
          recurso={recurso}
          withParams={withParams}
        />
      ) : (
        <ListView slug={tenant.slug} where={apptWhere} today={today} />
      )}
    </div>
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
  monthStr,
  today,
  recurso,
  withParams,
}: {
  slug: string;
  base: string;
  where: { clientId: string; employeeId?: string };
  monthStr: string;
  today: string;
  recurso: string;
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
    select: { id: true, title: true, startsAt: true, status: true },
  });

  const byDay = new Map<string, typeof appts>();
  for (const a of appts) {
    const key = argDateStr(a.startsAt);
    const list = byDay.get(key) ?? [];
    list.push(a);
    byDay.set(key, list);
  }

  const prev = addMonths(monthStr, -1);
  const next = addMonths(monthStr, 1);
  const weekdayNames = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

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

      <Card className="overflow-hidden p-0">
        <div className="grid grid-cols-7 border-b bg-muted text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {weekdayNames.map((w) => (
            <div key={w} className="px-1 py-1.5">
              {w}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {weeks.flat().map((cell) => {
            const list = byDay.get(cell.date) ?? [];
            const isToday = cell.date === today;
            return (
              <Link
                key={cell.date}
                href={withParams({ vista: "lista", fecha: cell.date })}
                className={`min-h-20 border-b border-r p-1 text-left align-top transition-colors hover:bg-muted sm:min-h-24 ${
                  cell.inMonth ? "" : "bg-muted/40 text-muted-foreground"
                }`}
              >
                <div className="mb-1 flex items-center justify-between">
                  <span
                    className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-xs ${
                      isToday ? "bg-primary font-semibold text-primary-foreground" : ""
                    }`}
                  >
                    {dayNum(cell.date)}
                  </span>
                  {list.length > 0 ? (
                    <span className="text-[10px] text-muted-foreground">{list.length}</span>
                  ) : null}
                </div>
                <div className="space-y-0.5">
                  {list.slice(0, 3).map((a) => (
                    <div
                      key={a.id}
                      className="flex items-center gap-1 truncate text-[11px] leading-tight"
                      title={`${fmtTime(a.startsAt)} · ${a.title}`}
                    >
                      <span
                        className={`h-1.5 w-1.5 shrink-0 rounded-full ${STATUS_DOT[a.status]}`}
                      />
                      <span className="font-mono tabular-nums">{fmtTime(a.startsAt)}</span>
                      <span className="truncate">{a.title}</span>
                    </div>
                  ))}
                  {list.length > 3 ? (
                    <div className="text-[10px] text-muted-foreground">
                      +{list.length - 3} más
                    </div>
                  ) : null}
                </div>
              </Link>
            );
          })}
        </div>
      </Card>
      <p className="text-xs text-muted-foreground">
        Tocá un día para ver su agenda completa.
      </p>
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
