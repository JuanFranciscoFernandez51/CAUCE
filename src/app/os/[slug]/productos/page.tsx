import Link from "next/link";
import { notFound } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getTenantBySlug } from "@/lib/tenant";
import { esBazar } from "@/lib/bazar-server";
import { ButtonLink } from "@/components/ui";
import { ProductosTable } from "../_components/bazar/productos-table";
import { ImportarCsv } from "../_components/bazar/importar-csv";

export const dynamic = "force-dynamic";

const POR_PAGINA = 30;

type SP = { q?: string; categoria?: string; pagina?: string };

export default async function ProductosPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SP>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const tenant = await getTenantBySlug(slug);
  if (!tenant || !esBazar(tenant)) notFound();

  const q = (sp.q ?? "").trim();
  const categoria = (sp.categoria ?? "").trim();
  const pagina = Math.max(1, Number.parseInt(sp.pagina ?? "1", 10) || 1);

  const where: Prisma.BazarProductoWhereInput = {
    clientId: tenant.id,
    ...(categoria ? { categoria } : {}),
    ...(q
      ? {
          OR: [
            { nombre: { contains: q, mode: "insensitive" } },
            { sku: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [total, productos, categoriasRaw] = await Promise.all([
    db.bazarProducto.count({ where }),
    db.bazarProducto.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (pagina - 1) * POR_PAGINA,
      take: POR_PAGINA,
      select: {
        id: true,
        nombre: true,
        categoria: true,
        precio: true,
        precioOferta: true,
        stock: true,
        fotos: true,
        destacado: true,
        activo: true,
        sku: true,
        vendidos: true,
      },
    }),
    db.bazarProducto.groupBy({
      by: ["categoria"],
      where: { clientId: tenant.id },
      _count: { _all: true },
      orderBy: { _count: { categoria: "desc" } },
    }),
  ]);
  const paginas = Math.max(1, Math.ceil(total / POR_PAGINA));
  const categorias = categoriasRaw.map((c) => c.categoria);
  const base = `/os/${tenant.slug}`;

  const url = (cambios: Partial<SP>) => {
    const p = new URLSearchParams();
    const estado: SP = {
      q: q || undefined,
      categoria: categoria || undefined,
      ...cambios,
    };
    for (const [k, v] of Object.entries(estado)) if (v) p.set(k, v);
    const qs = p.toString();
    return `${base}/productos${qs ? `?${qs}` : ""}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Catálogo</h1>
          <p className="text-sm text-muted-foreground">
            {total.toLocaleString("es-AR")} producto{total === 1 ? "" : "s"} — editá precio,
            stock, estado y categoría directo desde la lista.
          </p>
        </div>
        <div className="flex gap-2">
          <ImportarCsv slug={tenant.slug} />
          <ButtonLink href={`${base}/productos/nuevo`}>+ Nuevo producto</ButtonLink>
        </div>
      </div>

      {/* Tabs por categoría + buscador (server-side, listos para 6k) */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex max-w-full gap-1 overflow-x-auto">
          <Link
            href={url({ categoria: undefined, pagina: undefined })}
            className={`whitespace-nowrap rounded-full border px-3 py-1 text-sm ${!categoria ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted"}`}
          >
            Todas
          </Link>
          {categorias.map((c) => (
            <Link
              key={c}
              href={url({ categoria: c, pagina: undefined })}
              className={`whitespace-nowrap rounded-full border px-3 py-1 text-sm ${categoria === c ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted"}`}
            >
              {c}
            </Link>
          ))}
        </div>
        <form method="get" className="ml-auto flex gap-2">
          {categoria ? <input type="hidden" name="categoria" value={categoria} /> : null}
          <input
            name="q"
            defaultValue={q}
            placeholder="Buscar por nombre o SKU…"
            className="h-9 w-56 rounded-md border border-input bg-card px-3 text-sm outline-none focus-visible:outline-2 focus-visible:outline-ring"
          />
          <button
            type="submit"
            className="h-9 rounded-md border px-3 text-sm font-medium hover:bg-muted"
          >
            Buscar
          </button>
        </form>
      </div>

      <ProductosTable slug={tenant.slug} productos={productos} categorias={categorias} />

      {paginas > 1 ? (
        <nav className="flex items-center justify-center gap-2 text-sm" aria-label="Paginación">
          {pagina > 1 ? (
            <Link
              href={url({ pagina: String(pagina - 1) })}
              className="rounded-md border px-3 py-1.5 hover:bg-muted"
            >
              ← Anterior
            </Link>
          ) : null}
          <span className="px-2 text-muted-foreground">
            Página {pagina} de {paginas}
          </span>
          {pagina < paginas ? (
            <Link
              href={url({ pagina: String(pagina + 1) })}
              className="rounded-md border px-3 py-1.5 hover:bg-muted"
            >
              Siguiente →
            </Link>
          ) : null}
        </nav>
      ) : null}
    </div>
  );
}
