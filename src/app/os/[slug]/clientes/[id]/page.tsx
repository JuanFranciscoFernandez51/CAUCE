import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { esDooh, getTenantBySlug } from "@/lib/tenant";
import { esConcesionaria } from "@/lib/conce-server";
import {
  fmtPrecioVehiculo,
  nombreVehiculo,
  numeroOperacion,
  OPERACION_ESTADO_LABEL,
  permutasDe,
  rutaOperacion,
  VEHICULO_ESTADO_LABEL,
} from "@/lib/conce";
import { Badge, Card, EmptyState } from "@/components/ui";
import { Adjuntos, type AdjuntoData } from "../../_components/adjuntos";
import { InlineEdit } from "../../_components/inline-edit";
import { FichaClienteDooh } from "./ficha-dooh";

export const dynamic = "force-dynamic";

const fmtFecha = (d: Date) =>
  d.toLocaleDateString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" });

/**
 * Ficha del cliente: sus vehículos (comprados, entregados en consignación y
 * dados en permuta), TODOS los documentos generados sobre él con link al PDF,
 * y la carga de documentos escaneados (DNI, cédula) a Cloudinary.
 */
export default async function ClienteFichaPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) notFound();

  // Circuito de pantallas LED: ficha propia (contratos, pagos, documentos).
  if (esDooh(tenant)) return <FichaClienteDooh tenant={tenant} id={id} />;

  if (!esConcesionaria(tenant)) notFound();
  const base = `/os/${tenant.slug}`;

  const cliente = await db.contact.findFirst({
    where: { id, clientId: tenant.id },
    select: { id: true, name: true, phone: true, email: true, notes: true, createdAt: true },
  });
  if (!cliente) notFound();

  const [operaciones, docs, presupuestos] = await Promise.all([
    db.conceOperacion.findMany({
      where: { clientId: tenant.id, contactId: cliente.id },
      orderBy: [{ fecha: "desc" }],
      include: {
        vehiculo: {
          select: {
            id: true,
            marca: true,
            modelo: true,
            version: true,
            anio: true,
            dominio: true,
            estado: true,
            publicado: true,
            vendidoEl: true,
          },
        },
      },
    }),
    db.attachment.findMany({
      where: { clientId: tenant.id, refType: "contact", refId: cliente.id },
      orderBy: { createdAt: "asc" },
    }),
    db.presupuestoTaller.findMany({
      where: { clientId: tenant.id, contactId: cliente.id },
      orderBy: { numero: "desc" },
      select: { id: true, numero: true, totalArs: true, estado: true, createdAt: true },
    }),
  ]);

  const documentos: AdjuntoData[] = docs.map((a) => ({
    id: a.id,
    url: a.url,
    name: a.name,
    mime: a.mime,
  }));

  // Vehículos que pasaron por este cliente, por cómo llegaron.
  const comprados = operaciones.filter((o) => o.tipo === "BOLETO" && o.vehiculo);
  const consignados = operaciones.filter((o) => o.tipo === "MANDATO" && o.vehiculo);
  const permutaIds = operaciones
    .flatMap((o) => permutasDe(o.permutas))
    .map((p) => p.vehiculoId)
    .filter((v): v is string => Boolean(v));
  const permutados = permutaIds.length
    ? await db.conceVehiculo.findMany({
        where: { clientId: tenant.id, id: { in: permutaIds } },
        select: { id: true, marca: true, modelo: true, anio: true, estado: true, publicado: true },
      })
    : [];

  const endpoint = `/api/os/${tenant.slug}/contacts/${cliente.id}`;

  const filaVehiculo = (
    key: string,
    href: string,
    titulo: string,
    detalle: string,
    estado: string
  ) => (
    <li key={key} className="flex flex-wrap items-center justify-between gap-2 border-b py-2 last:border-0">
      <Link href={href} className="font-medium hover:text-primary hover:underline">
        🚗 {titulo}
      </Link>
      <span className="flex items-center gap-2 text-sm">
        <span className="text-xs text-muted-foreground">{detalle}</span>
        <Badge
          variant={
            estado === "disponible" ? "success" : estado === "reservado" ? "warning" : "destructive"
          }
        >
          {VEHICULO_ESTADO_LABEL[estado] ?? estado}
        </Badge>
      </span>
    </li>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{cliente.name}</h1>
          <p className="text-sm text-muted-foreground">
            Cliente desde el {fmtFecha(cliente.createdAt)} · {operaciones.length} operación(es)
          </p>
        </div>
        <div className="flex items-center gap-2">
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
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Teléfono</p>
          <InlineEdit endpoint={endpoint} field="phone" value={cliente.phone} placeholder="+ teléfono" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Email</p>
          <InlineEdit endpoint={endpoint} field="email" value={cliente.email} placeholder="+ email" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Nombre</p>
          <InlineEdit endpoint={endpoint} field="name" value={cliente.name} />
        </div>
      </Card>

      <Card className="p-4">
        <h2 className="mb-2 font-semibold">🚗 Sus vehículos</h2>
        {comprados.length === 0 && consignados.length === 0 && permutados.length === 0 ? (
          <p className="rounded-md border border-dashed px-4 py-5 text-center text-sm text-muted-foreground">
            Todavía no hay vehículos vinculados a este cliente.
          </p>
        ) : (
          <div className="space-y-4">
            {comprados.length > 0 ? (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Comprados / entregados
                </p>
                <ul>
                  {comprados.map((o) =>
                    filaVehiculo(
                      `c-${o.id}`,
                      `${base}/stock/${o.vehiculo!.id}`,
                      `${nombreVehiculo(o.vehiculo!)} ${o.vehiculo!.anio}`,
                      `${numeroOperacion(o.tipo, o.numero)}${
                        o.vehiculo!.vendidoEl ? ` · entregado el ${fmtFecha(o.vehiculo!.vendidoEl)}` : ""
                      }`,
                      o.vehiculo!.estado
                    )
                  )}
                </ul>
              </div>
            ) : null}

            {consignados.length > 0 ? (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Dejados en consignación (mandato)
                </p>
                <ul>
                  {consignados.map((o) =>
                    filaVehiculo(
                      `m-${o.id}`,
                      `${base}/stock/${o.vehiculo!.id}`,
                      `${nombreVehiculo(o.vehiculo!)} ${o.vehiculo!.anio}`,
                      `${numeroOperacion(o.tipo, o.numero)}${
                        o.vehiculo!.publicado ? "" : " · sin publicar"
                      }`,
                      o.vehiculo!.estado
                    )
                  )}
                </ul>
              </div>
            ) : null}

            {permutados.length > 0 ? (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Dados en permuta
                </p>
                <ul>
                  {permutados.map((v) =>
                    filaVehiculo(
                      `p-${v.id}`,
                      `${base}/stock/${v.id}`,
                      `${v.marca} ${v.modelo} ${v.anio}`,
                      v.publicado ? "en la web" : "sin publicar",
                      v.estado
                    )
                  )}
                </ul>
              </div>
            ) : null}
          </div>
        )}
      </Card>

      <Card className="p-4">
        <h2 className="mb-2 font-semibold">📄 Documentos generados</h2>
        {operaciones.length === 0 && presupuestos.length === 0 ? (
          <EmptyState
            icon="📄"
            title="Sin documentos"
            detail="Los mandatos y boletos que le hagas aparecen acá con su PDF."
          />
        ) : (
          <ul className="divide-y text-sm">
            {operaciones.map((o) => (
              <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <Link
                  href={`${base}/${rutaOperacion(o.tipo)}/${o.id}`}
                  className="font-medium hover:text-primary hover:underline"
                >
                  {o.tipo === "MANDATO" ? "📝 Mandato" : "🧾 Boleto"} {numeroOperacion(o.tipo, o.numero)}
                  <span className="ml-1.5 font-normal text-muted-foreground">
                    {fmtPrecioVehiculo(o.precio, o.moneda)}
                  </span>
                </Link>
                <span className="flex items-center gap-2">
                  <Badge
                    variant={
                      o.estado === "VIGENTE"
                        ? "warning"
                        : o.estado === "FIRMADO"
                          ? "primary"
                          : o.estado === "CONCRETADA"
                            ? "success"
                            : "destructive"
                    }
                  >
                    {OPERACION_ESTADO_LABEL[o.estado] ?? o.estado}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{fmtFecha(o.fecha)}</span>
                  <Link
                    href={`${base}/${rutaOperacion(o.tipo)}/${o.id}/imprimir`}
                    title="Ver el PDF"
                    className="text-muted-foreground/60 hover:text-primary"
                  >
                    🖨️
                  </Link>
                </span>
              </li>
            ))}
            {presupuestos.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <Link
                  href={`${base}/presupuestos/${p.id}`}
                  className="font-medium hover:text-primary hover:underline"
                >
                  💲 Presupuesto P-{String(p.numero).padStart(4, "0")}
                </Link>
                <span className="flex items-center gap-2 text-xs text-muted-foreground">
                  $ {Math.round(p.totalArs).toLocaleString("es-AR")} · {fmtFecha(p.createdAt)}
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
        titulo="Documentación escaneada"
        ayuda="DNI, cédula verde, título, autorizaciones: subilos acá y quedan guardados con nombre y fecha."
        adjuntos={documentos}
      />
    </div>
  );
}
