import Link from "next/link";
import type { Client } from "@prisma/client";
import { db } from "@/lib/db";
import { BAZAR_CARD_SELECT, aCard, type BazarShellInfo } from "../../_lib/bazar-site";
import { BazarShell } from "../bazar/bazar-shell";
import { ProductoCard } from "../bazar/producto-card";
import { BuscadorMoto } from "./buscador-moto";
import { CATEGORIAS_REPUESTOS } from "@/lib/motos-ar";

/**
 * Home del template REPUESTOS (Fernández Repuestos).
 * Negro y amarillo como el cartel del local. Lo primero y más grande es el
 * buscador por moto: es como compra el cliente de repuestos.
 */
const AMARILLO = "#F5B301";

export async function RepuestosHome({ tenant, info }: { tenant: Client; info: BazarShellInfo }) {
  const base = `/sitio/${tenant.slug}`;
  const st = (tenant.settings ?? {}) as {
    envios?: { bahiaBlanca?: number; interior?: number; gratisDesde?: number; correos?: string[] };
    nosotros?: { numeros?: { valor: string; texto: string }[] };
    horarios?: string;
  };
  const envios = st.envios ?? {};

  const [destacados, masPedidos, porCategoria, totalRepuestos] = await Promise.all([
    db.bazarProducto.findMany({
      where: { clientId: tenant.id, activo: true },
      orderBy: [{ destacado: "desc" }, { visitas: "desc" }, { createdAt: "desc" }],
      take: 8,
      select: BAZAR_CARD_SELECT,
    }),
    db.bazarProducto.findMany({
      where: { clientId: tenant.id, activo: true },
      orderBy: [{ vendidos: "desc" }, { createdAt: "asc" }],
      skip: 8,
      take: 8,
      select: BAZAR_CARD_SELECT,
    }),
    db.bazarProducto.groupBy({
      by: ["categoria"],
      where: { clientId: tenant.id, activo: true },
      _count: { _all: true },
    }),
    db.bazarProducto.count({ where: { clientId: tenant.id, activo: true } }),
  ]);

  const cuenta = new Map(porCategoria.map((c) => [c.categoria, c._count._all]));
  const cats = CATEGORIAS_REPUESTOS.filter((c) => cuenta.get(c));
  const plata = (n?: number) => (n ? `$ ${n.toLocaleString("es-AR")}` : null);

  return (
    <BazarShell info={info}>
      {/* ── Hero: el buscador manda ── */}
      <section className="relative isolate overflow-hidden bg-[#0A0A0B]">
        {/* profundidad: dos luces cálidas y una trama fina, para que no sea un negro plano */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(70% 55% at 78% 8%, rgba(245,179,1,.20), transparent 62%), radial-gradient(50% 40% at 8% 92%, rgba(245,179,1,.10), transparent 65%)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 opacity-[0.045]"
          style={{ backgroundImage: `radial-gradient(#F5B301 1px, transparent 1px)`, backgroundSize: "26px 26px" }}
        />
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-32 bg-gradient-to-b from-transparent to-black/60" />

        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:py-20 lg:grid-cols-[1fr_460px]">
          <div className="aparece">
            <p className="inline-flex items-center gap-1.5 rounded-full bg-[#F5B301] px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-black">
              Repuestos y accesorios para motos
            </p>
            <h1 className="mt-5 font-display text-[42px] font-semibold leading-[1.02] tracking-tight text-white sm:text-6xl lg:text-[64px]">
              El repuesto de tu moto,
              <span className="mt-1 block bg-gradient-to-r from-[#F5B301] to-[#FFD666] bg-clip-text text-transparent">
                sin dar vueltas
              </span>
            </h1>
            <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-white/65 sm:text-base">
              Originales y alternativos para todas las marcas. Decinos qué moto tenés y te
              mostramos lo que le entra. Despachamos a todo el país.
            </p>

            <div className="mt-7 grid max-w-md grid-cols-3 gap-3 border-t border-white/10 pt-5">
              {[
                { v: totalRepuestos.toLocaleString("es-AR"), t: "repuestos" },
                { v: "59", t: "modelos de moto" },
                { v: "24 h", t: "para despachar" },
              ].map((d) => (
                <div key={d.t}>
                  <p className="font-display text-2xl font-semibold text-white sm:text-[26px]">{d.v}</p>
                  <p className="text-[11px] uppercase tracking-wide text-white/40">{d.t}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              {["Envíos a todo el país", "Originales y alternativos", "Atendido por su dueño"].map((t) => (
                <span key={t} className="rounded-full border border-white/12 px-3 py-1.5 text-xs font-medium text-white/70">
                  ✓ {t}
                </span>
              ))}
            </div>
          </div>

          <BuscadorMoto base={base} total={totalRepuestos} />
        </div>
      </section>

      {/* ── Categorías ── */}
      <section className="t-suave">
        <div className="mx-auto max-w-6xl px-4 py-14">
        <div className="flex items-end justify-between gap-4">
          <h2 className="aparece font-display text-2xl font-semibold tracking-tight text-[color:var(--t-texto)] sm:text-3xl">Buscá por rubro</h2>
          <Link href={`${base}/tienda`} className="t-tenue text-sm font-medium transition hover:text-[color:var(--t-texto)]">
            Ver todo el catálogo →
          </Link>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {cats.map((c) => (
            <Link
              key={c}
              href={`${base}/tienda?categoria=${encodeURIComponent(c)}`}
              className="sube t-card t-borde group flex items-center justify-between gap-2 rounded-2xl border px-4 py-4 shadow-sm hover:border-[#F5B301]"
            >
              <span className="text-sm font-semibold leading-snug text-[color:var(--t-texto)]">{c}</span>
              <span className="t-tenue shrink-0 rounded-full bg-black/[0.06] px-2 py-0.5 text-xs font-semibold tabular-nums transition group-hover:bg-[#F5B301] group-hover:!text-black dark:bg-white/10">
                {cuenta.get(c)}
              </span>
            </Link>
          ))}
        </div>
        </div>
      </section>

      {/* ── Despachos: el foco del negocio ── */}
      <section className="bg-[#0B0B0C] py-12 text-white">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="aparece font-display text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Te lo mandamos a <span className="text-[#F5B301]">donde estés</span>
          </h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              { t: "Retiro en el local", d: "Brown 1141, Bahía Blanca", p: "Sin cargo" },
              { t: "Envío en Bahía Blanca", d: "Llega en el día o al siguiente", p: plata(envios.bahiaBlanca) },
              { t: "Envío al interior", d: (envios.correos ?? []).join(" · ") || "Correo Argentino", p: plata(envios.interior) },
            ].map((e) => (
              <div key={e.t} className="sube rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                <p className="text-sm font-bold text-[#F5B301]">{e.t}</p>
                <p className="mt-1.5 text-sm text-white/65">{e.d}</p>
                {e.p ? <p className="mt-3 text-lg font-semibold">{e.p}</p> : null}
              </div>
            ))}
          </div>
          {envios.gratisDesde ? (
            <p className="mt-4 text-sm text-white/60">
              Envío bonificado en compras desde <strong className="text-[#F5B301]">{plata(envios.gratisDesde)}</strong>.
            </p>
          ) : null}
        </div>
      </section>

      {/* ── Destacados ── */}
      {destacados.length ? (
        <section className="t-card px-4 py-12">
          <div className="mx-auto max-w-6xl">
          <h2 className="aparece font-display text-2xl font-semibold tracking-tight text-[color:var(--t-texto)] sm:text-3xl">Lo que más sale</h2>
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            {destacados.map((p) => (
              <ProductoCard key={p.id} slug={tenant.slug} p={aCard(p)} />
            ))}
          </div>
          </div>
        </section>
      ) : null}

      {/* ── Más pedidos ── */}
      {masPedidos.length ? (
        <section className="t-card px-4 pb-14">
          <div className="mx-auto max-w-6xl">
          <div className="flex items-end justify-between gap-4">
            <h2 className="aparece font-display text-2xl font-semibold tracking-tight text-[color:var(--t-texto)] sm:text-3xl">Recién cargados</h2>
            <Link href={`${base}/tienda`} className="t-tenue text-sm font-medium transition hover:text-[color:var(--t-texto)]">
              Ver todo →
            </Link>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            {masPedidos.map((p) => (
              <ProductoCard key={p.id} slug={tenant.slug} p={aCard(p)} />
            ))}
          </div>
          </div>
        </section>
      ) : null}
    </BazarShell>
  );
}
