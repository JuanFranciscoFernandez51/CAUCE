import Link from "next/link";
import { notFound } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getTenantBySlug } from "@/lib/tenant";
import { esConcesionaria } from "@/lib/conce-server";
import { Badge } from "@/components/ui";
import { ClientesTable, type ClienteRow } from "../_components/conce/clientes-table";

export const dynamic = "force-dynamic";

type SP = { q?: string };

/**
 * Clientes de la concesionaria: TODOS los que pasaron por un mandato, un
 * boleto o el CRM. Buscador + edición inline de teléfono/email, y ficha
 * individual con sus vehículos y sus documentos.
 */
export default async function ClientesPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SP>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const tenant = await getTenantBySlug(slug);
  if (!tenant || !esConcesionaria(tenant)) notFound();
  const base = `/os/${tenant.slug}`;

  const q = (sp.q ?? "").trim();
  const where: Prisma.ContactWhereInput = {
    clientId: tenant.id,
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { phone: { contains: q, mode: "insensitive" as const } },
            { email: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [contactos, total] = await Promise.all([
    db.contact.findMany({
      where,
      orderBy: [{ lastTouchAt: "desc" }, { createdAt: "desc" }],
      take: 300,
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        lastTouchAt: true,
        conceOperaciones: { select: { tipo: true, vehiculoId: true } },
      },
    }),
    db.contact.count({ where: { clientId: tenant.id } }),
  ]);

  const filas: ClienteRow[] = contactos.map((c) => ({
    id: c.id,
    nombre: c.name,
    telefono: c.phone,
    email: c.email,
    mandatos: c.conceOperaciones.filter((o) => o.tipo === "MANDATO").length,
    boletos: c.conceOperaciones.filter((o) => o.tipo === "BOLETO").length,
    vehiculos: new Set(c.conceOperaciones.map((o) => o.vehiculoId).filter(Boolean)).size,
    ultimoContacto: c.lastTouchAt
      ? c.lastTouchAt.toLocaleDateString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" })
      : null,
  }));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Clientes</h1>
          <p className="max-w-3xl text-sm text-muted-foreground">
            Todos los clientes del negocio. Editá teléfono y email acá mismo, o entrá a la ficha
            para ver sus vehículos, sus mandatos/boletos y sus documentos escaneados.
          </p>
        </div>
        <Link
          href={`${base}/crm`}
          className="inline-flex h-9 items-center rounded-md border px-3 text-sm font-medium hover:bg-muted"
        >
          📇 Ver en el CRM
        </Link>
      </div>

      <form method="get" className="flex flex-wrap items-center gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Buscar por nombre, teléfono o email…"
          className="h-9 w-full max-w-sm rounded-md border bg-card px-3 text-sm outline-none focus:border-primary"
        />
        <button type="submit" className="h-9 rounded-md border px-3 text-sm font-medium hover:bg-muted">
          Buscar
        </button>
        {q ? (
          <Link href={`${base}/clientes`} className="text-sm text-muted-foreground hover:underline">
            Limpiar
          </Link>
        ) : null}
        <span className="ml-auto">
          <Badge variant="default">
            {filas.length} en pantalla · {total} en total
          </Badge>
        </span>
      </form>

      <ClientesTable slug={tenant.slug} clientes={filas} />
    </div>
  );
}
