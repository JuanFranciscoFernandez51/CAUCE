import Link from "next/link";
import type { Client } from "@prisma/client";
import { db } from "@/lib/db";
import { CONCE_TIPOS } from "@/lib/conce";
import { conceSettings } from "@/lib/conce-server";
import {
  aCardVehiculo,
  CONCE_CARD_SELECT,
  conceMarcas,
  type ConceShellInfo,
} from "../../_lib/conce-site";
import { ConceShell } from "./conce-shell";
import { RC } from "@/lib/conce";
import { VehiculoCard } from "./vehiculo-card";
import { Reveal } from "./reveal";
import { IconAuto, IconLlave, IconBillete, IconDoc, IconMedalla, IconEstrella } from "./iconos";

/**
 * Home del template CONCESIONARIA: hero negro con buscador, banda de
 * beneficios, entradas 0KM/Usados, 12 categorías clickeables, Destacados,
 * Ofertas, Ingresos recientes y teaser Nosotros. Acabados Menta (mega
 * tarjetas, títulos grandes, reveals) con la marca negro+dorado de Ri Cars.
 */
export async function ConceHome({ tenant, info }: { tenant: Client; info: ConceShellInfo }) {
  const base = `/sitio/${tenant.slug}`;
  const s = conceSettings(tenant);
  const activos = { clientId: tenant.id, estado: { not: "vendido" }, publicado: true } as const;

  const [marcas, destacados, ofertas, recientes, count0km, countUsados, tiposFotos] =
    await Promise.all([
      conceMarcas(tenant.id),
      db.conceVehiculo.findMany({
        where: { ...activos, destacado: true },
        orderBy: { visitas: "desc" },
        take: 8,
        select: CONCE_CARD_SELECT,
      }),
      db.conceVehiculo.findMany({
        where: { ...activos, oferta: true },
        orderBy: { visitas: "desc" },
        take: 4,
        select: CONCE_CARD_SELECT,
      }),
      db.conceVehiculo.findMany({
        where: activos,
        orderBy: { ingresadoEl: "desc" },
        take: 8,
        select: CONCE_CARD_SELECT,
      }),
      db.conceVehiculo.count({ where: { ...activos, condicion: "0km" } }),
      db.conceVehiculo.count({ where: { ...activos, condicion: "usado" } }),
      // Portada por categoría: el vehículo más caro que tengamos en stock de ese tipo
      // (los USD primero, que son los de mayor valor). Cambia solo con el stock real.
      db.conceVehiculo.findMany({
        where: { ...activos, publicado: true },
        orderBy: [{ moneda: "desc" }, { precio: "desc" }],
        distinct: ["tipo"],
        select: { tipo: true, fotos: true },
      }),
    ]);

  const fotoDeTipo = new Map<string, string | null>();
  for (const t of tiposFotos) {
    const f = Array.isArray(t.fotos) && typeof t.fotos[0] === "string" ? t.fotos[0] : null;
    fotoDeTipo.set(t.tipo, f);
  }
  const heroFoto =
    (destacados[0] && Array.isArray(destacados[0].fotos) && (destacados[0].fotos as string[])[0]) ||
    null;

  return (
    <ConceShell info={info}>
      {/* ── Hero con buscador ── */}
      <section className="px-3 pt-4">
        <div
          className="relative mx-auto max-w-[1500px] overflow-hidden rounded-[2.5rem] px-5 py-20 sm:px-12 sm:py-28 lg:py-32"
          style={{ backgroundColor: RC.negro }}
        >
          {heroFoto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={heroFoto}
              alt=""
              className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-25"
            />
          ) : null}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/30" />
          <div className="relative">
            <p
              className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider"
              style={{ backgroundColor: RC.dorado, color: "#0A0A0A" }}
            >
              <IconAuto className="h-4 w-4" />
              Multimarcas 0KM y Usados · Bahía Blanca
            </p>
            <h1 className="mt-6 max-w-4xl text-5xl font-extrabold leading-[1.02] tracking-tight text-white sm:text-7xl lg:text-[84px]">
              Encontrá tu <span style={{ color: RC.dorado }}>auto ideal</span>
            </h1>
            <p className="mt-5 max-w-2xl text-base text-gray-300 sm:text-xl">
              {s.claim ??
                "Más de 15 años acompañándote en la compra de tu vehículo, con permutas, gestoría y atención personalizada."}
            </p>

            {/* Buscador → /catalogo */}
            <form
              method="get"
              action={`${base}/catalogo`}
              className="mt-8 grid max-w-3xl gap-2.5 rounded-3xl bg-white/95 p-3 backdrop-blur sm:grid-cols-2 lg:grid-cols-5"
            >
              <select
                name="marca"
                defaultValue=""
                className="h-11 rounded-xl border bg-white px-3 text-sm outline-none"
                style={{ borderColor: RC.borde }}
              >
                <option value="">Todas las marcas</option>
                {marcas.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              <input
                name="q"
                placeholder="Modelo (ej: Amarok)"
                className="h-11 rounded-xl border bg-white px-3 text-sm outline-none"
                style={{ borderColor: RC.borde }}
              />
              <select
                name="precio"
                defaultValue=""
                className="h-11 rounded-xl border bg-white px-3 text-sm outline-none"
                style={{ borderColor: RC.borde }}
              >
                <option value="">Cualquier precio</option>
                <option value="ars-20000000">Hasta $ 20M</option>
                <option value="ars-40000000">Hasta $ 40M</option>
                <option value="ars-60000000">Hasta $ 60M</option>
                <option value="usd-20000">Hasta US$ 20.000</option>
                <option value="usd-50000">Hasta US$ 50.000</option>
              </select>
              <select
                name="tipo"
                defaultValue=""
                className="h-11 rounded-xl border bg-white px-3 text-sm outline-none"
                style={{ borderColor: RC.borde }}
              >
                <option value="">Todos los tipos</option>
                {CONCE_TIPOS.map((t) => (
                  <option key={t.valor} value={t.valor}>
                    {t.label}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold transition-opacity hover:opacity-90"
                style={{ backgroundColor: RC.dorado, color: "#0A0A0A" }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="h-4 w-4" aria-hidden>
                  <circle cx="11" cy="11" r="6.5" />
                  <path d="m16 16 4.5 4.5" strokeLinecap="round" />
                </svg>
                Buscar
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* ── Banda de beneficios ── */}
      <BandaBeneficios />

      {/* ── 0KM / Usados ── */}
      <section className="mx-auto max-w-6xl px-4 py-8">
        <Reveal>
          <div className="grid gap-4 sm:grid-cols-2">
            <Link
              href={`${base}/catalogo?condicion=0km`}
              className="group relative overflow-hidden rounded-[2rem] p-8 transition-transform hover:-translate-y-1"
              style={{ backgroundColor: RC.negro }}
            >
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: RC.dorado }}>
                Entrega inmediata
              </p>
              <h2 className="mt-2 text-3xl font-extrabold text-white">Vehículos 0KM</h2>
              <p className="mt-2 text-sm text-gray-400">
                {count0km} unidades nuevas de fábrica, con garantía oficial.
              </p>
              <span
                className="mt-5 inline-block rounded-full px-5 py-2.5 text-sm font-bold transition-transform group-hover:scale-105"
                style={{ backgroundColor: RC.dorado, color: "#0A0A0A" }}
              >
                Ver 0KM →
              </span>
            </Link>
            <Link
              href={`${base}/catalogo?condicion=usado`}
              className="group relative overflow-hidden rounded-[2rem] bg-white p-8 transition-transform hover:-translate-y-1"
              style={{ border: `1px solid ${RC.borde}` }}
            >
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: RC.doradoTexto }}>
                Seleccionados y verificados
              </p>
              <h2 className="mt-2 text-3xl font-extrabold">Usados con respaldo</h2>
              <p className="mt-2 text-sm text-gray-500">
                {countUsados} usados revisados uno por uno, con permuta y financiación.
              </p>
              <span
                className="mt-5 inline-block rounded-full px-5 py-2.5 text-sm font-bold text-white transition-transform group-hover:scale-105"
                style={{ backgroundColor: RC.negro }}
              >
                Ver usados →
              </span>
            </Link>
          </div>
        </Reveal>
      </section>

      {/* ── Explorar por categoría ── */}
      <section className="mx-auto max-w-6xl px-4 py-8">
        <Reveal>
          <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            Explorá por categoría
          </h2>
        </Reveal>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {CONCE_TIPOS.map((t, i) => {
            const foto = fotoDeTipo.get(t.valor) ?? null;
            return (
              <Reveal key={t.valor} delay={(i % 6) * 60}>
                <Link
                  href={`${base}/catalogo?tipo=${encodeURIComponent(t.valor)}`}
                  className="group relative block aspect-[4/3] overflow-hidden rounded-2xl"
                  style={{ backgroundColor: RC.negro }}
                >
                  {foto ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={foto}
                      alt={t.label}
                      loading="lazy"
                      className="h-full w-full object-cover opacity-80 transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center opacity-40">
                      <IconAuto className="h-10 w-10 text-white" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <p className="absolute bottom-2.5 left-3.5 right-2 text-[13px] font-semibold tracking-wide text-white drop-shadow-[0_1px_6px_rgba(0,0,0,0.9)]">
                    {t.label}
                  </p>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* ── Destacados ── */}
      {destacados.length > 0 ? (
        <section className="mx-auto max-w-6xl px-4 py-8">
          <Reveal>
            <div className="mb-6 flex items-end justify-between gap-3">
              <div>
                <h2 className="flex items-center gap-2.5 text-2xl font-extrabold tracking-tight sm:text-3xl">
                  <IconEstrella className="h-6 w-6" style={{ color: RC.dorado }} />
                  Vehículos destacados
                </h2>
                <p className="text-sm text-gray-500">La selección de la casa</p>
              </div>
              <Link
                href={`${base}/catalogo?orden=vistos`}
                className="shrink-0 text-sm font-bold hover:underline"
                style={{ color: RC.doradoTexto }}
              >
                Ver todos →
              </Link>
            </div>
          </Reveal>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {destacados.map((v, i) => (
              <Reveal key={v.id} delay={(i % 4) * 80}>
                <VehiculoCard slug={tenant.slug} v={aCardVehiculo(v)} />
              </Reveal>
            ))}
          </div>
        </section>
      ) : null}

      {/* ── Ofertas ── */}
      {ofertas.length > 0 ? (
        <section className="px-3 py-8">
          <div
            className="mx-auto max-w-6xl rounded-[2.5rem] px-4 py-10 sm:px-8"
            style={{ backgroundColor: RC.negro }}
          >
            <Reveal>
              <div className="mb-6 flex items-end justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                    Ofertas especiales
                  </h2>
                  <p className="text-sm text-gray-400">Oportunidades por tiempo limitado</p>
                </div>
                <Link
                  href={`${base}/catalogo`}
                  className="shrink-0 text-sm font-bold hover:underline"
                  style={{ color: RC.dorado }}
                >
                  Ver catálogo →
                </Link>
              </div>
            </Reveal>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {ofertas.map((v, i) => (
                <Reveal key={v.id} delay={(i % 4) * 80}>
                  <VehiculoCard slug={tenant.slug} v={aCardVehiculo(v)} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* ── Ingresos recientes ── */}
      {recientes.length > 0 ? (
        <section className="mx-auto max-w-6xl px-4 py-8">
          <Reveal>
            <div className="mb-6 flex items-end justify-between gap-3">
              <div>
                <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                  Recién ingresados
                </h2>
                <p className="text-sm text-gray-500">Lo último que entró al salón</p>
              </div>
              <Link
                href={`${base}/catalogo?orden=recientes`}
                className="shrink-0 text-sm font-bold hover:underline"
                style={{ color: RC.doradoTexto }}
              >
                Ver todos →
              </Link>
            </div>
          </Reveal>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {recientes.map((v, i) => (
              <Reveal key={v.id} delay={(i % 4) * 80}>
                <VehiculoCard slug={tenant.slug} v={aCardVehiculo(v)} />
              </Reveal>
            ))}
          </div>
        </section>
      ) : null}

      {/* ── Teaser Nosotros ── */}
      <section className="mx-auto max-w-6xl px-4 py-10">
        <Reveal>
          <div
            className="grid items-center gap-8 rounded-[2.5rem] bg-white p-8 sm:p-10 md:grid-cols-2"
            style={{ border: `1px solid ${RC.borde}` }}
          >
            <div>
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: RC.doradoTexto }}>
                Desde 2008 en Bahía Blanca
              </p>
              <h2 className="mt-2 text-3xl font-extrabold tracking-tight">
                Tu concesionaria de confianza
              </h2>
              <p className="mt-3 text-[15px] leading-relaxed text-gray-600">
                Fundada por Ricardo Gomez, Ri Cars nació como un pequeño concesionario en el
                corazón de Bahía Blanca. Hoy somos una de las concesionarias más respetadas de la
                región: transparencia, honestidad y compromiso con cada cliente.
              </p>
              <Link
                href={`${base}/nosotros`}
                className="mt-5 inline-block rounded-full px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: RC.negro }}
              >
                Nuestra historia →
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {(s.nosotros?.numeros ?? []).slice(0, 4).map((n) => (
                <div
                  key={n.label}
                  className="rounded-2xl p-5 text-center"
                  style={{ backgroundColor: RC.doradoSuave }}
                >
                  <p className="text-3xl font-extrabold tracking-tight" style={{ color: RC.doradoTexto }}>
                    {n.valor}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-gray-600">{n.label}</p>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </section>
    </ConceShell>
  );
}


/** Banda de beneficios que se desplaza sola (marquee CSS, sin JS ni librerías). */
function BandaBeneficios() {
  const items = [
    { Icono: IconLlave, texto: "Tomamos tu usado en parte de pago" },
    { Icono: IconBillete, texto: "Financiación a tu medida" },
    { Icono: IconDoc, texto: "Gestoría y transferencia incluidas" },
    { Icono: IconMedalla, texto: "+15 años de trayectoria en Bahía Blanca" },
    { Icono: IconAuto, texto: "0KM y usados seleccionados" },
  ];
  const fila = [...items, ...items];
  return (
    <section className="overflow-hidden border-y py-3.5" style={{ borderColor: RC.borde, backgroundColor: "#fff" }}>
      <style>{`
        @keyframes conce-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .conce-marquee { animation: conce-marquee 32s linear infinite; }
        .conce-marquee:hover { animation-play-state: paused; }
        @media (prefers-reduced-motion: reduce) { .conce-marquee { animation: none; } }
      `}</style>
      <div className="conce-marquee flex w-max items-center gap-10 pr-10">
        {fila.map(({ Icono, texto }, i) => (
          <span key={i} className="flex shrink-0 items-center gap-2.5 text-[13.5px] font-semibold tracking-wide text-gray-700">
            <Icono className="h-[18px] w-[18px] shrink-0" style={{ color: RC.dorado }} />
            {texto}
            <span className="ml-8 h-1 w-1 rounded-full" style={{ backgroundColor: RC.dorado }} />
          </span>
        ))}
      </div>
    </section>
  );
}
