import Link from "next/link";

/**
 * Las dos puertas de entrada de Cauce — mismo protagonismo.
 * Se reusa en landing (hero y CTA final) y en /casos/[slug].
 */
export function Doors({ compact = false }: { compact?: boolean }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div
        className={`flex flex-col rounded-3xl border border-border bg-card shadow-[0_2px_24px_-8px_rgba(17,17,17,0.08)] ${compact ? "p-6" : "p-7"}`}
      >
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
          Puerta 1
        </p>
        <h3 className="mt-2 font-display text-xl font-medium tracking-tight">
          Sé lo que necesito
        </h3>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
          Contanos tu negocio en 5 pasos y en menos de 24 horas te mandamos por WhatsApp
          una propuesta con precio y una demo de tu rubro para que la toques.
        </p>
        <Link
          href="/intake"
          className="mt-5 inline-flex h-11 items-center justify-center rounded-full bg-foreground px-6 text-sm font-medium text-background transition hover:opacity-90 sm:self-start"
        >
          Empezar mi diagnóstico
        </Link>
      </div>
      <div
        className={`flex flex-col rounded-3xl border border-border bg-card shadow-[0_2px_24px_-8px_rgba(17,17,17,0.08)] ${compact ? "p-6" : "p-7"}`}
      >
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
          Puerta 2
        </p>
        <h3 className="mt-2 font-display text-xl font-medium tracking-tight">
          No sé por dónde empezar
        </h3>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
          Charla gratis de 30 minutos: nos contás cómo trabajás y te llevás un plan
          concreto de qué armar primero, por etapas y con precios.
        </p>
        <Link
          href="/consultoria"
          className="mt-5 inline-flex h-11 items-center justify-center rounded-full border border-border bg-card px-6 text-sm font-medium text-foreground transition hover:bg-muted sm:self-start"
        >
          Agendar consultoría gratis
        </Link>
      </div>
    </div>
  );
}
