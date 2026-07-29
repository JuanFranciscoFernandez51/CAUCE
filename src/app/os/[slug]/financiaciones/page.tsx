import Link from "next/link";
import { notFound } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getTenantBySlug } from "@/lib/tenant";
import { esConcesionaria } from "@/lib/conce-server";
import { Badge, Stat } from "@/components/ui";
import { aFechaInput, diasHasta, fmtPlata } from "@/lib/conce-fin";
import {
  FinanciacionesTable,
  type FinanciacionRow,
} from "../_components/conce/financiaciones-table";
import { AvisosCuotas, type AvisoRow } from "../_components/conce/avisos-cuotas";

export const dynamic = "force-dynamic";

type SP = { q?: string; estado?: string };

/** Módulo FINANCIACIONES: planes propios de la casa, cuotas y avisos. */
export default async function FinanciacionesPage({
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

  const base = `/os/${tenant.slug}/financiaciones`;
  const q = (sp.q ?? "").trim();
  const estado = ["ACTIVA", "COMPLETADA", "CANCELADA"].includes(sp.estado ?? "")
    ? (sp.estado as string)
    : "";

  const where: Prisma.ConceFinanciacionWhereInput = {
    clientId: tenant.id,
    ...(estado ? { estado } : {}),
    ...(q
      ? {
          OR: [
            { descripcion: { contains: q, mode: "insensitive" as const } },
            { contacto: { name: { contains: q, mode: "insensitive" as const } } },
            { operacion: { nombre: { contains: q, mode: "insensitive" as const } } },
          ],
        }
      : {}),
  };

  const incluir = {
    contacto: { select: { id: true, name: true, phone: true } },
    operacion: { select: { nombre: true, telefono: true } },
    cuotas: { orderBy: { numero: "asc" as const } },
  };

  const [financiaciones, totales] = await Promise.all([
    db.conceFinanciacion.findMany({
      where,
      orderBy: [{ estado: "asc" }, { numero: "desc" }],
      take: 200,
      include: incluir,
    }),
    db.conceFinanciacion.groupBy({
      by: ["estado"],
      where: { clientId: tenant.id },
      _count: { _all: true },
    }),
  ]);

  const conteo = new Map(totales.map((t) => [t.estado, t._count._all]));
  const total = [...conteo.values()].reduce((a, b) => a + b, 0);

  const filas: FinanciacionRow[] = financiaciones.map((f) => {
    const cobrado = f.cuotas.reduce((a, c) => a + c.montoPagado, 0);
    const pagadas = f.cuotas.filter((c) => c.montoPagado >= c.monto - 0.5).length;
    const impagas = f.cuotas.filter((c) => c.montoPagado < c.monto - 0.5);
    const vencidas = impagas.filter((c) => diasHasta(c.fechaVencimiento) < 0).length;
    const proxima = impagas[0];
    return {
      id: f.id,
      numero: f.numero,
      cliente: f.contacto?.name ?? f.operacion?.nombre ?? "Sin cliente",
      contactId: f.contacto?.id ?? null,
      descripcion: f.descripcion,
      origen: f.origen,
      montoTotal: f.montoTotal,
      entrega: f.entrega,
      cantidadCuotas: f.cantidadCuotas,
      valorCuota: f.valorCuota,
      moneda: f.moneda,
      estado: f.estado,
      cobrado,
      saldo: Math.max(0, f.montoTotal - cobrado),
      pagadas,
      vencidas,
      proximaIso: proxima ? aFechaInput(proxima.fechaVencimiento) : null,
      proximaNumero: proxima?.numero ?? null,
    };
  });

  // ── Bandeja "para avisar hoy": vencen en 3 días o ya vencieron ──────────
  const activas = await db.conceFinanciacion.findMany({
    where: { clientId: tenant.id, estado: "ACTIVA" },
    include: incluir,
  });
  const avisos: AvisoRow[] = [];
  for (const f of activas) {
    for (const c of f.cuotas) {
      const saldo = c.monto - c.montoPagado;
      if (saldo <= 0.5) continue;
      const dias = diasHasta(c.fechaVencimiento);
      if (dias > 3) continue;
      avisos.push({
        cuotaId: c.id,
        financiacionId: f.id,
        numeroFin: f.numero,
        numeroCuota: c.numero,
        cantidadCuotas: f.cantidadCuotas,
        cliente: f.contacto?.name ?? f.operacion?.nombre ?? "Cliente",
        telefono: f.contacto?.phone ?? f.operacion?.telefono ?? null,
        descripcion: f.descripcion,
        vencIso: aFechaInput(c.fechaVencimiento),
        saldo,
        moneda: c.monto ? f.moneda : f.moneda,
        avisado: !!c.avisadoEl,
      });
    }
  }
  avisos.sort((a, b) => a.vencIso.localeCompare(b.vencIso));

  // Totales de cartera (sólo lo que sigue activo).
  const carteraPendiente = filas
    .filter((f) => f.estado === "ACTIVA" && f.moneda === "ARS")
    .reduce((a, f) => a + f.saldo, 0);
  const vencidoTotal = avisos
    .filter((a) => diasHasta(new Date(`${a.vencIso}T12:00:00-03:00`)) < 0 && a.moneda === "ARS")
    .reduce((a, c) => a + c.saldo, 0);

  const urlCon = (cambios: Partial<SP>) => {
    const final: SP = { q: q || undefined, estado: estado || undefined, ...cambios };
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
          <h1 className="text-2xl font-semibold tracking-tight">Financiaciones</h1>
          <p className="max-w-3xl text-sm text-muted-foreground">
            Los planes que financia la casa. Al entregar un boleto con forma de pago financiado, la
            financiación y sus cuotas se arman solas.
          </p>
        </div>
        <Link
          href={`${base}/nueva`}
          className="inline-flex h-9 items-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          + Nueva financiación
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Por cobrar (activas, $)" value={fmtPlata(carteraPendiente, "ARS")} />
        <Stat label="Vencido sin cobrar ($)" value={fmtPlata(vencidoTotal, "ARS")} />
        <Stat label="Para avisar hoy" value={String(avisos.length)} />
      </div>

      <AvisosCuotas slug={tenant.slug} avisos={avisos} negocio={tenant.name} />

      <div className="flex flex-wrap items-center gap-2">
        {chip(urlCon({ estado: undefined }), !estado, `Todas · ${total}`)}
        {chip(urlCon({ estado: "ACTIVA" }), estado === "ACTIVA", `Activas · ${conteo.get("ACTIVA") ?? 0}`)}
        {chip(
          urlCon({ estado: "COMPLETADA" }),
          estado === "COMPLETADA",
          `Terminadas · ${conteo.get("COMPLETADA") ?? 0}`
        )}
        {chip(
          urlCon({ estado: "CANCELADA" }),
          estado === "CANCELADA",
          `Canceladas · ${conteo.get("CANCELADA") ?? 0}`
        )}
      </div>

      <form method="get" className="flex flex-wrap items-center gap-2">
        {estado ? <input type="hidden" name="estado" value={estado} /> : null}
        <input
          name="q"
          defaultValue={q}
          placeholder="Buscar por cliente o vehículo…"
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

      <FinanciacionesTable slug={tenant.slug} financiaciones={filas} />
    </div>
  );
}
