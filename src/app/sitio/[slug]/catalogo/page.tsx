import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { CONCE_TIPOS, tipoLabel } from "@/lib/conce";
import {
  aCardVehiculo,
  CONCE_CARD_SELECT,
  conceMarcas,
  getConceSite,
} from "../_lib/conce-site";
import { ConceShell } from "../_components/conce/conce-shell";
import { RC } from "@/lib/conce";
import { VehiculoCard } from "../_components/conce/vehiculo-card";

export const dynamic = "force-dynamic";

const POR_PAGINA = 20; // paginación server-side

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const site = await getConceSite(slug);
  if (!site) return { title: "Catálogo" };
  return {
    title: `Catálogo — ${site.info.nombre}`,
    description: `Todo el stock de ${site.info.nombre}: 0KM y usados multimarca en Bahía Blanca.`,
    robots: { index: false, follow: false },
  };
}

type SP = {
  q?: string;
  marca?: string;
  tipo?: string;
  condicion?: string;
  moneda?: string;
  min?: string;
  max?: string;
  anioMin?: string;
  anioMax?: string;
  transmision?: string;
  combustible?: string;
  orden?: string;
  pagina?: string;
  precio?: string; // atajo del hero: "ars-40000000" | "usd-20000"
};

const ORDENES: Record<string, Prisma.ConceVehiculoOrderByWithRelationInput[]> = {
  recientes: [{ ingresadoEl: "desc" }],
  menor: [{ precio: { sort: "asc", nulls: "last" } }],
  mayor: [{ precio: { sort: "desc", nulls: "last" } }],
  anioDesc: [{ anio: "desc" }],
  anioAsc: [{ anio: "asc" }],
  menorKm: [{ km: "asc" }],
  vistos: [{ visitas: "desc" }],
};

const ORDEN_LABEL: Record<string, string> = {
  recientes: "Más recientes",
  menor: "Menor precio",
  mayor: "Mayor precio",
  anioDesc: "Año: más nuevos",
  anioAsc: "Año: más viejos",
  menorKm: "Menos kilómetros",
  vistos: "Más vistos",
};

export default async function CatalogoPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SP>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const site = await getConceSite(slug);
  if (!site) notFound();
  const { tenant, info } = site;
  const base = `/sitio/${tenant.slug}`;

  // Atajo del buscador del hero: precio=ars-40000000 → moneda + max
  if (sp.precio && !sp.max) {
    const [mon, tope] = sp.precio.split("-");
    if (mon && tope) {
      sp.moneda = mon.toUpperCase();
      sp.max = tope;
    }
  }

  const q = (sp.q ?? "").trim();
  const marca = (sp.marca ?? "").trim();
  const tipo = (sp.tipo ?? "").trim();
  const condicion = sp.condicion === "0km" || sp.condicion === "usado" ? sp.condicion : "";
  const moneda = sp.moneda === "ARS" || sp.moneda === "USD" ? sp.moneda : "";
  const min = Number.parseInt(sp.min ?? "", 10);
  const max = Number.parseInt(sp.max ?? "", 10);
  const anioMin = Number.parseInt(sp.anioMin ?? "", 10);
  const anioMax = Number.parseInt(sp.anioMax ?? "", 10);
  const transmision = (sp.transmision ?? "").trim();
  const combustible = (sp.combustible ?? "").trim();
  const orden = ORDENES[sp.orden ?? ""] ? (sp.orden as string) : "recientes";
  const pagina = Math.max(1, Number.parseInt(sp.pagina ?? "1", 10) || 1);

  const where: Prisma.ConceVehiculoWhereInput = {
    clientId: tenant.id,
    estado: { not: "vendido" },
    publicado: true,
    ...(marca ? { marca } : {}),
    ...(tipo ? { tipo } : {}),
    ...(condicion ? { condicion } : {}),
    ...(moneda ? { moneda } : {}),
    ...(transmision ? { transmision } : {}),
    ...(combustible ? { combustible } : {}),
    ...(Number.isFinite(min) || Number.isFinite(max)
      ? {
          precio: {
            ...(Number.isFinite(min) ? { gte: min } : {}),
            ...(Number.isFinite(max) ? { lte: max } : {}),
          },
        }
      : {}),
    ...(Number.isFinite(anioMin) || Number.isFinite(anioMax)
      ? {
          anio: {
            ...(Number.isFinite(anioMin) ? { gte: anioMin } : {}),
            ...(Number.isFinite(anioMax) ? { lte: anioMax } : {}),
          },
        }
      : {}),
    ...(q
      ? {
          OR: [
            { marca: { contains: q, mode: "insensitive" } },
            { modelo: { contains: q, mode: "insensitive" } },
            { version: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [total, vehiculos, marcas, transmisiones, combustibles] = await Promise.all([
    db.conceVehiculo.count({ where }),
    db.conceVehiculo.findMany({
      where,
      orderBy: ORDENES[orden],
      skip: (pagina - 1) * POR_PAGINA,
      take: POR_PAGINA,
      select: CONCE_CARD_SELECT,
    }),
    conceMarcas(tenant.id),
    db.conceVehiculo.groupBy({
      by: ["transmision"],
      where: { clientId: tenant.id, estado: { not: "vendido" }, publicado: true, transmision: { not: null } },
    }),
    db.conceVehiculo.groupBy({
      by: ["combustible"],
      where: { clientId: tenant.id, estado: { not: "vendido" }, publicado: true, combustible: { not: null } },
    }),
  ]);
  const paginas = Math.max(1, Math.ceil(total / POR_PAGINA));

  /** URL del catálogo conservando filtros, pisando lo indicado. */
  const url = (cambios: Partial<SP>) => {
    const p = new URLSearchParams();
    const estado: SP = {
      q: q || undefined,
      marca: marca || undefined,
      tipo: tipo || undefined,
      condicion: condicion || undefined,
      moneda: moneda || undefined,
      min: Number.isFinite(min) ? String(min) : undefined,
      max: Number.isFinite(max) ? String(max) : undefined,
      anioMin: Number.isFinite(anioMin) ? String(anioMin) : undefined,
      anioMax: Number.isFinite(anioMax) ? String(anioMax) : undefined,
      transmision: transmision || undefined,
      combustible: combustible || undefined,
      orden: orden !== "recientes" ? orden : undefined,
      ...cambios,
    };
    for (const [k, v] of Object.entries(estado)) {
      if (v) p.set(k, v);
    }
    const qs = p.toString();
    return `${base}/catalogo${qs ? `?${qs}` : ""}`;
  };

  const inputCls = "h-10 w-full rounded-xl border bg-white px-3 text-sm outline-none";
  const labelCls = "mb-1 block text-[11px] font-bold uppercase tracking-wide text-gray-500";

  return (
    <ConceShell info={info}>
      <div className="mx-auto max-w-[1500px] px-3 py-6 sm:px-5 sm:py-8">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          {condicion === "0km" ? "Vehículos 0KM" : condicion === "usado" ? "Vehículos usados" : "Catálogo"}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {total.toLocaleString("es-AR")} vehículo{total === 1 ? "" : "s"}
          {q ? ` para “${q}”` : ""}
          {marca ? ` · ${marca}` : ""}
          {tipo ? ` · ${tipoLabel(tipo)}` : ""}
        </p>

        {/* Tabs 0KM / Usados */}
        <div className="mt-5 flex gap-2">
          {[
            { valor: "", label: "Todos" },
            { valor: "0km", label: "0KM" },
            { valor: "usado", label: "Usados" },
          ].map((t) => (
            <Link
              key={t.valor}
              href={url({ condicion: t.valor || undefined, pagina: undefined })}
              className="rounded-full px-5 py-2 text-sm font-bold transition-all"
              style={
                condicion === t.valor
                  ? { backgroundColor: RC.dorado, color: "#0A0A0A" }
                  : { backgroundColor: RC.doradoSuave, color: RC.doradoTexto }
              }
            >
              {t.label}
            </Link>
          ))}
        </div>

        <div className="mt-5 grid items-start gap-5 lg:grid-cols-[268px_minmax(0,1fr)]">
        {/* ── Filtros: sidebar en PC, desplegable en celular ── */}
        <aside className="lg:sticky lg:top-24">
        <details className="group rounded-3xl bg-white lg:open" open style={{ border: `1px solid ${RC.borde}` }}>
          <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-bold lg:hidden">
            Filtrar y ordenar
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 transition-transform group-open:rotate-180" aria-hidden>
              <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </summary>
        <form
          method="get"
          className="grid grid-cols-2 items-end gap-3 p-4 pt-0 lg:grid-cols-1 lg:pt-4"
        >
          {condicion ? <input type="hidden" name="condicion" value={condicion} /> : null}
          <div className="col-span-2 sm:col-span-1">
            <label className={labelCls}>Buscar</label>
            <input name="q" defaultValue={q} placeholder="Marca, modelo…" className={inputCls} style={{ borderColor: RC.borde }} />
          </div>
          <div>
            <label className={labelCls}>Marca</label>
            <select name="marca" defaultValue={marca} className={inputCls} style={{ borderColor: RC.borde }}>
              <option value="">Todas</option>
              {marcas.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Tipo</label>
            <select name="tipo" defaultValue={tipo} className={inputCls} style={{ borderColor: RC.borde }}>
              <option value="">Todos</option>
              {CONCE_TIPOS.map((t) => (
                <option key={t.valor} value={t.valor}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Moneda</label>
            <select name="moneda" defaultValue={moneda} className={inputCls} style={{ borderColor: RC.borde }}>
              <option value="">Todas</option>
              <option value="ARS">Pesos ($)</option>
              <option value="USD">Dólares (US$)</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Precio desde</label>
            <input name="min" type="number" min={0} defaultValue={Number.isFinite(min) ? min : ""} placeholder="Mín" className={inputCls} style={{ borderColor: RC.borde }} />
          </div>
          <div>
            <label className={labelCls}>Precio hasta</label>
            <input name="max" type="number" min={0} defaultValue={Number.isFinite(max) ? max : ""} placeholder="Máx" className={inputCls} style={{ borderColor: RC.borde }} />
          </div>
          <div>
            <label className={labelCls}>Año desde</label>
            <input name="anioMin" type="number" min={1950} max={2030} defaultValue={Number.isFinite(anioMin) ? anioMin : ""} placeholder="1990" className={inputCls} style={{ borderColor: RC.borde }} />
          </div>
          <div>
            <label className={labelCls}>Año hasta</label>
            <input name="anioMax" type="number" min={1950} max={2030} defaultValue={Number.isFinite(anioMax) ? anioMax : ""} placeholder="2026" className={inputCls} style={{ borderColor: RC.borde }} />
          </div>
          <div>
            <label className={labelCls}>Transmisión</label>
            <select name="transmision" defaultValue={transmision} className={inputCls} style={{ borderColor: RC.borde }}>
              <option value="">Todas</option>
              {transmisiones.map((t) => (
                <option key={t.transmision} value={t.transmision ?? ""}>{t.transmision}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Combustible</label>
            <select name="combustible" defaultValue={combustible} className={inputCls} style={{ borderColor: RC.borde }}>
              <option value="">Todos</option>
              {combustibles.map((c) => (
                <option key={c.combustible} value={c.combustible ?? ""}>{c.combustible}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Ordenar por</label>
            <select name="orden" defaultValue={orden} className={inputCls} style={{ borderColor: RC.borde }}>
              {Object.entries(ORDEN_LABEL).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
          <div className="col-span-2 flex gap-2 lg:col-span-1">
            <button
              type="submit"
              className="h-11 flex-1 rounded-full text-sm font-bold transition-opacity hover:opacity-90"
              style={{ backgroundColor: RC.dorado, color: "#0A0A0A" }}
            >
              Aplicar filtros
            </button>
            <Link
              href={`${base}/catalogo${condicion ? `?condicion=${condicion}` : ""}`}
              className="flex h-11 items-center justify-center rounded-full px-4 text-sm font-semibold"
              style={{ backgroundColor: RC.doradoSuave, color: RC.doradoTexto }}
            >
              Limpiar
            </Link>
          </div>
        </form>
        </details>
        </aside>

        {/* ── Resultados ── */}
        <div>
        {/* Grilla */}
        {vehiculos.length === 0 ? (
          <div className="py-20 text-center">
            <p className="mt-3 font-semibold">No encontramos vehículos con esos filtros.</p>
            <Link
              href={`${base}/catalogo`}
              className="mt-4 inline-block rounded-full px-6 py-2.5 text-sm font-bold"
              style={{ backgroundColor: RC.dorado, color: "#0A0A0A" }}
            >
              Ver todo el catálogo
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
            {vehiculos.map((v) => (
              <VehiculoCard key={v.id} slug={tenant.slug} v={aCardVehiculo(v)} />
            ))}
          </div>
        )}

        {/* Paginación */}
        {paginas > 1 ? (
          <nav className="mt-10 flex items-center justify-center gap-2" aria-label="Paginación">
            {pagina > 1 ? (
              <Link
                href={url({ pagina: String(pagina - 1) })}
                className="rounded-full border bg-white px-4 py-2 text-sm font-semibold"
                style={{ borderColor: RC.borde }}
              >
                ← Anterior
              </Link>
            ) : null}
            <span className="px-3 text-sm text-gray-500">
              Página {pagina} de {paginas}
            </span>
            {pagina < paginas ? (
              <Link
                href={url({ pagina: String(pagina + 1) })}
                className="rounded-full border bg-white px-4 py-2 text-sm font-semibold"
                style={{ borderColor: RC.borde }}
              >
                Siguiente →
              </Link>
            ) : null}
          </nav>
        ) : null}
        </div>
        </div>
      </div>
    </ConceShell>
  );
}
