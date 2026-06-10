import { db } from "@/lib/db";
import { Badge, Card, EmptyState } from "@/components/ui";
import { getPortalClient, fmtPeriod } from "../_lib";

type ReportContent = {
  summary?: string;
  messages?: number;
  leadsCaptured?: number;
  appointments?: number;
  automations?: { name: string; status: string; health: string }[];
};

const STATUS_LABEL: Record<string, { label: string; variant: "default" | "success" | "warning" | "destructive" }> = {
  TEST: { label: "En prueba", variant: "warning" },
  ACTIVE: { label: "Activa", variant: "success" },
  PAUSED: { label: "Pausada", variant: "default" },
  ERROR: { label: "Error", variant: "destructive" },
};

export default async function ReportesPage() {
  const client = await getPortalClient();
  if (!client) return null;

  const reports = await db.report.findMany({
    where: { clientId: client.id },
    orderBy: { period: "desc" },
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reportes</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Cada mes te contamos qué hizo tu bot por tu negocio.
        </p>
      </div>

      {reports.length === 0 ? (
        <EmptyState
          icon="📬"
          title="Tu primer reporte llega a fin de mes"
          detail="Resumimos mensajes atendidos, contactos capturados y cómo vienen tus automatizaciones."
        />
      ) : (
        <div className="space-y-4">
          {reports.map((r) => {
            const c = (r.content ?? {}) as ReportContent;
            return (
              <Card key={r.id} className="p-0">
                <details className="group">
                  <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-2 p-5 [&::-webkit-details-marker]:hidden">
                    <div>
                      <p className="font-semibold capitalize">{fmtPeriod(r.period)}</p>
                      {c.summary ? (
                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                          {c.summary}
                        </p>
                      ) : null}
                    </div>
                    <span className="text-sm font-medium text-primary group-open:hidden">
                      Ver detalle →
                    </span>
                    <span className="hidden text-sm font-medium text-primary group-open:inline">
                      Cerrar ↑
                    </span>
                  </summary>
                  <div className="border-t px-5 py-4">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div className="rounded-md bg-muted p-3">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Mensajes
                        </p>
                        <p className="mt-1 text-xl font-semibold">
                          {(c.messages ?? 0).toLocaleString("es-AR")}
                        </p>
                      </div>
                      <div className="rounded-md bg-muted p-3">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Contactos nuevos
                        </p>
                        <p className="mt-1 text-xl font-semibold">
                          {(c.leadsCaptured ?? 0).toLocaleString("es-AR")}
                        </p>
                      </div>
                      <div className="rounded-md bg-muted p-3">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Turnos
                        </p>
                        <p className="mt-1 text-xl font-semibold">
                          {(c.appointments ?? 0).toLocaleString("es-AR")}
                        </p>
                      </div>
                    </div>
                    {Array.isArray(c.automations) && c.automations.length > 0 ? (
                      <div className="mt-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Automatizaciones
                        </p>
                        <ul className="mt-2 space-y-2">
                          {c.automations.map((a, i) => {
                            const s = STATUS_LABEL[a.status] ?? { label: a.status, variant: "default" as const };
                            return (
                              <li key={i} className="flex items-center justify-between gap-2 text-sm">
                                <span className="min-w-0 truncate">{a.name}</span>
                                <Badge variant={s.variant}>{s.label}</Badge>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    ) : null}
                  </div>
                </details>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
