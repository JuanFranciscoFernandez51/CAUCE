import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getTenantBySlug, hasModule, tenantBranding, tenantModules } from "@/lib/tenant";
import { Badge, ButtonLink, Card, EmptyState, Stat } from "@/components/ui";
import {
  buildRanges,
  playbookForClient,
  type AlertResult,
  type KpiValue,
  type TenantCtx,
} from "@/lib/playbooks";
import { fmtTime } from "./_lib/dates";
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
  const modules = tenantModules(tenant);
  const base = `/os/${tenant.slug}`;
  const turnos = hasModule(tenant, "turnos");

  const playbook = playbookForClient(tenant);
  const ranges = buildRanges();
  const ctx: TenantCtx = { id: tenant.id, modules };
  const has = (m?: string) => !m || modules.includes(m as (typeof modules)[number]);

  // Solo KPIs/alertas cuyo módulo está activo en este tenant.
  const kpiDefs = playbook.kpis.filter((k) => has(k.requires)).slice(0, 5);
  const alertDefs = playbook.alerts.filter((a) => has(a.requires));
  const quickActions = playbook.quickActions.filter((q) => has(q.requires));

  // Todo en paralelo: KPIs, alertas y agenda de hoy.
  const [kpiResults, alertResults, todayAppts] = await Promise.all([
    Promise.all(
      kpiDefs.map(async (k): Promise<{ key: string; value: KpiValue } | null> => {
        try {
          return { key: k.key, value: await k.compute(db, ctx, ranges) };
        } catch {
          return null; // un KPI que falla no tira abajo el dashboard
        }
      })
    ),
    Promise.all(
      alertDefs.map(async (a): Promise<AlertResult | null> => {
        try {
          return await a.compute(db, ctx, ranges);
        } catch {
          return null;
        }
      })
    ),
    turnos
      ? db.appointment.findMany({
          where: {
            clientId: tenant.id,
            startsAt: { gte: ranges.todayStart, lt: ranges.todayEnd },
          },
          orderBy: { startsAt: "asc" },
          include: { contact: { select: { name: true } } },
        })
      : Promise.resolve([]),
  ]);

  const valueByKey = new Map(
    kpiResults.filter((r): r is { key: string; value: KpiValue } => r !== null).map((r) => [r.key, r.value])
  );
  const alerts = alertResults.filter((a): a is AlertResult => a !== null);

  // Franja "hoy": mensajes por mandar (los genera el cron de procesos).
  const mensajesPendientes = await db.outreachTarea
    .count({ where: { clientId: tenant.id, estado: "PROGRAMADA" } })
    .catch(() => 0);

  const alertToneCls: Record<NonNullable<AlertResult["tone"]>, string> = {
    default: "border-border",
    success: "border-success/40 bg-success/5",
    warning: "border-warning/40 bg-warning/5",
    destructive: "border-destructive/40 bg-destructive/5",
  };
  const noModules = modules.length === 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Hola, {branding.displayName} 👋</h1>
          <p className="text-sm text-muted-foreground">{playbook.heroSubtitle}</p>
        </div>
        {quickActions.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {quickActions.map((a) => (
              <ButtonLink key={a.label} href={`${base}${a.href}`} variant={a.variant} size="sm">
                {a.label}
              </ButtonLink>
            ))}
          </div>
        ) : null}
      </div>

      {mensajesPendientes > 0 ? (
        <Link
          href={`${base}/hoy`}
          className="flex items-center justify-between gap-3 rounded-lg border border-primary/40 bg-primary-soft px-4 py-3 transition-opacity hover:opacity-90"
        >
          <p className="text-sm font-medium">
            ☀️ Tenés <span className="font-bold">{mensajesPendientes}</span> mensaje
            {mensajesPendientes === 1 ? "" : "s"} para mandar hoy — cada uno con el WhatsApp armado.
          </p>
          <span className="shrink-0 text-sm font-semibold text-primary">Ir a Para hoy →</span>
        </Link>
      ) : null}

      {kpiDefs.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-5">
          {kpiDefs.map((k) => (
            <Stat
              key={k.key}
              label={k.label}
              value={valueByKey.has(k.key) ? valueByKey.get(k.key)! : "—"}
              hint={k.hint}
              tone={k.tone}
            />
          ))}
        </div>
      ) : null}

      {alerts.length > 0 ? (
        <Card className="p-4 sm:p-5">
          <h2 className="mb-3 font-semibold">Para resolver hoy</h2>
          <ul className="space-y-2">
            {alerts.map((a) => (
              <li key={a.label}>
                <Link
                  href={`${base}${a.href}`}
                  className={`flex items-center justify-between gap-3 rounded-md border px-3 py-2.5 transition-colors hover:bg-muted ${
                    alertToneCls[a.tone ?? "default"]
                  }`}
                >
                  <span className="flex min-w-0 items-center gap-2.5">
                    <Badge variant={a.tone === "destructive" ? "destructive" : a.tone === "success" ? "success" : "warning"}>
                      {a.count}
                    </Badge>
                    <span className="truncate text-sm">{a.label}</span>
                  </span>
                  <span className="shrink-0 text-sm font-medium text-primary">Ver →</span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {turnos ? (
        <Card className="p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="font-semibold">
              {playbook.glossary.appointments.charAt(0).toUpperCase() +
                playbook.glossary.appointments.slice(1)}{" "}
              de hoy
            </h2>
            <Link href={`${base}/turnos`} className="text-sm font-medium text-primary hover:underline">
              Ver agenda →
            </Link>
          </div>
          {todayAppts.length === 0 ? (
            <EmptyState
              icon="📅"
              title={`Hoy no tenés ${playbook.glossary.appointments}`}
              detail={`Cuando el bot o vos carguen ${playbook.glossary.appointments} para hoy, aparecen acá.`}
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

      {noModules ? (
        <EmptyState
          icon="🧩"
          title="Todavía no tenés módulos activos"
          detail="Hablá con Cauce para activar CRM, Turnos y más."
        />
      ) : null}
    </div>
  );
}
