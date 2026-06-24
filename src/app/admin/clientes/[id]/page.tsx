import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { fmtUsd } from "@/lib/pricing";
import { currentPeriod, getFairUse } from "@/lib/usage";
import { Badge, Card, EmptyState, Table, Td, Th } from "@/components/ui";
import {
  CLIENT_STATUS_BADGE,
  CLIENT_STATUS_LABELS,
  PACK_BADGE,
  PACK_LABELS,
} from "../../_components/format";
import { ClientEditForm } from "./client-edit-form";
import { AutomationsSection, type AutomationData, type RecipeVariable } from "./automations-section";
import { OsSection, type BrandingData } from "./os-section";
import { CredentialsSection } from "./credentials-section";
import { ReportsSection, type ReportData } from "./reports-section";
import { PortalAccessSection } from "./portal-access-section";

export const dynamic = "force-dynamic";

export default async function ClienteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const client = await db.client.findUnique({
    where: { id },
    include: {
      automations: {
        orderBy: { createdAt: "asc" },
        include: {
          recipe: { select: { name: true, variables: true } },
          qaChecks: { orderBy: { runAt: "desc" }, take: 6 },
        },
      },
      credentials: { orderBy: { createdAt: "desc" } },
      usages: { orderBy: { period: "desc" } },
      reports: { orderBy: { period: "desc" } },
      users: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!client) notFound();

  const [fairUse, recipes] = await Promise.all([
    getFairUse(client.id),
    db.recipe.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const automations: AutomationData[] = client.automations.map((a) => ({
    id: a.id,
    name: a.name,
    status: a.status,
    health: a.health,
    n8nWorkflowId: a.n8nWorkflowId,
    lastRunAt: a.lastRunAt?.toISOString() ?? null,
    lastError: a.lastError,
    config: Object.fromEntries(
      Object.entries((a.config as Record<string, unknown> | null) ?? {}).map(([k, v]) => [k, String(v ?? "")])
    ),
    recipeName: a.recipe?.name ?? null,
    variables: ((a.recipe?.variables as RecipeVariable[] | null) ?? []).filter((v) => v && v.key),
    qaChecks: a.qaChecks.map((c) => ({
      id: c.id,
      name: c.name,
      passed: c.passed,
      detail: c.detail,
      runAt: c.runAt.toISOString(),
    })),
  }));

  const branding = (client.branding as BrandingData | null) ?? {};
  const reports: ReportData[] = client.reports.map((r) => ({
    id: r.id,
    period: r.period,
    sentAt: r.sentAt?.toISOString() ?? null,
    content: (r.content as ReportData["content"]) ?? {},
  }));

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/clientes" className="text-sm text-muted-foreground hover:text-foreground">
          ← Clientes
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">{client.name}</h1>
          <Badge variant={PACK_BADGE[client.pack] ?? "default"}>{PACK_LABELS[client.pack] ?? client.pack}</Badge>
          <Badge variant={CLIENT_STATUS_BADGE[client.status] ?? "default"}>
            {CLIENT_STATUS_LABELS[client.status] ?? client.status}
          </Badge>
          <span className="text-sm text-muted-foreground">
            MRR {fmtUsd(client.mrr)} · {client.slug}.cauce.app
          </span>
          <a
            href={`/admin/clientes/${client.id}/presentacion`}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto inline-flex items-center gap-2 rounded-md border bg-card px-3 py-2 text-sm font-medium text-card-foreground transition-colors hover:bg-muted"
          >
            📄 Presentación para el cliente
          </a>
        </div>
      </div>

      <ClientEditForm
        client={{
          id: client.id,
          name: client.name,
          rubro: client.rubro,
          contactName: client.contactName,
          email: client.email,
          phone: client.phone,
          domain: client.domain,
          whatsapp: client.whatsapp,
          notes: client.notes,
          pack: client.pack,
          status: client.status,
          mrr: client.mrr,
          costEstUsd: client.costEstUsd,
          health: client.health,
        }}
      />

      <AutomationsSection clientId={client.id} automations={automations} recipes={recipes} />

      <div className="grid gap-6 xl:grid-cols-2">
        <OsSection clientId={client.id} slug={client.slug} modules={client.modules} branding={branding} />
        <CredentialsSection
          clientId={client.id}
          credentials={client.credentials.map((c) => ({
            id: c.id,
            kind: c.kind,
            label: c.label,
            createdAt: c.createdAt.toISOString(),
          }))}
        />
      </div>

      {/* Uso y fair use (server-rendered) */}
      <Card className="p-5">
        <h2 className="mb-4 font-semibold">Uso</h2>
        <div className="mb-5">
          <div className="mb-1.5 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Fair use del período actual ({currentPeriod()})
            </span>
            <span className="font-medium">
              {fairUse.used.toLocaleString("es-AR")}
              {fairUse.limit ? ` / ${fairUse.limit.toLocaleString("es-AR")} mensajes` : " mensajes (sin tope)"}
            </span>
          </div>
          {fairUse.limit ? (
            <>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full ${
                    fairUse.exceeded ? "bg-destructive" : fairUse.warn ? "bg-warning" : "bg-primary"
                  }`}
                  style={{ width: `${Math.min(100, fairUse.pct ?? 0)}%` }}
                />
              </div>
              {fairUse.exceeded ? (
                <p className="mt-1.5 text-xs font-medium text-destructive">
                  Tope superado ({fairUse.pct}%). Conviene conversar upgrade de pack.
                </p>
              ) : fairUse.warn ? (
                <p className="mt-1.5 text-xs font-medium text-warning">
                  {fairUse.pct}% del tope usado — cerca del límite.
                </p>
              ) : null}
            </>
          ) : (
            <p className="text-xs text-muted-foreground">El pack de este cliente no tiene tope de mensajes.</p>
          )}
        </div>

        {client.usages.length === 0 ? (
          <EmptyState icon="📊" title="Sin uso registrado" detail="Cuando sus bots empiecen a responder, el consumo aparece acá." />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Período</Th>
                <Th>Mensajes</Th>
                <Th>Tokens in</Th>
                <Th>Tokens out</Th>
                <Th>Costo (USD)</Th>
              </tr>
            </thead>
            <tbody>
              {client.usages.map((u) => (
                <tr key={u.id}>
                  <Td className="font-medium">{u.period}</Td>
                  <Td>{u.messages.toLocaleString("es-AR")}</Td>
                  <Td className="text-muted-foreground">{u.tokensIn.toLocaleString("es-AR")}</Td>
                  <Td className="text-muted-foreground">{u.tokensOut.toLocaleString("es-AR")}</Td>
                  <Td>{u.costUsd.toLocaleString("es-AR", { maximumFractionDigits: 2 })}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <ReportsSection clientId={client.id} reports={reports} currentPeriod={currentPeriod()} />
        <PortalAccessSection
          clientId={client.id}
          users={client.users.map((u) => ({
            id: u.id,
            username: u.username,
            name: u.name,
            email: u.email,
            createdAt: u.createdAt.toISOString(),
          }))}
        />
      </div>
    </div>
  );
}
