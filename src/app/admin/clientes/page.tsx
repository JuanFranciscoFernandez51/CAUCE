import Link from "next/link";
import { db } from "@/lib/db";
import { fmtUsd } from "@/lib/pricing";
import { Badge, EmptyState, Table, Td, Th } from "@/components/ui";
import {
  CLIENT_STATUS_BADGE,
  CLIENT_STATUS_LABELS,
  PACK_BADGE,
  PACK_LABELS,
} from "../_components/format";
import { NewClientButton } from "./new-client-button";

export const dynamic = "force-dynamic";

export default async function ClientesPage() {
  const clients = await db.client.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clientes</h1>
          <p className="text-sm text-muted-foreground">
            Cartera de Cauce: packs, MRR, salud y Cauce OS de cada cliente.
          </p>
        </div>
      </div>

      <NewClientButton />

      {clients.length === 0 ? (
        <EmptyState
          title="Todavía no hay clientes"
          detail="Aprobá un blueprint desde un lead o creá un cliente a mano."
        />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Nombre</Th>
              <Th>Pack</Th>
              <Th>Estado</Th>
              <Th>MRR</Th>
              <Th>Salud</Th>
              <Th>Costo est. vs MRR</Th>
              <Th>Módulos OS</Th>
              <Th></Th>
            </tr>
          </thead>
          <tbody>
            {clients.map((c) => (
              <tr key={c.id} className="hover:bg-muted/50">
                <Td>
                  <p className="font-medium">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.rubro ?? c.slug}</p>
                </Td>
                <Td>
                  <Badge variant={PACK_BADGE[c.pack] ?? "default"}>{PACK_LABELS[c.pack] ?? c.pack}</Badge>
                </Td>
                <Td>
                  <Badge variant={CLIENT_STATUS_BADGE[c.status] ?? "default"}>
                    {CLIENT_STATUS_LABELS[c.status] ?? c.status}
                  </Badge>
                </Td>
                <Td className="font-medium">{fmtUsd(c.mrr)}</Td>
                <Td>
                  <span
                    className={
                      c.health >= 80 ? "text-success" : c.health >= 50 ? "text-warning" : "text-destructive"
                    }
                  >
                    {c.health}%
                  </span>
                </Td>
                <Td className="text-muted-foreground">
                  {fmtUsd(c.costEstUsd)} / {fmtUsd(c.mrr)}
                </Td>
                <Td>
                  {c.modules.length === 0 ? (
                    <span className="text-xs text-muted-foreground">—</span>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {c.modules.map((m) => (
                        <Badge key={m} variant="outline">{m}</Badge>
                      ))}
                    </div>
                  )}
                </Td>
                <Td>
                  <Link href={`/admin/clientes/${c.id}`} className="text-sm font-medium text-primary hover:underline">
                    Ver →
                  </Link>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}
