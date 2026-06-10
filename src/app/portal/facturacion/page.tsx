import { db } from "@/lib/db";
import { getPricing, fmtUsd, fmtArs, usdToArs } from "@/lib/pricing";
import { Badge, Card, EmptyState, Table, Th, Td } from "@/components/ui";
import { getPortalClient, fmtDate } from "../_lib";

const SUB_STATUS: Record<string, { label: string; variant: "success" | "warning" | "destructive" }> = {
  ACTIVE: { label: "Activa", variant: "success" },
  PAUSED: { label: "Pausada", variant: "warning" },
  CANCELLED: { label: "Cancelada", variant: "destructive" },
};

const INV_STATUS: Record<string, { label: string; variant: "default" | "success" | "warning" | "destructive" }> = {
  pending: { label: "Pendiente", variant: "warning" },
  paid: { label: "Pagada", variant: "success" },
  overdue: { label: "Vencida", variant: "destructive" },
};

export default async function FacturacionPage() {
  const client = await getPortalClient();
  if (!client) return null;

  const [subscription, invoices, pricing] = await Promise.all([
    db.subscription.findFirst({
      where: { clientId: client.id },
      orderBy: { startedAt: "desc" },
    }),
    db.invoice.findMany({
      where: { clientId: client.id },
      orderBy: { createdAt: "desc" },
    }),
    getPricing(),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Facturación</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tu suscripción y tus facturas.
        </p>
      </div>

      {/* Suscripción actual */}
      {subscription ? (
        <Card className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Badge variant="primary">{subscription.pack}</Badge>
              {(() => {
                const s = SUB_STATUS[subscription.status] ?? SUB_STATUS.ACTIVE;
                return <Badge variant={s.variant}>{s.label}</Badge>;
              })()}
            </div>
            <p className="text-sm text-muted-foreground">
              Cliente desde el {fmtDate(subscription.startedAt)}
            </p>
          </div>
          <p className="mt-3 text-2xl font-semibold">
            {fmtUsd(subscription.monthlyUsd)}
            <span className="text-base font-normal text-muted-foreground">/mes</span>
          </p>
          <p className="text-sm text-muted-foreground">
            ≈ {fmtArs(usdToArs(subscription.monthlyUsd, pricing.dolarArs))} al
            cambio de hoy
          </p>
        </Card>
      ) : (
        <EmptyState
          icon="📄"
          title="Todavía no tenés una suscripción activa"
          detail="Si esto es un error, escribinos por WhatsApp y lo resolvemos."
        />
      )}

      {/* Facturas */}
      <section>
        <h2 className="mb-3 font-semibold">Facturas</h2>
        {invoices.length === 0 ? (
          <EmptyState
            icon="🧾"
            title="Sin facturas por ahora"
            detail="Cuando emitamos tu primera factura, la vas a ver acá."
          />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Concepto</Th>
                <Th>Tipo</Th>
                <Th>Monto</Th>
                <Th>Estado</Th>
                <Th>Vencimiento</Th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => {
                const s = INV_STATUS[inv.status] ?? { label: inv.status, variant: "default" as const };
                return (
                  <tr key={inv.id}>
                    <Td className="font-medium">{inv.concept}</Td>
                    <Td>
                      <Badge variant="outline">Factura {inv.type}</Badge>
                    </Td>
                    <Td>
                      {fmtUsd(inv.amountUsd)}
                      {inv.amountArs ? (
                        <span className="block text-xs text-muted-foreground">
                          {fmtArs(inv.amountArs)}
                        </span>
                      ) : null}
                    </Td>
                    <Td>
                      <Badge variant={s.variant}>{s.label}</Badge>
                    </Td>
                    <Td className="text-muted-foreground">
                      {inv.dueDate ? fmtDate(inv.dueDate) : "—"}
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </section>

      <p className="text-xs text-muted-foreground">
        💳 El pago automático con Mercado Pago llega pronto — por ahora
        coordinamos por WhatsApp.
      </p>
    </div>
  );
}
