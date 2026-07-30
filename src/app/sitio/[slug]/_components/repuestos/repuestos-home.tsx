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

  const [destacados, masPedidos, porCategoria] = await Promise.all([
    db.bazarProducto.findMany({
      where: { clientId: tenant.id, activo: true, destacado: true },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: BAZAR_CARD_SELECT,
    }),
    db.bazarProducto.findMany({
      where: { clientId: tenant.id, activo: true, stock: { gt: 0 } },
      orderBy: [{ vendidos: "desc" }, { visitas: "desc" }],
      take: 8,
      select: BAZAR_CARD_SELECT,
    }),
    db.bazarProducto.groupBy({
      by: ["categoria"],
      where: { clientId: tenant.id, activo: true },
      _count: { _all: true },
    }),
  ]);

  const cuenta = new Map(porCategoria.map((c) => [c.categoria, c._count._all]));
  const cats = CATEGORIAS_REPUESTOS.filter((c) => cuenta.get(c));
  const plata = (n?: number) => (n ? `$ ${n.toLocaleString("es-AR")}` : null);

  return (
    <BazarShell info={info}>
      {/* ── Hero: el buscador manda ── */}
      <section className="relative overflow-hidden bg-[#0B0B0C]">
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: `radial-gradient(${AMARILLO} 1px, transparent 1px)`, backgroundSize: "22px 22px" }}
        />
        <div className="relative mx-auto grid max-w-6xl items-center gap-8 px-4 py-12 sm:py-16 md:grid-cols-[1.05fr_1fr]">
          <div>
            <p className="inline-flex items-center gap-1.5 rounded-full bg-[#F5B301] px-3 py-1 text-xs font-bold uppercase tracking-wide text-black">
              Repuestos y accesorios para motos
            </p>
            <h1 className="mt-4 font-display text-4xl font-semibold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-[56px]">
              El repuesto de tu moto,
              <span className="block text-[#F5B301]">sin dar vueltas</span>
            </h1>
            <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-white/70">
              Originales y alternativos para todas las marcas. Decinos qué moto tenés y te
              mostramos lo que le entra. Despachamos a todo el país.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              {["Envíos a todo el país", "Originales y alternativos", "Todas las marcas", "Atendido por su dueño"].map((t) => (
                <span key={t} className="rounded-full border border-white/15 px-3 py-1.5 text-xs font-medium text-white/75">
                  ✓ {t}
                </span>
              ))}
            </div>
          </div>

          <BuscadorMoto base={base} />
        </div>
      </section>

      {/* ── Categorías ── */}
      <section className="bg-white text-[#111111]">
        <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">Buscá por rubro</h2>
          <Link href={`${base}/tienda`} className="text-sm font-medium text-muted-foreground transition hover:text-foreground">
            Ver todo el catálogo →
          </Link>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {cats.map((c) => (
            <Link
              key={c}
              href={`${base}/tienda?categoria=${encodeURIComponent(c)}`}
              className="group flex items-center justify-between rounded-2xl border border-black/10 bg-white px-4 py-4 text-[#111111] shadow-sm transition hover:border-[#F5B301] hover:shadow-md"
            >
              <span className="text-sm font-semibold">{c}</span>
              <span className="rounded-full bg-black/[0.06] px-2 py-0.5 text-xs font-semibold text-black/55 transition group-hover:bg-[#F5B301] group-hover:text-black">
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
          <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            Te lo mandamos a <span className="text-[#F5B301]">donde estés</span>
          </h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              { t: "Retiro en el local", d: "Brown 1141, Bahía Blanca", p: "Sin cargo" },
              { t: "Envío en Bahía Blanca", d: "Llega en el día o al siguiente", p: plata(envios.bahiaBlanca) },
              { t: "Envío al interior", d: (envios.correos ?? []).join(" · ") || "Correo Argentino", p: plata(envios.interior) },
            ].map((e) => (
              <div key={e.t} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
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
        <section className="bg-white px-4 py-12 text-[#111111]">
          <div className="mx-auto max-w-6xl">
          <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">Lo que más sale</h2>
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
        <section className="bg-white px-4 pb-14 text-[#111111]">
          <div className="mx-auto max-w-6xl">
          <div className="flex items-end justify-between gap-4">
            <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">En stock ahora</h2>
            <Link href={`${base}/tienda`} className="text-sm font-medium text-muted-foreground transition hover:text-foreground">
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
