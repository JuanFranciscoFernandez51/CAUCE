import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getTenantBySlug, hasModule, tenantCustomFields, MODULE_LABELS } from "@/lib/tenant";
import { ModuleDisabled } from "../../_components/module-disabled";
import { ContactDetail, type DetailContact } from "../../_components/contact-detail";

export default async function ContactoDetallePage({
  params,
}: {
  params: Promise<{ slug: string; contactId: string }>;
}) {
  const { slug, contactId } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) notFound();
  if (!hasModule(tenant, "crm")) {
    return <ModuleDisabled moduleLabel={MODULE_LABELS.crm} />;
  }

  // SIEMPRE scopeado: id + clientId. Un tenant jamás ve contactos de otro.
  const contact = await db.contact.findFirst({
    where: { id: contactId, clientId: tenant.id },
    include: {
      tasks: { orderBy: [{ done: "asc" }, { createdAt: "desc" }] },
      appointments: { orderBy: { startsAt: "desc" } },
    },
  });
  if (!contact) notFound();

  const customDefs = tenantCustomFields(tenant).contact ?? [];

  const data: DetailContact = {
    id: contact.id,
    name: contact.name,
    phone: contact.phone,
    email: contact.email,
    stage: contact.stage,
    source: contact.source,
    notes: contact.notes,
    custom: (contact.custom as Record<string, unknown> | null) ?? {},
    lastTouchAt: contact.lastTouchAt?.toISOString() ?? null,
    createdAt: contact.createdAt.toISOString(),
    tasks: contact.tasks.map((t) => ({
      id: t.id,
      title: t.title,
      dueAt: t.dueAt?.toISOString() ?? null,
      done: t.done,
    })),
    appointments: contact.appointments.map((a) => ({
      id: a.id,
      title: a.title,
      startsAt: a.startsAt.toISOString(),
      status: a.status,
    })),
  };

  return <ContactDetail slug={tenant.slug} contact={data} customDefs={customDefs} />;
}
