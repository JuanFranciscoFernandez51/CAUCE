import Link from "next/link";
import { db } from "@/lib/db";
import { Badge, EmptyState, Table, Td, Th } from "@/components/ui";

export const metadata = { title: "Consultorías" };
export const dynamic = "force-dynamic";

const STATUS_BADGE: Record<string, { label: string; variant: "warning" | "primary" | "success" | "default" }> = {
  SCHEDULED: { label: "Agendada", variant: "warning" },
  DONE: { label: "Hecha", variant: "primary" },
  ROADMAP_SENT: { label: "Roadmap enviado", variant: "success" },
  CANCELLED: { label: "Cancelada", variant: "default" },
};

function fmtFecha(d: Date | null): string {
  if (!d) return "Sin agendar";
  return d.toLocaleString("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function ConsultoriasPage() {
  const notes = await db.consultNote.findMany({
    include: { lead: true, roadmap: { select: { id: true } } },
    orderBy: [{ createdAt: "desc" }],
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Consultorías</h1>
        <p className="text-sm text-muted-foreground">
          Videollamadas agendadas desde la web. Notas de llamada → roadmap con IA.
        </p>
      </div>

      {notes.length === 0 ? (
        <EmptyState
          icon="🗓️"
          title="Todavía no hay consultorías"
          detail="Cuando alguien pida una videollamada desde /consultoria, aparece acá."
        />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Negocio</Th>
              <Th>Contacto</Th>
              <Th>Fecha</Th>
              <Th>Estado</Th>
              <Th>Roadmap</Th>
              <Th />
            </tr>
          </thead>
          <tbody>
            {notes.map((n) => {
              const b = STATUS_BADGE[n.status] ?? STATUS_BADGE.SCHEDULED;
              return (
                <tr key={n.id} className="hover:bg-muted/50">
                  <Td className="font-medium">{n.lead.business || n.lead.name}</Td>
                  <Td>
                    {n.lead.name}
                    {n.lead.whatsapp ? (
                      <span className="block text-xs text-muted-foreground">{n.lead.whatsapp}</span>
                    ) : null}
                  </Td>
                  <Td>{fmtFecha(n.scheduledAt)}</Td>
                  <Td>
                    <Badge variant={b.variant}>{b.label}</Badge>
                  </Td>
                  <Td>{n.roadmap ? "✓" : "—"}</Td>
                  <Td>
                    <Link href={`/admin/consultorias/${n.id}`} className="text-sm font-medium text-primary hover:underline">
                      Abrir
                    </Link>
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      )}
    </div>
  );
}
