import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getTenantBySlug } from "@/lib/tenant";
import { esVidrios, ordenDatos, totalOrden, vehiculoLinea } from "@/lib/vidrios";
import { ButtonLink } from "@/components/ui";
import { OrdenesTable, type OrdenRow } from "./ordenes-table";

export const dynamic = "force-dynamic";
export const metadata = { title: "Órdenes" };

type SP = { estado?: string; q?: string };

/** Órdenes de pedido: el papel que hoy llenan a mano, con boleto imprimible. */
export default async function OrdenesPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SP>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const tenant = await getTenantBySlug(slug);
  if (!tenant || !esVidrios(tenant)) notFound();

  const filtro = sp.estado === "PENDIENTE" || sp.estado === "COLOCADO" ? sp.estado : "";
  const q = (sp.q ?? "").trim();

  const lista = await db.presupuestoDoc.findMany({
    where: {
      clientId: tenant.id,
      ...(filtro ? { estado: filtro } : {}),
      ...(q ? { OR: [{ nombre: { contains: q, mode: "insensitive" } }, { telefono: { contains: q } }] } : {}),
    },
    orderBy: { numero: "desc" },
    take: 200,
  });

  const filas: OrdenRow[] = lista.map((p) => {
    const d = ordenDatos(p);
    return {
      id: p.id,
      numero: p.numero,
      nombre: p.nombre,
      telefono: p.telefono,
      vehiculo: vehiculoLinea(d),
      total: totalOrden(p),
      senia: d.senia,
      estado: p.estado,
      facturacion: d.facturacion,
      fecha: p.createdAt.toLocaleDateString("es-AR"),
    };
  });

  const pendientes = filas.filter((f) => f.estado === "PENDIENTE").length;
  const base = `/os/${tenant.slug}/ordenes`;
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
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Órdenes de pedido</h1>
          <p className="text-sm text-muted-foreground">
            Cliente, vehículo, vidrios y seña — al guardar sale el boleto imprimible.
          </p>
        </div>
        <ButtonLink href={`${base}/nueva`}>+ Nueva orden</ButtonLink>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {chip(base, !filtro, "Todas")}
        {chip(`${base}?estado=PENDIENTE`, filtro === "PENDIENTE", !filtro ? `Pendientes · ${pendientes}` : "Pendientes")}
        {chip(`${base}?estado=COLOCADO`, filtro === "COLOCADO", "Colocadas")}
        <form method="get" className="ml-auto flex gap-2">
          {filtro ? <input type="hidden" name="estado" value={filtro} /> : null}
          <input
            name="q"
            defaultValue={q}
            placeholder="Buscar por cliente o teléfono…"
            className="h-9 w-56 rounded-md border bg-card px-3 text-sm outline-none focus:border-primary"
          />
          <button type="submit" className="h-9 rounded-md border px-3 text-sm font-medium hover:bg-muted">
            Buscar
          </button>
        </form>
      </div>

      {filas.length === 0 ? (
        <p className="rounded-xl border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
          Todavía no hay órdenes{filtro || q ? " con ese filtro" : ""}. Armá la primera con “+ Nueva orden”.
        </p>
      ) : (
        <OrdenesTable slug={tenant.slug} ordenes={filas} />
      )}
    </div>
  );
}
