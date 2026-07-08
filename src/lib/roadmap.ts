import { getAnthropic, MODEL_AGENT, aiAvailable } from "@/lib/anthropic";
import { db } from "@/lib/db";
import { getPricing } from "@/lib/pricing";
import { PROCESOS_CATALOGO } from "@/lib/procesos-catalogo";

export type RoadmapContent = {
  resumen: string;
  fases: {
    titulo: string;
    objetivo: string;
    items: { receta: string; area: string; nivel: string; impacto: string }[];
    packSugerido: string;
    precioEstimadoUsd: { setup: number; mensual: number };
  }[];
};

const TOOL = {
  name: "emitir_roadmap",
  description: "Emite el roadmap de automatización para este negocio.",
  input_schema: {
    type: "object" as const,
    properties: {
      resumen: { type: "string", description: "Resumen ejecutivo del roadmap (4-6 oraciones, rioplatense, claro)" },
      fases: {
        type: "array",
        items: {
          type: "object",
          properties: {
            titulo: { type: "string" },
            objetivo: { type: "string" },
            items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  receta: { type: "string" },
                  area: { type: "string" },
                  nivel: { type: "string" },
                  impacto: { type: "string" },
                },
                required: ["receta", "area", "nivel", "impacto"],
              },
            },
            packSugerido: { type: "string" },
            precioEstimadoUsd: {
              type: "object",
              properties: { setup: { type: "number" }, mensual: { type: "number" } },
              required: ["setup", "mensual"],
            },
          },
          required: ["titulo", "objetivo", "items", "packSugerido", "precioEstimadoUsd"],
        },
      },
    },
    required: ["resumen", "fases"],
  },
};

/** Genera el roadmap desde las notas de la llamada de consultoría. */
export async function generarRoadmap(consultNoteId: string): Promise<{ roadmapId: string }> {
  const note = await db.consultNote.findUniqueOrThrow({
    where: { id: consultNoteId },
    include: { lead: true },
  });
  const pricing = await getPricing();

  let content: RoadmapContent;
  if (aiAvailable()) {
    const anthropic = getAnthropic();
    const res = await anthropic.messages.create({
      model: MODEL_AGENT,
      max_tokens: 3000,
      tools: [TOOL],
      tool_choice: { type: "tool", name: "emitir_roadmap" },
      system: `Sos el consultor de Cauce, empresa argentina que entrega a cada PyME su web + su software de gestión + sus procesos automatizados. A partir de las notas de una videollamada de consultoría, armás un roadmap por fases (de menor a mayor complejidad, quick wins primero). Usá los procesos del catálogo por nombre, de cualquier área (atención, ventas, marketing, operaciones, turnos, RRHH, finanzas). Si el negocio necesita software propio (CRM, turnos, stock, RRHH, caja con su marca), proponé Cauce OS en una fase con pack SCALE. Precios de referencia (USD, setup único + mensual): ${JSON.stringify(pricing.packs)}. Español rioplatense, concreto, sin humo.`,
      messages: [
        {
          role: "user",
          content: `NEGOCIO: ${note.lead.business ?? note.lead.name} | Rubro: ${note.lead.rubro ?? "—"}
NOTAS DE LA LLAMADA:
${note.callNotes ?? "(sin notas)"}

CATÁLOGO DE PROCESOS DISPONIBLE:
${PROCESOS_CATALOGO.map((p) => `- ${p.nombre} (${p.area}, corre: ${p.cuando}): ${p.queHace}`).join("\n")}`,
        },
      ],
    });
    const toolUse = res.content.find((b) => b.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use") throw new Error("El agente no emitió roadmap");
    content = toolUse.input as RoadmapContent;
  } else {
    content = {
      resumen: `Roadmap preliminar para ${note.lead.business ?? note.lead.name}. (Generado sin IA — configurá ANTHROPIC_API_KEY para el roadmap completo desde las notas.)`,
      fases: [
        {
          titulo: "Fase 1 — Quick wins",
          objetivo: "Automatizar la atención y captura de leads.",
          items: [{ receta: "Bot FAQ + captura de lead (WhatsApp o IG)", area: "ATENCION", nivel: "N2", impacto: "Atención 24/7 sin sumar gente" }],
          packSugerido: "STARTER",
          precioEstimadoUsd: { setup: 0, mensual: 45 },
        },
      ],
    };
  }

  const existing = await db.roadmap.findUnique({ where: { consultNoteId } });
  const roadmap = existing
    ? await db.roadmap.update({ where: { consultNoteId }, data: { content } })
    : await db.roadmap.create({
        data: {
          consultNoteId,
          content,
          priceUsd: pricing.roadmapPriceUsd > 0 ? pricing.roadmapPriceUsd : null,
        },
      });

  await db.consultNote.update({ where: { id: consultNoteId }, data: { status: "DONE" } });
  return { roadmapId: roadmap.id };
}
