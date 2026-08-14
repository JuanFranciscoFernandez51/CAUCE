import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getTenantBySlug } from "@/lib/tenant";
import { esBazar, bazarSettings } from "@/lib/bazar-server";
import { igConexionDe } from "@/lib/bazar-ig";
import { fotosDe, captionAuto } from "@/lib/bazar";
import { argMonthStr, addMonths, fmtMonthLabel, monthGrid, argDateStr } from "../_lib/dates";
import {
  InstagramPanel,
  type ProductoIg,
  type PublicacionIg,
} from "../_components/bazar/instagram-panel";

export const dynamic = "force-dynamic";

/**
 * Instagram del bazar: grilla de productos para publicar ahora o programar,
 * calendario mensual con lo programado/publicado y estado de la conexión.
 */
export default async function InstagramPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ mes?: string; q?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const tenant = await getTenantBySlug(slug);
  const tplIg = (tenant?.settings as { template?: string } | null)?.template;
  if (!tenant || !(esBazar(tenant) || tplIg === "piletas")) notFound();
  const base = `/os/${tenant.slug}`;

  const conexion = igConexionDe(tenant);
  const igUsername = conexion?.igUsername ?? bazarSettings(tenant).instagram ?? null;

  const mes = /^\d{4}-\d{2}$/.test(sp.mes ?? "") ? (sp.mes as string) : argMonthStr();
  const [y, m] = mes.split("-").map(Number);
  const mesSig = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
  const desde = new Date(`${mes}-01T00:00:00-03:00`);
  const hasta = new Date(`${mesSig}-01T00:00:00-03:00`);

  const q = (sp.q ?? "").trim();
  const [productosDb, pubsDb] = await Promise.all([
    db.bazarProducto.findMany({
      where: {
        clientId: tenant.id,
        activo: true,
        ...(q ? { nombre: { contains: q, mode: "insensitive" } } : {}),
      },
      orderBy: [{ destacado: "desc" }, { vendidos: "desc" }],
      take: 24,
      select: {
        id: true,
        nombre: true,
        precio: true,
        precioOferta: true,
        fotos: true,
      },
    }),
    db.bazarPublicacion.findMany({
      where: {
        clientId: tenant.id,
        OR: [
          { programadaPara: { gte: desde, lt: hasta } },
          { publicadaEn: { gte: desde, lt: hasta } },
          { estado: { in: ["PROGRAMADA", "ERROR"] } }, // pendientes siempre visibles
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 200,
      include: { producto: { select: { nombre: true, fotos: true } } },
    }),
  ]);

  const productos: ProductoIg[] = productosDb.map((p) => ({
    id: p.id,
    nombre: p.nombre,
    foto: fotosDe(p.fotos)[0] ?? null,
    cantFotos: fotosDe(p.fotos).length,
    captionAuto: captionAuto(p),
  }));

  const publicaciones: PublicacionIg[] = pubsDb.map((p) => ({
    id: p.id,
    productoNombre: p.producto?.nombre ?? "Publicación",
    fotos: fotosDe(p.fotos),
    foto: fotosDe(p.fotos)[0] ?? (p.producto ? fotosDe(p.producto.fotos)[0] : null) ?? null,
    caption: p.caption,
    estado: p.estado,
    error: p.error,
    programadaPara: p.programadaPara?.toISOString() ?? null,
    publicadaEn: p.publicadaEn?.toISOString() ?? null,
    dia: p.programadaPara
      ? argDateStr(p.programadaPara)
      : p.publicadaEn
        ? argDateStr(p.publicadaEn)
        : null,
  }));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Instagram</h1>
          <p className="text-sm text-muted-foreground">
            Publicá productos ahora o dejalos programados — el sistema los sube solo.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Link
            href={`${base}/instagram?mes=${addMonths(mes, -1)}`}
            className="rounded-md border px-2.5 py-1.5 hover:bg-muted"
          >
            ←
          </Link>
          <span className="min-w-32 text-center font-medium capitalize">{fmtMonthLabel(mes)}</span>
          <Link
            href={`${base}/instagram?mes=${addMonths(mes, 1)}`}
            className="rounded-md border px-2.5 py-1.5 hover:bg-muted"
          >
            →
          </Link>
        </div>
      </div>

      <InstagramPanel
        slug={tenant.slug}
        conectado={Boolean(conexion)}
        igUsername={igUsername}
        productos={productos}
        publicaciones={publicaciones}
        weeks={monthGrid(mes)}
        hoy={argDateStr()}
        q={q}
      />
    </div>
  );
}
