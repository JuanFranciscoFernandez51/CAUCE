import type { Metadata } from "next";
import { PublicShell } from "@/components/public/shell";
import { EjemplosAnimaciones } from "./ejemplos";

export const metadata: Metadata = {
  title: "Animaciones web — Cauce",
  description: "Ejemplos vivos de animaciones e interacciones que le sumamos a las webs que armamos.",
};

/** Sección pública: ejemplos vivos de animaciones para que el cliente pruebe. */
export default function AnimacionesPublicas() {
  return (
    <PublicShell>
      <section className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">Animaciones web</p>
        <h1 className="mt-3 max-w-2xl text-4xl font-bold leading-tight sm:text-5xl">
          Webs que se sienten vivas
        </h1>
        <p className="mt-4 max-w-xl text-muted-foreground">
          Estos son ejemplos reales de animaciones e interacciones que podemos sumar a tu web.
          Movelos, tocalos, probalos — así se van a sentir en tu sitio.
        </p>
        <div className="mt-10">
          <EjemplosAnimaciones />
        </div>
        <div className="mt-12 rounded-2xl border border-border bg-card p-6 text-center">
          <p className="text-lg font-semibold">¿Querés algo así en tu web?</p>
          <p className="mt-1 text-sm text-muted-foreground">Contanos tu idea y te decimos cómo la aplicamos a tu marca.</p>
          <a
            href="https://wa.me/5492915757101?text=Hola!%20Vi%20las%20animaciones%20de%20Cauce%20y%20quiero%20algo%20asi%20en%20mi%20web."
            target="_blank"
            className="mt-4 inline-block rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-background transition hover:opacity-90"
          >
            Hablemos por WhatsApp
          </a>
        </div>
      </section>
    </PublicShell>
  );
}
