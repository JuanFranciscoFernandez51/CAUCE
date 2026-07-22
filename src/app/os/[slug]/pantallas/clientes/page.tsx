import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getTenantBySlug, hasModule, MODULE_LABELS } from "@/lib/tenant";
import { ModuleDisabled } from "../../_components/module-disabled";
import { ClientesPantallas, type ClientePantallasView } from "./clientes-pantallas";

/** Listado de anunciantes: toda su info cruzando CRM + contratos de pantallas. */
export default async function ClientesPantallasPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) notFound();
  if (!hasModule(tenant, "pantallas")) {
    return <ModuleDisabled moduleLabel={MODULE_LABELS.pantallas} />;
  }

  const contratos = await db.pantallaContrato.findMany({
    where: { clientId: tenant.id, estado: { not: "baja" } },
    include: {
      contact: {
        select: { id: true, name: true, phone: true, email: true, notes: true, lastTouchAt: true },
      },
      pantalla: { select: { nombre: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  // Agrupar por contacto (los contratos sin contacto van juntos al final).
  const porCliente = new Map<string, ClientePantallasView>();
  for (const c of contratos) {
    const key = c.contact?.id ?? "(sin-contacto)";
    const acc = porCliente.get(key) ?? {
      contactId: c.contact?.id ?? null,
      nombre: c.contact?.name ?? "(sin contacto)",
      telefono: c.contact?.phone ?? null,
      email: c.contact?.email ?? null,
      notas: c.contact?.notes ?? null,
      pantallas: [],
      totalSlots: 0,
      totalMensual: 0,
      pausados: 0,
    };
    acc.pantallas.push({
      nombre: c.pantalla.nombre,
      slots: c.slots,
      monto: c.montoMensual,
      estado: c.estado,
    });
    if (c.estado === "activo") {
      acc.totalSlots += c.slots;
      acc.totalMensual += c.montoMensual;
    } else {
      acc.pausados++;
    }
    porCliente.set(key, acc);
  }

  const clientes = [...porCliente.values()].sort((a, b) => b.totalMensual - a.totalMensual);

  return <ClientesPantallas slug={tenant.slug} clientes={clientes} />;
}
