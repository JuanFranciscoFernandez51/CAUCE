import Link from "next/link";
import { notFound } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getTenantBySlug } from "@/lib/tenant";
import { esConcesionaria } from "@/lib/conce-server";
import { Badge } from "@/components/ui";
import { origenVehiculoTexto, rutaOperacion } from "@/lib/conce";
import { StockTable, type VehiculoRow } from "../_components/conce/stock-table";
import { ImportarVehiculosCsv } from "../_components/conce/importar-vehiculos-csv";

export const dynamic = "force-dynamic";

type SP = { q?: string; condicion?: string; estado?: string; marca?: string; web?: string };

/**
 * Stock de la concesionaria: lista con edición inline, buscador, filtros por
 * condición/estado/marca, alta y import CSV.
 */
export default async function StockPage({
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
  const condicion = sp.condicion === "0km" || sp.condicion === "usado" ? sp.condicion : "";
  const estado = ["disponible", "reservado", "vendido"].includes(sp.estado ?? "")
    ? (sp.estado as string)
    : "";
  const marca = (sp.marca ?? "").trim();
  const web = sp.web === "sin" ? "sin" : "";

  const where: Prisma.ConceVehiculoWhereInput = {
    clientId: tenant.id,
    ...(condicion ? { condicion } : {}),
    ...(estado ? { estado } : {}),
    ...(web === "sin" ? { publicado: false } : {}),
    ...(marca ? { marca } : {}),
    ...(q
      ? {
          OR: [
            { marca: { contains: q, mode: "insensitive" } },
            { modelo: { contains: q, mode: "insensitive" } },
            { version: { contains: q, mode: "insensitive" } },
            { dominio: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [vehiculos, totales, marcas, sinPublicar] = await Promise.all([
    db.conceVehiculo.findMany({
      where,
      orderBy: [{ estado: "asc" }, { ingresadoEl: "desc" }],
      take: 200,
      select: {
        id: true,
        marca: true,
        modelo: true,
        version: true,
        anio: true,
        km: true,
        precio: true,
        moneda: true,
        condicion: true,
        tipo: true,
        estado: true,
        publicado: true,
        destacado: true,
        oferta: true,
        visitas: true,
        dominio: true,
        fotos: true,
        origenTipo: true,
        origenOperacionId: true,
      },
    }),
    db.conceVehiculo.groupBy({
      by: ["estado"],
      where: { clientId: tenant.id },
      _count: { _all: true },
    }),
    db.conceVehiculo.groupBy({
      by: ["marca"],
      where: { clientId: tenant.id },
      orderBy: { marca: "asc" },
    }),
    db.conceVehiculo.count({ where: { clientId: tenant.id, publicado: false } }),
  ]);

  // Cartelito de por dónde entró cada unidad al stock (mandato firmado / permuta).
  const origenIds = vehiculos
    .map((v) => v.origenOperacionId)
    .filter((id): id is string => Boolean(id));
  const origenes = origenIds.length
    ? await db.conceOperacion.findMany({
        where: { clientId: tenant.id, id: { in: origenIds } },
        select: { id: true, tipo: true, numero: true },
      })
    : [];
  const origenPorId = new Map(origenes.map((o) => [o.id, o]));

  const filas: VehiculoRow[] = vehiculos.map((v) => {
    const op = v.origenOperacionId ? origenPorId.get(v.origenOperacionId) : null;
    return {
      ...v,
      origenTexto: origenVehiculoTexto(v.origenTipo, op?.numero ?? null, op?.tipo ?? null),
      origenHref: op ? `${base}/${rutaOperacion(op.tipo)}/${op.id}` : null,
    };
  });

  const conteo = new Map(totales.map((t) => [t.estado, t._count._all]));

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

  const urlCon = (cambios: Partial<SP>) => {
    const p = new URLSearchParams();
    const estadoFinal: SP = {
      q: q || undefined,
      condicion: condicion || undefined,
      estado: estado || undefined,
      marca: marca || undefined,
      web: web || undefined,
      ...cambios,
    };
    for (const [k, v] of Object.entries(estadoFinal)) if (v) p.set(k, v);
    const qs = p.toString();
    return `${base}/stock${qs ? `?${qs}` : ""}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Stock</h1>
          <p className="text-sm text-muted-foreground">
            Editá precio, moneda, estado, 🌐 publicado, ⭐ destacado y 🔥 oferta directo desde la
            lista. Lo que entra solo (mandato firmado, permuta) queda SIN publicar hasta que lo
            revises.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ImportarVehiculosCsv slug={tenant.slug} />
          <Link
            href={`${base}/stock/nuevo`}
            className="inline-flex h-9 items-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            + Vehículo
          </Link>
        </div>
      </div>

      {/* Chips de estado + tabs condición */}
      <div className="flex flex-wrap items-center gap-2">
        {chip(urlCon({ estado: undefined }), !estado, `Todos · ${[...conteo.values()].reduce((a, b) => a + b, 0)}`)}
        {chip(urlCon({ estado: "disponible" }), estado === "disponible", `Disponibles · ${conteo.get("disponible") ?? 0}`)}
        {chip(urlCon({ estado: "reservado" }), estado === "reservado", `Reservados · ${conteo.get("reservado") ?? 0}`)}
        {chip(urlCon({ estado: "vendido" }), estado === "vendido", `Vendidos · ${conteo.get("vendido") ?? 0}`)}
        <span className="mx-1 text-muted-foreground">|</span>
        {chip(urlCon({ condicion: undefined }), !condicion, "0KM + Usados")}
        {chip(urlCon({ condicion: "0km" }), condicion === "0km", "🆕 0KM")}
        {chip(urlCon({ condicion: "usado" }), condicion === "usado", "Usados")}
        <span className="mx-1 text-muted-foreground">|</span>
        {chip(urlCon({ web: web === "sin" ? undefined : "sin" }), web === "sin", `🌐 Sin publicar · ${sinPublicar}`)}
      </div>

      {/* Buscador + marca */}
      <form method="get" className="flex flex-wrap items-center gap-2">
        {condicion ? <input type="hidden" name="condicion" value={condicion} /> : null}
        {estado ? <input type="hidden" name="estado" value={estado} /> : null}
        <input
          name="q"
          defaultValue={q}
          placeholder="Buscar por marca, modelo, versión o dominio…"
          className="h-9 w-full max-w-sm rounded-md border bg-card px-3 text-sm outline-none focus:border-primary"
        />
        <select
          name="marca"
          defaultValue={marca}
          className="h-9 rounded-md border bg-card px-2.5 text-sm outline-none"
        >
          <option value="">Todas las marcas</option>
          {marcas.map((m) => (
            <option key={m.marca} value={m.marca}>
              {m.marca}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="h-9 rounded-md border px-3 text-sm font-medium hover:bg-muted"
        >
          Buscar
        </button>
        {q || marca ? (
          <Link href={urlCon({ q: undefined, marca: undefined })} className="text-sm text-muted-foreground hover:underline">
            Limpiar
          </Link>
        ) : null}
        <span className="ml-auto">
          <Badge variant="default">{vehiculos.length} en pantalla</Badge>
        </span>
      </form>

      <StockTable slug={tenant.slug} vehiculos={filas} />
    </div>
  );
}
