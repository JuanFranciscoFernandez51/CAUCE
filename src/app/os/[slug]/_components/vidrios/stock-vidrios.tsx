import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { StockTable, type StockRow } from "./stock-table";
import { ImportadorStock } from "../../importar-stock/importador";

/** Pantalla de Stock del template vidrios: filtros + tabla editable. */
export async function StockVidrios({
  slug,
  tenantId,
  q,
  categoria,
}: {
  slug: string;
  tenantId: string;
  q: string;
  categoria: string;
}) {
  const where: Prisma.BazarProductoWhereInput = {
    clientId: tenantId,
    ...(categoria ? { categoria } : {}),
    ...(q
      ? {
          OR: [
            { nombre: { contains: q, mode: "insensitive" } },
            { sku: { contains: q, mode: "insensitive" } },
            { marca: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [productos, todas, total, sinPrecio, bajos] = await Promise.all([
    db.bazarProducto.findMany({ where, orderBy: [{ categoria: "asc" }, { nombre: "asc" }], take: 500 }),
    db.bazarProducto.findMany({ where: { clientId: tenantId }, distinct: ["categoria"], select: { categoria: true } }),
    db.bazarProducto.count({ where: { clientId: tenantId } }),
    db.bazarProducto.count({ where: { clientId: tenantId, precio: 0 } }),
    db.bazarProducto.count({ where: { clientId: tenantId, stock: { lte: 2 } } }),
  ]);

  const categorias = todas.map((c) => c.categoria).sort();
  const filas: StockRow[] = productos.map((p) => ({
    id: p.id,
    sku: p.sku,
    nombre: p.nombre,
    marca: p.marca,
    categoria: p.categoria,
    stock: p.stock,
    precio: p.precio,
    precioSeguro: p.precioSeguro,
    precioSinMO: p.precioSinMO,
    ubicacion: p.ubicacion,
  }));

  const chip = (href: string, activo: boolean, label: string) => (
    <Link
      key={label}
      href={href}
      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
        activo ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted"
      }`}
    >
      {label}
    </Link>
  );
  const base = `/os/${slug}/productos`;

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Stock</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {total} productos · {bajos} con 2 o menos unidades
            {sinPrecio ? ` · ${sinPrecio} sin precio cargado` : ""}
          </p>
        </div>
        <Link href={`${base}/nuevo`} className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition hover:opacity-90">
          + Nuevo producto
        </Link>
      </div>

      <details className="rounded-xl border bg-card">
        <summary className="cursor-pointer px-4 py-3 text-sm font-semibold">
          📥 Cargar archivo — pedido del proveedor o lista de precios
        </summary>
        <div className="border-t p-4">
          <ImportadorStock slug={slug} />
        </div>
      </details>

      <div className="flex flex-wrap items-center gap-2">
        {chip(base, !categoria, "Todas")}
        {categorias.map((c) => chip(`${base}?categoria=${encodeURIComponent(c)}`, categoria === c, c))}
        <form className="ml-auto flex gap-2">
          {categoria ? <input type="hidden" name="categoria" value={categoria} /> : null}
          <input
            name="q"
            defaultValue={q}
            placeholder="Buscar por código, descripción o marca…"
            className="h-9 w-64 rounded-lg border bg-card px-3 text-sm"
          />
          <button className="rounded-lg border px-3 text-xs font-semibold transition hover:bg-muted">Buscar</button>
        </form>
      </div>

      <StockTable slug={slug} filas={filas} categorias={categorias} />
    </div>
  );
}
