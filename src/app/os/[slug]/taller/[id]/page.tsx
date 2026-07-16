import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getTenantBySlug, hasModule, MODULE_LABELS } from "@/lib/tenant";
import { Badge } from "@/components/ui";
import { ModuleDisabled } from "../../_components/module-disabled";
import { fmtDateShort } from "../../_lib/dates";
import { OT_ESTADOS } from "../estados";
import { OtDetail, type OtData } from "./ot-detail";
import { Adjuntos, type AdjuntoData } from "../../_components/adjuntos";

export default async function OtPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) notFound();
  if (!hasModule(tenant, "taller")) {
    return <ModuleDisabled moduleLabel={MODULE_LABELS.taller} />;
  }

  const ot = await db.ordenTrabajo.findFirst({
    where: { id, clientId: tenant.id },
    include: { contact: { select: { id: true, name: true, phone: true } } },
  });
  if (!ot) notFound();

  const adjuntos: AdjuntoData[] = (
    await db.attachment.findMany({
      where: { clientId: tenant.id, refType: "ot", refId: ot.id },
      orderBy: { createdAt: "asc" },
    })
  ).map((a) => ({ id: a.id, url: a.url, name: a.name, mime: a.mime }));

  const e = OT_ESTADOS[ot.estado];
  const data: OtData = {
    id: ot.id,
    numero: ot.numero,
    equipo: ot.equipo,
    motivoIngreso: ot.motivoIngreso,
    diagnostico: ot.diagnostico,
    trabajos: ot.trabajos,
    items: (ot.items as OtData["items"]) ?? [],
    totalArs: ot.totalArs,
    pagadoArs: ot.pagadoArs,
    estado: ot.estado,
    contacto: ot.contact ? { id: ot.contact.id, name: ot.contact.name, phone: ot.contact.phone } : null,
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <Link
          href={`/os/${tenant.slug}/taller`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Taller
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold">
            OT-{String(ot.numero).padStart(4, "0")} · {ot.equipo}
          </h1>
          <Badge variant={e.variant}>{e.label}</Badge>
          <span className="text-sm text-muted-foreground">Ingresó {fmtDateShort(ot.createdAt)}</span>
        </div>
        {ot.contact ? (
          <p className="mt-0.5 text-sm text-muted-foreground">
            Cliente:{" "}
            <Link
              href={`/os/${tenant.slug}/crm/${ot.contact.id}`}
              className="font-medium text-primary hover:underline"
            >
              {ot.contact.name}
            </Link>
            {ot.contact.phone ? ` · ${ot.contact.phone}` : ""}
          </p>
        ) : null}
      </div>

      <OtDetail slug={tenant.slug} ot={data} />

      <Adjuntos
        slug={tenant.slug}
        refType="ot"
        refId={ot.id}
        titulo="Fotos y archivos del trabajo"
        ayuda="Cómo entró el equipo, el diagnóstico, los repuestos: todo queda en la OT."
        adjuntos={adjuntos}
      />
    </div>
  );
}
