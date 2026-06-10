import { getAnthropic, MODEL_AGENT, aiAvailable } from "@/lib/anthropic";
import { db } from "@/lib/db";
import type { Lead, Recipe } from "@prisma/client";
import { getPricing } from "@/lib/pricing";

export type BlueprintDraft = {
  summary: string;
  level: "N1" | "N2" | "N3" | "N4";
  recipeIds: string[];
  flow: { paso: number; titulo: string; detalle: string }[];
  suggestedPack: "STARTER" | "PRO" | "SCALE" | "CUSTOM";
  suggestedSetup: number;
  suggestedMonthly: number;
  score: number; // calidad del lead 0-100
};

const TOOL = {
  name: "emitir_blueprint",
  description: "Emite el blueprint de automatización diagnosticado para este lead.",
  input_schema: {
    type: "object" as const,
    properties: {
      summary: { type: "string", description: "Diagnóstico en lenguaje claro para el cliente (3-6 oraciones, español rioplatense)" },
      level: { type: "string", enum: ["N1", "N2", "N3", "N4"] },
      recipeIds: { type: "array", items: { type: "string" }, description: "IDs de las recetas del recetario que aplican (pueden ser de varias áreas)" },
      flow: {
        type: "array",
        items: {
          type: "object",
          properties: {
            paso: { type: "number" },
            titulo: { type: "string" },
            detalle: { type: "string" },
          },
          required: ["paso", "titulo", "detalle"],
        },
      },
      suggestedPack: { type: "string", enum: ["STARTER", "PRO", "SCALE", "CUSTOM"] },
      suggestedSetup: { type: "number", description: "Setup único sugerido en USD" },
      suggestedMonthly: { type: "number", description: "Mensual sugerido en USD" },
      score: { type: "number", description: "Calidad del lead 0-100 (presupuesto, urgencia, fit)" },
    },
    required: ["summary", "level", "recipeIds", "flow", "suggestedPack", "suggestedSetup", "suggestedMonthly", "score"],
  },
};

function recipeCatalog(recipes: Recipe[]): string {
  return recipes
    .map(
      (r) =>
        `- id:${r.id} | ${r.name} | área:${r.area} | nivel:${r.level} | apps:${r.apps.join(",")} | resuelve: ${r.solves}`
    )
    .join("\n");
}

/**
 * Agente Diagnóstico: matchea el intake contra el recetario completo (todas las áreas)
 * con tool use FORZADO y devuelve un Blueprint borrador. Crea el registro en DB.
 */
export async function runDiagnostico(leadId: string): Promise<{ blueprintId: string }> {
  const lead = await db.lead.findUniqueOrThrow({ where: { id: leadId } });
  const recipes = await db.recipe.findMany({ where: { active: true } });
  const pricing = await getPricing();

  let draft: BlueprintDraft;
  if (aiAvailable()) {
    draft = await diagnoseWithClaude(lead, recipes, pricing.packs);
  } else {
    draft = fallbackDraft(lead, recipes);
  }

  // Validar que las recetas existan de verdad (la IA no inventa IDs)
  const validIds = new Set(recipes.map((r) => r.id));
  draft.recipeIds = draft.recipeIds.filter((id) => validIds.has(id));

  const bp = await db.blueprint.create({
    data: {
      leadId: lead.id,
      status: "DRAFT",
      level: draft.level,
      summary: draft.summary,
      flow: draft.flow,
      recipeIds: draft.recipeIds,
      suggestedPack: draft.suggestedPack,
      suggestedSetup: draft.suggestedSetup,
      suggestedMonthly: draft.suggestedMonthly,
    },
  });

  await db.lead.update({
    where: { id: lead.id },
    data: { score: Math.max(0, Math.min(100, Math.round(draft.score))), status: "QUALIFIED" },
  });

  // El lead diagnosticado entra al pipeline
  const existing = await db.project.findFirst({ where: { leadId: lead.id } });
  if (!existing) {
    await db.project.create({
      data: {
        title: `${lead.business || lead.name} — automatización`,
        stage: "DIAGNOSTICO",
        level: draft.level,
        setupFee: draft.suggestedSetup,
        leadId: lead.id,
      },
    });
  }

  return { blueprintId: bp.id };
}

async function diagnoseWithClaude(
  lead: Lead,
  recipes: Recipe[],
  packs: unknown
): Promise<BlueprintDraft> {
  const anthropic = getAnthropic();
  const res = await anthropic.messages.create({
    model: MODEL_AGENT,
    max_tokens: 2000,
    tools: [TOOL],
    tool_choice: { type: "tool", name: "emitir_blueprint" },
    system: `Sos el agente de Diagnóstico de Cauce, agencia argentina de automatización con IA para negocios.
Tu trabajo: leer el intake de un lead y matchearlo contra el RECETARIO completo (todas las áreas: atención, ventas/CRM, marketing, operaciones/stock, turnos, RRHH, finanzas). Un mismo cliente puede necesitar recetas de varias áreas.
Reglas:
- Elegí SOLO recetas del recetario provisto, por id exacto.
- Nivel N1-N4 = complejidad total del proyecto (el mayor de las recetas + integraciones).
- Pack: STARTER (1 bot simple autoservicio), PRO (bot + integraciones + varios flujos), SCALE (necesita software propio: CRM/turnos/stock/RRHH/caja con su marca = Cauce OS), CUSTOM (Cauce OS + desarrollo único).
- Precios de referencia de packs (USD): ${JSON.stringify(packs)}. Setup = pago único; mensual = retainer. Sugerí números coherentes con eso.
- summary en español rioplatense, claro, sin tecnicismos, vendedor pero honesto.`,
    messages: [
      {
        role: "user",
        content: `LEAD:
Nombre: ${lead.name}
Negocio: ${lead.business ?? "—"} | Rubro: ${lead.rubro ?? "—"}
Fuente: ${lead.source}
Intake (scorecard): ${JSON.stringify(lead.intake ?? {}, null, 2)}

RECETARIO:
${recipeCatalog(recipes)}`,
      },
    ],
  });

  const toolUse = res.content.find((b) => b.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") throw new Error("El agente no emitió blueprint");
  return toolUse.input as BlueprintDraft;
}

/** Sin API key: heurística simple para que el flujo nunca se rompa. */
function fallbackDraft(lead: Lead, recipes: Recipe[]): BlueprintDraft {
  const starter = recipes.find((r) => r.name.toLowerCase().includes("faq"));
  return {
    summary: `Diagnóstico preliminar para ${lead.business || lead.name}: arrancamos con un bot de atención 24/7 que responde consultas frecuentes y captura los datos de cada interesado. (Generado sin IA — configurá ANTHROPIC_API_KEY para diagnóstico completo.)`,
    level: "N2",
    recipeIds: starter ? [starter.id] : [],
    flow: [
      { paso: 1, titulo: "Bot de atención", detalle: "Responde FAQs 24/7 en WhatsApp y captura leads." },
      { paso: 2, titulo: "Aviso de leads calientes", detalle: "Si el interesado quiere comprar/agendar, te avisa al toque." },
    ],
    suggestedPack: "STARTER",
    suggestedSetup: 0,
    suggestedMonthly: 45,
    score: 50,
  };
}
