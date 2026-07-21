import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getTenantBySlug, hasModule, MODULE_LABELS } from "@/lib/tenant";
import { ButtonLink, Input } from "@/components/ui";
import { ModuleDisabled } from "../_components/module-disabled";
import { CrmBoard, type BoardContact } from "../_components/crm-board";

export default async function CrmPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { slug } = await params;
  const { q } = await searchParams;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) notFound();
  if (!hasModule(tenant, "crm")) {
    return <ModuleDisabled moduleLabel={MODULE_LABELS.crm} />;
  }

  const query = (q ?? "").trim();
  const contacts = await db.contact.findMany({
    where: {
      clientId: tenant.id,
      ...(query
        ? {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { phone: { contains: query } },
            ],
          }
        : {}),
    },
    orderBy: [{ lastTouchAt: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }],
    select: {
      id: true,
      name: true,
      phone: true,
      stage: true,
      temperatura: true,
      source: true,
      lastTouchAt: true,
    },
  });

  const base = `/os/${tenant.slug}`;
  const boardContacts: BoardContact[] = contacts.map((c) => ({
    id: c.id,
    name: c.name,
    phone: c.phone,
    stage: c.stage,
    temperatura: c.temperatura,
    source: c.source,
    lastTouchAt: c.lastTouchAt ? c.lastTouchAt.toISOString() : null,
  }));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">CRM</h1>
          <p className="text-sm text-muted-foreground">
            {contacts.length} contacto{contacts.length === 1 ? "" : "s"}
            {query ? ` para “${query}”` : " en tu pipeline"}
          </p>
        </div>
        <div className="flex gap-2">
          <ButtonLink href={`${base}/crm/importar`} variant="secondary" size="sm">
            ⬆ Importar
          </ButtonLink>
          <ButtonLink href={`${base}/crm/nuevo`} size="sm">
            + Contacto
          </ButtonLink>
        </div>
      </div>

      <form method="GET" className="flex max-w-md gap-2">
        <Input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Buscar por nombre o teléfono…"
          aria-label="Buscar contactos"
        />
        <button
          type="submit"
          className="h-10 shrink-0 rounded-md border bg-card px-4 text-sm font-medium hover:bg-muted"
        >
          Buscar
        </button>
      </form>

      <CrmBoard slug={tenant.slug} contacts={boardContacts} />
    </div>
  );
}
