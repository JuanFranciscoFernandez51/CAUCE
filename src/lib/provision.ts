import { db } from "@/lib/db";
import { n8nConfigured, instantiateRecipe, activateWorkflow, deactivateWorkflow } from "@/lib/n8n";
import type { Pack } from "@prisma/client";

/**
 * Motor de delivery:
 * aprobar blueprint → cliente + automatizaciones (nacen en TEST) → QA → activo.
 */

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 30);
}

/** Aprueba un blueprint: convierte el lead en cliente y crea las automatizaciones en TEST. */
export async function aprobarBlueprint(blueprintId: string): Promise<{ clientId: string }> {
  const bp = await db.blueprint.findUniqueOrThrow({
    where: { id: blueprintId },
    include: { lead: true },
  });
  if (!bp.lead) throw new Error("El blueprint no tiene lead asociado");

  let clientId = bp.lead.clientId;
  if (!clientId) {
    const base = slugify(bp.lead.business || bp.lead.name);
    let slug = base || `cliente${Date.now() % 100000}`;
    let i = 1;
    while (await db.client.findUnique({ where: { slug } })) slug = `${base}${i++}`;
    const client = await db.client.create({
      data: {
        name: bp.lead.business || bp.lead.name,
        slug,
        rubro: bp.lead.rubro,
        pack: bp.suggestedPack as Pack,
        status: "ONBOARDING",
        mrr: bp.suggestedMonthly,
        setupPaid: 0,
        contactName: bp.lead.name,
        email: bp.lead.email,
        phone: bp.lead.phone,
        whatsapp: bp.lead.whatsapp,
      },
    });
    clientId = client.id;
    await db.lead.update({
      where: { id: bp.lead.id },
      data: { clientId, status: "CONVERTED" },
    });
  }

  // Automatizaciones desde las recetas del blueprint — SIEMPRE nacen en TEST
  const recipes = await db.recipe.findMany({ where: { id: { in: bp.recipeIds } } });
  for (const r of recipes) {
    const exists = await db.automation.findFirst({
      where: { clientId, recipeId: r.id },
    });
    if (!exists) {
      await db.automation.create({
        data: {
          clientId,
          recipeId: r.id,
          name: r.name,
          status: "TEST",
          health: "UNKNOWN",
        },
      });
    }
  }

  await db.blueprint.update({ where: { id: blueprintId }, data: { status: "APPROVED" } });

  // El proyecto del pipeline avanza a BUILD
  const project = await db.project.findFirst({ where: { leadId: bp.lead.id } });
  if (project) {
    await db.project.update({
      where: { id: project.id },
      data: { stage: "BUILD", clientId, setupFee: bp.suggestedSetup },
    });
  }

  return { clientId };
}

/**
 * Provisión 1-click (v1): instancia la receta en n8n con las variables del cliente.
 * Sin n8n configurado, la automatización queda en TEST lista para conectar (estado claro en UI).
 */
export async function provisionar(automationId: string): Promise<{ ok: boolean; detail: string }> {
  const auto = await db.automation.findUniqueOrThrow({
    where: { id: automationId },
    include: { recipe: true, client: true },
  });

  if (!n8nConfigured()) {
    return {
      ok: false,
      detail: "n8n sin configurar (N8N_URL/N8N_API_KEY). La automatización queda en TEST, lista para provisionar.",
    };
  }
  if (!auto.recipe?.n8nTemplateId) {
    return {
      ok: false,
      detail: "La receta no tiene workflow plantilla en n8n (n8nTemplateId). Cargalo en el recetario.",
    };
  }

  const variables: Record<string, string> = {};
  const config = (auto.config as Record<string, unknown> | null) ?? {};
  for (const [k, v] of Object.entries(config)) variables[k] = String(v ?? "");
  variables["cliente_id"] = auto.clientId;
  variables["cliente_nombre"] = auto.client.name;
  // Cableado a los hooks de sinergia de Cauce OS (book/slots/lead)
  variables["cliente_slug"] = auto.client.slug;
  variables["cauce_url"] = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  variables["cauce_secret"] = process.env.CAUCE_WEBHOOK_SECRET ?? "";

  const { workflowId } = await instantiateRecipe({
    templateWorkflowId: auto.recipe.n8nTemplateId,
    name: `[${auto.client.slug}] ${auto.name}`,
    variables,
  });

  await db.automation.update({
    where: { id: automationId },
    data: { n8nWorkflowId: workflowId, status: "TEST" },
  });

  return { ok: true, detail: `Workflow ${workflowId} creado en n8n (desactivado, estado TEST).` };
}

/** Test automático (QA) — corre los checks básicos y los registra. */
export async function runQA(automationId: string): Promise<{ passed: boolean }> {
  const auto = await db.automation.findUniqueOrThrow({
    where: { id: automationId },
    include: { recipe: true, client: true },
  });

  const checks: { name: string; passed: boolean; detail?: string }[] = [];

  const config = (auto.config as Record<string, unknown> | null) ?? {};
  const requiredVars =
    ((auto.recipe?.variables as { key: string; required: boolean; label: string }[] | null) ?? []).filter(
      (v) => v.required
    );
  const missing = requiredVars.filter((v) => !config[v.key] || String(config[v.key]).trim() === "");
  checks.push({
    name: "Variables requeridas completas",
    passed: missing.length === 0,
    detail: missing.length ? `Faltan: ${missing.map((m) => m.label).join(", ")}` : undefined,
  });

  checks.push({
    name: "Cliente activo",
    passed: auto.client.status === "ACTIVE" || auto.client.status === "ONBOARDING",
    detail: `Estado del cliente: ${auto.client.status}`,
  });

  if (auto.n8nWorkflowId) {
    checks.push({ name: "Workflow n8n vinculado", passed: true, detail: auto.n8nWorkflowId });
  } else {
    checks.push({
      name: "Workflow n8n vinculado",
      passed: false,
      detail: "Sin workflow en n8n todavía (provisionar primero).",
    });
  }

  for (const c of checks) {
    await db.qACheck.create({
      data: { automationId, name: c.name, passed: c.passed, detail: c.detail },
    });
  }

  const passed = checks.every((c) => c.passed);
  if (!passed) {
    await db.automation.update({ where: { id: automationId }, data: { health: "WARN" } });
  }
  return { passed };
}

/** Activa una automatización (TEST → ACTIVE). Activa el workflow en n8n si está vinculado. */
export async function activar(automationId: string): Promise<void> {
  const auto = await db.automation.findUniqueOrThrow({ where: { id: automationId } });
  if (auto.n8nWorkflowId && n8nConfigured()) {
    await activateWorkflow(auto.n8nWorkflowId);
  }
  await db.automation.update({
    where: { id: automationId },
    data: { status: "ACTIVE", health: "OK", lastError: null },
  });
  const client = await db.client.findUnique({ where: { id: auto.clientId } });
  if (client?.status === "ONBOARDING") {
    await db.client.update({ where: { id: client.id }, data: { status: "ACTIVE" } });
  }
}

/** Pausa una automatización (→ PAUSED). */
export async function pausar(automationId: string): Promise<void> {
  const auto = await db.automation.findUniqueOrThrow({ where: { id: automationId } });
  if (auto.n8nWorkflowId && n8nConfigured()) {
    await deactivateWorkflow(auto.n8nWorkflowId);
  }
  await db.automation.update({ where: { id: automationId }, data: { status: "PAUSED" } });
}
