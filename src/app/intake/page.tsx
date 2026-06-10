import type { Metadata } from "next";
import { PublicShell } from "@/components/public/shell";
import { IntakeWizard } from "@/components/public/intake-wizard";

export const metadata: Metadata = {
  title: "Tu diagnóstico de automatización",
  description:
    "Contanos tu negocio en 5 pasos y la IA arma tu plan de automatización. En menos de 24 horas lo recibís por WhatsApp, con propuesta y precios.",
};

export default function IntakePage() {
  return (
    <PublicShell>
      <section className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold sm:text-4xl">
            Armemos tu plan de automatización
          </h1>
          <p className="mt-3 text-muted-foreground">
            5 pasos, menos de 3 minutos. La IA cruza tus respuestas con nuestro
            recetario y en menos de 24 horas tenés tu plan por WhatsApp.
          </p>
        </div>
        <div className="mt-8">
          <IntakeWizard />
        </div>
      </section>
    </PublicShell>
  );
}
