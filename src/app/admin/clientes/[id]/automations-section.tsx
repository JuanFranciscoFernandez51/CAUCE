"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Field,
  Input,
  Select,
  Spinner,
  Textarea,
} from "@/components/ui";
import {
  AUTOMATION_STATUS_BADGE,
  AUTOMATION_STATUS_LABELS,
  fmtDateTime,
  HEALTH_BADGE,
  HEALTH_LABELS,
} from "../../_components/format";

export type RecipeVariable = {
  key: string;
  label: string;
  type?: string;
  required?: boolean;
  help?: string;
};

export type AutomationData = {
  id: string;
  name: string;
  status: string;
  health: string;
  n8nWorkflowId: string | null;
  lastRunAt: string | null;
  lastError: string | null;
  config: Record<string, string>;
  recipeName: string | null;
  variables: RecipeVariable[];
  qaChecks: { id: string; name: string; passed: boolean; detail: string | null; runAt: string }[];
};

export type RecipeOption = { id: string; name: string };

export function AutomationsSection({
  clientId,
  automations,
  recipes,
}: {
  clientId: string;
  automations: AutomationData[];
  recipes: RecipeOption[];
}) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [newRecipeId, setNewRecipeId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function addAutomation(e: React.FormEvent) {
    e.preventDefault();
    if (!newRecipeId) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/clients/${clientId}/automations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipeId: newRecipeId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "No se pudo crear la automatización");
      setAdding(false);
      setNewRecipeId("");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo crear la automatización");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-semibold">Automatizaciones</h2>
        <Button size="sm" variant="secondary" onClick={() => setAdding((v) => !v)}>
          {adding ? "Cerrar" : "+ Automatización"}
        </Button>
      </div>

      {adding ? (
        <form onSubmit={addAutomation} className="mb-4 flex flex-wrap items-end gap-2 rounded-md border border-dashed p-3">
          <div className="min-w-56 flex-1">
            <Field label="Receta">
              <Select value={newRecipeId} onChange={(e) => setNewRecipeId(e.target.value)} required>
                <option value="">Elegí una receta…</option>
                {recipes.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </Select>
            </Field>
          </div>
          <Button type="submit" disabled={busy || !newRecipeId}>
            {busy ? <Spinner /> : null} Crear en TEST
          </Button>
        </form>
      ) : null}
      {error ? <div className="mb-4"><ErrorState message={error} /></div> : null}

      {automations.length === 0 ? (
        <EmptyState
          icon="⚙️"
          title="Sin automatizaciones"
          detail="Agregá una desde el recetario o aprobá un blueprint del lead."
        />
      ) : (
        <div className="space-y-4">
          {automations.map((a) => (
            <AutomationCard key={a.id} automation={a} />
          ))}
        </div>
      )}
    </Card>
  );
}

function AutomationCard({ automation: a }: { automation: AutomationData }) {
  const router = useRouter();
  const [config, setConfig] = useState<Record<string, string>>(a.config);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [showQA, setShowQA] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const [configSaved, setConfigSaved] = useState(false);

  async function call(action: string, path: string, init?: RequestInit) {
    setBusy(action);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch(path, { method: "POST", ...init });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Falló la acción");
      return data;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falló la acción");
      return null;
    } finally {
      setBusy(null);
    }
  }

  async function saveConfig() {
    setBusy("config");
    setError(null);
    setConfigSaved(false);
    try {
      const res = await fetch(`/api/admin/automations/${a.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "No se pudo guardar la configuración");
      setConfigSaved(true);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar la configuración");
    } finally {
      setBusy(null);
    }
  }

  async function provisionar() {
    const data = await call("provisionar", `/api/admin/automations/${a.id}/provisionar`);
    if (data) {
      if (data.ok) {
        setNotice(data.detail);
        router.refresh();
      } else {
        // No es un error: estado claro, motor sin conectar o receta sin template.
        setNotice(data.detail);
      }
    }
  }

  async function correrQA() {
    const data = await call("qa", `/api/admin/automations/${a.id}/qa`);
    if (data) {
      setShowQA(true);
      setNotice(data.passed ? "QA pasó todos los checks ✓" : "QA encontró problemas — revisá los checks.");
      router.refresh();
    }
  }

  async function activar() {
    const data = await call("activar", `/api/admin/automations/${a.id}/activar`);
    if (data) {
      setNotice("Automatización activada.");
      router.refresh();
    }
  }

  async function pausar() {
    const data = await call("pausar", `/api/admin/automations/${a.id}/pausar`);
    if (data) {
      setNotice("Automatización pausada.");
      router.refresh();
    }
  }

  return (
    <div className="rounded-lg border p-4">
      <div className="flex flex-wrap items-center gap-2">
        <p className="font-medium">{a.name}</p>
        <Badge variant={AUTOMATION_STATUS_BADGE[a.status] ?? "default"}>
          {AUTOMATION_STATUS_LABELS[a.status] ?? a.status}
        </Badge>
        <Badge variant={HEALTH_BADGE[a.health] ?? "default"}>
          {HEALTH_LABELS[a.health] ?? a.health}
        </Badge>
        <span className="ml-auto text-xs text-muted-foreground">
          Última corrida: {a.lastRunAt ? fmtDateTime(a.lastRunAt) : "nunca"}
        </span>
      </div>
      {a.recipeName ? (
        <p className="mt-1 text-xs text-muted-foreground">Receta: {a.recipeName}</p>
      ) : null}
      {a.n8nWorkflowId ? (
        <p className="mt-1 text-xs text-muted-foreground">Workflow n8n: {a.n8nWorkflowId}</p>
      ) : null}
      {a.lastError ? (
        <p className="mt-2 text-sm text-destructive">Último error: {a.lastError}</p>
      ) : null}

      {/* Configuración desde las variables de la receta */}
      {a.variables.length > 0 ? (
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setConfigOpen((v) => !v)}
            className="text-sm font-medium text-primary hover:underline"
          >
            {configOpen ? "▾ Ocultar configuración" : "▸ Editar configuración"}
          </button>
          {configOpen ? (
            <div className="mt-3 grid gap-3 rounded-md bg-muted/50 p-3 sm:grid-cols-2">
              {a.variables.map((v) => (
                <div key={v.key} className={v.type === "textarea" ? "sm:col-span-2" : undefined}>
                  <Field label={`${v.label}${v.required ? " *" : ""}`} help={v.help}>
                    {v.type === "textarea" ? (
                      <Textarea
                        value={config[v.key] ?? ""}
                        onChange={(e) => setConfig((c) => ({ ...c, [v.key]: e.target.value }))}
                        rows={3}
                      />
                    ) : (
                      <Input
                        type={v.type === "number" ? "number" : "text"}
                        value={config[v.key] ?? ""}
                        onChange={(e) => setConfig((c) => ({ ...c, [v.key]: e.target.value }))}
                      />
                    )}
                  </Field>
                </div>
              ))}
              <div className="flex items-center gap-2 sm:col-span-2">
                <Button size="sm" onClick={saveConfig} disabled={busy !== null}>
                  {busy === "config" ? <Spinner /> : null} Guardar configuración
                </Button>
                {configSaved ? <span className="text-sm text-success">Guardada ✓</span> : null}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Acciones */}
      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" variant="secondary" onClick={provisionar} disabled={busy !== null}>
          {busy === "provisionar" ? <Spinner /> : null} Provisionar en n8n
        </Button>
        <Button size="sm" variant="secondary" onClick={correrQA} disabled={busy !== null}>
          {busy === "qa" ? <Spinner /> : null} Correr QA
        </Button>
        {a.status !== "ACTIVE" ? (
          <Button size="sm" onClick={activar} disabled={busy !== null}>
            {busy === "activar" ? <Spinner /> : null} Activar
          </Button>
        ) : null}
        {a.status === "ACTIVE" ? (
          <Button size="sm" variant="secondary" onClick={pausar} disabled={busy !== null}>
            {busy === "pausar" ? <Spinner /> : null} Pausar
          </Button>
        ) : null}
      </div>

      {notice ? (
        <div className="mt-3 rounded-md border bg-muted px-3 py-2 text-sm">{notice}</div>
      ) : null}
      {error ? <div className="mt-3"><ErrorState message={error} /></div> : null}

      {/* QA checks */}
      {a.qaChecks.length > 0 ? (
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setShowQA((v) => !v)}
            className="text-sm font-medium text-primary hover:underline"
          >
            {showQA ? "▾ Ocultar checks de QA" : `▸ Ver checks de QA (${a.qaChecks.length})`}
          </button>
          {showQA ? (
            <ul className="mt-2 space-y-1.5">
              {a.qaChecks.map((c) => (
                <li key={c.id} className="flex items-start gap-2 text-sm">
                  <span className={c.passed ? "text-success" : "text-destructive"}>
                    {c.passed ? "✓" : "✗"}
                  </span>
                  <div>
                    <span className="font-medium">{c.name}</span>
                    {c.detail ? <span className="text-muted-foreground"> — {c.detail}</span> : null}
                    <span className="ml-1 text-xs text-muted-foreground">({fmtDateTime(c.runAt)})</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
