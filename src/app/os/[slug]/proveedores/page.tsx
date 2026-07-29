import Link from "next/link";
import { notFound } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getTenantBySlug } from "@/lib/tenant";
import { esConcesionaria } from "@/lib/conce-server";
import { Badge } from "@/components/ui";
import { contactosDe, cuentasDe, preciosDe } from "@/lib/conce-fin";
import {
  ProveedoresTable,
  type ProveedorRow,
} from "../_components/conce/proveedores-table";
import { ProveedorNuevo } from "../_components/conce/proveedor-nuevo";

export const dynamic = "force-dynamic";

type SP = { q?: string; rubro?: string };

/** Módulo PROVEEDORES: la agenda de a quién le compra la concesionaria. */
export default async function ProveedoresPage({
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

  const base = `/os/${tenant.slug}/proveedores`;
  const q = (sp.q ?? "").trim();
  const rubro = (sp.rubro ?? "").trim();

  const where: Prisma.ProveedorWhereInput = {
    clientId: tenant.id,
    ...(rubro ? { rubro } : {}),
    ...(q
      ? {
          OR: [
            { nombre: { contains: q, mode: "insensitive" as const } },
            { rubro: { contains: q, mode: "insensitive" as const } },
            { cuit: { contains: q, mode: "insensitive" as const } },
            { telefono: { contains: q, mode: "insensitive" as const } },
            { ciudad: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [proveedores, rubros] = await Promise.all([
    db.proveedor.findMany({
      where,
      orderBy: [{ activo: "desc" }, { nombre: "asc" }],
      take: 300,
    }),
    db.proveedor.groupBy({
      by: ["rubro"],
      where: { clientId: tenant.id, rubro: { not: null } },
      _count: { _all: true },
      orderBy: { rubro: "asc" },
    }),
  ]);

  const filas: ProveedorRow[] = proveedores.map((p) => ({
    id: p.id,
    nombre: p.nombre,
    rubro: p.rubro,
    cuit: p.cuit,
    telefono: p.telefono,
    email: p.email,
    ciudad: p.ciudad,
    activo: p.activo,
    contactos: contactosDe(p.contactos).length,
    cuentas: cuentasDe(p.cuentasBancarias).length,
    precios: preciosDe(p.listaPrecios).length,
  }));

  const urlCon = (cambios: Partial<SP>) => {
    const final: SP = { q: q || undefined, rubro: rubro || undefined, ...cambios };
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(final)) if (v) p.set(k, v);
    const qs = p.toString();
    return `${base}${qs ? `?${qs}` : ""}`;
  };

  const chip = (href: string, activo: boolean, label: string) => (
    <Link
      key={label}
      href={href}
      className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
        activo ? "bg-primary text-primary-foreground" : "border hover:bg-muted"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Proveedores</h1>
          <p className="max-w-3xl text-sm text-muted-foreground">
            A quién le comprás, con quién hablás en cada uno, dónde le transferís y qué te cobra.
            El CBU, el alias y el CUIT se copian de un toque.
          </p>
        </div>
        <ProveedorNuevo slug={tenant.slug} />
      </div>

      {rubros.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          {chip(urlCon({ rubro: undefined }), !rubro, `Todos · ${proveedores.length}`)}
          {rubros.map((r) =>
            chip(urlCon({ rubro: r.rubro ?? undefined }), rubro === r.rubro, `${r.rubro} · ${r._count._all}`)
          )}
        </div>
      ) : null}

      <form method="get" className="flex flex-wrap items-center gap-2">
        {rubro ? <input type="hidden" name="rubro" value={rubro} /> : null}
        <input
          name="q"
          defaultValue={q}
          placeholder="Buscar por nombre, rubro, CUIT o teléfono…"
          className="h-9 w-full max-w-sm rounded-md border bg-card px-3 text-sm outline-none focus:border-primary"
        />
        <button type="submit" className="h-9 rounded-md border px-3 text-sm font-medium hover:bg-muted">
          Buscar
        </button>
        {q ? (
          <Link href={urlCon({ q: undefined })} className="text-sm text-muted-foreground hover:underline">
            Limpiar
          </Link>
        ) : null}
        <span className="ml-auto">
          <Badge variant="default">{filas.length} en pantalla</Badge>
        </span>
      </form>

      <ProveedoresTable slug={tenant.slug} proveedores={filas} />
    </div>
  );
}
