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
import { checklistEntrega } from "@/lib/entregable";
import { ClientEditForm } from "./client-edit-form";
import { FichaTabs } from "./ficha-tabs";
import { ProcesosSection, type ProcesoData } from "./procesos-section";
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
      procesos: { orderBy: [{ orden: "asc" }, { createdAt: "asc" }] },
      credentials: { orderBy: { createdAt: "desc" } },
      usages: { orderBy: { period: "desc" } },
      reports: { orderBy: { period: "desc" } },
      users: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!client) notFound();

  const [fairUse, checklist] = await Promise.all([getFairUse(client.id), checklistEntrega(client)]);
  const rojos = checklist.filter((c) => !c.ok);

  const procesos: ProcesoData[] = client.procesos.map((p) => ({
    id: p.id,
    nombre: p.nombre,
    queHace: p.queHace,
    cuando: p.cuando,
    estado: p.estado,
    ultimaCorrida: p.ultimaCorrida?.toISOString() ?? null,
  }));

  const branding = (client.branding as BrandingData | null) ?? {};
  const reports: ReportData[] = client.reports.map((r) => ({
    id: r.id,
    period: r.period,
    sentAt: r.sentAt?.toISOString() ?? null,
    content: (r.content as ReportData["content"]) ?? {},
  }));

  const tieneSitio = client.modules.includes("sitio");
  const procesosActivos = procesos.filter((p) => p.estado === "ACTIVO").length;

  // ── Pestaña 1: CÓMO ESTÁ ARMADO (lo primero que se ve) ──
  const armado = (
    <div className="space-y-6">
      {/* EL SEMÁFORO: el mínimo entregable, codificado. Sin verdes no se entrega. */}
      <Card className={`p-5 ${rojos.length === 0 ? "border-success/50" : "border-warning/50"}`}>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">Checklist de entrega</h2>
          <Badge variant={rojos.length === 0 ? "success" : "warning"}>
            {rojos.length === 0
              ? "✅ Entregable"
              : `${checklist.length - rojos.length}/${checklist.length} — faltan ${rojos.length}`}
          </Badge>
        </div>
        <ul className="grid gap-1.5 sm:grid-cols-2">
          {checklist.map((c) => (
            <li key={c.key} className="flex items-start gap-2 text-sm">
              <span aria-hidden className="mt-0.5 shrink-0">{c.ok ? "✅" : "🔴"}</span>
              <span>
                <span className={c.ok ? "" : "font-medium"}>{c.label}</span>
                <span className="block text-xs text-muted-foreground">{c.detalle}</span>
              </span>
            </li>
          ))}
        </ul>
        {rojos.length > 0 ? (
          <p className="mt-3 rounded-md bg-warning/10 px-3 py-2 text-xs font-medium text-warning">
            Regla de la casa: no se entrega ni se cobra con rojos en esta lista.
          </p>
        ) : null}
      </Card>

      {/* Las tres patas de la entrega, con sus links directos */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">🌐 Su web</p>
          {tieneSitio || client.domain ? (
            <a
              href={client.domain ? `https://${client.domain}` : `/sitio/${client.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 block truncate font-medium text-primary hover:underline"
            >
              {client.domain ?? `/sitio/${client.slug}`} →
            </a>
          ) : (
            <p className="mt-1 text-sm text-muted-foreground">Sin web propia (módulo apagado).</p>
          )}
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">🖥️ Su sistema</p>
          <a
            href={`/os/${client.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 block truncate font-medium text-primary hover:underline"
          >
            /os/{client.slug} →
          </a>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {client.modules.length > 0 ? client.modules.join(" · ") : "sin módulos activos"}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">⚡ Sus procesos</p>
          <p className="mt-1 font-medium">
            {procesos.length === 0 ? "Sin procesos" : `${procesosActivos} de ${procesos.length} funcionando`}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">La lista completa, acá abajo.</p>
        </Card>
      </div>

      <ProcesosSection clientId={client.id} procesos={procesos} />

      <OsSection clientId={client.id} slug={client.slug} modules={client.modules} branding={branding} />
    </div>
  );

  // ── Pestaña 2: DATOS (contacto, credenciales, accesos) ──
  const datos = (
    <div className="space-y-6">
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
      <div className="grid gap-6 xl:grid-cols-2">
        <CredentialsSection
          clientId={client.id}
          credentials={client.credentials.map((c) => ({
            id: c.id,
            kind: c.kind,
            label: c.label,
            createdAt: c.createdAt.toISOString(),
          }))}
        />
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

  // ── Pestaña 3: USO Y REPORTES ────────────────────────────
  const uso = (
    <div className="space-y-6">
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

      <ReportsSection clientId={client.id} reports={reports} currentPeriod={currentPeriod()} />
    </div>
  );

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
            MRR {fmtUsd(client.mrr)} · {client.slug}
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

      <FichaTabs armado={armado} datos={datos} uso={uso} />
    </div>
  );
}
