import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getTenantBySlug } from "@/lib/tenant";
import { AREA_LABELS } from "@/lib/casos";
import { getExecutions, n8nConfigured } from "@/lib/n8n";
import { Badge, Card, EmptyState } from "@/components/ui";
import { fmtDateShort, fmtTime } from "../_lib/dates";
import { isOsOwner, resolveOsRole } from "../_components/os-role";
import {
  AutomationChangeRequest,
  AutomationToggle,
} from "../_components/automation-actions";

const STATUS_BADGE: Record<string, { label: string; variant: "success" | "default" | "warning" | "destructive" }> = {
  ACTIVE: { label: "Funcionando", variant: "success" },
  PAUSED: { label: "Pausada", variant: "default" },
  TEST: { label: "En pruebas", variant: "warning" },
  ERROR: { label: "Con errores", variant: "destructive" },
};

const HEALTH_DOT: Record<string, { dot: string; label: string }> = {
  OK: { dot: "bg-success", label: "Funcionando bien" },
  WARN: { dot: "bg-warning", label: "Con algunos avisos" },
  DOWN: { dot: "bg-destructive", label: "Con problemas" },
  UNKNOWN: { dot: "bg-muted-foreground", label: "Sin datos todavía" },
};

type Execution = { id: string; status: string; startedAt: string };
type VariableDef = { key: string; label?: string };

function execBadge(status: string): { label: string; cls: string } {
  if (status === "success") return { label: "OK", cls: "text-success" };
  if (status === "error" || status === "failed" || status === "crashed") {
    return { label: "Falló", cls: "text-destructive" };
  }
  return { label: status, cls: "text-muted-foreground" };
}

export default async function AutomatizacionesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) notFound();

  const session = await auth();
  const osRole = session ? await resolveOsRole(session.user.id, tenant.id) : null;
  const owner = isOsOwner(osRole);

  const automations = await db.automation.findMany({
    where: { clientId: tenant.id },
    orderBy: { createdAt: "asc" },
    include: {
      recipe: { select: { area: true, solves: true, variables: true } },
    },
  });

  // Últimas 5 ejecuciones reales por automatización (solo si el motor está conectado).
  const engineOn = n8nConfigured();
  const executions: (Execution[] | null)[] = await Promise.all(
    automations.map(async (a) => {
      if (!engineOn || !a.n8nWorkflowId) return null;
      try {
        const res = await getExecutions(a.n8nWorkflowId, 5);
        return res.data.slice(0, 5);
      } catch {
        return [];
      }
    })
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Automatizaciones</h1>
        <p className="text-sm text-muted-foreground">
          Esto es lo que está trabajando por vos, las 24 horas.
        </p>
      </div>

      {automations.length === 0 ? (
        <EmptyState
          icon="⚡"
          title="Todavía no tenés automatizaciones"
          detail="Cauce está armando tus flujos. Apenas estén listos los vas a ver funcionando acá."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {automations.map((auto, i) => {
            const status = STATUS_BADGE[auto.status] ?? STATUS_BADGE.TEST;
            const health = HEALTH_DOT[auto.health] ?? HEALTH_DOT.UNKNOWN;
            const execs = executions[i];
            const config = (auto.config as Record<string, unknown> | null) ?? {};
            const configEntries = Object.entries(config).filter(
              ([, v]) => v !== null && v !== undefined && String(v).trim() !== ""
            );
            const varDefs = ((auto.recipe?.variables as VariableDef[] | null) ?? []).filter(
              (v) => v && typeof v === "object"
            );
            const labelFor = (key: string) =>
              varDefs.find((v) => v.key === key)?.label ?? key;
            const canToggle =
              owner && (auto.status === "ACTIVE" || auto.status === "PAUSED");

            return (
              <Card key={auto.id} className="flex flex-col gap-4 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h2 className="font-semibold">{auto.name}</h2>
                    {auto.recipe ? (
                      <p className="text-xs text-muted-foreground">
                        {AREA_LABELS[auto.recipe.area]}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={status.variant}>{status.label}</Badge>
                    {canToggle ? (
                      <AutomationToggle
                        slug={tenant.slug}
                        automationId={auto.id}
                        status={auto.status as "ACTIVE" | "PAUSED"}
                      />
                    ) : null}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${health.dot}`} />
                  <span className="text-muted-foreground">{health.label}</span>
                </div>

                {auto.recipe?.solves ? (
                  <p className="text-sm text-muted-foreground">{auto.recipe.solves}</p>
                ) : null}

                {execs !== null ? (
                  <div>
                    <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Últimas ejecuciones
                    </h3>
                    {execs.length === 0 ? (
                      <p className="rounded-md border border-dashed px-3 py-2 text-xs text-muted-foreground">
                        Todavía sin ejecuciones — el flujo está listo esperando actividad.
                      </p>
                    ) : (
                      <ul className="divide-y rounded-md border">
                        {execs.map((e) => {
                          const b = execBadge(e.status);
                          const at = new Date(e.startedAt);
                          return (
                            <li
                              key={e.id}
                              className="flex items-center justify-between gap-3 px-3 py-1.5 text-sm"
                            >
                              <span className="font-mono text-xs tabular-nums text-muted-foreground">
                                {fmtDateShort(at)} · {fmtTime(at)} h
                              </span>
                              <span className={`text-xs font-semibold ${b.cls}`}>
                                {b.label}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                ) : null}

                {configEntries.length > 0 ? (
                  <div>
                    <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Configuración actual
                    </h3>
                    <dl className="space-y-1 rounded-md bg-muted/50 px-3 py-2 text-sm">
                      {configEntries.map(([key, value]) => (
                        <div key={key} className="flex flex-wrap justify-between gap-x-3">
                          <dt className="text-muted-foreground">{labelFor(key)}</dt>
                          <dd className="break-all font-medium">{String(value)}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                ) : null}

                <div className="mt-auto border-t pt-3">
                  <AutomationChangeRequest slug={tenant.slug} automationId={auto.id} />
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
