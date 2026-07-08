import { getAnthropic, MODEL_AGENT, aiAvailable } from "@/lib/anthropic";
import { db } from "@/lib/db";
import type { Lead } from "@prisma/client";
import { getPricing } from "@/lib/pricing";
import { PROCESOS_CATALOGO, procesosParaRubro } from "@/lib/procesos-catalogo";

export type BlueprintDraft = {
  summary: string;
  level: "N1" | "N2" | "N3" | "N4";
  /** Keys del catálogo de procesos (procesos-catalogo.ts). */
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
      recipeIds: { type: "array", items: { type: "string" }, description: "Keys de los procesos del catálogo que aplican (pueden ser de varias áreas)" },
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

function catalogoTexto(): string {
  return PROCESOS_CATALOGO.map(
    (p) => `- key:${p.key} | ${p.nombre} | área:${p.area} | corre:${p.cuando} | resuelve: ${p.queHace}`
  ).join("\n");
}

/**
 * Agente Diagnóstico: matchea el intake contra el catálogo de procesos
 * (todas las áreas) con tool use FORZADO y devuelve un Blueprint borrador.
 */
export async function runDiagnostico(leadId: string): Promise<{ blueprintId: string }> {
  const lead = await db.lead.findUniqueOrThrow({ where: { id: leadId } });
  const pricing = await getPricing();

  let draft: BlueprintDraft;
  if (aiAvailable()) {
    draft = await diagnoseWithClaude(lead, pricing.packs);
  } else {
    draft = fallbackDraft(lead);
  }

  // Validar que los procesos existan en el catálogo (la IA no inventa keys)
  const validKeys = new Set(PROCESOS_CATALOGO.map((p) => p.key));
  draft.recipeIds = draft.recipeIds.filter((k) => validKeys.has(k));

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

async function diagnoseWithClaude(lead: Lead, packs: unknown): Promise<BlueprintDraft> {
  const anthropic = getAnthropic();
  const res = await anthropic.messages.create({
    model: MODEL_AGENT,
    max_tokens: 2000,
    tools: [TOOL],
    tool_choice: { type: "tool", name: "emitir_blueprint" },
    system: `Sos el agente de Diagnóstico de Cauce, empresa argentina que entrega a cada PyME su web + su software de gestión + sus procesos automatizados (corriendo en el propio software, sin herramientas externas).
Tu trabajo: leer el intake de un lead y matchearlo contra el CATÁLOGO de procesos (todas las áreas: atención, ventas/CRM, marketing, operaciones/stock, turnos, RRHH, finanzas). Un mismo cliente puede necesitar procesos de varias áreas.
Reglas:
- Elegí SOLO procesos del catálogo provisto, por key exacta.
- Nivel N1-N4 = complejidad total del proyecto.
- Pack: STARTER (web + procesos básicos), PRO (web + varios procesos), SCALE (necesita software propio: CRM/turnos/stock/finanzas con su marca = Cauce OS), CUSTOM (Cauce OS + desarrollo único, ej: cronómetro de eventos).
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

CATÁLOGO DE PROCESOS:
${catalogoTexto()}`,
      },
    ],
  });

  const toolUse = res.content.find((b) => b.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") throw new Error("El agente no emitió blueprint");
  return toolUse.input as BlueprintDraft;
}

/** Sin API key: sugiere los procesos del rubro para que el flujo nunca se rompa. */
function fallbackDraft(lead: Lead): BlueprintDraft {
  const sugeridos = procesosParaRubro(lead.rubro);
  return {
    summary: `Diagnóstico preliminar para ${lead.business || lead.name}: arrancamos ordenando las consultas en un CRM único y dejando corriendo los procesos clave del rubro. (Generado sin IA — configurá ANTHROPIC_API_KEY para diagnóstico completo.)`,
    level: "N2",
    recipeIds: sugeridos.map((p) => p.key),
    flow: sugeridos.slice(0, 4).map((p, i) => ({ paso: i + 1, titulo: p.nombre, detalle: p.queHace })),
    suggestedPack: "SCALE",
    suggestedSetup: 0,
    suggestedMonthly: 45,
    score: 50,
  };
}
