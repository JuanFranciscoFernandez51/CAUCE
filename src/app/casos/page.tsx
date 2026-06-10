import type { Metadata } from "next";
import Link from "next/link";
import { CASOS, AREA_LABELS } from "@/lib/casos";
import { PublicShell } from "@/components/public/shell";
import { Card, Badge } from "@/components/ui";

export const metadata: Metadata = {
  title: "Casos",
  description:
    "Los dolores más comunes de los negocios argentinos y cómo los resolvemos con automatización e IA: mensajes, presupuestos, turnos, stock, cobranzas y más.",
};

export default function CasosPage() {
  return (
    <PublicShell>
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-4xl font-bold">¿Cuál es tu dolor?</h1>
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
                <h2 className="mt-3 text-lg font-bold leading-snug">
                  &ldquo;{caso.dolor}&rdquo;
                </h2>
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
