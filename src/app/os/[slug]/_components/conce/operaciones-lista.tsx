import Link from "next/link";
import type { Client, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui";
import { nombreVehiculo, permutasDe, rutaOperacion } from "@/lib/conce";
import { OperacionesTable, type OperacionRow } from "./operaciones-table";

export type OperacionesSP = { q?: string; estado?: string };

const COPY = {
  MANDATO: {
    titulo: "Mandatos de venta",
    bajada:
      "Consignaciones con PDF imprimible y numeración propia (MV). Al marcarlo FIRMADO, el vehículo entra solo al stock sin publicar.",
    alta: "+ Nuevo mandato",
    buscar: "Buscar por titular, dominio o vehículo…",
  },
  BOLETO: {
    titulo: "Boletos / órdenes de compra",
    bajada:
      "Ventas con PDF imprimible y numeración propia (BC). Al entregarlo, el vehículo pasa a vendido y las permutas tomadas entran al stock.",
    alta: "+ Nuevo boleto",
    buscar: "Buscar por comprador, dominio o vehículo…",
  },
} as const;

function aFechaInput(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

/**
 * Cuerpo compartido de los DOS módulos separados (mandatos y boletos): cada
 * uno con su lista, su numeración y su PDF. Sólo cambia el tipo.
 */
export async function OperacionesLista({
  tenant,
  tipo,
  sp,
}: {
  tenant: Client;
  tipo: "MANDATO" | "BOLETO";
  sp: OperacionesSP;
}) {
  const base = `/os/${tenant.slug}/${rutaOperacion(tipo)}`;
  const copy = COPY[tipo];

  const q = (sp.q ?? "").trim();
  const estado = ["VIGENTE", "FIRMADO", "CONCRETADA", "CANCELADA"].includes(sp.estado ?? "")
    ? (sp.estado as string)
    : "";

  const where: Prisma.ConceOperacionWhereInput = {
    clientId: tenant.id,
    tipo,
    ...(estado ? { estado } : {}),
    ...(q
      ? {
          OR: [
            { nombre: { contains: q, mode: "insensitive" as const } },
            { dominio: { contains: q, mode: "insensitive" as const } },
            { vehiculoTexto: { contains: q, mode: "insensitive" as const } },
            { vehMarca: { contains: q, mode: "insensitive" as const } },
            { vehModelo: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [operaciones, totales] = await Promise.all([
    db.conceOperacion.findMany({
      where,
      orderBy: [{ estado: "asc" }, { numero: "desc" }],
      take: 200,
      include: {
        vehiculo: { select: { marca: true, modelo: true, version: true, anio: true } },
      },
    }),
    db.conceOperacion.groupBy({
      by: ["estado"],
      where: { clientId: tenant.id, tipo },
      _count: { _all: true },
    }),
  ]);
  const conteo = new Map(totales.map((t) => [t.estado, t._count._all]));
  const total = [...conteo.values()].reduce((a, b) => a + b, 0);

  const urlCon = (cambios: Partial<OperacionesSP>) => {
    const p = new URLSearchParams();
    const final: OperacionesSP = { q: q || undefined, estado: estado || undefined, ...cambios };
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

  const filas: OperacionRow[] = operaciones.map((o) => ({
    id: o.id,
    tipo: o.tipo,
    numero: o.numero,
    fechaIso: aFechaInput(o.fecha),
    fechaTexto: o.fecha.toLocaleDateString("es-AR", {
      timeZone: "America/Argentina/Buenos_Aires",
    }),
    nombre: o.nombre,
    telefono: o.telefono,
    vehiculoTitulo: o.vehiculo
      ? `${nombreVehiculo(o.vehiculo)} ${o.vehiculo.anio}`
      : o.vehiculoTexto ||
        [o.vehMarca, o.vehModelo, o.vehAnio].filter(Boolean).join(" ") ||
        "—",
    dominio: o.dominio,
    precio: o.precio,
    moneda: o.moneda,
    comisionPct: o.comisionPct,
    estado: o.estado,
    permutas: permutasDe(o.permutas).length,
    vehiculoId: o.vehiculoId,
  }));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{copy.titulo}</h1>
          <p className="max-w-3xl text-sm text-muted-foreground">{copy.bajada}</p>
        </div>
        <Link
          href={`${base}/nuevo`}
          className="inline-flex h-9 items-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          {copy.alta}
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {chip(urlCon({ estado: undefined }), !estado, `Todos · ${total}`)}
        {chip(urlCon({ estado: "VIGENTE" }), estado === "VIGENTE", `Vigentes · ${conteo.get("VIGENTE") ?? 0}`)}
        {chip(urlCon({ estado: "FIRMADO" }), estado === "FIRMADO", `Firmados · ${conteo.get("FIRMADO") ?? 0}`)}
        {chip(
          urlCon({ estado: "CONCRETADA" }),
          estado === "CONCRETADA",
          `${tipo === "BOLETO" ? "Entregados" : "Concretados"} · ${conteo.get("CONCRETADA") ?? 0}`
        )}
        {chip(urlCon({ estado: "CANCELADA" }), estado === "CANCELADA", `Anulados · ${conteo.get("CANCELADA") ?? 0}`)}
      </div>

      <form method="get" className="flex flex-wrap items-center gap-2">
        {estado ? <input type="hidden" name="estado" value={estado} /> : null}
        <input
          name="q"
          defaultValue={q}
          placeholder={copy.buscar}
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

      <OperacionesTable slug={tenant.slug} operaciones={filas} tipo={tipo} />
    </div>
  );
}
