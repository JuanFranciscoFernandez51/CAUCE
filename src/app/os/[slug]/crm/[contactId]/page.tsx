import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getTenantBySlug, hasModule, tenantCustomFields, MODULE_LABELS } from "@/lib/tenant";
import { storageAvailable } from "@/lib/storage";
import { Badge, Card } from "@/components/ui";
import { fichaConfig } from "../../_lib/ficha";
import { fmtDateShort } from "../../_lib/dates";
import { fmtArs } from "../../_components/money";
import { saldoDeVenta, type PagoVenta } from "../../ventas/saldo";
import { OT_ESTADOS } from "../../taller/estados";
import { ModuleDisabled } from "../../_components/module-disabled";
import { ContactDetail, type DetailContact } from "../../_components/contact-detail";
import { Adjuntos, type AdjuntoData } from "../../_components/adjuntos";
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

  // ── Historial comercial + documentos del cliente ──
  const [ventas, ots, docs] = await Promise.all([
    hasModule(tenant, "ventas")
      ? db.venta.findMany({
          where: { clientId: tenant.id, contactId: contact.id },
          orderBy: { numero: "desc" },
          take: 20,
        })
      : Promise.resolve([]),
    hasModule(tenant, "taller")
      ? db.ordenTrabajo.findMany({
          where: { clientId: tenant.id, contactId: contact.id },
          orderBy: { numero: "desc" },
          take: 20,
        })
      : Promise.resolve([]),
    db.attachment.findMany({
      where: { clientId: tenant.id, refType: "contact", refId: contact.id },
      orderBy: { createdAt: "asc" },
    }),
  ]);
  const documentos: AdjuntoData[] = docs.map((a) => ({
    id: a.id,
    url: a.url,
    name: a.name,
    mime: a.mime,
  }));

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

  const base = `/os/${tenant.slug}`;

  return (
    <div className="space-y-4">
      <ContactDetail slug={tenant.slug} contact={data} customDefs={customDefs} />

      {/* Historial comercial: todo lo que este cliente hizo con el negocio */}
      {ventas.length > 0 || ots.length > 0 ? (
        <Card className="p-4 sm:p-5">
          <h2 className="mb-3 font-semibold">Historial con el negocio</h2>
          <ul className="divide-y">
            {ventas.map((v) => {
              const saldo = saldoDeVenta(v.precioArs, v.senaArs, v.permutaValorArs, v.pagos as PagoVenta[] | null);
              return (
                <li key={`v-${v.id}`} className="flex flex-wrap items-center justify-between gap-2 py-2">
                  <Link href={`${base}/ventas/${v.id}`} className="font-medium hover:text-primary hover:underline">
                    🤝 V-{String(v.numero).padStart(4, "0")} · {v.descripcion}
                  </Link>
                  <span className="flex items-center gap-2 text-sm">
                    {saldo > 0 ? (
                      <span className="font-medium text-warning">debe {fmtArs(saldo)}</span>
                    ) : (
                      <span className="text-success">saldada ✓</span>
                    )}
                    <span className="text-xs text-muted-foreground">{fmtDateShort(v.createdAt)}</span>
                  </span>
                </li>
              );
            })}
            {ots.map((ot) => {
              const e = OT_ESTADOS[ot.estado];
              return (
                <li key={`ot-${ot.id}`} className="flex flex-wrap items-center justify-between gap-2 py-2">
                  <Link href={`${base}/taller/${ot.id}`} className="font-medium hover:text-primary hover:underline">
                    🔧 OT-{String(ot.numero).padStart(4, "0")} · {ot.equipo}
                  </Link>
                  <span className="flex items-center gap-2 text-sm">
                    <Badge variant={e.variant}>{e.label}</Badge>
                    <span className="text-xs text-muted-foreground">{fmtDateShort(ot.createdAt)}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </Card>
      ) : null}

      <Adjuntos
        slug={tenant.slug}
        refType="contact"
        refId={contact.id}
        titulo="Documentos del cliente"
        ayuda="DNI, comprobantes, autorizaciones: los papeles de esta persona, siempre a mano."
        adjuntos={documentos}
      />

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
