import Link from "next/link";
import { notFound } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getTenantBySlug } from "@/lib/tenant";
import { esConcesionaria } from "@/lib/conce-server";
import { fmtPrecioVehiculo, nombreVehiculo, OPERACION_ESTADO_LABEL } from "@/lib/conce";
import { Badge, EmptyState, Table, Td, Th } from "@/components/ui";
import { OperacionEstadoBtns } from "../_components/conce/operacion-estado-btns";

export const dynamic = "force-dynamic";

type SP = { tipo?: string; estado?: string };

/**
 * Mandatos de venta (consignaciones) y boletos/órdenes de compra —
 * patrón MF adaptado a autos, con PDF imprimible con la marca del negocio.
 */
export default async function MandatosPage({
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

  const tipo = sp.tipo === "MANDATO" || sp.tipo === "BOLETO" ? sp.tipo : "";
  const estado = ["VIGENTE", "CONCRETADA", "CANCELADA"].includes(sp.estado ?? "")
    ? (sp.estado as string)
    : "";

  const where: Prisma.ConceOperacionWhereInput = {
    clientId: tenant.id,
    ...(tipo ? { tipo } : {}),
    ...(estado ? { estado } : {}),
  };

  const [operaciones, totales] = await Promise.all([
    db.conceOperacion.findMany({
      where,
      orderBy: [{ estado: "asc" }, { fecha: "desc" }],
      take: 200,
      include: {
        vehiculo: { select: { marca: true, modelo: true, version: true, anio: true } },
      },
    }),
    db.conceOperacion.groupBy({
      by: ["tipo"],
      where: { clientId: tenant.id },
      _count: { _all: true },
    }),
  ]);
  const conteo = new Map(totales.map((t) => [t.tipo, t._count._all]));

  const urlCon = (cambios: Partial<SP>) => {
    const p = new URLSearchParams();
    const final: SP = { tipo: tipo || undefined, estado: estado || undefined, ...cambios };
    for (const [k, v] of Object.entries(final)) if (v) p.set(k, v);
    const qs = p.toString();
    return `${base}/mandatos${qs ? `?${qs}` : ""}`;
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

  const badgeEstado = (e: string) => (
    <Badge variant={e === "VIGENTE" ? "warning" : e === "CONCRETADA" ? "success" : "destructive"}>
      {OPERACION_ESTADO_LABEL[e] ?? e}
    </Badge>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Mandatos & Boletos</h1>
          <p className="text-sm text-muted-foreground">
            Consignaciones (mandatos de venta) y órdenes de compra (boletos), con PDF imprimible.
            Concretar un boleto registra la venta en Finanzas y marca el vehículo como vendido.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`${base}/mandatos/nuevo?tipo=MANDATO`}
            className="inline-flex h-9 items-center rounded-md border px-3 text-sm font-medium hover:bg-muted"
          >
            + Mandato
          </Link>
          <Link
            href={`${base}/mandatos/nuevo?tipo=BOLETO`}
            className="inline-flex h-9 items-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            + Boleto
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {chip(urlCon({ tipo: undefined }), !tipo, `Todos · ${(conteo.get("MANDATO") ?? 0) + (conteo.get("BOLETO") ?? 0)}`)}
        {chip(urlCon({ tipo: "MANDATO" }), tipo === "MANDATO", `Mandatos · ${conteo.get("MANDATO") ?? 0}`)}
        {chip(urlCon({ tipo: "BOLETO" }), tipo === "BOLETO", `Boletos · ${conteo.get("BOLETO") ?? 0}`)}
        <span className="mx-1 text-muted-foreground">|</span>
        {chip(urlCon({ estado: undefined }), !estado, "Todos los estados")}
        {chip(urlCon({ estado: "VIGENTE" }), estado === "VIGENTE", "Vigentes")}
        {chip(urlCon({ estado: "CONCRETADA" }), estado === "CONCRETADA", "Concretadas")}
        {chip(urlCon({ estado: "CANCELADA" }), estado === "CANCELADA", "Canceladas")}
      </div>

      {operaciones.length === 0 ? (
        <EmptyState
          icon="📋"
          title="Sin operaciones acá"
          detail="Creá un mandato de venta o un boleto con los botones de arriba."
        />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Nº</Th>
              <Th>Tipo</Th>
              <Th>Fecha</Th>
              <Th>Persona</Th>
              <Th>Vehículo</Th>
              <Th className="text-right">Precio</Th>
              <Th>Estado</Th>
              <Th className="w-32"></Th>
            </tr>
          </thead>
          <tbody>
            {operaciones.map((o) => (
              <tr key={o.id} className="hover:bg-muted/40">
                <Td className="font-mono text-sm">#{o.numero}</Td>
                <Td>
                  <Badge variant={o.tipo === "BOLETO" ? "primary" : "default"}>
                    {o.tipo === "BOLETO" ? "Boleto" : "Mandato"}
                  </Badge>
                </Td>
                <Td className="text-sm">
                  {o.fecha.toLocaleDateString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" })}
                </Td>
                <Td>
                  <Link href={`${base}/mandatos/${o.id}`} className="font-medium hover:text-primary">
                    {o.nombre}
                  </Link>
                  {o.telefono ? (
                    <span className="ml-1.5 text-xs text-muted-foreground">{o.telefono}</span>
                  ) : null}
                </Td>
                <Td className="text-sm">
                  {o.vehiculo ? `${nombreVehiculo(o.vehiculo)} ${o.vehiculo.anio}` : (o.vehiculoTexto ?? "—")}
                  {o.dominio ? (
                    <span className="ml-1 text-xs text-muted-foreground">({o.dominio})</span>
                  ) : null}
                </Td>
                <Td className="text-right text-sm font-semibold">
                  {fmtPrecioVehiculo(o.precio, o.moneda)}
                  {o.tipo === "MANDATO" && o.comisionPct ? (
                    <span className="ml-1 text-xs font-normal text-muted-foreground">
                      ({o.comisionPct}% com.)
                    </span>
                  ) : null}
                </Td>
                <Td>{badgeEstado(o.estado)}</Td>
                <Td>
                  <div className="flex items-center justify-end gap-2">
                    {o.estado === "VIGENTE" ? (
                      <OperacionEstadoBtns slug={tenant.slug} id={o.id} tipo={o.tipo} />
                    ) : null}
                    <Link
                      href={`${base}/mandatos/${o.id}/imprimir`}
                      title="PDF imprimible"
                      className="text-muted-foreground/60 hover:text-primary"
                    >
                      🖨️
                    </Link>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}
