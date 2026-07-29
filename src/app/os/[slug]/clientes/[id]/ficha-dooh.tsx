import Link from "next/link";
import { notFound } from "next/navigation";
import type { Client } from "@prisma/client";
import { db } from "@/lib/db";
import { waLink } from "@/lib/conce-fin";
import { Badge, Card, EmptyState, Table, Td, Th } from "@/components/ui";
import { Adjuntos, type AdjuntoData } from "../../_components/adjuntos";
import { InlineEdit } from "../../_components/inline-edit";
import { NotasInternas } from "../../_components/notas-internas";
import { customToValues } from "../../_components/custom-fields";

const fmtFecha = (d: Date) =>
  d.toLocaleDateString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" });
const fmt = (n: number) => `$ ${Math.round(n).toLocaleString("es-AR")}`;

/**
 * En Finanzas un mismo movimiento junta varios cobros ("Pago HONDA (abr)
 * $350.000 y BASANI $130.000"). Sacamos el monto que le corresponde a ESTE
 * cliente; si no se puede, el movimiento se muestra pero no suma al acumulado.
 */
function montoAtribuido(concepto: string, nombre: string): number | null {
  const escapado = nombre.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const m = new RegExp(`${escapado}[^$\\n]{0,40}\\$\\s*([\\d.]+)`, "i").exec(concepto);
  if (!m) return null;
  const n = Number(m[1].replace(/\./g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
}

const ESTADO_CONTRATO: Record<string, { label: string; variant: "success" | "warning" | "default" }> = {
  activo: { label: "Activo", variant: "success" },
  pausado: { label: "Pausado", variant: "warning" },
  baja: { label: "De baja", variant: "default" },
};

/**
 * Ficha del anunciante: sus datos fiscales (CUIT y domicilio viven en
 * Contact.custom), la descripción interna del equipo, TODOS sus contratos de
 * pantallas con lo que factura por mes, sus pagos en Finanzas y la carpeta de
 * documentos (contratos firmados, facturas).
 */
export async function FichaClienteDooh({ tenant, id }: { tenant: Client; id: string }) {
  const base = `/os/${tenant.slug}`;

  const cliente = await db.contact.findFirst({
    where: { id, clientId: tenant.id },
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      notes: true,
      custom: true,
      createdAt: true,
    },
  });
  if (!cliente) notFound();

  const [contratos, docs] = await Promise.all([
    db.pantallaContrato.findMany({
      where: { clientId: tenant.id, contactId: cliente.id },
      orderBy: [{ estado: "asc" }, { createdAt: "asc" }],
      include: { pantalla: { select: { id: true, nombre: true, zona: true } } },
    }),
    db.attachment.findMany({
      where: { clientId: tenant.id, refType: "contact", refId: cliente.id },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  // Pagos: los ingresos de Finanzas que nombran a este cliente.
  // (Todavía no hay vínculo duro movimiento↔contacto: matcheamos por concepto.)
  const nombreBuscable = cliente.name.trim();
  const movimientos =
    nombreBuscable.length >= 3
      ? await db.cashMovement.findMany({
          where: {
            clientId: tenant.id,
            kind: "venta",
            concept: { contains: nombreBuscable, mode: "insensitive" },
          },
          orderBy: { date: "desc" },
          take: 100,
          select: { id: true, concept: true, amountArs: true, date: true, method: true, moneda: true },
        })
      : [];
  const pagos = movimientos.map((p) => ({
    ...p,
    atribuido: montoAtribuido(p.concept, nombreBuscable),
  }));
  const acumulado = pagos.reduce((a, p) => a + (p.atribuido ?? 0), 0);
  const sinDesglosar = pagos.filter((p) => p.atribuido === null).length;

  const activos = contratos.filter((c) => c.estado === "activo");
  const totalMensual = activos.reduce((a, c) => a + c.montoMensual, 0);
  const totalSlots = activos.reduce((a, c) => a + c.slots, 0);

  const documentos: AdjuntoData[] = docs.map((a) => ({
    id: a.id,
    url: a.url,
    name: a.name,
    mime: a.mime,
  }));

  const endpoint = `/api/os/${tenant.slug}/contacts/${cliente.id}`;
  const custom = customToValues(cliente.custom);
  const mensajeWa = `Hola ${cliente.name.split(" ")[0]}! Te escribo por tu pauta en las pantallas${
    totalMensual > 0 ? `: hoy tenés ${activos.length} pantalla(s) por ${fmt(totalMensual)} por mes` : ""
  }.`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{cliente.name}</h1>
          <p className="text-sm text-muted-foreground">
            Cliente desde el {fmtFecha(cliente.createdAt)} · {contratos.length} contrato(s) ·{" "}
            {totalMensual > 0 ? `${fmt(totalMensual)} por mes` : "sin pauta activa"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {cliente.phone ? (
            <a
              href={waLink(cliente.phone, mensajeWa)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 items-center rounded-md border px-3 text-sm font-medium hover:bg-muted"
            >
              💬 WhatsApp
            </a>
          ) : null}
          <Link
            href={`${base}/crm/${cliente.id}`}
            className="inline-flex h-9 items-center rounded-md border px-3 text-sm font-medium hover:bg-muted"
          >
            📇 Ficha del CRM
          </Link>
          <Link
            href={`${base}/clientes`}
            className="inline-flex h-9 items-center rounded-md border px-3 text-sm font-medium hover:bg-muted"
          >
            ← Volver
          </Link>
        </div>
      </div>

      <Card className="grid gap-4 p-4 sm:grid-cols-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Nombre / razón social</p>
          <InlineEdit endpoint={endpoint} field="name" value={cliente.name} />
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Teléfono</p>
          <InlineEdit endpoint={endpoint} field="phone" value={cliente.phone} placeholder="+ teléfono" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Email</p>
          <InlineEdit endpoint={endpoint} field="email" value={cliente.email} placeholder="+ email" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">CUIT</p>
          <InlineEdit
            endpoint={endpoint}
            field="cuit"
            value={custom.cuit ?? null}
            customBase={custom}
            placeholder="+ CUIT"
          />
        </div>
        <div className="sm:col-span-2">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Domicilio</p>
          <InlineEdit
            endpoint={endpoint}
            field="domicilio"
            value={custom.domicilio ?? null}
            customBase={custom}
            placeholder="+ domicilio"
          />
        </div>
      </Card>

      <NotasInternas endpoint={endpoint} field="notes" value={cliente.notes} />

      <Card className="p-4">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">🖥️ Sus pantallas contratadas</h2>
          <span className="text-sm text-muted-foreground">
            {totalSlots} spot{totalSlots === 1 ? "" : "s"} activos ·{" "}
            <strong className="text-foreground">{fmt(totalMensual)} por mes</strong>
          </span>
        </div>
        {contratos.length === 0 ? (
          <EmptyState
            icon="🖥️"
            title="Sin contratos"
            detail="Asignale una pantalla desde el módulo Pantallas y aparece acá."
          />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Pantalla</Th>
                <Th className="text-center">Spots</Th>
                <Th className="text-right">Por mes</Th>
                <Th>Estado</Th>
                <Th>Desde</Th>
              </tr>
            </thead>
            <tbody>
              {contratos.map((c) => {
                const est = ESTADO_CONTRATO[c.estado] ?? { label: c.estado, variant: "default" as const };
                return (
                  <tr key={c.id} className={c.estado === "activo" ? "" : "opacity-60"}>
                    <Td className="font-medium">
                      <Link
                        href={`${base}/pantallas#pantalla-${c.pantalla.id}`}
                        className="hover:text-primary hover:underline"
                      >
                        {c.pantalla.nombre}
                      </Link>
                      {c.pantalla.zona ? (
                        <span className="ml-1.5 text-xs text-muted-foreground">{c.pantalla.zona}</span>
                      ) : null}
                    </Td>
                    <Td className="text-center text-sm tabular-nums">{c.slots}</Td>
                    <Td className="text-right text-sm tabular-nums">
                      {c.montoMensual > 0 ? fmt(c.montoMensual) : <span className="text-warning">$ 0</span>}
                    </Td>
                    <Td>
                      <Badge variant={est.variant}>{est.label}</Badge>
                    </Td>
                    <Td className="text-sm text-muted-foreground">
                      {c.inicio ? fmtFecha(c.inicio) : fmtFecha(c.createdAt)}
                      {c.fin ? ` → ${fmtFecha(c.fin)}` : ""}
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </Card>

      <Card className="p-4">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-semibold">💵 Sus pagos</h2>
            <p className="text-xs text-muted-foreground">
              Ingresos de Finanzas que mencionan a este cliente
              {sinDesglosar > 0
                ? ` · ${sinDesglosar} sin desglosar (el movimiento junta varios clientes)`
                : ""}
              .
            </p>
          </div>
          <span className="text-sm">
            Acumulado: <strong>{fmt(acumulado)}</strong>
          </span>
        </div>
        {pagos.length === 0 ? (
          <EmptyState
            icon="💵"
            title="Todavía no hay pagos registrados"
            detail="Cargá el cobro en Finanzas nombrando al cliente en el concepto y aparece acá."
          />
        ) : (
          <ul className="divide-y text-sm">
            {pagos.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span className="min-w-0 break-words">
                  <span className="font-medium">{p.concept}</span>
                  {p.method ? (
                    <span className="ml-1.5 text-xs text-muted-foreground">({p.method})</span>
                  ) : null}
                </span>
                <span className="flex shrink-0 items-center gap-3">
                  <span className="text-xs text-muted-foreground">{fmtFecha(p.date)}</span>
                  {p.atribuido !== null ? (
                    <span className="tabular-nums font-medium">{fmt(p.atribuido)}</span>
                  ) : (
                    <span
                      className="tabular-nums text-xs text-muted-foreground"
                      title="El movimiento junta varios clientes: no se puede separar lo de este"
                    >
                      en un pago de {fmt(p.amountArs)}
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Adjuntos
        slug={tenant.slug}
        refType="contact"
        refId={cliente.id}
        titulo="Documentos del cliente"
        ayuda="Contratos firmados, facturas, comprobantes, el arte que mandó: subilos acá y quedan guardados con nombre y fecha."
        adjuntos={documentos}
      />
    </div>
  );
}
