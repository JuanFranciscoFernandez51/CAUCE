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

  return (
    <PublicShell>
      {/* ── Negocios reales (capturas) ── */}
      {negocios.length > 0 ? (
        <section className="border-b bg-muted/40">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <Badge variant="primary">Negocios reales</Badge>
              <h1 className="mt-4 text-4xl font-bold tracking-tight">
                Ya funcionan con Cauce
              </h1>
              <p className="mt-3 text-muted-foreground">
                No son maquetas: son negocios argentinos con su web, su sistema y
                sus automatizaciones andando. Estas son capturas reales.
              </p>
            </div>

            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {negocios.map((n) => (
                <Card key={n.slug} className="flex flex-col overflow-hidden">
                  <div className="relative aspect-[16/10] w-full border-b bg-muted">
                    <Image
                      src={n.shotUrl}
                      alt={`${n.shotTitulo} — ${n.name}`}
                      fill
                      sizes="(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw"
                      className="object-cover object-top"
                    />
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex items-start justify-between gap-2">
                      <h2 className="text-lg font-bold leading-snug">{n.name}</h2>
                      {n.rubro ? (
                        <Badge variant="outline" className="shrink-0 capitalize">
                          {n.rubro}
                        </Badge>
                      ) : null}
                    </div>
                    <p className="mt-2 flex-1 text-sm text-muted-foreground">
                      {n.logro}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>
      ) : null}

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
