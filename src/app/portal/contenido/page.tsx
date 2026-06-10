import { getPortalClient, type BotSettings } from "../_lib";
import { ContenidoForm } from "./contenido-form";

export default async function ContenidoPage() {
  const client = await getPortalClient();
  if (!client) return null;

  const settings = (client.settings ?? {}) as BotSettings;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Contenido del bot</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Esto es lo que tu bot responde. Cargá las preguntas que te hacen todos
          los días y dejá que conteste solo.
        </p>
      </div>
      <ContenidoForm
        initial={{
          horarios: settings.horarios ?? "",
          datosNegocio: settings.datosNegocio ?? "",
          tono: settings.tono ?? "amable e informal",
          faqs:
            Array.isArray(settings.faqs) && settings.faqs.length > 0
              ? settings.faqs
              : [{ q: "", a: "" }],
        }}
      />
    </div>
  );
}
