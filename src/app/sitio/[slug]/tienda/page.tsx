import Link from "next/link";
import { intentosDeBusqueda } from "@/lib/buscar-repuestos";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { aCard, BAZAR_CARD_SELECT, getBazarSite } from "../_lib/bazar-site";
import { BazarShell, BZ } from "../_components/bazar/bazar-shell";
import { ProductoCard } from "../_components/bazar/producto-card";

export const dynamic = "force-dynamic";

const POR_PAGINA = 24; // paginación server-side: listo para 6.000+ productos

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const site = await getBazarSite(slug);
  if (!site) return { title: "Tienda" };
  return {
    title: `Tienda — ${site.info.nombre}`,
    description: `Todo el catálogo de ${site.info.nombre}: deco, vajilla, textiles y más con envíos a todo el país.`,
    robots: { index: false, follow: false },
  };
}

type SP = {
  q?: string;
  categoria?: string;
  moto?: string; // "Honda CG Titan 150" — filtra por compatibilidad
  min?: string;
  max?: string;
  stock?: string;
  orden?: string;
  pagina?: string;
};

const ORDENES: Record<string, Prisma.BazarProductoOrderByWithRelationInput[]> = {
  novedades: [{ createdAt: "desc" }],
  menor: [{ precio: "asc" }],
  mayor: [{ precio: "desc" }],
  vendidos: [{ vendidos: "desc" }],
};

const ORDEN_LABEL: Record<string, string> = {
  novedades: "Novedades",
  menor: "Menor precio",
  mayor: "Mayor precio",
  vendidos: "Más vendidos",
};

export default async function TiendaPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SP>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const site = await getBazarSite(slug);
  if (!site) notFound();
  const { tenant, info } = site;
  const base = `/sitio/${tenant.slug}`;

  const q = (sp.q ?? "").trim();
  const categoria = (sp.categoria ?? "").trim();
  const moto = (sp.moto ?? "").trim();
  const min = Number.parseInt(sp.min ?? "", 10);
  const max = Number.parseInt(sp.max ?? "", 10);
  const soloStock = sp.stock === "1";
  const orden = ORDENES[sp.orden ?? ""] ? (sp.orden as string) : "novedades";
  const pagina = Math.max(1, Number.parseInt(sp.pagina ?? "1", 10) || 1);

  const where: Prisma.BazarProductoWhereInput = {
    clientId: tenant.id,
    activo: true,
    ...(categoria ? { categoria } : {}),
    // el cliente busca por su moto, no por código
    ...(moto ? { compatibilidades: { has: moto } } : {}),
    ...(soloStock ? { stock: { gt: 0 } } : {}),
    ...(Number.isFinite(min) || Number.isFinite(max)
      ? {
          precio: {
            ...(Number.isFinite(min) ? { gte: min } : {}),
            ...(Number.isFinite(max) ? { lte: max } : {}),
          },
        }
      : {}),
  };

  // La gente escribe "pastillas de freno de 110": se prueba desde lo más
  // preciso a lo más amplio y se usa el primer intento que traiga algo, para
  // que nunca quede la pantalla vacía.
  const intentos = q ? intentosDeBusqueda(q) : [];
  let filtroTexto: Prisma.BazarProductoWhereInput | null = null;
  let busquedaAmplia = false;
  if (intentos.length) {
    for (const [i, intento] of intentos.entries()) {
      const hay = await db.bazarProducto.count({ where: { ...where, ...intento } });
      if (hay > 0) {
        filtroTexto = intento;
        busquedaAmplia = i > 0;
        break;
      }
    }
  }
  if (filtroTexto) Object.assign(where, filtroTexto);

  // Con una moto elegida, los rubros que se ofrecen son los de esa moto.
  const dondeRubros = { clientId: tenant.id, activo: true, ...(moto ? { compatibilidades: { has: moto } } : {}) };

  const [total, productos, rubrosRaw] = await Promise.all([
    db.bazarProducto.count({ where }),
    db.bazarProducto.findMany({
      where,
      orderBy: ORDENES[orden],
      skip: (pagina - 1) * POR_PAGINA,
      take: POR_PAGINA,
      select: BAZAR_CARD_SELECT,
    }),
    db.bazarProducto.groupBy({
      by: ["categoria"],
      where: dondeRubros,
      _count: { _all: true },
      orderBy: { _count: { categoria: "desc" } },
    }),
  ]);
  const rubros = rubrosRaw.map((r) => r.categoria);
  const paginas = Math.max(1, Math.ceil(total / POR_PAGINA));

  /** Arma la URL de la tienda conservando los filtros, pisando lo indicado. */
  const url = (cambios: Partial<SP>) => {
    const p = new URLSearchParams();
    const estado: SP = {
      q: q || undefined,
      moto: moto || undefined,
      categoria: categoria || undefined,
      min: sp.min,
      max: sp.max,
      stock: soloStock ? "1" : undefined,
      orden: orden !== "novedades" ? orden : undefined,
      ...cambios,
    };
    for (const [k, v] of Object.entries(estado)) {
      if (v) p.set(k, v);
    }
    const qs = p.toString();
    return `${base}/tienda${qs ? `?${qs}` : ""}`;
  };

  return (
    <BazarShell info={info}>
      <div className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: "var(--t-texto)" }}>
          Tienda
        </h1>
        <p className="mt-1 text-sm t-tenue">
          {total.toLocaleString("es-AR")} producto{total === 1 ? "" : "s"}
          {moto ? (
            <>
              {" "}
              que le entran a tu <strong>{moto}</strong>{" "}
              <a href={`/sitio/${slug}/tienda`} className="underline underline-offset-2 opacity-70 hover:opacity-100">
                (quitar filtro)
              </a>
            </>
          ) : null}
          {q ? ` para “${q}”` : ""}
          {categoria ? ` en ${categoria}` : ""}
        </p>

        {/* ── Chips de categorías ── */}
        <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
          <Link
            href={url({ categoria: undefined, pagina: undefined })}
            className="whitespace-nowrap rounded-full border px-4 py-1.5 text-sm font-medium transition-colors"
            style={
              !categoria
                ? { backgroundColor: info.color, borderColor: info.color, color: info.sobreColor }
                : { borderColor: "var(--t-borde)" }
            }
          >
            Todo
          </Link>
          {rubros.map((c) => (
            <Link
              key={c}
              href={url({ categoria: c, pagina: undefined })}
              className="whitespace-nowrap rounded-full border px-4 py-1.5 text-sm font-medium transition-colors"
              style={
                categoria === c
                  ? { backgroundColor: info.color, borderColor: info.color, color: info.sobreColor }
                  : { borderColor: "var(--t-borde)" }
              }
            >
              {c}
            </Link>
          ))}
        </div>

        {/* ── Filtros (form GET server-side) ── */}
        <form
          method="get"
          className="mt-4 flex flex-wrap items-end gap-3 rounded-2xl border p-4"
          style={{ borderColor: "var(--t-borde)", backgroundColor: "var(--t-suave)" }}
        >
          {categoria ? <input type="hidden" name="categoria" value={categoria} /> : null}
          <div className="min-w-40 flex-1">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide t-tenue">
              Buscar
            </label>
            <input
              name="q"
              defaultValue={q}
              placeholder="Nombre o código…"
              className="h-10 w-full rounded-xl border t-card px-3 text-sm outline-none"
              style={{ borderColor: "var(--t-borde)" }}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide t-tenue">
              Precio desde
            </label>
            <input
              name="min"
              type="number"
              min={0}
              defaultValue={sp.min ?? ""}
              placeholder="$ mín"
              className="h-10 w-28 rounded-xl border t-card px-3 text-sm outline-none"
              style={{ borderColor: "var(--t-borde)" }}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide t-tenue">
              Hasta
            </label>
            <input
              name="max"
              type="number"
              min={0}
              defaultValue={sp.max ?? ""}
              placeholder="$ máx"
              className="h-10 w-28 rounded-xl border t-card px-3 text-sm outline-none"
              style={{ borderColor: "var(--t-borde)" }}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide t-tenue">
              Ordenar por
            </label>
            <select
              name="orden"
              defaultValue={orden}
              className="h-10 rounded-xl border t-card px-3 text-sm outline-none"
              style={{ borderColor: "var(--t-borde)" }}
            >
              {Object.entries(ORDEN_LABEL).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </div>
          <label className="flex h-10 items-center gap-2 text-sm">
            <input type="checkbox" name="stock" value="1" defaultChecked={soloStock} />
            Solo con stock
          </label>
          <button
            type="submit"
            className="h-10 rounded-full px-5 text-sm font-semibold text-white"
            style={{ backgroundColor: "var(--t-texto)", color: "var(--t-fondo)" }}
          >
            Aplicar
          </button>
        </form>

        {/* ── Grilla ── */}
        {productos.length === 0 ? (
          <div className="py-20 text-center">
            <div className="text-4xl"></div>
            <p className="mt-3 font-medium">No encontramos productos con esos filtros.</p>
            <Link
              href={`${base}/tienda`}
              className="mt-4 inline-block rounded-full px-5 py-2.5 text-sm font-semibold text-white"
              style={{ backgroundColor: "var(--tpl, #3FA9A5)", color: "var(--tpl-sobre, #fff)" }}
            >
              Ver todo el catálogo
            </Link>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {productos.map((p) => (
              <ProductoCard key={p.id} slug={tenant.slug} p={aCard(p)} />
            ))}
          </div>
        )}

        {/* ── Paginación ── */}
        {paginas > 1 ? (
          <nav className="mt-8 flex items-center justify-center gap-2" aria-label="Paginación">
            {pagina > 1 ? (
              <Link
                href={url({ pagina: String(pagina - 1) })}
                className="rounded-full border px-4 py-2 text-sm font-medium"
                style={{ borderColor: "var(--t-borde)" }}
              >
                ← Anterior
              </Link>
            ) : null}
            <span className="px-3 text-sm t-tenue">
              Página {pagina} de {paginas}
            </span>
            {pagina < paginas ? (
              <Link
                href={url({ pagina: String(pagina + 1) })}
                className="rounded-full border px-4 py-2 text-sm font-medium"
                style={{ borderColor: "var(--t-borde)" }}
              >
                Siguiente →
              </Link>
            ) : null}
          </nav>
        ) : null}
      </div>
    </BazarShell>
  );
}
