"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge, Button, Card, EmptyState, ErrorState, Spinner } from "@/components/ui";
import {
  AUTOMATION_STATUS_BADGE,
  AUTOMATION_STATUS_LABELS,
  fmtDate,
  HEALTH_BADGE,
  HEALTH_LABELS,
} from "../../_components/format";

export type ReportData = {
  id: string;
  period: string;
  sentAt: string | null;
  content: {
    summary?: string;
    messages?: number;
    leadsCaptured?: number;
    appointments?: number;
    automations?: { name: string; status: string; health: string }[];
  };
};

export function ReportsSection({
  clientId,
  reports,
  currentPeriod,
}: {
  clientId: string;
  reports: ReportData[];
  currentPeriod: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  async function generate() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/clients/${clientId}/reports`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "No se pudo generar el reporte");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo generar el reporte");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-semibold">Reportes mensuales</h2>
        <Button size="sm" variant="secondary" onClick={generate} disabled={busy}>
          {busy ? <Spinner /> : "📈"}
          {busy ? "Generando…" : `Generar reporte del mes (${currentPeriod})`}
        </Button>
      </div>
      {error ? <div className="mb-3"><ErrorState message={error} /></div> : null}

      {reports.length === 0 ? (
        <EmptyState icon="📄" title="Sin reportes todavía" detail="Generá el primero con el botón de arriba." />
      ) : (
        <ul className="divide-y">
          {reports.map((r) => (
            <li key={r.id} className="py-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{r.period}</span>
                {r.sentAt ? (
                  <Badge variant="success">Enviado {fmtDate(r.sentAt)}</Badge>
                ) : (
                  <Badge variant="outline">Sin enviar</Badge>
                )}
                <button
                  type="button"
                  onClick={() => setOpenId(openId === r.id ? null : r.id)}
                  className="ml-auto text-sm font-medium text-primary hover:underline"
                >
                  {openId === r.id ? "Ocultar" : "Ver contenido"}
                </button>
              </div>
              {openId === r.id ? (
                <div className="mt-3 space-y-3 rounded-md bg-muted/50 p-3 text-sm">
                  {r.content.summary ? <p className="leading-relaxed">{r.content.summary}</p> : null}
                  <div className="flex flex-wrap gap-4">
                    <Num label="Mensajes" value={r.content.messages ?? 0} />
                    <Num label="Contactos nuevos" value={r.content.leadsCaptured ?? 0} />
                    <Num label="Turnos" value={r.content.appointments ?? 0} />
                  </div>
                  {r.content.automations && r.content.automations.length > 0 ? (
                    <div>
                      <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Automatizaciones
                      </p>
                      <ul className="space-y-1">
                        {r.content.automations.map((a, i) => (
                          <li key={i} className="flex flex-wrap items-center gap-2">
                            <span>{a.name}</span>
                            <Badge variant={AUTOMATION_STATUS_BADGE[a.status] ?? "default"}>
                              {AUTOMATION_STATUS_LABELS[a.status] ?? a.status}
                            </Badge>
                            <Badge variant={HEALTH_BADGE[a.health] ?? "default"}>
                              {HEALTH_LABELS[a.health] ?? a.health}
                            </Badge>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function Num({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold">{value.toLocaleString("es-AR")}</p>
    </div>
  );
}
