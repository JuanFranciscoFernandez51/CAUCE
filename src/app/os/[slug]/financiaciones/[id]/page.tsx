import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getTenantBySlug } from "@/lib/tenant";
import { esConcesionaria } from "@/lib/conce-server";
import { Badge, Card, Stat } from "@/components/ui";
import { numeroOperacion, rutaOperacion } from "@/lib/conce";
import {
  FINANCIACION_ESTADO_LABEL,
  aFechaInput,
  fmtFecha,
  fmtPlata,
  numeroFinanciacion,
} from "@/lib/conce-fin";
import { CuotasPlan, type CuotaRow } from "../../_components/conce/cuotas-plan";

export const dynamic = "force-dynamic";

/** Ficha de una financiación: plan de cuotas, saldo y avisos por WhatsApp. */
export default async function FinanciacionPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant || !esConcesionaria(tenant)) notFound();

  const f = await db.conceFinanciacion.findFirst({
    where: { id, clientId: tenant.id },
    include: {
      contacto: { select: { id: true, name: true, phone: true } },
      operacion: { select: { id: true, tipo: true, numero: true, nombre: true, telefono: true } },
      cuotas: { orderBy: { numero: "asc" } },
    },
  });
  if (!f) notFound();

  const cobrado = f.cuotas.reduce((a, c) => a + c.montoPagado, 0);
  const saldo = Math.max(0, f.montoTotal - cobrado);
  const pagadas = f.cuotas.filter((c) => c.montoPagado >= c.monto - 0.5).length;
  const cliente = f.contacto?.name ?? f.operacion?.nombre ?? "Sin cliente";
  const telefono = f.contacto?.phone ?? f.operacion?.telefono ?? null;

  const cuotas: CuotaRow[] = f.cuotas.map((c) => ({
    id: c.id,
    numero: c.numero,
    monto: c.monto,
    montoPagado: c.montoPagado,
    vencIso: aFechaInput(c.fechaVencimiento),
    pagoIso: c.fechaPago ? aFechaInput(c.fechaPago) : null,
    estado: c.estado,
    metodoPago: c.metodoPago,
    comprobante: c.comprobante,
    avisado: !!c.avisadoEl,
  }));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              Financiación {numeroFinanciacion(f.numero)}
            </h1>
            <Badge
              variant={
                f.estado === "ACTIVA" ? "primary" : f.estado === "COMPLETADA" ? "success" : "destructive"
              }
            >
              {FINANCIACION_ESTADO_LABEL[f.estado] ?? f.estado}
            </Badge>
            {f.origen === "BOLETO_AUTOMATICA" ? (
              <Badge variant="outline">⚡ armada sola desde el boleto</Badge>
            ) : null}
          </div>
          <p className="text-sm text-muted-foreground">
            {f.contacto ? (
              <Link href={`/os/${tenant.slug}/clientes/${f.contacto.id}`} className="hover:text-primary">
                {cliente}
              </Link>
            ) : (
              cliente
            )}
            {f.descripcion ? ` · ${f.descripcion}` : ""} · arrancó el {fmtFecha(f.fechaInicio)}
          </p>
        </div>
        <Link
          href={`/os/${tenant.slug}/financiaciones`}
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Volver a financiaciones
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Financiado" value={fmtPlata(f.montoTotal, f.moneda)} />
        <Stat label="Cobrado" value={fmtPlata(cobrado, f.moneda)} tone="success" />
        <Stat
          label="Saldo"
          value={fmtPlata(saldo, f.moneda)}
          tone={saldo > 0 ? "warning" : "success"}
        />
        <Stat
          label="Cuotas"
          value={`${pagadas}/${f.cantidadCuotas}`}
          hint={`de ${fmtPlata(f.valorCuota, f.moneda)} · vencen el ${f.diaVencimiento} de cada mes`}
        />
      </div>

      {f.operacion || f.entrega > 0 || f.observaciones ? (
        <Card className="space-y-1.5 border-primary/30 bg-primary-soft/40 p-4 text-sm">
          {f.operacion ? (
            <p>
              🧾 Sale del boleto{" "}
              <Link
                href={`/os/${tenant.slug}/${rutaOperacion(f.operacion.tipo)}/${f.operacion.id}`}
                className="font-medium hover:text-primary"
              >
                {numeroOperacion(f.operacion.tipo, f.operacion.numero)}
              </Link>
            </p>
          ) : null}
          {f.entrega > 0 ? <p>💵 Entrega tomada: {fmtPlata(f.entrega, f.moneda)}</p> : null}
          {f.observaciones ? <p className="text-muted-foreground">{f.observaciones}</p> : null}
        </Card>
      ) : null}

      <CuotasPlan
        slug={tenant.slug}
        cuotas={cuotas}
        moneda={f.moneda}
        cliente={cliente}
        telefono={telefono}
        descripcion={f.descripcion}
        negocio={tenant.name}
      />
    </div>
  );
}
