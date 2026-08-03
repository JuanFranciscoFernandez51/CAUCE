import Link from "next/link";
import type { Client } from "@prisma/client";
import { db } from "@/lib/db";
import { bazarSettings } from "@/lib/bazar-server";
import { BAZAR_CARD_SELECT, aCard, type BazarShellInfo } from "../../_lib/bazar-site";
import { BazarShell, BZ } from "./bazar-shell";
import { ProductoCard } from "./producto-card";

/**
 * Home del template BAZAR: hero con foto real + claim, tiles de categorías,
 * "Nuevos ingresos", "Los más pedidos", banda de beneficios, teaser Quiénes
 * somos y footer completo. Divina y aireada — nada oscuro.
 */
export async function BazarHome({ tenant, info }: { tenant: Client; info: BazarShellInfo }) {
  const base = `/sitio/${tenant.slug}`;
  const settings = bazarSettings(tenant);
  const fotos = (settings.fotos ?? []).filter(Boolean);

  const [nuevos, masPedidos, tilesFotos] = await Promise.all([
    db.bazarProducto.findMany({
      where: { clientId: tenant.id, activo: true },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: BAZAR_CARD_SELECT,
    }),
    db.bazarProducto.findMany({
      where: { clientId: tenant.id, activo: true, vendidos: { gt: 0 } },
      orderBy: { vendidos: "desc" },
      take: 8,
      select: BAZAR_CARD_SELECT,
    }),
    // Una foto por categoría para los tiles (el producto más vendido con foto).
    db.bazarProducto.findMany({
      where: { clientId: tenant.id, activo: true },
      orderBy: [{ destacado: "desc" }, { vendidos: "desc" }],
      distinct: ["categoria"],
      select: { categoria: true, fotos: true },
    }),
  ]);

  const fotoDeCategoria = new Map<string, string | null>();
  for (const t of tilesFotos) {
    const f = Array.isArray(t.fotos) && typeof t.fotos[0] === "string" ? t.fotos[0] : null;
    fotoDeCategoria.set(t.categoria, f);
  }

  const heroFoto = fotos[0] ?? null;
  const teaserFoto = fotos[1] ?? fotos[0] ?? null;

  return (
    <BazarShell info={info}>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden" style={{ backgroundColor: "var(--t-suave)" }}>
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-12 sm:py-16 md:grid-cols-2">
          <div>
            <p
              className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide text-white"
              style={{ backgroundColor: "var(--tpl, #3FA9A5)", color: "var(--tpl-sobre, #fff)" }}
            >
               Bazar de playa · Monte Hermoso
            </p>
            <h1
              className="mt-4 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl"
              style={{ color: "var(--t-texto)" }}
            >
              Tu casa con onda de mar
            </h1>
            <p className="mt-4 max-w-md text-base t-tenue sm:text-lg">
              Vajilla, textiles y deco elegidos pieza por pieza. Envíos a todo el país desde la
              costa.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href={`${base}/tienda`}
                className="rounded-full px-7 py-3.5 text-base font-semibold text-white shadow-lg transition-transform hover:scale-[1.02]"
                style={{ backgroundColor: "var(--tpl, #3FA9A5)", color: "var(--tpl-sobre, #fff)" }}
              >
                Ver la tienda
              </Link>
              <Link
                href={`${base}/quienes-somos`}
                className="rounded-full border-2 t-card px-7 py-3.5 text-base font-semibold transition-colors hover:bg-[#F6F1E8]"
                style={{ borderColor: "var(--t-borde)", color: "var(--t-texto)" }}
              >
                Conocenos
              </Link>
            </div>
          </div>
          {heroFoto ? (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={heroFoto}
                alt={info.nombre}
                className="aspect-square w-full rounded-[2.5rem] object-cover shadow-xl"
              />
              <div
                className="absolute -bottom-3 -left-3 rounded-2xl t-card px-4 py-2 text-sm font-semibold shadow-lg"
                style={{ color: "var(--t-texto)" }}
              >
                ✨ Colecciones elegidas en Expo CAFIRA y PRESENTES
              </div>
            </div>
          ) : null}
        </div>
      </section>

      {/* ── Banda de beneficios ── */}
      <section className="border-b t-card" style={{ borderColor: "#EFF6F5" }}>
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-2 px-4 py-4 text-center text-sm font-medium sm:grid-cols-3">
          <p>🚚 Envíos a todo el país</p>
          <p>💳 3 y 6 cuotas</p>
          <p>🏖️ Local en Monte Hermoso</p>
        </div>
      </section>

      {/* ── Tiles de categorías ── */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="text-2xl font-bold tracking-tight" style={{ color: "var(--t-texto)" }}>
          Explorá por categoría
        </h2>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {info.categorias.slice(0, 10).map((c) => {
            const foto = fotoDeCategoria.get(c) ?? null;
            return (
              <Link
                key={c}
                href={`${base}/tienda?categoria=${encodeURIComponent(c)}`}
                className="group relative aspect-[4/3] overflow-hidden rounded-2xl"
                style={{ backgroundColor: "var(--t-suave)" }}
              >
                {foto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={foto}
                    alt={c}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-3xl"></div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
                <p className="absolute bottom-2 left-3 right-2 text-sm font-bold text-white drop-shadow">
                  {c}
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ── Nuevos ingresos ── */}
      {nuevos.length > 0 ? (
        <section style={{ backgroundColor: "#FBF9F4" }}>
          <div className="mx-auto max-w-6xl px-4 py-12">
            <div className="mb-6 flex items-end justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold tracking-tight" style={{ color: "var(--t-texto)" }}>
                  Nuevos ingresos
                </h2>
                <p className="text-sm t-tenue">Lo último que llegó de las expos</p>
              </div>
              <Link
                href={`${base}/tienda?orden=novedades`}
                className="shrink-0 text-sm font-semibold hover:underline"
                style={{ color: "var(--tpl, #3FA9A5)" }}
              >
                Ver todos →
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {nuevos.map((p) => (
                <ProductoCard key={p.id} slug={tenant.slug} p={aCard(p)} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* ── Los más pedidos ── */}
      {masPedidos.length > 0 ? (
        <section className="mx-auto max-w-6xl px-4 py-12">
          <div className="mb-6 flex items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold tracking-tight" style={{ color: "var(--t-texto)" }}>
                Los más pedidos
              </h2>
              <p className="text-sm t-tenue">Los favoritos de la comunidad</p>
            </div>
            <Link
              href={`${base}/tienda?orden=vendidos`}
              className="shrink-0 text-sm font-semibold hover:underline"
              style={{ color: "var(--tpl, #3FA9A5)" }}
            >
              Ver todos →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {masPedidos.map((p) => (
              <ProductoCard key={p.id} slug={tenant.slug} p={aCard(p)} />
            ))}
          </div>
        </section>
      ) : null}

      {/* ── Teaser Quiénes somos ── */}
      <section style={{ backgroundColor: "var(--t-suave)" }}>
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-12 md:grid-cols-2">
          {teaserFoto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={teaserFoto}
              alt="El local"
              loading="lazy"
              className="aspect-[4/3] w-full rounded-[2rem] object-cover shadow-lg"
            />
          ) : null}
          <div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl" style={{ color: "var(--t-texto)" }}>
              De la costa a tu casa 🌊
            </h2>
            <p className="mt-3 t-tenue">
              Somos un bazar de playa nacido en Monte Hermoso. Viajamos a las expos CAFIRA y
              PRESENTES en Buenos Aires a elegir cada pieza, para que tu casa tenga esa onda de
              mar todo el año.
            </p>
            <Link
              href={`${base}/quienes-somos`}
              className="mt-5 inline-block rounded-full px-6 py-3 font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: "var(--t-texto)", color: "var(--t-fondo)" }}
            >
              Nuestra historia
            </Link>
          </div>
        </div>
      </section>
    </BazarShell>
  );
}
