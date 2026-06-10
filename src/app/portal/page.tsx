import Link from "next/link";
import { db } from "@/lib/db";
import { getFairUse, currentPeriod } from "@/lib/usage";
import { Badge, ButtonLink, Card, EmptyState, Stat } from "@/components/ui";
import { getPortalClient, timeAgo, fmtDateTime, type BotSettings } from "./_lib";

const STATUS_BADGE: Record<
  string,
  { label: string; variant: "default" | "success" | "warning" | "destructive" }
> = {
  TEST: { label: "En prueba", variant: "warning" },
  ACTIVE: { label: "Activa", variant: "success" },
  PAUSED: { label: "Pausada", variant: "default" },
  ERROR: { label: "Error", variant: "destructive" },
};

const HEALTH_LABEL: Record<string, string> = {
  UNKNOWN: "Sin datos",
  OK: "Funcionando bien",
  WARN: "Con avisos",
  DOWN: "Caída",
};

function ChecklistItem({
  done,
  title,
  detail,
  href,
  cta,
}: {
  done: boolean;
  title: string;
  detail: string;
  href: string;
  cta: string;
}) {
  return (
    <li className="flex items-start gap-3 py-3">
      <span
        className={
          "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold " +
          (done ? "bg-success/15 text-success" : "bg-muted text-muted-foreground")
        }
      >
        {done ? "✓" : "○"}
      </span>
      <div className="min-w-0 flex-1">
        <p className={"text-sm font-medium " + (done ? "text-muted-foreground line-through" : "")}>
          {title}
        </p>
        <p className="text-xs text-muted-foreground">{detail}</p>
      </div>
      {!done ? (
        <Link href={href} className="shrink-0 text-sm font-medium text-primary hover:underline">
          {cta} →
        </Link>
      ) : null}
    </li>
  );
}

export default async function PortalHome() {
  const client = await getPortalClient();
  if (!client) return null; // el layout muestra el aviso

  const period = currentPeriod();
  const [automations, channelCount, fairUse] = await Promise.all([
    db.automation.findMany({
      where: { clientId: client.id },
      orderBy: { createdAt: "asc" },
    }),
    db.credential.count({
      where: { clientId: client.id, kind: { in: ["whatsapp", "instagram"] } },
    }),
    getFairUse(client.id),
  ]);

  // Stats del mes (límites del período en hora argentina)
  const [yearStr, monthStr] = period.split("-");
  const from = new Date(Date.UTC(Number(yearStr), Number(monthStr) - 1, 1, 3));
  const hasCrm = client.modules.includes("crm");
  const hasTurnos = client.modules.includes("turnos");
  const [newContacts, nextAppointment] = await Promise.all([
    hasCrm
      ? db.contact.count({ where: { clientId: client.id, createdAt: { gte: from } } })
      : Promise.resolve(null),
    hasTurnos
      ? db.appointment.findFirst({
          where: {
            clientId: client.id,
            startsAt: { gte: new Date() },
            status: { in: ["PENDING", "CONFIRMED"] },
          },
          orderBy: { startsAt: "asc" },
        })
      : Promise.resolve(null),
  ]);

  // Checklist de onboarding
  const settings = (client.settings ?? {}) as BotSettings;
  const checks = {
    canal: channelCount > 0,
    contenido: Array.isArray(settings.faqs) && settings.faqs.length > 0,
    bot: automations.some((a) => a.n8nWorkflowId || a.status === "ACTIVE"),
    activo: client.status === "ACTIVE",
  };
  const allDone = Object.values(checks).every(Boolean);

  const barPct = fairUse.limit ? Math.min(fairUse.pct ?? 0, 100) : 0;
  const barColor = fairUse.exceeded
    ? "bg-destructive"
    : fairUse.warn
      ? "bg-warning"
      : "bg-primary";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Hola, {client.contactName || client.name} 👋</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Así está funcionando tu bot hoy.
        </p>
      </div>

      {/* Checklist de onboarding — solo si falta algo */}
      {!allDone ? (
        <Card className="p-5">
          <h2 className="font-semibold">Poné en marcha tu bot</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Te faltan estos pasos para que tu bot quede atendiendo solo.
          </p>
          <ul className="mt-3 divide-y">
            <ChecklistItem
              done={checks.canal}
              title="Conectar tu canal"
              detail="WhatsApp Business o Instagram, donde va a responder el bot."
              href="/portal/canal"
              cta="Conectar"
            />
            <ChecklistItem
              done={checks.contenido}
              title="Cargar el contenido"
              detail="Preguntas frecuentes, horarios y datos de tu negocio."
              href="/portal/contenido"
              cta="Cargar"
            />
            <ChecklistItem
              done={checks.bot}
              title="Bot provisionado"
              detail="Cauce arma y prueba tu bot — listo en menos de 24h hábiles."
              href="/portal/canal"
              cta="Ver"
            />
            <ChecklistItem
              done={checks.activo}
              title="Cuenta activa"
              detail="Cuando todo está probado, tu bot pasa a producción."
              href="/portal/uso"
              cta="Ver"
            />
          </ul>
        </Card>
      ) : null}

      {/* Fair use */}
      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">Mensajes del mes</h2>
          {fairUse.limit ? (
            <span className="text-sm text-muted-foreground">
              {fairUse.used.toLocaleString("es-AR")} de{" "}
              {fairUse.limit.toLocaleString("es-AR")} mensajes
            </span>
          ) : (
            <Badge variant="success">Sin tope de mensajes</Badge>
          )}
        </div>
        {fairUse.limit ? (
          <>
            <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full transition-all ${barColor}`}
                style={{ width: `${barPct}%` }}
              />
            </div>
            {fairUse.exceeded ? (
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3">
                <p className="text-sm text-destructive">
                  Superaste el tope de mensajes de tu plan este mes.
                </p>
                <ButtonLink href="/portal/pedir-mas?upgrade=pro" size="sm">
                  Pasate a Pro
                </ButtonLink>
              </div>
            ) : fairUse.warn ? (
              <p className="mt-3 rounded-md border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
                Estás llegando al tope del plan ({fairUse.pct}% usado).
              </p>
            ) : null}
          </>
        ) : null}
      </Card>

      {/* Stats del mes */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Stat
          label="Mensajes atendidos"
          value={fairUse.used.toLocaleString("es-AR")}
          hint="Este mes"
        />
        {newContacts !== null ? (
          <Stat
            label="Contactos nuevos"
            value={newContacts.toLocaleString("es-AR")}
            hint="Este mes"
            tone={newContacts > 0 ? "success" : "default"}
          />
        ) : null}
        {hasTurnos ? (
          <Card className="p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Próximo turno
            </p>
            {nextAppointment ? (
              <>
                <p className="mt-1 text-2xl font-semibold">
                  {fmtDateTime(nextAppointment.startsAt)}
                </p>
                <p className="mt-1 truncate text-xs text-muted-foreground">
                  {nextAppointment.title}
                </p>
              </>
            ) : (
              <p className="mt-1 text-sm text-muted-foreground">Sin turnos próximos</p>
            )}
            <Link
              href={`/os/${client.slug}`}
              className="mt-2 inline-block text-xs font-medium text-primary hover:underline"
            >
              Ver agenda →
            </Link>
          </Card>
        ) : null}
      </div>

      {/* Automatizaciones */}
      <section>
        <h2 className="mb-3 font-semibold">Mis automatizaciones</h2>
        {automations.length === 0 ? (
          <EmptyState
            icon="🤖"
            title="Tu bot se está preparando"
            detail="Apenas conectes tu canal y cargues el contenido, Cauce lo arma y lo deja funcionando."
            action={
              <ButtonLink href="/portal/canal" size="sm">
                Conectar mi canal
              </ButtonLink>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {automations.map((a) => {
              const badge = STATUS_BADGE[a.status] ?? STATUS_BADGE.TEST;
              return (
                <Card key={a.id} className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-medium">{a.name}</p>
                    <Badge variant={badge.variant}>{badge.label}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Salud: {HEALTH_LABEL[a.health] ?? a.health}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {a.lastRunAt
                      ? `Última ejecución ${timeAgo(a.lastRunAt)}`
                      : "Todavía no se ejecutó"}
                  </p>
                  {a.status === "ERROR" && a.lastError ? (
                    <p className="mt-2 rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
                      {a.lastError}
                    </p>
                  ) : null}
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* Cauce OS */}
      {client.modules.length > 0 ? (
        <Card className="flex flex-wrap items-center justify-between gap-4 p-5">
          <div>
            <h2 className="font-semibold">Tu sistema Cauce OS</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Módulos activos:{" "}
              {client.modules.map((m) => m.toUpperCase()).join(" · ")}
            </p>
          </div>
          <ButtonLink href={`/os/${client.slug}`} variant="secondary">
            Abrir Cauce OS →
          </ButtonLink>
        </Card>
      ) : null}
    </div>
  );
}
