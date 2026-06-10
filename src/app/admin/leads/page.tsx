import Link from "next/link";
import { db } from "@/lib/db";
import { Badge, EmptyState, Table, Td, Th } from "@/components/ui";
import {
  fmtDate,
  LEAD_SOURCE_BADGE,
  LEAD_SOURCE_LABELS,
  LEAD_STATUS_BADGE,
  LEAD_STATUS_LABELS,
} from "../_components/format";

export const dynamic = "force-dynamic";

export default async function LeadsPage() {
  const leads = await db.lead.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Leads</h1>
        <p className="text-sm text-muted-foreground">
          Todos los interesados: intake web, consultorías, bot y carga manual.
        </p>
      </div>

      {leads.length === 0 ? (
        <EmptyState
          title="Todavía no hay leads"
          detail="Cuando alguien complete el intake o agende una consultoría, aparece acá."
        />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Nombre</Th>
              <Th>Negocio</Th>
              <Th>Fuente</Th>
              <Th>Score</Th>
              <Th>Estado</Th>
              <Th>Fecha</Th>
              <Th></Th>
            </tr>
          </thead>
          <tbody>
            {leads.map((l) => (
              <tr key={l.id} className="hover:bg-muted/50">
                <Td className="font-medium">{l.name}</Td>
                <Td>{l.business ?? "—"}</Td>
                <Td>
                  <Badge variant={LEAD_SOURCE_BADGE[l.source] ?? "default"}>
                    {LEAD_SOURCE_LABELS[l.source] ?? l.source}
                  </Badge>
                </Td>
                <Td>
                  <span className={l.score >= 70 ? "font-semibold text-success" : l.score >= 40 ? "text-warning" : "text-muted-foreground"}>
                    {l.score}
                  </span>
                </Td>
                <Td>
                  <Badge variant={LEAD_STATUS_BADGE[l.status] ?? "default"}>
                    {LEAD_STATUS_LABELS[l.status] ?? l.status}
                  </Badge>
                </Td>
                <Td className="text-muted-foreground">{fmtDate(l.createdAt)}</Td>
                <Td>
                  <Link href={`/admin/leads/${l.id}`} className="text-sm font-medium text-primary hover:underline">
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
