import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { Recipe } from "@prisma/client";
import { db } from "@/lib/db";
import { CASOS, getCaso, AREA_LABELS } from "@/lib/casos";
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

const LEVEL_BADGE: Record<Recipe["level"], { label: string; variant: "default" | "primary" | "success" | "warning" }> = {
  N1: { label: "N1 · Listo en días", variant: "success" },
  N2: { label: "N2 · Integrado", variant: "primary" },
  N3: { label: "N3 · Avanzado", variant: "warning" },
  N4: { label: "N4 · A medida", variant: "default" },
};

export default async function CasoPage({ params }: Props) {
  const { slug } = await params;
  const caso = getCaso(slug);
  if (!caso) notFound();

  let recipes: Recipe[] = [];
  try {
    recipes = await db.recipe.findMany({
      where: { active: true, area: caso.area },
      orderBy: { level: "asc" },
    });
  } catch (e) {
    console.error("caso: error leyendo recetas", e);
  }

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

        {/* Recetas reales */}
        <section className="mt-10">
          <h2 className="text-2xl font-bold">
            Las automatizaciones que usamos para esto
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Recetas reales de nuestro catálogo para {AREA_LABELS[caso.area].toLowerCase()}.
          </p>
          {recipes.length === 0 ? (
            <div className="mt-4">
              <EmptyState
                icon="🧩"
                title="Recetas a medida para esta área"
                detail="Este dolor lo resolvemos con flujos armados específicamente para tu caso. Contanos el tuyo y te mostramos el plan."
              />
            </div>
          ) : (
            <ul className="mt-4 space-y-3">
              {recipes.map((r) => {
                const lvl = LEVEL_BADGE[r.level];
                return (
                  <li key={r.id}>
                    <Card className="p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="font-semibold">{r.name}</h3>
                        <Badge variant={lvl.variant}>{lvl.label}</Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{r.solves}</p>
                    </Card>
                  </li>
                );
              })}
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
