import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { fmtUsd } from "@/lib/pricing";
import { PROCESOS_CATALOGO } from "@/lib/procesos-catalogo";
import { Badge, Card, EmptyState } from "@/components/ui";
import {
  AREA_LABELS,
  BLUEPRINT_STATUS_BADGE,
  BLUEPRINT_STATUS_LABELS,
  fmtDateTime,
  humanizeIntakeKey,
  humanizeIntakeValue,
  LEAD_SOURCE_BADGE,
  LEAD_SOURCE_LABELS,
  LEAD_STATUS_BADGE,
  LEAD_STATUS_LABELS,
  PACK_BADGE,
  PACK_LABELS,
} from "../../_components/format";
import { BlueprintActions, DiagnosticoButton, MarkLostButton } from "./lead-actions";

export const dynamic = "force-dynamic";

type FlowStep = { paso: number; titulo: string; detalle: string };

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const lead = await db.lead.findUnique({
    where: { id },
    include: {
      blueprints: { orderBy: { createdAt: "desc" } },
      client: { select: { id: true, name: true } },
    },
  });
  if (!lead) notFound();

  // Los blueprints guardan keys del catálogo de procesos (en código).
  const recipeById = new Map(
    PROCESOS_CATALOGO.map((p) => [p.key, { id: p.key, name: p.nombre, area: p.area }])
  );

  const intake = (lead.intake as Record<string, unknown> | null) ?? null;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/admin/leads" className="text-sm text-muted-foreground hover:text-foreground">
            ← Leads
          </Link>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">{lead.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant={LEAD_SOURCE_BADGE[lead.source] ?? "default"}>
              {LEAD_SOURCE_LABELS[lead.source] ?? lead.source}
            </Badge>
            <Badge variant={LEAD_STATUS_BADGE[lead.status] ?? "default"}>
              {LEAD_STATUS_LABELS[lead.status] ?? lead.status}
            </Badge>
            <span className="text-sm text-muted-foreground">Score: {lead.score}</span>
            <span className="text-sm text-muted-foreground">· {fmtDateTime(lead.createdAt)}</span>
          </div>
          {lead.client ? (
            <p className="mt-2 text-sm">
              Convertido en cliente:{" "}
              <Link href={`/admin/clientes/${lead.client.id}`} className="font-medium text-primary hover:underline">
                {lead.client.name} →
              </Link>
            </p>
          ) : null}
        </div>
        <div className="flex flex-col items-end gap-2">
          <DiagnosticoButton leadId={lead.id} />
          <MarkLostButton leadId={lead.id} status={lead.status} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-3 font-semibold">Datos de contacto</h2>
          <dl className="space-y-2 text-sm">
            <Row k="Negocio" v={lead.business ?? "—"} />
            <Row k="Rubro" v={lead.rubro ?? "—"} />
            <Row k="Email" v={lead.email ?? "—"} />
            <Row k="Teléfono" v={lead.phone ?? "—"} />
            <Row k="WhatsApp" v={lead.whatsapp ?? "—"} />
          </dl>
        </Card>

        <Card className="p-5">
          <h2 className="mb-3 font-semibold">Respuestas del intake</h2>
          {!intake || Object.keys(intake).length === 0 ? (
            <p className="text-sm text-muted-foreground">Este lead no completó el intake.</p>
          ) : (
            <dl className="space-y-2 text-sm">
              {Object.entries(intake).map(([k, v]) => (
                <Row key={k} k={humanizeIntakeKey(k)} v={humanizeIntakeValue(v)} />
              ))}
            </dl>
          )}
        </Card>
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Blueprints</h2>
        {lead.blueprints.length === 0 ? (
          <EmptyState
            icon="🧩"
            title="Sin blueprints todavía"
            detail="Corré el diagnóstico para que la IA arme la propuesta de automatización."
          />
        ) : (
          lead.blueprints.map((bp) => {
            const flow = (bp.flow as FlowStep[] | null) ?? [];
            return (
              <Card key={bp.id} className="space-y-4 p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={BLUEPRINT_STATUS_BADGE[bp.status] ?? "default"}>
                    {BLUEPRINT_STATUS_LABELS[bp.status] ?? bp.status}
                  </Badge>
                  <Badge variant="primary">{bp.level}</Badge>
                  <Badge variant={PACK_BADGE[bp.suggestedPack] ?? "default"}>
                    Pack {PACK_LABELS[bp.suggestedPack] ?? bp.suggestedPack}
                  </Badge>
                  <span className="ml-auto text-xs text-muted-foreground">{fmtDateTime(bp.createdAt)}</span>
                </div>

                <p className="text-sm leading-relaxed">{bp.summary}</p>

                <div className="flex flex-wrap gap-4 rounded-md bg-muted p-3 text-sm">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Setup sugerido</p>
                    <p className="font-semibold">{fmtUsd(bp.suggestedSetup)}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Mensual sugerido</p>
                    <p className="font-semibold">{fmtUsd(bp.suggestedMonthly)}/mes</p>
                  </div>
                </div>

                {flow.length > 0 ? (
                  <div>
                    <h3 className="mb-2 text-sm font-semibold">Flujo propuesto</h3>
                    <ol className="space-y-2">
                      {flow.map((step, i) => (
                        <li key={i} className="flex gap-3 text-sm">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-semibold text-primary">
                            {step.paso ?? i + 1}
                          </span>
                          <div>
                            <p className="font-medium">{step.titulo}</p>
                            <p className="text-muted-foreground">{step.detalle}</p>
                          </div>
                        </li>
                      ))}
                    </ol>
                  </div>
                ) : null}

                {bp.recipeIds.length > 0 ? (
                  <div>
                    <h3 className="mb-2 text-sm font-semibold">Recetas matcheadas</h3>
                    <div className="flex flex-wrap gap-2">
                      {bp.recipeIds.map((rid) => {
                        const r = recipeById.get(rid);
                        return (
                          <Badge key={rid} variant="outline">
                            {r ? `${r.name} · ${AREA_LABELS[r.area] ?? r.area}` : `Receta ${rid} (no encontrada)`}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

                <BlueprintActions blueprintId={bp.id} status={bp.status} />
              </Card>
            );
          })
        )}
      </section>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-dashed pb-1.5 last:border-0">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="text-right font-medium">{v}</dd>
    </div>
  );
}
