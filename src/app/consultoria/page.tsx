import type { Metadata } from "next";
import { PublicShell } from "@/components/public/shell";
import { ConsultoriaForm } from "@/components/public/consultoria-form";
import { Card, Badge } from "@/components/ui";

export const metadata: Metadata = {
  title: "Consultoría gratis",
  description:
    "Videollamada gratis de 30-45 minutos. Te llevás un roadmap de automatización de tu negocio, por fases y con precios. Sin compromiso.",
};

const QUE_TE_LLEVAS = [
  {
    titulo: "Roadmap de automatización",
    detalle:
      "Un plan concreto de qué automatizar en tu negocio, ordenado por impacto: qué primero, qué después.",
  },
  {
    titulo: "Por fases y con precios",
    detalle:
      "Cada fase con su alcance y su precio. Sabés exactamente qué cuesta cada paso antes de decidir nada.",
  },
  {
    titulo: "Sin compromiso",
    detalle:
      "El roadmap es tuyo. Si lo hacés con nosotros, genial; si no, te queda un plan claro igual.",
  },
];

export default function ConsultoriaPage() {
  const calUrl = process.env.NEXT_PUBLIC_CAL_URL;

  return (
    <PublicShell>
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="primary">Gratis · 30-45 minutos · Por videollamada</Badge>
          <h1 className="mt-4 text-4xl font-bold">
            No sabés qué automatizar. Nosotros sí.
          </h1>
          <p className="mt-3 text-lg text-muted-foreground">
            Una videollamada donde miramos tu negocio, encontramos los procesos
            que te están comiendo el día y te armamos el plan para que corran solos.
          </p>
        </div>

        <div className="mx-auto mt-10 grid max-w-4xl gap-4 sm:grid-cols-3">
          {QUE_TE_LLEVAS.map((item) => (
            <Card key={item.titulo} className="p-5">
              <h2 className="font-semibold">{item.titulo}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{item.detalle}</p>
            </Card>
          ))}
        </div>

        <div className="mx-auto mt-8 max-w-2xl text-center text-sm text-muted-foreground">
          <p>
            <strong className="text-foreground">¿Para quién es?</strong> Para vos
            si pensás &quot;sé que la IA me puede ayudar pero no sé por dónde
            empezar&quot;, o &quot;quiero meterle automatización al negocio pero no
            tengo idea de qué se puede&quot;. No hace falta saber nada técnico.
          </p>
        </div>

        <div className="mx-auto mt-10 max-w-2xl">
          {calUrl ? (
            <Card className="overflow-hidden">
              <iframe
                src={calUrl}
                title="Agendá tu consultoría gratis con Cauce"
                className="h-[680px] w-full"
                loading="lazy"
              />
            </Card>
          ) : (
            <ConsultoriaForm />
          )}
        </div>
      </section>
    </PublicShell>
  );
}
