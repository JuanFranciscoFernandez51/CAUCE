import { db } from "@/lib/db";
import { ButtonLink, EmptyState } from "@/components/ui";
import { NewClientButton } from "./new-client-button";
import { ClientesList, type ClienteView } from "./clientes-list";

export const dynamic = "force-dynamic";

export default async function ClientesPage() {
  const clients = await db.client.findMany({ orderBy: { createdAt: "desc" } });

  const views: ClienteView[] = clients.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    rubro: c.rubro,
    pack: c.pack,
    status: c.status,
    mrr: c.mrr,
    health: c.health,
    costEstUsd: c.costEstUsd,
    modules: c.modules,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clientes</h1>
          <p className="text-sm text-muted-foreground">
            Cartera de Cauce: packs, MRR, salud y Cauce OS de cada cliente. Todo editable desde la
            lista.
          </p>
        </div>
        <ButtonLink href="/admin/clientes/nuevo">➕ Nuevo cliente</ButtonLink>
      </div>

      <NewClientButton />

      {views.length === 0 ? (
        <EmptyState
          title="Todavía no hay clientes"
          detail="Aprobá un blueprint desde un lead o creá un cliente a mano."
        />
      ) : (
        <ClientesList clients={views} />
      )}
    </div>
  );
}
