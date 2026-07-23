import { Card, ButtonLink } from "@/components/ui";

/**
 * Las dos puertas de entrada de Cauce — mismo protagonismo.
 * Se reusa en landing (hero y CTA final) y en /casos/[slug].
 */
export function Doors({ compact = false }: { compact?: boolean }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Card className={compact ? "flex flex-col p-5" : "flex flex-col p-6"}>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Puerta 1
        </p>
        <h3 className="mt-1 text-xl font-bold">Sé lo que necesito</h3>
        <p className="mt-2 flex-1 text-sm text-muted-foreground">
          Contanos tu negocio en 5 pasos y en menos de 24 horas te mandamos por WhatsApp
          una propuesta con precio y una demo de tu rubro para que la toques.
        </p>
        <ButtonLink href="/intake" variant="primary" className="mt-4 w-full sm:w-auto">
          Empezar mi diagnóstico
        </ButtonLink>
      </Card>
      <Card className={compact ? "flex flex-col p-5" : "flex flex-col p-6"}>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Puerta 2
        </p>
        <h3 className="mt-1 text-xl font-bold">No sé por dónde empezar</h3>
        <p className="mt-2 flex-1 text-sm text-muted-foreground">
          Charla gratis de 30 minutos: nos contás cómo trabajás y te llevás un plan
          concreto de qué armar primero, por etapas y con precios.
        </p>
        <ButtonLink href="/consultoria" variant="accent" className="mt-4 w-full sm:w-auto">
          Agendar consultoría gratis
        </ButtonLink>
      </Card>
    </div>
  );
}
