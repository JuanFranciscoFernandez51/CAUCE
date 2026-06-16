import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getTenantBySlug, hasModule, tenantCustomFields, MODULE_LABELS } from "@/lib/tenant";
import { storageAvailable } from "@/lib/storage";
import { fichaConfig } from "../../_lib/ficha";
import { ModuleDisabled } from "../../_components/module-disabled";
import { ContactDetail, type DetailContact } from "../../_components/contact-detail";
import {
  ContactRecords,
  type FichaRecord,
  type EmployeeOption,
} from "../../_components/contact-records";

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

  // ── Ficha / Historia: entradas + profesionales + config por rubro ──
  const ficha = fichaConfig(tenant.rubro);
  const [records, employees] = await Promise.all([
    db.contactRecord.findMany({
      where: { clientId: tenant.id, contactId: contact.id },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      include: { attachments: { orderBy: { createdAt: "asc" } } },
    }),
    db.employee.findMany({
      where: { clientId: tenant.id, active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  // Resolvemos el nombre del profesional (authorId) en memoria sobre el set chico.
  const empById = new Map(employees.map((e) => [e.id, e.name]));
  const fichaRecords: FichaRecord[] = records.map((r) => ({
    id: r.id,
    type: r.type,
    date: r.date.toISOString(),
    title: r.title,
    summary: r.summary,
    fields: (r.fields as Record<string, unknown> | null) ?? {},
    authorName: r.authorId ? empById.get(r.authorId) ?? null : null,
    attachments: r.attachments.map((a) => ({
      id: a.id,
      url: a.url,
      name: a.name,
      mime: a.mime,
    })),
  }));
  const employeeOptions: EmployeeOption[] = employees.map((e) => ({
    id: e.id,
    name: e.name,
  }));

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

  return (
    <div className="space-y-4">
      <ContactDetail slug={tenant.slug} contact={data} customDefs={customDefs} />
      <ContactRecords
        slug={tenant.slug}
        contactId={contact.id}
        ficha={ficha}
        records={fichaRecords}
        employees={employeeOptions}
        storageOn={storageAvailable()}
      />
    </div>
  );
}
