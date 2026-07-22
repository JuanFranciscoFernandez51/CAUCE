import { db } from "@/lib/db";
import { LeadsList, type LeadView } from "./leads-list";

export const dynamic = "force-dynamic";

export default async function LeadsPage() {
  const leads = await db.lead.findMany({ orderBy: { createdAt: "desc" } });

  const views: LeadView[] = leads.map((l) => ({
    id: l.id,
    name: l.name,
    business: l.business,
    rubro: l.rubro,
    phone: l.phone,
    whatsapp: l.whatsapp,
    email: l.email,
    source: l.source,
    status: l.status,
    temperatura: l.temperatura,
    score: l.score,
    esCliente: Boolean(l.clientId),
    createdAt: l.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Leads</h1>
        <p className="text-sm text-muted-foreground">
          Todos los interesados, con su estado, temperatura y de dónde vinieron.
        </p>
      </div>
      <LeadsList leads={views} />
    </div>
  );
}
