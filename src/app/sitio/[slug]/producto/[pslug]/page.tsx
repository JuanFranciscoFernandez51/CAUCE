import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { fmtCuota, fmtPrecio, fotosDe, precioVigente } from "@/lib/bazar";
import { aCard, BAZAR_CARD_SELECT, getBazarSite } from "../../_lib/bazar-site";
import { BazarShell, BZ } from "../../_components/bazar/bazar-shell";
import { Carrusel } from "../../_components/bazar/carrusel";
import { AgregarControls } from "../../_components/bazar/agregar-controls";
import { ProductoCard } from "../../_components/bazar/producto-card";
import { VistaPing } from "../../_components/bazar/vista-ping";
import { ConsultaBazarForm } from "../../_components/bazar/consulta-bazar-form";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; pslug: string }>;
}): Promise<Metadata> {
  const { slug, pslug } = await params;
  const site = await getBazarSite(slug);
  if (!site) return { title: "Producto" };
  const producto = await db.bazarProducto.findFirst({
    where: { clientId: site.tenant.id, slug: pslug },
    select: { nombre: true, descripcion: true, fotos: true },
  });
  if (!producto) return { title: site.info.nombre };
  const foto = fotosDe(producto.fotos)[0];
  return {
    title: `${producto.nombre} — ${site.info.nombre}`,
    description: producto.descripcion?.slice(0, 160) ?? producto.nombre,
    robots: { index: false, follow: false },
    openGraph: {
      title: producto.nombre,
      description: producto.descripcion?.slice(0, 160) ?? producto.nombre,
      ...(foto ? { images: [foto] } : {}),
    },
  };
}

export default async function ProductoPage({
  params,
}: {
  params: Promise<{ slug: string; pslug: string }>;
}) {
  const { slug, pslug } = await params;
  const site = await getBazarSite(slug);
  if (!site) notFound();
  const { tenant, info } = site;
  const base = `/sitio/${tenant.slug}`;

  const producto = await db.bazarProducto.findFirst({
    where: { clientId: tenant.id, slug: pslug, activo: true },
  });
  if (!producto) notFound();

  const fotos = fotosDe(producto.fotos);
  const vigente = precioVigente(producto);
  const enOferta = producto.precioOferta != null && producto.precioOferta < producto.precio;

  const relacionados = await db.bazarProducto.findMany({
    where: {
      clientId: tenant.id,
      activo: true,
      categoria: producto.categoria,
      id: { not: producto.id },
    },
    orderBy: { vendidos: "desc" },
    take: 4,
    select: BAZAR_CARD_SELECT,
  });

  const wa = info.whatsapp
    ? `https://wa.me/${info.whatsapp}?text=${encodeURIComponent(`Hola! Quiero consultar por "${producto.nombre}" (${fmtPrecio(vigente)})`)}`
    : null;

  return (
    <BazarShell info={info}>
      <VistaPing slug={tenant.slug} productoId={producto.id} />
      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Migas */}
        <nav className="mb-5 text-sm text-gray-500">
          <Link href={base} className="hover:underline">
            Inicio
          </Link>
          {" / "}
          <Link
            href={`${base}/tienda?categoria=${encodeURIComponent(producto.categoria)}`}
            className="hover:underline"
          >
            {producto.categoria}
          </Link>
          {" / "}
          <span className="text-gray-700">{producto.nombre}</span>
        </nav>

        <div className="grid gap-10 md:grid-cols-2">
          <Carrusel fotos={fotos} alt={producto.nombre} />

          <div>
            <p className="text-sm font-semibold uppercase tracking-wide" style={{ color: BZ.aqua }}>
              {producto.categoria}
              {producto.sku ? ` · ${producto.sku}` : ""}
            </p>
            <h1
              className="mt-1 text-3xl font-extrabold leading-tight tracking-tight"
              style={{ color: BZ.azul }}
            >
              {producto.nombre}
            </h1>

            <div className="mt-4 flex items-end gap-3">
              <p className="text-4xl font-extrabold" style={{ color: BZ.azul }}>
                {fmtPrecio(vigente)}
              </p>
              {enOferta ? (
                <p className="pb-1 text-lg text-gray-400 line-through">
                  {fmtPrecio(producto.precio)}
                </p>
              ) : null}
            </div>
            <p className="mt-1 text-sm text-gray-500">
              3 cuotas sin recargo de <strong>{fmtCuota(vigente, 3)}</strong> · 6 cuotas de{" "}
              {fmtCuota(vigente, 6)}
            </p>

            <p className="mt-3 text-sm">
              {producto.stock > 3 ? (
                <span className="font-medium" style={{ color: BZ.aqua }}>
                  ✔ En stock, listo para enviar
                </span>
              ) : producto.stock > 0 ? (
                <span className="font-semibold text-amber-600">
                  ⚠ ¡Últimas {producto.stock} unidad{producto.stock === 1 ? "" : "es"}!
                </span>
              ) : (
                <span className="font-medium text-gray-400">Sin stock</span>
              )}
            </p>

            <div className="mt-6">
              <AgregarControls
                productoId={producto.id}
                nombre={producto.nombre}
                precio={vigente}
                foto={fotos[0] ?? null}
                stock={producto.stock}
              />
            </div>

            {wa ? (
              <a
                href={wa}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 block rounded-full border-2 py-3 text-center font-semibold transition-colors hover:bg-[#F6F1E8]"
                style={{ borderColor: BZ.aquaClaro, color: BZ.azul }}
              >
                💬 Consultanos por WhatsApp
              </a>
            ) : null}

            {producto.descripcion ? (
              <div className="mt-7 rounded-2xl p-5" style={{ backgroundColor: "#FBF9F4" }}>
                <h2 className="text-sm font-bold uppercase tracking-wide" style={{ color: BZ.azul }}>
                  Descripción
                </h2>
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-gray-600">
                  {producto.descripcion}
                </p>
              </div>
            ) : null}

            <ul className="mt-5 space-y-1 text-sm text-gray-500">
              <li>🚚 Envíos a todo el país</li>
              <li>🏖️ Retiro sin cargo por el local en Monte Hermoso</li>
            </ul>
          </div>
        </div>

        {/* Relacionados */}
        {relacionados.length > 0 ? (
          <section className="mt-14">
            <h2 className="text-2xl font-bold tracking-tight" style={{ color: BZ.azul }}>
              También te puede gustar
            </h2>
            <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {relacionados.map((p) => (
                <ProductoCard key={p.id} slug={tenant.slug} p={aCard(p)} />
              ))}
            </div>
          </section>
        ) : null}

        {/* Consulta por este producto */}
        <section className="mx-auto mt-14 max-w-lg">
          <h2 className="text-center text-2xl font-bold tracking-tight" style={{ color: BZ.azul }}>
            ¿Tenés una duda sobre este producto?
          </h2>
          <div className="mt-5">
            <ConsultaBazarForm
              slug={tenant.slug}
              productoId={producto.id}
              productoNombre={producto.nombre}
            />
          </div>
        </section>
      </div>
    </BazarShell>
  );
}
