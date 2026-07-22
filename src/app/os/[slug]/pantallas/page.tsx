import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getTenantBySlug, hasModule, MODULE_LABELS } from "@/lib/tenant";
import { ModuleDisabled } from "../_components/module-disabled";
import { PantallasBoard, type PantallaView } from "../_components/pantallas-board";

export default async function PantallasPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) notFound();
  if (!hasModule(tenant, "pantallas")) {
    return <ModuleDisabled moduleLabel={MODULE_LABELS.pantallas} />;
  }

  const [pantallas, contactos] = await Promise.all([
    db.pantalla.findMany({
      where: { clientId: tenant.id },
      orderBy: { orden: "asc" },
      include: {
        contratos: {
          where: { estado: { not: "baja" } },
          orderBy: { createdAt: "asc" },
          include: { contact: { select: { id: true, name: true, phone: true } } },
        },
      },
    }),
    db.contact.findMany({
      where: { clientId: tenant.id },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
      take: 500,
    }),
  ]);

  const views: PantallaView[] = pantallas.map((p) => ({
    id: p.id,
    nombre: p.nombre,
    zona: p.zona,
    medidas: p.medidas,
    resolucion: p.resolucion,
    slotsTotal: p.slotsTotal,
    activa: p.activa,
    contratos: p.contratos.map((c) => ({
      id: c.id,
      contactId: c.contact?.id ?? null,
      nombre: c.contact?.name ?? "(sin nombre)",
      telefono: c.contact?.phone ?? null,
      slots: c.slots,
      montoMensual: c.montoMensual,
      estado: c.estado,
    })),
  }));

  return (
    <PantallasBoard
      slug={tenant.slug}
      pantallas={views}
      contactos={contactos}
    />
  );
}
