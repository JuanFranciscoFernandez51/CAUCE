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
import { Card, Badge } from "@/components/ui";

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
      <section className="border-b bg-muted/40">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <Badge variant="primary">Casos reales</Badge>
            <h1 className="mt-4 text-4xl font-bold tracking-tight">
              Las marcas que ya trabajan con Cauce
            </h1>
            <p className="mt-3 text-muted-foreground">
              Negocios argentinos de verdad, con su web y su sistema andando todos los días.
              Entrá a cada uno y mirá qué tiene su sistema adentro — capturas reales incluidas.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {marcas.map(({ caso, shotUrl }) => (
              <Link key={caso.slug} href={`/casos/marca/${caso.slug}`} className="group">
                <Card className="flex h-full flex-col overflow-hidden transition-shadow group-hover:shadow-md">
                  {shotUrl ? (
                    <div className="relative aspect-[16/10] w-full border-b bg-muted">
                      <Image
                        src={shotUrl}
                        alt={`Sistema de ${caso.nombre}`}
                        fill
                        sizes="(min-width: 768px) 360px, 100vw"
                        className="object-cover object-top"
                      />
                    </div>
                  ) : null}
                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex items-center gap-3">
                      {caso.logo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={caso.logo}
                          alt=""
                          className={`h-9 w-auto rounded object-contain ${caso.logoOscuro ? "bg-slate-900 p-1" : ""}`}
                        />
                      ) : (
                        <span className="flex h-9 w-9 items-center justify-center rounded bg-primary text-lg font-bold text-primary-foreground">
                          {caso.nombre[0]}
                        </span>
                      )}
                      <div className="min-w-0">
                        <h2 className="font-bold leading-snug">{caso.nombre}</h2>
                        <p className="truncate text-xs text-muted-foreground">{caso.rubro}</p>
                      </div>
                    </div>
                    <p className="mt-3 flex-1 text-sm text-muted-foreground">{caso.resumen}</p>
                    <p className="mt-3 text-sm font-medium text-primary">
                      Ver su sistema por dentro →
                    </p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>

          {negocios.length > 0 ? (
            <p className="mt-8 text-center text-sm text-muted-foreground">
              Y además: {negocios.map((n) => n.name).join(" · ")} — demos vivas por rubro para
              que toques antes de decidir.
            </p>
          ) : null}
        </div>
      </section>

      {/* ── Dolores (recetario) ── */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold">¿Cuál es tu dolor?</h2>
          <p className="mt-3 text-muted-foreground">
            No organizamos por industria sino por problema. Encontrá el tuyo y
            mirá cómo lo encauzamos.
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CASOS.map((caso) => (
            <Link key={caso.slug} href={`/casos/${caso.slug}`} className="group">
              <Card className="flex h-full flex-col p-5 transition-colors group-hover:border-primary">
                <div className="flex items-start justify-between gap-2">
                  <span aria-hidden className="text-2xl">{caso.icon}</span>
                  <Badge variant="outline">{AREA_LABELS[caso.area]}</Badge>
                </div>
                <h3 className="mt-3 text-lg font-bold leading-snug">
                  &ldquo;{caso.dolor}&rdquo;
                </h3>
                <p className="mt-2 flex-1 text-sm text-muted-foreground">
                  {caso.descripcion}
                </p>
                <p className="mt-4 text-sm font-medium text-primary">
                  Ver cómo lo encauzamos →
                </p>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </PublicShell>
  );
}
