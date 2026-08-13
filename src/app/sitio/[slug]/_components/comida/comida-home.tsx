import Link from "next/link";
import type { Client } from "@prisma/client";
import { db } from "@/lib/db";
import { BAZAR_CARD_SELECT, aCard, type BazarShellInfo } from "../../_lib/bazar-site";
import { BazarShell } from "../bazar/bazar-shell";
import { ProductoCard } from "../bazar/producto-card";

/**
 * Home del template COMIDA (Casa Milo).
 * Crema, bordó y celeste como sus piezas; la carta y el pedido adelante,
 * porque acá se entra con hambre y con apuro.
 */
const BORDO = "#7B2233";
const CREMA = "#FDF8E9";
const CELESTE = "#A9C6F2";

export async function ComidaHome({ tenant, info }: { tenant: Client; info: BazarShellInfo }) {
  const base = `/sitio/${tenant.slug}`;
  const st = (tenant.settings ?? {}) as {
    eslogan?: string;
    claim?: string;
    horarios?: string;
    envios?: { caba?: number; gratisDesde?: number; demora?: string };
    nosotros?: { numeros?: { valor: string; texto: string }[] };
  };
  const envios = st.envios ?? {};

  const [destacados, porCategoria] = await Promise.all([
    db.bazarProducto.findMany({
      where: { clientId: tenant.id, activo: true, destacado: true },
      orderBy: { precio: "asc" },
      take: 8,
      select: BAZAR_CARD_SELECT,
    }),
    db.bazarProducto.groupBy({
      by: ["categoria"],
      where: { clientId: tenant.id, activo: true },
      _count: { _all: true },
    }),
  ]);

  const plata = (n?: number) => (n ? `$ ${n.toLocaleString("es-AR")}` : null);
  const wa = tenant.whatsapp?.replace(/\D/g, "");

  return (
    <BazarShell info={info}>
      {/* ── Portada: el nombre grande, como en sus piezas ── */}
      <section className="relative overflow-hidden" style={{ backgroundColor: CREMA }}>
        <div className="mx-auto max-w-6xl px-4 py-14 sm:py-20">
          <h1
            className="font-display text-[64px] font-semibold leading-[0.9] tracking-tight sm:text-[110px] lg:text-[132px]"
            style={{ color: BORDO }}
          >
            Casa Milo
          </h1>

          <div className="mt-8 grid items-end gap-8 md:grid-cols-[1.1fr_1fr]">
            <div>
              <p className="text-2xl font-semibold leading-tight sm:text-3xl" style={{ color: BORDO }}>
                {st.claim ?? "Milanesas & pollo premium"}
                <span className="ml-2 font-bold" style={{ color: CELESTE }}>
                  BS-AS
                </span>
              </p>
              <p className="mt-3 max-w-md text-[15px] leading-relaxed" style={{ color: "#6B5B52" }}>
                Seleccionamos cada <strong>corte</strong> para que disfrutes lo mejor en tu <strong>mesa</strong>.
                Empanado a mano y con envío a domicilio.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href={`${base}/tienda`}
                  className="inline-flex h-12 items-center rounded-full px-7 text-sm font-bold transition hover:opacity-90"
                  style={{ backgroundColor: BORDO, color: CREMA }}
                >
                  Ver la carta y pedir
                </Link>
                {wa ? (
                  <a
                    href={`https://wa.me/${wa}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-12 items-center rounded-full border px-6 text-sm font-semibold transition hover:bg-black/[0.04]"
                    style={{ borderColor: BORDO, color: BORDO }}
                  >
                    Pedir por WhatsApp
                  </a>
                ) : null}
              </div>
            </div>

            <div className="rounded-3xl p-6 text-right" style={{ backgroundColor: BORDO, color: CREMA }}>
              <p className="text-lg font-bold leading-tight">
                Hecho para
                <br />
                disfrutar.
              </p>
              <div className="mt-5 space-y-2 text-sm opacity-90">
                {envios.demora ? <p>🛵 Llega en {envios.demora.toLowerCase()}</p> : null}
                {envios.caba ? <p>📍 Envío en CABA {plata(envios.caba)}</p> : null}
                {envios.gratisDesde ? <p>✨ Envío sin cargo desde {plata(envios.gratisDesde)}</p> : null}
                {st.horarios ? <p>🕘 {st.horarios}</p> : null}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── La carta por categoría ── */}
      <section style={{ backgroundColor: "#FFFDF6" }}>
        <div className="mx-auto max-w-6xl px-4 py-12">
          <h2 className="font-display text-3xl font-semibold tracking-tight" style={{ color: BORDO }}>
            Nuestra carta
          </h2>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {porCategoria.map((c) => (
              <Link
                key={c.categoria}
                href={`${base}/tienda?categoria=${encodeURIComponent(c.categoria)}`}
                className="sube rounded-2xl border px-4 py-5 text-center transition"
                style={{ borderColor: "rgba(123,34,51,.18)", backgroundColor: CREMA }}
              >
                <p className="text-sm font-bold" style={{ color: BORDO }}>
                  {c.categoria}
                </p>
                <p className="mt-1 text-xs" style={{ color: "#8A7768" }}>
                  {c._count._all} opciones
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Los más pedidos ── */}
      {destacados.length ? (
        <section style={{ backgroundColor: CREMA }}>
          <div className="mx-auto max-w-6xl px-4 py-12">
            <div className="flex items-end justify-between gap-4">
              <h2 className="font-display text-3xl font-semibold tracking-tight" style={{ color: BORDO }}>
                Los más pedidos
              </h2>
              <Link href={`${base}/tienda`} className="text-sm font-medium underline-offset-4 hover:underline" style={{ color: BORDO }}>
                Ver todo →
              </Link>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
              {destacados.map((p) => (
                <ProductoCard key={p.id} slug={tenant.slug} p={aCard(p)} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* ── Cómo se pide ── */}
      <section style={{ backgroundColor: BORDO, color: CREMA }}>
        <div className="mx-auto max-w-6xl px-4 py-14">
          <h2 className="font-display text-3xl font-semibold tracking-tight">Pedir es simple</h2>
          <div className="mt-7 grid gap-4 sm:grid-cols-3">
            {[
              { n: "1", t: "Elegís", d: "Armás tu pedido desde la carta, por unidad o por bandeja." },
              { n: "2", t: "Pagás", d: "Con Mercado Pago, tarjeta o efectivo al recibir." },
              { n: "3", t: "Recibís", d: `Llega a tu casa ${envios.demora ? `en ${envios.demora.toLowerCase()}` : "el mismo día"}, listo para cocinar.` },
            ].map((p) => (
              <div key={p.n} className="rounded-2xl p-5" style={{ backgroundColor: "rgba(255,248,231,.08)" }}>
                <p className="font-display text-4xl font-semibold" style={{ color: CELESTE }}>
                  {p.n}
                </p>
                <p className="mt-2 text-lg font-bold">{p.t}</p>
                <p className="mt-1 text-sm opacity-85">{p.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </BazarShell>
  );
}
