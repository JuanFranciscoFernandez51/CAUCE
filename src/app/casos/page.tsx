import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/db";
import {
  CASOS,
  AREA_LABELS,
  NEGOCIOS_DESTACADOS,
  logroPorRubro,
  shotsDeSettings,
  shotPrincipal,
} from "@/lib/casos";
import { PublicShell } from "@/components/public/shell";
import { CASOS_REALES } from "@/lib/casos-reales";
import { Reveal } from "@/components/public/menta";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Casos",
  description:
    "Negocios reales que ya funcionan con Cauce y los dolores más comunes que resolvemos: mensajes, presupuestos, turnos, stock, cobranzas y más.",
};

type NegocioReal = {
  slug: string;
  name: string;
  rubro: string | null;
  logro: string;
  shotUrl: string;
  shotTitulo: string;
};

/** Trae los negocios destacados que tengan capturas reales. No rompe si no hay. */
async function getNegociosReales(): Promise<NegocioReal[]> {
  let clients: { slug: string; name: string; rubro: string | null; settings: unknown }[] = [];
  try {
    clients = await db.client.findMany({
      where: { slug: { in: [...NEGOCIOS_DESTACADOS] } },
      select: { slug: true, name: true, rubro: true, settings: true },
    });
  } catch (e) {
    console.error("casos: error leyendo negocios reales", e);
    return [];
  }

  // Orden estable según NEGOCIOS_DESTACADOS y solo los que tienen captura.
  const out: NegocioReal[] = [];
  for (const slug of NEGOCIOS_DESTACADOS) {
    const c = clients.find((x) => x.slug === slug);
    if (!c) continue;
    const shot = shotPrincipal(shotsDeSettings(c.settings));
    if (!shot) continue;
    out.push({
      slug: c.slug,
      name: c.name,
      rubro: c.rubro,
      logro: logroPorRubro(c.rubro),
      shotUrl: shot.url,
      shotTitulo: shot.titulo,
    });
  }
  return out;
}

export default async function CasosPage() {
  const negocios = await getNegociosReales();

  // Marcas reales con ficha propia: shot principal desde su tenant.
  const marcas = await Promise.all(
    CASOS_REALES.map(async (caso) => {
      let shotUrl: string | null = caso.shotsReales?.[0]?.url ?? null;
      if (!shotUrl) {
        try {
          const t = await db.client.findUnique({ where: { slug: caso.shotsSlug } });
          shotUrl = shotPrincipal(shotsDeSettings(t?.settings))?.url ?? null;
        } catch {
          // sin captura no rompe
        }
      }
      return { caso, shotUrl };
    })
  );

  return (
    <PublicShell>
      {/* ── Marcas reales con ficha completa ── */}
      <section className="mx-auto max-w-6xl px-4 pb-10 pt-12 sm:px-6 sm:pt-16">
        <div className="mx-auto max-w-2xl text-center">
          <Reveal>
            <span className="inline-flex items-center rounded-full border border-black/10 bg-white px-4 py-1.5 text-xs font-medium text-muted-foreground">
              Casos reales
            </span>
            <h1 className="title-mega mt-5 text-[40px] sm:text-6xl lg:text-[64px]">
              Las marcas que ya trabajan con Cauce
            </h1>
            <p className="mt-5 text-lg text-muted-foreground">
              Negocios argentinos de verdad, con su web y su sistema andando todos los días.
              Entrá a cada uno y mirá qué tiene su sistema adentro — capturas reales incluidas.
            </p>
          </Reveal>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {marcas.map(({ caso, shotUrl }, i) => (
            <Reveal key={caso.slug} delay={(i % 3) * 100} className="h-full">
              <Link href={`/casos/marca/${caso.slug}`} className="group block h-full">
                <div className="flex h-full flex-col overflow-hidden rounded-[28px] border border-black/5 bg-card shadow-[0_2px_24px_-10px_rgba(17,17,17,0.1)] transition duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_24px_60px_-24px_rgba(17,17,17,0.25)]">
                  {shotUrl ? (
                    <div className="relative aspect-[16/10] w-full border-b border-black/5 bg-muted">
                      <Image
                        src={shotUrl}
                        alt={`Sistema de ${caso.nombre}`}
                        fill
                        sizes="(min-width: 768px) 360px, 100vw"
                        className="object-cover object-top"
                      />
                    </div>
                  ) : null}
                  <div className="flex flex-1 flex-col p-6">
                    <div className="flex items-center gap-3">
                      {caso.logo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={caso.logo}
                          alt=""
                          className={`h-9 w-auto rounded-lg object-contain ${caso.logoOscuro ? "bg-slate-900 p-1" : ""}`}
                        />
                      ) : (
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-lg font-bold text-primary-foreground">
                          {caso.nombre[0]}
                        </span>
                      )}
                      <div className="min-w-0">
                        <h2 className="font-display font-medium leading-snug tracking-tight">
                          {caso.nombre}
                        </h2>
                        <p className="truncate text-xs text-muted-foreground">{caso.rubro}</p>
                      </div>
                    </div>
                    <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                      {caso.resumen}
                    </p>
                    <p className="mt-4 text-sm font-medium text-primary">
                      Ver su sistema por dentro →
                    </p>
                  </div>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>

        {negocios.length > 0 ? (
          <Reveal className="mt-10">
            <p className="text-center text-sm text-muted-foreground">
              Y además: {negocios.map((n) => n.name).join(" · ")} — demos vivas por rubro para
              que toques antes de decidir.
            </p>
          </Reveal>
        ) : null}
      </section>

      {/* ── Dolores (recetario) — mega-tarjeta clara ── */}
      <section className="px-3 pb-4 sm:px-4">
        <div className="mx-auto max-w-6xl rounded-[32px] border border-black/5 bg-card px-6 py-16 shadow-[0_2px_40px_-16px_rgba(17,17,17,0.1)] sm:rounded-[40px] sm:px-10 sm:py-20 lg:px-16">
          <div className="mx-auto max-w-2xl text-center">
            <Reveal>
              <h2 className="title-mega text-4xl sm:text-5xl">¿Cuál es tu dolor?</h2>
              <p className="mt-4 text-lg text-muted-foreground">
                No organizamos por industria sino por problema. Encontrá el tuyo y
                mirá cómo lo encauzamos.
              </p>
            </Reveal>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CASOS.map((caso, i) => (
              <Reveal key={caso.slug} delay={(i % 3) * 90} className="h-full">
                <Link href={`/casos/${caso.slug}`} className="group block h-full">
                  <div className="flex h-full flex-col rounded-3xl border border-black/5 bg-background p-6 transition duration-300 group-hover:-translate-y-1 group-hover:border-primary/40 group-hover:shadow-[0_20px_50px_-24px_rgba(46,107,255,0.35)]">
                    <div className="flex items-start justify-between gap-2">
                      <span
                        aria-hidden
                        className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-xl"
                      >
                        {caso.icon}
                      </span>
                      <span className="rounded-full border border-black/10 px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                        {AREA_LABELS[caso.area]}
                      </span>
                    </div>
                    <h3 className="mt-4 font-display text-lg font-medium leading-snug tracking-tight">
                      &ldquo;{caso.dolor}&rdquo;
                    </h3>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                      {caso.descripcion}
                    </p>
                    <p className="mt-4 text-sm font-medium text-primary">
                      Ver cómo lo encauzamos →
                    </p>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
