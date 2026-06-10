/**
 * Adapter del motor n8n vía REST API.
 * Sin N8N_URL/N8N_API_KEY configurados, todo degrada con claridad:
 * configured() = false y la UI muestra el estado "motor sin conectar".
 */

type N8nWorkflow = {
  id: string;
  name: string;
  active: boolean;
};

function cfg() {
  const url = process.env.N8N_URL?.replace(/\/$/, "");
  const key = process.env.N8N_API_KEY;
  return url && key ? { url, key } : null;
}

export function n8nConfigured(): boolean {
  return cfg() !== null;
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const c = cfg();
  if (!c) throw new Error("n8n no configurado: faltan N8N_URL / N8N_API_KEY");
  const res = await fetch(`${c.url}/api/v1${path}`, {
    ...init,
    headers: {
      "X-N8N-API-KEY": c.key,
      "Content-Type": "application/json",
      ...init?.headers,
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`n8n ${res.status}: ${body.slice(0, 300)}`);
  }
  return res.json() as Promise<T>;
}

/** Clona un workflow plantilla reemplazando variables {{var}} por valores del cliente. */
export async function instantiateRecipe(opts: {
  templateWorkflowId: string;
  name: string;
  variables: Record<string, string>;
}): Promise<{ workflowId: string }> {
  const tpl = await api<{ name: string; nodes: unknown[]; connections: unknown; settings?: unknown }>(
    `/workflows/${opts.templateWorkflowId}`
  );
  let json = JSON.stringify({ nodes: tpl.nodes, connections: tpl.connections });
  for (const [k, v] of Object.entries(opts.variables)) {
    json = json.replaceAll(`{{${k}}}`, v.replaceAll('"', '\\"'));
  }
  const parsed = JSON.parse(json) as { nodes: unknown[]; connections: unknown };
  const created = await api<N8nWorkflow>(`/workflows`, {
    method: "POST",
    body: JSON.stringify({
      name: opts.name,
      nodes: parsed.nodes,
      connections: parsed.connections,
      settings: tpl.settings ?? {},
    }),
  });
  // Nace SIEMPRE desactivado (estado test) — jamás directo a active.
  return { workflowId: created.id };
}

export async function activateWorkflow(workflowId: string): Promise<void> {
  await api(`/workflows/${workflowId}/activate`, { method: "POST" });
}

export async function deactivateWorkflow(workflowId: string): Promise<void> {
  await api(`/workflows/${workflowId}/deactivate`, { method: "POST" });
}

export async function getWorkflowStatus(workflowId: string): Promise<{ active: boolean } | null> {
  try {
    const wf = await api<N8nWorkflow>(`/workflows/${workflowId}`);
    return { active: wf.active };
  } catch {
    return null;
  }
}

/** Últimas ejecuciones del workflow para health-check. */
export async function getExecutions(workflowId: string, limit = 10) {
  return api<{ data: { id: string; status: string; startedAt: string }[] }>(
    `/executions?workflowId=${workflowId}&limit=${limit}`
  );
}

/** Health simple: OK si la última ejecución no falló; WARN si hay fallas mezcladas; DOWN si todo falla. */
export async function computeHealth(workflowId: string): Promise<"OK" | "WARN" | "DOWN" | "UNKNOWN"> {
  try {
    const ex = await getExecutions(workflowId, 10);
    if (!ex.data.length) return "UNKNOWN";
    const failed = ex.data.filter((e) => e.status === "error" || e.status === "failed").length;
    if (failed === 0) return "OK";
    if (failed === ex.data.length) return "DOWN";
    return "WARN";
  } catch {
    return "UNKNOWN";
  }
}
