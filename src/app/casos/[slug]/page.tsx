import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CASOS, getCaso, AREA_LABELS } from "@/lib/casos";
import { PROCESOS_CATALOGO } from "@/lib/procesos-catalogo";
import { PublicShell } from "@/components/public/shell";
import { Doors } from "@/components/public/doors";
import { Card, Badge, EmptyState } from "@/components/ui";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return CASOS.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const caso = getCaso(slug);
  if (!caso) return { title: "Caso no encontrado" };
  return {
    title: caso.dolor,
    description: caso.descripcion,
  };
}

export default async function CasoPage({ params }: Props) {
  const { slug } = await params;
  const caso = getCaso(slug);
  if (!caso) notFound();

  const procesos = PROCESOS_CATALOGO.filter((p) => p.area === caso.area);

  return (
    <PublicShell>
      <article className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        {/* El dolor */}
        <Badge variant="outline">{AREA_LABELS[caso.area]}</Badge>
        <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
          &ldquo;{caso.dolor}&rdquo;
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">{caso.descripcion}</p>

        {/* Así lo encauzamos */}
        <section className="mt-10">
          <h2 className="text-2xl font-bold">Así lo encauzamos</h2>
          <Card className="mt-4 border-l-4 border-l-primary p-5">
            <p className="text-base">{caso.solucion}</p>
          </Card>
        </section>

        {/* Procesos reales */}
        <section className="mt-10">
          <h2 className="text-2xl font-bold">
            Los procesos que usamos para esto
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Procesos reales, funcionando hoy en negocios reales, para {AREA_LABELS[caso.area].toLowerCase()}.
          </p>
          {procesos.length === 0 ? (
            <div className="mt-4">
              <EmptyState
                icon="🧩"
                title="Procesos a medida para esta área"
                detail="Este dolor lo resolvemos con procesos armados específicamente para tu caso. Contanos el tuyo y te mostramos el plan."
              />
            </div>
          ) : (
            <ul className="mt-4 space-y-3">
              {procesos.map((p) => (
                <li key={p.key}>
                  <Card className="p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="font-semibold">{p.nombre}</h3>
                      <Badge variant="primary">{p.cuando}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{p.queHace}</p>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* CTA doble puerta */}
        <section className="mt-12">
          <h2 className="text-center text-2xl font-bold">
            ¿Te suena? Sacátelo de encima
          </h2>
          <div className="mt-6">
            <Doors compact />
          </div>
        </section>
      </article>
    </PublicShell>
  );
}
