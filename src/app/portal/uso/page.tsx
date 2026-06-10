import { db } from "@/lib/db";
import { getFairUse, currentPeriod } from "@/lib/usage";
import { getPricing, type PackKey } from "@/lib/pricing";
import { Badge, Card, EmptyState, Table, Th, Td } from "@/components/ui";
import { getPortalClient, fmtPeriod } from "../_lib";

function estadoBadge(messages: number, limit: number | null) {
  if (!limit) return <Badge variant="success">Sin tope</Badge>;
  const pct = Math.round((messages / limit) * 100);
  if (pct >= 100) return <Badge variant="destructive">Tope superado</Badge>;
  if (pct >= 80) return <Badge variant="warning">Cerca del tope ({pct}%)</Badge>;
  return <Badge variant="success">Dentro del tope ({pct}%)</Badge>;
}

export default async function UsoPage() {
  const client = await getPortalClient();
  if (!client) return null;

  const [usages, fairUse, pricing] = await Promise.all([
    db.usage.findMany({
      where: { clientId: client.id },
      orderBy: { period: "desc" },
    }),
    getFairUse(client.id),
    getPricing(),
  ]);

  const packKey = client.pack.toLowerCase() as PackKey;
  const pack = pricing.packs[packKey];
  const period = currentPeriod();
  const barPct = fairUse.limit ? Math.min(fairUse.pct ?? 0, 100) : 0;
  const barColor = fairUse.exceeded
    ? "bg-destructive"
    : fairUse.warn
      ? "bg-warning"
      : "bg-primary";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Uso</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Cuántos mensajes atendió tu bot cada mes.
        </p>
      </div>

      {/* Período actual */}
      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">Este mes ({fmtPeriod(period)})</h2>
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
          <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full rounded-full ${barColor}`}
              style={{ width: `${barPct}%` }}
            />
          </div>
        ) : null}
        {fairUse.exceeded ? (
          <p className="mt-3 text-sm text-destructive">
            Superaste el tope del plan este mes. Tu bot sigue funcionando, pero
            te conviene pasarte a un plan más grande.
          </p>
        ) : fairUse.warn ? (
          <p className="mt-3 text-sm text-warning">
            Estás llegando al tope del plan.
          </p>
        ) : null}
      </Card>

      {/* Historial */}
      {usages.length === 0 ? (
        <EmptyState
          icon="📊"
          title="Todavía no hay uso registrado"
          detail="Cuando tu bot empiece a atender mensajes, acá vas a ver el detalle mes a mes."
        />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Período</Th>
              <Th>Mensajes</Th>
              <Th>Estado</Th>
            </tr>
          </thead>
          <tbody>
            {usages.map((u) => (
              <tr key={u.id}>
                <Td className="font-medium capitalize">{fmtPeriod(u.period)}</Td>
                <Td>{u.messages.toLocaleString("es-AR")}</Td>
                <Td>{estadoBadge(u.messages, fairUse.limit)}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      {/* Nota fair use del pack */}
      <p className="text-xs text-muted-foreground">
        {pack
          ? pack.fairUseMsgs
            ? `Tu pack ${pack.label} incluye un fair use de ${pack.fairUseMsgs.toLocaleString("es-AR")} mensajes por mes. Si lo superás seguido, te proponemos un plan a tu medida — el bot nunca se corta de golpe.`
            : `Tu pack ${pack.label} no tiene tope de mensajes.`
          : "Tu cuenta todavía no tiene un pack asignado."}
      </p>
    </div>
  );
}
