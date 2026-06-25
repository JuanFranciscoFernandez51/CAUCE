import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getTenantBySlug } from "@/lib/tenant";
import { currentPeriod } from "@/lib/usage";
import { generateMonthlyReport, type ReportContent } from "@/lib/reports";
import { resolveOsRole, isOsOwner } from "../_components/os-role";
import { ModuleDisabled } from "../_components/module-disabled";
import { ReportRefreshButton } from "../_components/report-refresh-button";
import { fmtMonthLabel, fmtDateShort } from "../_lib/dates";
import { Card, Stat, Badge, EmptyState } from "@/components/ui";

export const dynamic = "force-dynamic";

type ReportRow = {
  id: string;
  period: string;
  content: ReportContent;
  sentAt: Date | null;
  createdAt: Date;
};

/** "junio" (solo el mes, sin año) para arrancar la redacción del resumen. */
function monthOnly(period: string): string {
  return fmtMonthLabel(period).split(" ")[0] ?? period;
}

/** Salud global de las automatizaciones del reporte (para un Badge de estado). */
function automationsHealth(content: ReportContent): {
  active: number;
  total: number;
  tone: "success" | "warning" | "default";
} {
  const total = content.automations.length;
  const active = content.automations.filter((a) => a.status === "ACTIVE").length;
  const anyDown = content.automations.some((a) => a.health && a.health !== "OK" && a.health !== "HEALTHY");
  return { active, total, tone: anyDown ? "warning" : active > 0 ? "success" : "default" };
}

export default async function ReportesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) notFound();

  // Solo el dueño (o admin de Cauce): los reportes son la vista de negocio del dueño.
  const session = await auth();
  const role = session ? await resolveOsRole(session.user.id, tenant.id) : null;
  if (!isOsOwner(role)) {
    return (
      <ModuleDisabled
        moduleLabel="Reportes"
        title="Reportes mensuales"
        detail="Solo el dueño de la cuenta puede ver los reportes del negocio. Pedile acceso si lo necesitás."
      />
    );
  }

  const period = currentPeriod();

  // Si todavía no existe el reporte del mes en curso, lo armamos al vuelo
  // para que el dueño siempre vea su mes fresco al entrar.
  const existsCurrent = await db.report.count({
    where: { clientId: tenant.id, period },
  });
  if (existsCurrent === 0) {
    try {
      await generateMonthlyReport(tenant.id, period);
    } catch {
      // Si falla la generación, seguimos: la lista igual muestra lo que haya.
    }
  }

  // SCOPING: SIEMPRE filtrado por clientId del tenant.
  const reportsRaw = await db.report.findMany({
    where: { clientId: tenant.id },
    orderBy: { period: "desc" },
    select: { id: true, period: true, content: true, sentAt: true, createdAt: true },
  });
  const reports = reportsRaw as unknown as ReportRow[];

  const current = reports.find((r) => r.period === period) ?? null;
  const history = reports.filter((r) => r.period !== period);

  // Sin ningún reporte todavía: estado vacío lindo.
  if (reports.length === 0) {
    return (
      <div className="space-y-6">
        <Header slug={slug} />
        <EmptyState
          icon="📊"
          title="Tu primer reporte se arma solo a fin de mes"
          detail="Cada mes Cauce resume cómo viene tu negocio: mensajes atendidos, contactos nuevos, turnos y el estado de tus automatizaciones. ¿No querés esperar? Generalo ahora con los datos de hoy."
          action={<ReportRefreshButton slug={slug} label="Generar reporte de este mes" />}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Header slug={slug} />

      {/* ── Reporte del mes actual, destacado ── */}
      {current ? (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold capitalize">{fmtMonthLabel(current.period)}</h2>
              <p className="text-sm text-muted-foreground">Mes en curso · se actualiza a medida que avanza</p>
            </div>
            <ReportRefreshButton slug={slug} />
          </div>

          <CurrentSummary content={current.content} />
          <Kpis content={current.content} />
          <AutomationsCard content={current.content} />
        </section>
      ) : null}

      {/* ── Histórico de meses anteriores ── */}
      {history.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Meses anteriores</h2>
          <div className="space-y-2">
            {history.map((r) => (
              <HistoryRow key={r.id} report={r} />
            ))}
          </div>
        </section>
      ) : null}

      {/*
        PRÓXIMO PASO (NO IMPLEMENTADO): envío del reporte por email.
        Este mismo `content` es lo que se mandará por Resend a fin de mes
        (asunto "Tu resumen de {fmtMonthLabel(period)}", cuerpo = summary + KPIs).
        El campo Report.sentAt queda reservado para marcar el envío.
        Acá iría algo como: <SendReportButton slug={slug} period={period} />
      */}
    </div>
  );
}

function Header({ slug }: { slug: string }) {
  return (
    <div>
      <h1 className="text-2xl font-bold">📊 Reportes mensuales</h1>
      <p className="text-sm text-muted-foreground">
        El resumen de tu negocio, mes a mes. Pensado para que de un vistazo sepas cómo venís.
      </p>
      {/* slug disponible por si sumamos acciones a nivel header en el futuro */}
      <span className="sr-only">{slug}</span>
    </div>
  );
}

/** Resumen redactado del mes en curso ("En junio tu negocio…"). */
function CurrentSummary({ content }: { content: ReportContent }) {
  const mes = monthOnly(content.period);
  const { active, total } = automationsHealth(content);
  return (
    <Card className="border-primary/30 bg-primary-soft/40 p-5">
      <p className="text-sm leading-relaxed">
        <span className="font-semibold capitalize">En {mes}</span> tu negocio atendió{" "}
        <strong>{content.messages.toLocaleString("es-AR")}</strong> mensaje
        {content.messages === 1 ? "" : "s"}, sumó{" "}
        <strong>{content.leadsCaptured.toLocaleString("es-AR")}</strong> contacto
        {content.leadsCaptured === 1 ? "" : "s"} nuevo
        {content.leadsCaptured === 1 ? "" : "s"} y registró{" "}
        <strong>{content.appointments.toLocaleString("es-AR")}</strong> turno
        {content.appointments === 1 ? "" : "s"}.{" "}
        {total > 0 ? (
          <>
            Tenés <strong>{active}</strong> de <strong>{total}</strong> automatización
            {total === 1 ? "" : "es"} trabajando para vos.
          </>
        ) : (
          <>Todavía no tenés automatizaciones configuradas.</>
        )}
      </p>
    </Card>
  );
}

/** KPIs grandes del mes en curso. */
function Kpis({ content }: { content: ReportContent }) {
  const { active, total } = automationsHealth(content);
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Stat label="Mensajes atendidos" value={content.messages.toLocaleString("es-AR")} hint="Por tus automatizaciones e IA" />
      <Stat
        label="Contactos nuevos"
        value={content.leadsCaptured.toLocaleString("es-AR")}
        hint="Sumados al CRM este mes"
        tone={content.leadsCaptured > 0 ? "success" : "default"}
      />
      <Stat label="Turnos registrados" value={content.appointments.toLocaleString("es-AR")} hint="Agendados en el mes" />
      <Stat
        label="Automatizaciones activas"
        value={`${active}/${total}`}
        hint="Trabajando para tu negocio"
        tone={total > 0 && active === 0 ? "warning" : "default"}
      />
    </div>
  );
}

/** Detalle de cada automatización con su estado y salud. */
function AutomationsCard({ content }: { content: ReportContent }) {
  if (content.automations.length === 0) return null;
  return (
    <Card className="p-5">
      <p className="mb-3 text-sm font-semibold">Tus automatizaciones</p>
      <ul className="space-y-2">
        {content.automations.map((a, i) => {
          const isActive = a.status === "ACTIVE";
          const healthy = !a.health || a.health === "OK" || a.health === "HEALTHY";
          return (
            <li key={`${a.name}-${i}`} className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="font-medium">{a.name}</span>
              <span className="flex items-center gap-1.5">
                <Badge variant={isActive ? "success" : "default"}>
                  {isActive ? "Activa" : "Pausada"}
                </Badge>
                {isActive ? (
                  <Badge variant={healthy ? "primary" : "warning"}>
                    {healthy ? "Todo OK" : "Revisar"}
                  </Badge>
                ) : null}
              </span>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

/** Fila expandible de un mes histórico (period + métricas clave). */
function HistoryRow({ report }: { report: ReportRow }) {
  const c = report.content;
  const { active, total } = automationsHealth(c);
  return (
    <Card className="overflow-hidden p-0">
      <details className="group">
        <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 px-4 py-3 hover:bg-muted">
          <span className="font-medium capitalize">{fmtMonthLabel(report.period)}</span>
          <span className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span>💬 {c.messages.toLocaleString("es-AR")} mensajes</span>
            <span>📇 {c.leadsCaptured.toLocaleString("es-AR")} contactos</span>
            <span>📅 {c.appointments.toLocaleString("es-AR")} turnos</span>
            <span className="text-base transition-transform group-open:rotate-180">⌄</span>
          </span>
        </summary>
        <div className="space-y-3 border-t px-4 py-3">
          <p className="text-sm leading-relaxed text-muted-foreground">{c.summary}</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <MiniStat label="Mensajes" value={c.messages} />
            <MiniStat label="Contactos" value={c.leadsCaptured} />
            <MiniStat label="Turnos" value={c.appointments} />
            <MiniStat label="Autom. activas" value={`${active}/${total}`} />
          </div>
          <p className="text-xs text-muted-foreground">
            Generado el {fmtDateShort(new Date(report.createdAt))}
            {report.sentAt ? ` · enviado el ${fmtDateShort(new Date(report.sentAt))}` : ""}
          </p>
        </div>
      </details>
    </Card>
  );
}

function MiniStat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-md border bg-card px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold">
        {typeof value === "number" ? value.toLocaleString("es-AR") : value}
      </p>
    </div>
  );
}
