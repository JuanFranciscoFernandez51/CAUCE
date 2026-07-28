import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import {
  fmtKm,
  fmtPrecioVehiculo,
  fotosDeVehiculo,
  nombreVehiculo,
  tipoLabel,
} from "@/lib/conce";
import { aCardVehiculo, CONCE_CARD_SELECT, getConceSite } from "../../_lib/conce-site";
import { ConceShell } from "../../_components/conce/conce-shell";
import { RC } from "@/lib/conce";
import { CarruselVehiculo } from "../../_components/conce/carrusel-vehiculo";
import { VehiculoCard } from "../../_components/conce/vehiculo-card";
import {
  CompartirBtn,
  FavoritoBtn,
  VistaPing,
} from "../../_components/conce/ficha-acciones";
import { ConsultaConceForm } from "../../_components/conce/consulta-conce-form";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; vslug: string }>;
}): Promise<Metadata> {
  const { slug, vslug } = await params;
  const site = await getConceSite(slug);
  if (!site) return { title: "Vehículo" };
  const v = await db.conceVehiculo.findFirst({
    where: { clientId: site.tenant.id, slug: vslug },
    select: { marca: true, modelo: true, version: true, anio: true, descripcion: true, fotos: true },
  });
  if (!v) return { title: site.info.nombre };
  const titulo = `${nombreVehiculo(v)} ${v.anio}`;
  const foto = fotosDeVehiculo(v.fotos)[0];
  return {
    title: `${titulo} — ${site.info.nombre}`,
    description: v.descripcion?.slice(0, 160) ?? titulo,
    robots: { index: false, follow: false },
    openGraph: {
      title: titulo,
      description: v.descripcion?.slice(0, 160) ?? titulo,
      ...(foto ? { images: [foto] } : {}),
    },
  };
}

export default async function VehiculoPage({
  params,
}: {
  params: Promise<{ slug: string; vslug: string }>;
}) {
  const { slug, vslug } = await params;
  const site = await getConceSite(slug);
  if (!site) notFound();
  const { tenant, info } = site;
  const base = `/sitio/${tenant.slug}`;

  const v = await db.conceVehiculo.findFirst({
    where: { clientId: tenant.id, slug: vslug },
  });
  if (!v || v.estado === "vendido") notFound();

  const fotos = fotosDeVehiculo(v.fotos);
  const titulo = `${nombreVehiculo(v)} ${v.anio}`;
  const es0km = v.condicion === "0km";

  const similares = await db.conceVehiculo.findMany({
    where: {
      clientId: tenant.id,
      estado: { not: "vendido" },
      id: { not: v.id },
      OR: [{ tipo: v.tipo }, { marca: v.marca }],
    },
    orderBy: { visitas: "desc" },
    take: 4,
    select: CONCE_CARD_SELECT,
  });

  const wa = info.whatsapp
    ? `https://wa.me/${info.whatsapp}?text=${encodeURIComponent(
        `Hola! Vi el ${titulo} en la web (${fmtPrecioVehiculo(v.precio, v.moneda)}) y quiero más info.`
      )}`
    : null;

  const ficha: { label: string; valor: string | null }[] = [
    { label: "Marca", valor: v.marca },
    { label: "Modelo", valor: v.modelo },
    { label: "Versión", valor: v.version },
    { label: "Año", valor: String(v.anio) },
    { label: "Kilómetros", valor: es0km ? "0 km" : fmtKm(v.km) },
    { label: "Condición", valor: es0km ? "0KM" : "Usado" },
    { label: "Transmisión", valor: v.transmision },
    { label: "Combustible", valor: v.combustible },
    { label: "Color", valor: v.color },
    { label: "Tipo", valor: tipoLabel(v.tipo) },
    { label: "Motor", valor: v.motor },
  ];

  return (
    <ConceShell info={info}>
      <VistaPing slug={tenant.slug} vehiculoId={v.id} />
      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Migas */}
        <nav className="mb-5 text-sm text-gray-500">
          <Link href={base} className="hover:underline">Inicio</Link>
          {" / "}
          <Link href={`${base}/catalogo?tipo=${encodeURIComponent(v.tipo)}`} className="hover:underline">
            {tipoLabel(v.tipo)}
          </Link>
          {" / "}
          <span className="text-gray-800">{titulo}</span>
        </nav>

        <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr]">
          <CarruselVehiculo fotos={fotos} alt={titulo} />

          <div>
            <div className="flex flex-wrap items-center gap-2">
              {es0km ? (
                <span className="rounded-full px-3 py-1 text-xs font-extrabold uppercase tracking-wide" style={{ backgroundColor: RC.dorado, color: "#0A0A0A" }}>
                  0KM
                </span>
              ) : (
                <span className="rounded-full bg-black px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
                  Usado
                </span>
              )}
              {v.oferta ? (
                <span className="rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide text-white" style={{ backgroundColor: "#EF4444" }}>
                  Oferta
                </span>
              ) : null}
              {v.destacado ? (
                <span className="rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide" style={{ backgroundColor: "#FACC15", color: "#713F12" }}>
                  ⭐ Destacado
                </span>
              ) : null}
              {v.estado === "reservado" ? (
                <span className="rounded-full border border-gray-400 px-3 py-1 text-xs font-bold uppercase tracking-wide text-gray-600">
                  Reservado
                </span>
              ) : null}
            </div>

            <h1 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
              {v.marca} <span style={{ color: RC.doradoTexto }}>{v.modelo}</span>
              {v.version ? <span className="font-semibold text-gray-500"> {v.version}</span> : null}
            </h1>
            <p className="mt-1.5 text-[15px] text-gray-500">
              {v.anio} · {es0km ? "0 km" : fmtKm(v.km)}
              {v.transmision ? ` · ${v.transmision}` : ""}
              {v.combustible ? ` · ${v.combustible}` : ""}
            </p>

            <p className="mt-5 text-4xl font-extrabold tracking-tight">
              {v.precio == null || v.precio <= 0 ? (
                <span style={{ color: RC.doradoTexto }}>Consultar precio</span>
              ) : (
                fmtPrecioVehiculo(v.precio, v.moneda)
              )}
            </p>

            {wa ? (
              <a
                href={wa}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 block rounded-full py-3.5 text-center text-base font-extrabold transition-transform hover:scale-[1.01]"
                style={{ backgroundColor: "#25D366", color: "#fff" }}
              >
                💬 Consultar por WhatsApp
              </a>
            ) : null}
            <div className="mt-3 flex flex-wrap gap-2">
              <FavoritoBtn slug={tenant.slug} vehiculoId={v.id} />
              <CompartirBtn titulo={titulo} />
              {info.mercadolibre ? (
                <a
                  href={info.mercadolibre}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border bg-white px-4 py-2.5 text-sm font-semibold hover:bg-gray-50"
                  style={{ borderColor: RC.borde }}
                >
                  🛒 Mercado Libre
                </a>
              ) : null}
            </div>

            {/* Ficha técnica */}
            <div className="mt-7 overflow-hidden rounded-3xl bg-white" style={{ border: `1px solid ${RC.borde}` }}>
              <p className="px-5 pt-4 text-xs font-bold uppercase tracking-widest" style={{ color: RC.doradoTexto }}>
                Ficha técnica
              </p>
              <dl className="grid grid-cols-2 gap-x-6 px-5 py-4">
                {ficha
                  .filter((f) => f.valor)
                  .map((f) => (
                    <div key={f.label} className="flex justify-between border-b py-2 text-sm last:border-b-0" style={{ borderColor: "#F3F0E9" }}>
                      <dt className="text-gray-500">{f.label}</dt>
                      <dd className="font-semibold">{f.valor}</dd>
                    </div>
                  ))}
              </dl>
            </div>

            {v.descripcion ? (
              <div className="mt-5 rounded-3xl p-5" style={{ backgroundColor: RC.doradoSuave }}>
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: RC.doradoTexto }}>
                  Descripción
                </p>
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-gray-700">
                  {v.descripcion}
                </p>
              </div>
            ) : null}
          </div>
        </div>

        {/* Similares */}
        {similares.length > 0 ? (
          <section className="mt-16">
            <h2 className="text-2xl font-extrabold tracking-tight">También te pueden interesar</h2>
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {similares.map((s) => (
                <VehiculoCard key={s.id} slug={tenant.slug} v={aCardVehiculo(s)} />
              ))}
            </div>
          </section>
        ) : null}

        {/* Consulta por este vehículo */}
        <section className="mx-auto mt-16 max-w-xl">
          <h2 className="text-center text-2xl font-extrabold tracking-tight">
            ¿Querés saber más sobre este vehículo?
          </h2>
          <p className="mt-1 text-center text-sm text-gray-500">
            Dejanos tus datos y te contactamos, o escribinos directo por WhatsApp.
          </p>
          <div className="mt-5">
            <ConsultaConceForm slug={tenant.slug} vehiculoId={v.id} vehiculoNombre={titulo} />
          </div>
        </section>
      </div>
    </ConceShell>
  );
}
